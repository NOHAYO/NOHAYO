#!/usr/bin/env node
/**
 * A fake Dolphin cloud API for local development and tests. It speaks the
 * same form-encoded POST /HA/V1/<endpoint>.php protocol as api.dolphinboiler.com
 * and simulates one boiler whose water warms up while it's heating.
 *
 *   node scripts/dolphin-mock.js            # listens on :4100
 *   DOLPHIN_BASE_URL=http://localhost:4100/HA/V1 npm start
 *
 * Login: demo@example.com / demo-password
 */
import http from "node:http";
import { pathToFileURL } from "node:url";

export const MOCK_EMAIL = "demo@example.com";
export const MOCK_PASSWORD = "demo-password";
export const MOCK_API_KEY = "mock-api-key-123";
export const MOCK_DEVICE = "DOLPHIN-MOCK-1";

export function createMockDolphin() {
  const device = {
    Power: "OFF",
    Temperature: 31,
    targetTemperature: 0,
    Energy: 0,
    Shabbat: "OFF",
    fixedTemperature: "OFF",
    showerTemperature: [{ temp: 38 }, { temp: 45 }, { temp: 52 }, { temp: 58 }],
  };
  const calls = [];

  const tick = () => {
    // Each status read nudges the water 2 °C toward the target while heating.
    if (device.Power === "ON" && device.Temperature < device.targetTemperature) {
      device.Temperature = Math.min(device.targetTemperature, device.Temperature + 2);
    }
    // Manual heating stops once the water is hot enough (even if it already was).
    if (device.Power === "ON" && device.Temperature >= device.targetTemperature && device.fixedTemperature === "OFF") {
      device.Power = "OFF";
    }
    device.Energy = device.Power === "ON" ? 13.2 : 0;
  };

  const authed = (f) => f.email === MOCK_EMAIL && f.API_Key === MOCK_API_KEY;
  const ownsDevice = (f) => authed(f) && f.deviceName === MOCK_DEVICE;

  const handlers = {
    getAPIkey: (f) => (f.email === MOCK_EMAIL && f.password === MOCK_PASSWORD ? MOCK_API_KEY : "failed"), // as the real service replies
    getDevices: (f) => (authed(f) ? [{ deviceName: MOCK_DEVICE }] : { error: "unauthorized" }),
    getMainScreenData: (f) => {
      if (!ownsDevice(f)) return { error: "unauthorized" };
      tick();
      return { ...device };
    },
    isEnergyMeter: (f) => (ownsDevice(f) ? { isEnergyMeter: 1 } : { error: "unauthorized" }),
    turnOnManually: (f) => {
      if (!ownsDevice(f)) return { error: "unauthorized" };
      device.Power = "ON";
      device.targetTemperature = Number(f.temperature);
      return { ok: true };
    },
    turnOffManually: (f) => {
      if (!ownsDevice(f)) return { error: "unauthorized" };
      device.Power = "OFF";
      return { ok: true };
    },
    setFixedTemperature: (f) => {
      if (!ownsDevice(f)) return { error: "unauthorized" };
      device.fixedTemperature = "ON";
      device.targetTemperature = Number(f.temperature);
      device.Power = "ON";
      return { ok: true };
    },
    turnOffFixedTemperature: (f) => {
      if (!ownsDevice(f)) return { error: "unauthorized" };
      device.fixedTemperature = "OFF";
      return { ok: true };
    },
    enableShabbat: (f) => (ownsDevice(f) ? ((device.Shabbat = "ON"), { ok: true }) : { error: "unauthorized" }),
    disableShabbat: (f) => (ownsDevice(f) ? ((device.Shabbat = "OFF"), { ok: true }) : { error: "unauthorized" }),
  };

  const server = http.createServer((req, res) => {
    const match = req.url.match(/^\/HA\/V1\/+([A-Za-z]+)\.php$/);
    const handler = match && Object.hasOwn(handlers, match[1]) && handlers[match[1]];
    if (req.method !== "POST" || !handler) {
      res.writeHead(404).end("not found");
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const fields = Object.fromEntries(new URLSearchParams(raw));
      calls.push({ endpoint: match[1], fields });
      const out = handler(fields);
      res.writeHead(200, { "Content-Type": typeof out === "string" ? "text/plain" : "application/json" });
      res.end(typeof out === "string" ? out : JSON.stringify(out));
    });
  });

  return { server, device, calls };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4100);
  createMockDolphin().server.listen(port, () => {
    console.log(`Mock Dolphin API on http://localhost:${port}/HA/V1`);
    console.log(`Login: ${MOCK_EMAIL} / ${MOCK_PASSWORD}  (device ${MOCK_DEVICE})`);
  });
}
