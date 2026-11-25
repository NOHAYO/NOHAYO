/**
 * Client for the Dolphin smart-boiler cloud API (api.dolphinboiler.com).
 *
 * Dolphin publishes no official API. This follows the endpoints used by the
 * community Home Assistant integration (github.com/0xAlon/dolphin): every call
 * is a form-encoded POST to /HA/V1/<endpoint>.php carrying `email` + `API_Key`
 * (and usually `deviceName`); replies are JSON except getAPIkey.php, which
 * returns the key as plain text.
 *
 * DOLPHIN_BASE_URL overrides the host, so tests and the CLI can point at the
 * local mock (scripts/dolphin-mock.js) instead of the real service.
 */

export const DEFAULT_BASE_URL = "https://api.dolphinboiler.com/HA/V1";
const TIMEOUT_MS = 10_000;

export class DolphinError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "DolphinError";
    this.status = status;
    this.body = body;
  }
}

function baseUrl(override) {
  return (override || process.env.DOLPHIN_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function post(endpoint, fields, { base, fetchImpl = fetch } = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) body.set(k, String(v));

  let res;
  try {
    res = await fetchImpl(`${baseUrl(base)}/${endpoint}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new DolphinError(`Could not reach Dolphin (${err.name === "TimeoutError" ? "timeout" : err.message}).`);
  }

  const text = await res.text();
  if (!res.ok) throw new DolphinError(`Dolphin returned HTTP ${res.status}.`, { status: res.status, body: text });
  return text;
}

function parseJson(endpoint, text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new DolphinError(`Unexpected reply from Dolphin ${endpoint}.`, { body: text });
  }
}

/** Normalises getMainScreenData into stable camelCase fields. */
export function normaliseStatus(raw = {}) {
  const on = (v) => String(v).toUpperCase() === "ON";
  const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
  const temperature = num(raw.Temperature);
  const target = num(raw.targetTemperature);
  return {
    power: on(raw.Power),
    temperature: temperature !== null && temperature > 0 ? temperature : null,
    targetTemperature: target !== null && target > 0 ? target : null,
    energy: num(raw.Energy) ?? 0,
    shabbat: on(raw.Shabbat),
    fixedTemperature: on(raw.fixedTemperature),
    // Index 0 = water needed for 1 shower, index 1 = 2 showers, ...
    showers: Array.isArray(raw.showerTemperature)
      ? raw.showerTemperature.map((s, i) => ({ count: i + 1, temperature: num(s?.temp) }))
      : [],
  };
}

export function createDolphinClient(opts = {}) {
  const call = (endpoint, fields) => post(endpoint, fields, opts);
  const json = async (endpoint, fields) => parseJson(endpoint, await call(endpoint, fields));

  return {
    /** Exchanges the app login for an API key (plain-text reply). */
    async getApiKey(email, password) {
      const text = (await call("getAPIkey", { email, password })).trim();
      // A failed login comes back as an empty body or a JSON/HTML error, never a bare key.
      if (!text || /^[{[<]/.test(text) || /\s/.test(text)) {
        throw new DolphinError("Dolphin rejected that email or password.", { body: text });
      }
      return text;
    },

    async getDevices(email, apiKey) {
      const data = await json("getDevices", { email, API_Key: apiKey });
      if (!Array.isArray(data)) throw new DolphinError("Dolphin did not return a device list.", { body: data });
      return data.filter((d) => d && d.deviceName).map((d) => ({ ...d, deviceName: String(d.deviceName) }));
    },

    async getStatus(email, apiKey, deviceName) {
      return normaliseStatus(await json("getMainScreenData", { email, API_Key: apiKey, deviceName }));
    },

    async hasEnergyMeter(email, apiKey, deviceName) {
      const data = await json("isEnergyMeter", { email, API_Key: apiKey, deviceName });
      return Number(data?.isEnergyMeter) === 1;
    },

    turnOn: (email, apiKey, deviceName, temperature) =>
      call("turnOnManually", { email, API_Key: apiKey, deviceName, temperature }),
    turnOff: (email, apiKey, deviceName) =>
      call("turnOffManually", { email, API_Key: apiKey, deviceName }),
    setFixedTemperature: (email, apiKey, deviceName, temperature) =>
      call("setFixedTemperature", { email, API_Key: apiKey, deviceName, temperature }),
    turnOffFixedTemperature: (email, apiKey, deviceName) =>
      call("turnOffFixedTemperature", { email, API_Key: apiKey, deviceName }),
    setShabbat: (email, apiKey, deviceName, on) =>
      call(on ? "enableShabbat" : "disableShabbat", { email, API_Key: apiKey, deviceName }),
  };
}
