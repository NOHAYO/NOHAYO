import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { boilerAccounts } from "../db/schema.js";
import { createDolphinClient, DolphinError } from "../integrations/dolphin.js";
import { seal, open } from "../integrations/secretBox.js";

/** Boiler controls: links the signed-in user's Dolphin account and proxies
 *  commands to it. The Dolphin API key stays on the server; the browser only
 *  ever sees device names and status. */

export const MIN_TEMP = 20;
export const MAX_TEMP = 71; // the range the Dolphin app/integration allows

const router = Router();
const dolphin = createDolphinClient();

const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (err instanceof DolphinError) return res.status(502).json({ error: err.message });
    next(err);
  }
};

async function loadAccount(req, res, next) {
  const [row] = await db.select().from(boilerAccounts).where(eq(boilerAccounts.userId, req.userId));
  if (!row) return res.status(404).json({ error: "No Dolphin boiler account linked yet." });
  req.boiler = { email: row.dolphinEmail, apiKey: open(row.apiKeyEncrypted) };
  next();
}

async function statusFor({ email, apiKey }, deviceName) {
  return { deviceName, ...(await dolphin.getStatus(email, apiKey, deviceName)) };
}

// GET /api/boiler -> { linked, email, devices: [{ deviceName, power, temperature, ... }] }
router.get("/", wrap(async (req, res) => {
  const [row] = await db.select().from(boilerAccounts).where(eq(boilerAccounts.userId, req.userId));
  if (!row) return res.json({ linked: false, devices: [] });

  const account = { email: row.dolphinEmail, apiKey: open(row.apiKeyEncrypted) };
  const devices = await dolphin.getDevices(account.email, account.apiKey);
  const statuses = await Promise.all(devices.map((d) => statusFor(account, d.deviceName)));
  res.json({ linked: true, email: row.dolphinEmail, devices: statuses });
}));

const linkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/boiler/link { email, password } — the password is used once and discarded.
router.post("/link", wrap(async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { email, password } = parsed.data;

  const apiKey = await dolphin.getApiKey(email, password);
  const devices = await dolphin.getDevices(email, apiKey); // proves the key works

  const values = { userId: req.userId, dolphinEmail: email, apiKeyEncrypted: seal(apiKey) };
  await db.insert(boilerAccounts).values(values)
    .onConflictDoUpdate({ target: boilerAccounts.userId, set: { dolphinEmail: email, apiKeyEncrypted: values.apiKeyEncrypted } });

  res.status(201).json({ linked: true, email, devices: devices.map((d) => ({ deviceName: d.deviceName })) });
}));

router.delete("/link", wrap(async (req, res) => {
  await db.delete(boilerAccounts).where(eq(boilerAccounts.userId, req.userId));
  res.json({ linked: false });
}));

const temperatureSchema = z.object({
  temperature: z.coerce.number().int().min(MIN_TEMP).max(MAX_TEMP),
});

function parseTemperature(req, res) {
  const parsed = temperatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Temperature must be a whole number from ${MIN_TEMP} to ${MAX_TEMP} °C.` });
    return null;
  }
  return parsed.data.temperature;
}

const device = Router({ mergeParams: true });
router.use("/devices/:deviceName", wrap(loadAccount), device);

device.get("/", wrap(async (req, res) => {
  res.json(await statusFor(req.boiler, req.params.deviceName));
}));

// Heat now until the water reaches `temperature`.
device.post("/heat", wrap(async (req, res) => {
  const temperature = parseTemperature(req, res);
  if (temperature === null) return;
  const { email, apiKey } = req.boiler;
  await dolphin.turnOn(email, apiKey, req.params.deviceName, temperature);
  res.json(await statusFor(req.boiler, req.params.deviceName));
}));

// Stop heating (also clears fixed-temperature mode, as the Dolphin app does).
device.post("/off", wrap(async (req, res) => {
  const { email, apiKey } = req.boiler;
  const name = req.params.deviceName;
  // Stop first and don't depend on a status read: a stop must go through even
  // when status is unavailable. Clearing fixed mode when it's already off is harmless.
  await dolphin.turnOff(email, apiKey, name);
  await dolphin.turnOffFixedTemperature(email, apiKey, name);
  res.json(await statusFor(req.boiler, name));
}));

// Keep the water at `temperature` continuously.
device.post("/fixed", wrap(async (req, res) => {
  const temperature = parseTemperature(req, res);
  if (temperature === null) return;
  const { email, apiKey } = req.boiler;
  await dolphin.setFixedTemperature(email, apiKey, req.params.deviceName, temperature);
  res.json(await statusFor(req.boiler, req.params.deviceName));
}));

device.delete("/fixed", wrap(async (req, res) => {
  const { email, apiKey } = req.boiler;
  await dolphin.turnOffFixedTemperature(email, apiKey, req.params.deviceName);
  res.json(await statusFor(req.boiler, req.params.deviceName));
}));

device.post("/shabbat", wrap(async (req, res) => {
  const parsed = z.object({ on: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Send { on: true | false }." });
  const { email, apiKey } = req.boiler;
  await dolphin.setShabbat(email, apiKey, req.params.deviceName, parsed.data.on);
  res.json(await statusFor(req.boiler, req.params.deviceName));
}));

// Heat enough water for N showers (only if it isn't already hot enough).
device.post("/showers", wrap(async (req, res) => {
  const parsed = z.object({ count: z.coerce.number().int().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Send { count: <number of showers> }." });
  const { email, apiKey } = req.boiler;
  const name = req.params.deviceName;

  const status = await dolphin.getStatus(email, apiKey, name);
  const shower = status.showers.find((s) => s.count === parsed.data.count);
  if (!shower || shower.temperature === null) return res.status(400).json({ error: "This boiler has no setting for that many showers." });
  if (status.shabbat) return res.status(409).json({ error: "Shabbat mode is on — turn it off to control the boiler." });

  if (status.temperature === null || status.temperature < shower.temperature) {
    const target = Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round(shower.temperature)));
    await dolphin.turnOn(email, apiKey, name, target);
  }
  res.json(await statusFor(req.boiler, name));
}));

export default router;
