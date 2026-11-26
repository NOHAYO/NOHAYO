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

/**
 * Why a Dolphin call failed, so routes and the UI can say something useful:
 *   bad_login     getAPIkey refused the email/password
 *   unauthorized  a stored API key was rejected (the user must sign in again)
 *   unreachable   network error or timeout talking to Dolphin
 *   rejected      Dolphin answered `{ error: ... }` to a device call (offline boiler, unknown device, ...)
 *   bad_reply     HTTP error or a reply we can't parse
 */
export class DolphinError extends Error {
  constructor(message, { code = "bad_reply", status } = {}) {
    super(message);
    this.name = "DolphinError";
    this.code = code;
    this.status = status;
    // Deliberately no copy of the request or reply body: requests carry the
    // password or API key, and an error object is the kind of thing that gets logged.
  }
}

function baseUrl(override) {
  return (override || process.env.DOLPHIN_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function post(endpoint, fields, { base, fetchImpl = fetch, timeoutMs } = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) body.set(k, String(v));

  let res;
  try {
    res = await fetchImpl(`${baseUrl(base)}/${endpoint}.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(timeoutMs ?? (Number(process.env.DOLPHIN_TIMEOUT_MS) || TIMEOUT_MS)),
    });
  } catch (err) {
    const why = err.name === "TimeoutError" ? "timeout" : "connection failed";
    throw new DolphinError(`Could not reach Dolphin (${why}).`, { code: "unreachable" });
  }

  let text;
  try {
    text = await res.text();
  } catch {
    throw new DolphinError("Could not reach Dolphin (connection dropped).", { code: "unreachable" });
  }
  if (res.status === 401 || res.status === 403) {
    throw new DolphinError(`Dolphin refused ${endpoint}: HTTP ${res.status}.`, { code: "unauthorized", status: res.status });
  }
  if (!res.ok) throw new DolphinError(`Dolphin returned HTTP ${res.status}.`, { status: res.status });
  return text;
}

const AUTH_WORDS = /unauthori[sz]ed|api[ _-]?key|not logged|login|token|credential/i;

/** Dolphin reports failures as a 200 with `{ "error": "..." }`. */
function replyError(endpoint, data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !data.error) return null;
  const detail = String(data.error).slice(0, 120);
  // "unauthorized" may also mean "not your boiler": callers that know the device
  // re-check the key with getDevices before asking the user to sign in again.
  const code = AUTH_WORDS.test(detail) ? "unauthorized" : "rejected";
  return new DolphinError(`Dolphin refused ${endpoint}: ${detail}.`, { code });
}

function parseJson(endpoint, text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new DolphinError(`Unexpected reply from Dolphin ${endpoint}.`);
  }
  const err = replyError(endpoint, data);
  if (err) throw err;
  return data;
}

/** Commands may reply with plain text ("ok") or JSON; only a JSON error counts as failure. */
function checkCommand(endpoint, text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return text;
  }
  const err = replyError(endpoint, data);
  if (err) throw err;
  return data;
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

const badLogin = () => new DolphinError("Dolphin rejected that email or password.", { code: "bad_login" });

export function createDolphinClient(opts = {}) {
  const call = (endpoint, fields) => post(endpoint, fields, opts);
  const json = async (endpoint, fields) => parseJson(endpoint, await call(endpoint, fields));
  const command = async (endpoint, fields) => checkCommand(endpoint, await call(endpoint, fields));

  return {
    /** Exchanges the app login for an API key (plain-text reply). */
    async getApiKey(email, password) {
      let text;
      try {
        text = (await call("getAPIkey", { email, password })).trim();
      } catch (err) {
        if (err.code === "unauthorized") throw badLogin();
        throw err;
      }
      // A failed login comes back as an empty body or a JSON/HTML error, never a bare key.
      if (!text || /^[{[<]/.test(text) || /\s/.test(text)) throw badLogin();
      return text;
    },

    async getDevices(email, apiKey) {
      const data = await json("getDevices", { email, API_Key: apiKey });
      if (!Array.isArray(data)) throw new DolphinError("Dolphin did not return a device list.");
      return data.filter((d) => d && d.deviceName).map((d) => ({ ...d, deviceName: String(d.deviceName) }));
    },

    async getStatus(email, apiKey, deviceName) {
      const data = await json("getMainScreenData", { email, API_Key: apiKey, deviceName });
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new DolphinError("Dolphin did not return boiler status.");
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
