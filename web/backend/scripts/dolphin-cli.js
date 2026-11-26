#!/usr/bin/env node
/**
 * Test client for the Dolphin boiler API — talks to Dolphin directly, without
 * the NOHAYO backend, so you can check your account and boiler work.
 *
 * Credentials come from the environment (never put them on the command line,
 * where they'd land in shell history):
 *   DOLPHIN_EMAIL     your Dolphin app login
 *   DOLPHIN_PASSWORD  used once to fetch an API key  — or —
 *   DOLPHIN_API_KEY   the key from a previous `login`
 *   DOLPHIN_BASE_URL  optional; e.g. http://localhost:4100/HA/V1 for the mock
 *
 * Commands:
 *   login                     print your API key (then set DOLPHIN_API_KEY)
 *   devices                   list your boilers
 *   status  [device]          temperature, power, modes, shower table
 *   on      <temp> [device]   heat now until <temp> °C
 *   off     [device]          stop heating
 *   fixed   <temp|off> [device]
 *   shabbat <on|off> [device]
 *   showers <n> [device]      heat enough water for n showers
 *
 * [device] defaults to your first boiler.
 */
import { createDolphinClient, DolphinError, DEFAULT_BASE_URL } from "../src/integrations/dolphin.js";

const [cmd, ...args] = process.argv.slice(2);
const client = createDolphinClient();
const email = process.env.DOLPHIN_EMAIL;

function usage(code = 1) {
  console.log("Usage: npm run dolphin -- <login|devices|status|on|off|fixed|shabbat|showers> [args]");
  console.log("Set DOLPHIN_EMAIL and DOLPHIN_PASSWORD (or DOLPHIN_API_KEY). See scripts/dolphin-cli.js.");
  process.exit(code);
}

function need(name) {
  if (!process.env[name]) {
    console.error(`Missing ${name} in the environment.`);
    process.exit(1);
  }
  return process.env[name];
}

async function apiKey() {
  if (process.env.DOLPHIN_API_KEY) return process.env.DOLPHIN_API_KEY;
  return client.getApiKey(need("DOLPHIN_EMAIL"), need("DOLPHIN_PASSWORD"));
}

async function deviceArg(key, given) {
  if (given) return given;
  const devices = await client.getDevices(email, key);
  if (!devices.length) throw new DolphinError("No boilers on this account.");
  return devices[0].deviceName;
}

function temp(value) {
  const t = Number(value);
  if (!Number.isInteger(t) || t < 20 || t > 71) {
    console.error("Temperature must be a whole number from 20 to 71.");
    process.exit(1);
  }
  return t;
}

function printStatus(name, s) {
  console.log(`${name}`);
  console.log(`  water        ${s.temperature ?? "?"} °C`);
  console.log(`  heating      ${s.power ? `ON → ${s.targetTemperature ?? "?"} °C` : "off"}`);
  console.log(`  fixed temp   ${s.fixedTemperature ? "on" : "off"}`);
  console.log(`  shabbat      ${s.shabbat ? "on" : "off"}`);
  console.log(`  current      ${s.energy} A`);
  for (const sh of s.showers) {
    const ready = s.temperature !== null && sh.temperature !== null && s.temperature >= sh.temperature;
    console.log(`  ${sh.count} shower${sh.count > 1 ? "s" : " "}    needs ${sh.temperature} °C${ready ? "  ✓ ready" : ""}`);
  }
}

async function main() {
  if (!cmd || cmd === "help" || cmd === "--help") usage(0);
  need("DOLPHIN_EMAIL");
  if (process.env.DOLPHIN_BASE_URL) console.error(`(using ${process.env.DOLPHIN_BASE_URL})`);
  else console.error(`(using ${DEFAULT_BASE_URL})`);

  const key = await apiKey();

  switch (cmd) {
    case "login":
      await client.getDevices(email, key); // proves the key works before printing it
      console.log(key);
      console.error("Export this as DOLPHIN_API_KEY to skip the password next time.");
      return;
    case "devices": {
      const devices = await client.getDevices(email, key);
      for (const d of devices) console.log(d.deviceName);
      if (!devices.length) console.log("(no boilers)");
      return;
    }
    case "status": {
      const name = await deviceArg(key, args[0]);
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    case "on": {
      const t = temp(args[0]);
      const name = await deviceArg(key, args[1]);
      await client.turnOn(email, key, name, t);
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    case "off": {
      const name = await deviceArg(key, args[0]);
      await client.turnOff(email, key, name);
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    case "fixed": {
      if (!args[0]) usage();
      const name = await deviceArg(key, args[1]);
      if (args[0] === "off") await client.turnOffFixedTemperature(email, key, name);
      else await client.setFixedTemperature(email, key, name, temp(args[0]));
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    case "shabbat": {
      if (args[0] !== "on" && args[0] !== "off") usage();
      const name = await deviceArg(key, args[1]);
      await client.setShabbat(email, key, name, args[0] === "on");
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    case "showers": {
      const n = Number(args[0]);
      const name = await deviceArg(key, args[1]);
      const s = await client.getStatus(email, key, name);
      const shower = s.showers.find((x) => x.count === n);
      if (!shower || shower.temperature === null) throw new DolphinError(`No setting for ${args[0]} showers on this boiler.`);
      if (s.shabbat) throw new DolphinError("Shabbat mode is on. Turn it off to control the boiler.");
      if (s.temperature !== null && s.temperature >= shower.temperature) console.log("Already hot enough.");
      else await client.turnOn(email, key, name, Math.min(71, Math.max(20, Math.round(shower.temperature))));
      printStatus(name, await client.getStatus(email, key, name));
      return;
    }
    default:
      usage();
  }
}

main().catch((err) => {
  console.error(err instanceof DolphinError ? `Error: ${err.message}` : err);
  process.exit(1);
});
