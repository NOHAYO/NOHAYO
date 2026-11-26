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

/** Bare-word replies that mean the login failed, not an API key. */
const LOGIN_FAILURE_WORDS = /^(fail(ed|ure)?|error|false|invalid|unauthori[sz]ed|wrong|null|undefined|0|-1)$/i;

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
  let text;
  try {
    res = await fetchImpl(`${baseUrl(base)}/${endpoint}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    text = await res.text();
  } catch (err) {
    throw new DolphinError(`Could not reach Dolphin (${err.name === "TimeoutError" ? "timeout" : err.message}).`);
  }

  if (!res.ok) throw new DolphinError(`Dolphin returned HTTP ${res.status}.`, { status: res.status, body: text });
  return text;
}

function parseJson(endpoint, text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new DolphinError(`Unexpected reply from Dolphin ${endpoint}.`, { body: text });
  }
  return rejectErrorReply(endpoint, data, text);
}

/** Dolphin reports failures (bad key, unknown device) as HTTP 200 with an
 *  `error` field, so a 2xx alone does not mean the command was accepted. */
function rejectErrorReply(endpoint, data, text) {
  if (data && typeof data === "object" && !Array.isArray(data) && data.error) {
    throw new DolphinError(`Dolphin refused ${endpoint}: ${data.error}.`, { body: text });
  }
  return data;
}

/** Control commands: the body is usually small JSON, but may be empty or plain
 *  text, so only a JSON error reply counts as a failure. */
function checkCommand(endpoint, text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return text;
  }
  return rejectErrorReply(endpoint, data, text);
}

/** Normalises getMainScreenData into stable camelCase fields. */
export function normaliseStatus(raw = {}) {
  const on = (v) => String(v).toUpperCase() === "ON";
  const num = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
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
  const command = async (endpoint, fields) => checkCommand(endpoint, await call(endpoint, fields));

  return {
    /** Exchanges the app login for an API key (plain-text reply). */
    async getApiKey(email, password) {
      const text = (await call("getAPIkey", { email, password })).trim();
      // A failed login comes back as a bare word such as "failed" (seen from the real
      // service on a wrong email or password), an empty body, or a JSON/HTML error.
      if (!text || /^[{[<]/.test(text) || /\s/.test(text) || LOGIN_FAILURE_WORDS.test(text)) {
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
      const data = await json("getMainScreenData", { email, API_Key: apiKey, deviceName });
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new DolphinError("Dolphin did not return boiler status.", { body: data });
      }
      return normaliseStatus(data);
    },

    async hasEnergyMeter(email, apiKey, deviceName) {
      const data = await json("isEnergyMeter", { email, API_Key: apiKey, deviceName });
      return Number(data?.isEnergyMeter) === 1;
    },

    turnOn: (email, apiKey, deviceName, temperature) =>
      command("turnOnManually", { email, API_Key: apiKey, deviceName, temperature }),
    turnOff: (email, apiKey, deviceName) =>
      command("turnOffManually", { email, API_Key: apiKey, deviceName }),
    setFixedTemperature: (email, apiKey, deviceName, temperature) =>
      command("setFixedTemperature", { email, API_Key: apiKey, deviceName, temperature }),
    turnOffFixedTemperature: (email, apiKey, deviceName) =>
      command("turnOffFixedTemperature", { email, API_Key: apiKey, deviceName }),
    setShabbat: (email, apiKey, deviceName, on) =>
      command(on ? "enableShabbat" : "disableShabbat", { email, API_Key: apiKey, deviceName }),
  };
}
