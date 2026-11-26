import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import { format } from "node:util";
import { createApp } from "./app.js";
import { pool } from "./db/client.js";
import { createMockDolphin, MOCK_EMAIL, MOCK_PASSWORD, MOCK_API_KEY, MOCK_DEVICE } from "../scripts/dolphin-mock.js";

/** Boiler routes against a live Postgres (run `npm run db:migrate` first) and
 *  the in-process mock Dolphin API. */
const app = createApp();
const mock = createMockDolphin();
const dev = `/api/boiler/devices/${MOCK_DEVICE}`;

afterAll(async () => {
  await new Promise((r) => mock.server.close(r));
  await pool.end();
});

describe("Boiler controls API", () => {
  let auth;
  let userId;

  beforeAll(async () => {
    await new Promise((r) => mock.server.listen(0, r));
    process.env.DOLPHIN_BASE_URL = `http://127.0.0.1:${mock.server.address().port}/HA/V1`;
    const res = await request(app).post("/api/auth/signup")
      .send({ email: `boiler-${Date.now()}@nohayo.com`, password: "password123", name: "Boiler Tester" });
    auth = { Authorization: `Bearer ${res.body.token}` };
    userId = res.body.user.id;
  });


  it("requires sign-in", async () => {
    expect((await request(app).get("/api/boiler")).status).toBe(401);
  });

  it("starts unlinked", async () => {
    const res = await request(app).get("/api/boiler").set(auth);
    expect(res.body).toEqual({ linked: false, devices: [] });
    expect((await request(app).get(dev).set(auth)).status).toBe(404);
  });

  it("rejects a wrong Dolphin password", async () => {
    const res = await request(app).post("/api/boiler/link").set(auth).send({ email: MOCK_EMAIL, password: "wrong" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("dolphin_bad_login");
    expect((await request(app).get("/api/boiler").set(auth)).body.linked).toBe(false);
  });

  it("links the account and stores the key encrypted", async () => {
    const res = await request(app).post("/api/boiler/link").set(auth).send({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.devices).toEqual([{ deviceName: MOCK_DEVICE }]);
    expect(JSON.stringify(res.body)).not.toContain(MOCK_API_KEY);

    const { rows } = await pool.query("select api_key_encrypted from boiler_accounts where user_id = $1", [userId]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].api_key_encrypted).not.toContain(MOCK_API_KEY);
  });

  it("lists boilers with status", async () => {
    const res = await request(app).get("/api/boiler").set(auth);
    expect(res.body.linked).toBe(true);
    expect(res.body.devices[0]).toMatchObject({ deviceName: MOCK_DEVICE, power: false, temperature: 31 });
  });

  it("validates temperatures", async () => {
    expect((await request(app).post(`${dev}/heat`).set(auth).send({ temperature: 90 })).status).toBe(400);
    expect((await request(app).post(`${dev}/heat`).set(auth).send({})).status).toBe(400);
  });

  it("heats, then turns off", async () => {
    let res = await request(app).post(`${dev}/heat`).set(auth).send({ temperature: 60 });
    expect(res.body).toMatchObject({ power: true, targetTemperature: 60 });
    res = await request(app).post(`${dev}/off`).set(auth);
    expect(res.body.power).toBe(false);
  });

  it("fixed temperature on/off, and off clears it", async () => {
    let res = await request(app).post(`${dev}/fixed`).set(auth).send({ temperature: 55 });
    expect(res.body.fixedTemperature).toBe(true);
    res = await request(app).post(`${dev}/off`).set(auth);
    expect(res.body).toMatchObject({ power: false, fixedTemperature: false });
  });

  it("heats for N showers, and Shabbat blocks it", async () => {
    let res = await request(app).post(`${dev}/showers`).set(auth).send({ count: 3 });
    expect(res.body).toMatchObject({ power: true, targetTemperature: 52 });
    await request(app).post(`${dev}/off`).set(auth);

    res = await request(app).post(`${dev}/shabbat`).set(auth).send({ on: true });
    expect(res.body.shabbat).toBe(true);
    expect((await request(app).post(`${dev}/showers`).set(auth).send({ count: 2 })).status).toBe(409);
    res = await request(app).post(`${dev}/shabbat`).set(auth).send({ on: false });
    expect(res.body.shabbat).toBe(false);
  });

  it("returns 404 for a boiler not on this account, without dropping the sign-in", async () => {
    const res = await request(app).post("/api/boiler/devices/SOMEONE-ELSES-BOILER/heat").set(auth).send({ temperature: 50 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("boiler_not_found");
    expect((await request(app).get("/api/boiler").set(auth)).body.needsRelink).toBeUndefined();
  });

  it("unlinks", async () => {
    expect((await request(app).delete("/api/boiler/link").set(auth)).body).toEqual({ linked: false });
    expect((await request(app).get("/api/boiler").set(auth)).body.linked).toBe(false);
  });
});

/** Failure handling: offline boiler, Dolphin outages, a revoked key, and
 *  keeping the Dolphin password out of storage, responses and logs. */
describe("Boiler error states and credential handling", () => {
  const SECRET_PASSWORD = "Sup3r-Secret-Dolphin-PW";
  let auth;
  let logs;

  const signup = async (tag) => {
    const res = await request(app).post("/api/auth/signup")
      .send({ email: `boiler-${tag}-${Date.now()}@nohayo.com`, password: "password123", name: "Boiler Tester" });
    return { Authorization: `Bearer ${res.body.token}` };
  };
  const link = (headers, password = MOCK_PASSWORD) =>
    request(app).post("/api/boiler/link").set(headers).send({ email: MOCK_EMAIL, password });

  beforeAll(async () => {
    auth = await signup("errors");
    expect((await link(auth)).status).toBe(201);
  });

  beforeEach(() => {
    // Capture everything the server writes, to check no secret is ever logged.
    logs = [];
    const keep = (...args) => logs.push(format(...args)); // exactly what console would print
    for (const m of ["log", "info", "warn", "error"]) vi.spyOn(console, m).mockImplementation(keep);
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => (logs.push(String(chunk)), true));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    mock.reset();
  });


  it("shows an offline boiler without failing the whole page", async () => {
    mock.faults.offline = true;
    const res = await request(app).get("/api/boiler").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.devices).toEqual([{ deviceName: MOCK_DEVICE, online: false }]);
  });

  it("says the boiler is offline when a command can't reach it", async () => {
    mock.faults.offline = true;
    const res = await request(app).post(`${dev}/heat`).set(auth).send({ temperature: 50 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("boiler_offline");
  });

  it("marks a healthy boiler online", async () => {
    const res = await request(app).get("/api/boiler").set(auth);
    expect(res.body.devices[0]).toMatchObject({ deviceName: MOCK_DEVICE, online: true });
  });

  it.each([
    ["drop", 503, "dolphin_unreachable"],
    ["http500", 502, "dolphin_error"],
    ["garbage", 502, "dolphin_error"],
  ])("reports a Dolphin outage (%s) as %i %s", async (outage, status, code) => {
    mock.faults.outage = outage;
    for (const res of [await request(app).get("/api/boiler").set(auth), await request(app).get(dev).set(auth)]) {
      expect(res.status).toBe(status);
      expect(res.body.code).toBe(code);
    }
    // An outage is not a reason to drop the stored sign-in.
    mock.reset();
    expect((await request(app).get("/api/boiler").set(auth)).body.needsRelink).toBeUndefined();
  });

  it("asks to sign in again when Dolphin revokes the key, then recovers", async () => {
    mock.revokeKey();

    let res = await request(app).post(`${dev}/heat`).set(auth).send({ temperature: 50 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("dolphin_relink");
    expect(mock.device.Power).toBe("OFF"); // the rejected command did nothing

    res = await request(app).get("/api/boiler").set(auth);
    expect(res.body).toEqual({ linked: true, needsRelink: true, email: MOCK_EMAIL, devices: [] });

    // The rejected key is forgotten, so it isn't sent to Dolphin again.
    const before = mock.calls.length;
    expect((await request(app).get(dev).set(auth)).body.code).toBe("dolphin_relink");
    expect(mock.calls.length).toBe(before);

    // Entering the password again fetches a fresh key.
    expect((await link(auth)).status).toBe(201);
    res = await request(app).get("/api/boiler").set(auth);
    expect(res.body).toMatchObject({ linked: true, devices: [{ deviceName: MOCK_DEVICE, online: true }] });
  });

  it("never answers 401 for Dolphin problems (that would sign the user out of NOHAYO)", async () => {
    mock.revokeKey();
    expect((await request(app).get("/api/boiler").set(auth)).status).toBe(200);
    expect((await link(auth, "wrong")).status).toBe(400);
  });

  it("limits wrong-password attempts per user", async () => {
    const other = await signup("ratelimit");
    for (let i = 0; i < 5; i++) expect((await link(other, `wrong-${i}`)).status).toBe(400);
    const locked = await link(other, MOCK_PASSWORD);
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe("too_many_attempts");
    // Other users are unaffected.
    expect((await link(auth)).status).toBe(201);
  });

  it("sends the password only to getAPIkey, and never stores or returns it", async () => {
    // A password Dolphin rejects is still handled the same way, so use one the mock won't accept.
    const start = mock.calls.length;
    const res = await link(auth, SECRET_PASSWORD);
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_PASSWORD);

    const sent = mock.calls.slice(start);
    expect(sent.map((c) => c.endpoint)).toEqual(["getAPIkey"]);

    expect((await link(auth)).status).toBe(201);
    const after = mock.calls.slice(start + 1);
    expect(after.filter((c) => "password" in c.fields).map((c) => c.endpoint)).toEqual(["getAPIkey"]);

    const { rows } = await pool.query("select * from boiler_accounts where dolphin_email = $1", [MOCK_EMAIL]);
    const stored = JSON.stringify(rows);
    expect(stored).not.toContain(MOCK_PASSWORD);
    expect(stored).not.toContain(SECRET_PASSWORD);
    expect(stored).not.toContain(MOCK_API_KEY);
  });

  it("doesn't log the password or API key, even for a malformed request", async () => {
    await request(app).post("/api/boiler/link").set(auth)
      .set("Content-Type", "application/json")
      .send(`{"email":"${MOCK_EMAIL}","password":"${SECRET_PASSWORD}"`); // broken JSON
    await link(auth, SECRET_PASSWORD);
    mock.faults.outage = "http500";
    await link(auth, SECRET_PASSWORD);
    mock.reset();
    mock.revokeKey();
    await request(app).get(dev).set(auth);
    await request(app).get("/api/boiler").set(auth);

    const all = logs.join("\n");
    expect(all.length).toBeGreaterThan(0);
    expect(all).not.toContain(SECRET_PASSWORD);
    expect(all).not.toContain(MOCK_API_KEY);
  });

  it("answers a malformed request with 400, not 500", async () => {
    const res = await request(app).post("/api/boiler/link").set(auth)
      .set("Content-Type", "application/json").send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("bad_request");
  });
});
