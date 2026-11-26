import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createDolphinClient, normaliseStatus, DolphinError } from "./dolphin.js";
import { createMockDolphin, MOCK_EMAIL, MOCK_PASSWORD, MOCK_API_KEY, MOCK_DEVICE } from "../../scripts/dolphin-mock.js";
import { seal, open } from "./secretBox.js";

describe("Dolphin client (against the mock API)", () => {
  const mock = createMockDolphin();
  let client;

  beforeAll(async () => {
    await new Promise((r) => mock.server.listen(0, r));
    client = createDolphinClient({ base: `http://127.0.0.1:${mock.server.address().port}/HA/V1` });
  });
  afterAll(() => new Promise((r) => mock.server.close(r)));

  it("exchanges email + password for an API key, form-encoded", async () => {
    expect(await client.getApiKey(MOCK_EMAIL, MOCK_PASSWORD)).toBe(MOCK_API_KEY);
    expect(mock.calls.at(-1)).toEqual({ endpoint: "getAPIkey", fields: { email: MOCK_EMAIL, password: MOCK_PASSWORD } });
  });

  it("rejects a wrong password", async () => {
    await expect(client.getApiKey(MOCK_EMAIL, "nope")).rejects.toBeInstanceOf(DolphinError);
  });

  it("lists devices and reads status", async () => {
    const devices = await client.getDevices(MOCK_EMAIL, MOCK_API_KEY);
    expect(devices.map((d) => d.deviceName)).toEqual([MOCK_DEVICE]);
    const s = await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect(s.power).toBe(false);
    expect(s.showers[1]).toEqual({ count: 2, temperature: 45 });
  });

  it("turns heating on and off", async () => {
    await client.turnOn(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, 60);
    expect(mock.calls.at(-1).fields).toMatchObject({ deviceName: MOCK_DEVICE, temperature: "60", API_Key: MOCK_API_KEY });
    expect((await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE)).power).toBe(true);
    await client.turnOff(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect((await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE)).power).toBe(false);
  });

  it("toggles Shabbat and fixed temperature", async () => {
    await client.setShabbat(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, true);
    await client.setFixedTemperature(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, 50);
    let s = await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect([s.shabbat, s.fixedTemperature]).toEqual([true, true]);
    await client.setShabbat(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, false);
    await client.turnOffFixedTemperature(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    s = await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect([s.shabbat, s.fixedTemperature]).toEqual([false, false]);
  });

  it("reports the energy meter", async () => {
    expect(await client.hasEnergyMeter(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE)).toBe(true);
  });

  it("errors on an unreachable host", async () => {
    const dead = createDolphinClient({ base: "http://127.0.0.1:1/HA/V1" });
    await expect(dead.getDevices(MOCK_EMAIL, MOCK_API_KEY)).rejects.toMatchObject({ code: "unreachable" });
  });

  it("classifies failures", async () => {
    await expect(client.getApiKey(MOCK_EMAIL, "nope")).rejects.toMatchObject({ code: "bad_login" });

    mock.faults.offline = true;
    await expect(client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE)).rejects.toMatchObject({ code: "rejected" });
    await expect(client.turnOn(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, 50)).rejects.toMatchObject({ code: "rejected" });
    mock.reset();

    // A rejected key used to make commands "succeed" silently; now it's an error.
    await expect(client.turnOn(MOCK_EMAIL, "stale-key", MOCK_DEVICE, 50)).rejects.toMatchObject({ code: "unauthorized" });
    await expect(client.getDevices(MOCK_EMAIL, "stale-key")).rejects.toMatchObject({ code: "unauthorized" });

    for (const [outage, code] of [["drop", "unreachable"], ["http500", "bad_reply"], ["garbage", "bad_reply"]]) {
      mock.faults.outage = outage;
      await expect(client.getDevices(MOCK_EMAIL, MOCK_API_KEY)).rejects.toMatchObject({ code });
    }
    mock.reset();
  });

  it("times out instead of hanging", async () => {
    const http = await import("node:http");
    const hang = http.createServer(() => {}); // never answers
    await new Promise((r) => hang.listen(0, r));
    const slow = createDolphinClient({ base: `http://127.0.0.1:${hang.address().port}/HA/V1`, timeoutMs: 100 });
    await expect(slow.getDevices(MOCK_EMAIL, MOCK_API_KEY)).rejects.toMatchObject({ code: "unreachable", message: expect.stringContaining("timeout") });
    hang.closeAllConnections();
    await new Promise((r) => hang.close(r));
  });

  it("keeps credentials out of errors", async () => {
    const err = await client.getApiKey(MOCK_EMAIL, "secret-guess").catch((e) => e);
    expect(JSON.stringify({ ...err, message: err.message })).not.toContain("secret-guess");
  });
});

describe("Dolphin client error handling (against the mock API)", () => {
  const mock = createMockDolphin();
  let base;
  let client;

  beforeAll(async () => {
    await new Promise((r) => mock.server.listen(0, r));
    base = `http://127.0.0.1:${mock.server.address().port}/HA/V1`;
    client = createDolphinClient({ base });
  });
  afterAll(() => new Promise((r) => mock.server.close(r)));

  it.each([
    ["turnOn", (c, key, dev) => c.turnOn(MOCK_EMAIL, key, dev, 60)],
    ["turnOff", (c, key, dev) => c.turnOff(MOCK_EMAIL, key, dev)],
    ["setFixedTemperature", (c, key, dev) => c.setFixedTemperature(MOCK_EMAIL, key, dev, 50)],
    ["turnOffFixedTemperature", (c, key, dev) => c.turnOffFixedTemperature(MOCK_EMAIL, key, dev)],
    ["setShabbat", (c, key, dev) => c.setShabbat(MOCK_EMAIL, key, dev, true)],
  ])("%s fails loudly when Dolphin refuses the command", async (_name, fn) => {
    await expect(fn(client, "wrong-key", MOCK_DEVICE)).rejects.toThrow(/refused/);
    await expect(fn(client, MOCK_API_KEY, "SOMEONE-ELSES-BOILER")).rejects.toBeInstanceOf(DolphinError);
    expect(mock.device.Power).toBe("OFF");
    expect(mock.device.Shabbat).toBe("OFF");
  });

  it("refuses status and device list with a bad key or unknown device", async () => {
    await expect(client.getStatus(MOCK_EMAIL, "wrong-key", MOCK_DEVICE)).rejects.toThrow(/refused/);
    await expect(client.getStatus(MOCK_EMAIL, MOCK_API_KEY, "NOPE")).rejects.toThrow(/refused/);
    await expect(client.getDevices(MOCK_EMAIL, "wrong-key")).rejects.toBeInstanceOf(DolphinError);
    await expect(client.hasEnergyMeter(MOCK_EMAIL, "wrong-key", MOCK_DEVICE)).rejects.toBeInstanceOf(DolphinError);
  });

  it("sends every field form-encoded, including the device name", async () => {
    await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect(mock.calls.at(-1)).toEqual({
      endpoint: "getMainScreenData",
      fields: { email: MOCK_EMAIL, API_Key: MOCK_API_KEY, deviceName: MOCK_DEVICE },
    });
  });

  it("tolerates a trailing slash on the base URL and reads DOLPHIN_BASE_URL", async () => {
    const slashed = createDolphinClient({ base: `${base}/` });
    expect(await slashed.getDevices(MOCK_EMAIL, MOCK_API_KEY)).toHaveLength(1);

    const prev = process.env.DOLPHIN_BASE_URL;
    process.env.DOLPHIN_BASE_URL = base;
    try {
      expect(await createDolphinClient().getApiKey(MOCK_EMAIL, MOCK_PASSWORD)).toBe(MOCK_API_KEY);
    } finally {
      if (prev === undefined) delete process.env.DOLPHIN_BASE_URL;
      else process.env.DOLPHIN_BASE_URL = prev;
    }
  });

  it("follows the simulated boiler as it heats, then stops at the target", async () => {
    mock.device.Temperature = 40;
    await client.turnOn(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE, 44);
    const temps = [];
    for (let i = 0; i < 3; i++) temps.push((await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE)).temperature);
    expect(temps).toEqual([42, 44, 44]);
    const s = await client.getStatus(MOCK_EMAIL, MOCK_API_KEY, MOCK_DEVICE);
    expect(s).toMatchObject({ power: false, energy: 0 });
  });

  it("404s on an unknown endpoint as an HTTP error", async () => {
    const wrongPath = createDolphinClient({ base: `${base}/../V9` });
    await expect(wrongPath.getDevices(MOCK_EMAIL, MOCK_API_KEY)).rejects.toMatchObject({ name: "DolphinError", status: 404 });
  });
});

describe("Dolphin client replies the mock can't produce", () => {
  const reply = (body, status = 200) => async () => new Response(body, { status });
  const with_ = (fetchImpl) => createDolphinClient({ base: "http://dolphin.invalid/HA/V1", fetchImpl });

  it("turns an HTTP 5xx into a DolphinError carrying the status, but not the reply body", async () => {
    const err = await with_(reply("oops", 503)).getDevices("a@b.c", "k").catch((e) => e);
    expect(err).toMatchObject({ status: 503, code: "bad_reply" });
    expect(err).not.toHaveProperty("body");
  });

  it("rejects a non-JSON status reply", async () => {
    await expect(with_(reply("<html>maintenance</html>")).getStatus("a@b.c", "k", "d")).rejects.toThrow(/Unexpected reply/);
  });

  it("rejects a status reply that is not an object", async () => {
    await expect(with_(reply("[]")).getStatus("a@b.c", "k", "d")).rejects.toThrow(/status/);
  });

  it("rejects a device list that is not a list", async () => {
    await expect(with_(reply('{"ok":true}')).getDevices("a@b.c", "k")).rejects.toThrow(/device list/);
  });

  it("drops device entries without a name and stringifies numeric names", async () => {
    const devices = await with_(reply('[{"deviceName":12345},{},null,{"deviceName":""}]')).getDevices("a@b.c", "k");
    expect(devices).toEqual([{ deviceName: "12345" }]);
  });

  it.each(["", "  ", '{"error":"bad login"}', "<html>login</html>", "Invalid email or password"])(
    "treats getAPIkey reply %j as a failed login",
    async (body) => {
      await expect(with_(reply(body)).getApiKey("a@b.c", "pw")).rejects.toThrow(/rejected/);
    },
  );

  it("trims the plain-text API key", async () => {
    expect(await with_(reply("  key-abc\n")).getApiKey("a@b.c", "pw")).toBe("key-abc");
  });

  it("accepts an empty or plain-text command reply", async () => {
    await expect(with_(reply("")).turnOff("a@b.c", "k", "d")).resolves.toBe("");
    await expect(with_(reply("OK")).turnOff("a@b.c", "k", "d")).resolves.toBe("OK");
  });

  it("reports a timeout as such", async () => {
    const timeout = async () => {
      throw Object.assign(new Error("aborted"), { name: "TimeoutError" });
    };
    await expect(with_(timeout).getDevices("a@b.c", "k")).rejects.toThrow(/timeout/);
  });
});

describe("normaliseStatus", () => {
  it("treats non-positive temperatures as unknown", () => {
    expect(normaliseStatus({ Temperature: 0, targetTemperature: -1 })).toMatchObject({ temperature: null, targetTemperature: null });
  });

  it("parses string numbers and on/off flags in any case", () => {
    expect(
      normaliseStatus({ Power: "on", Temperature: "47", targetTemperature: "60", Energy: "12.5", Shabbat: "Off", fixedTemperature: "ON" }),
    ).toMatchObject({ power: true, temperature: 47, targetTemperature: 60, energy: 12.5, shabbat: false, fixedTemperature: true });
  });

  it("defaults missing fields", () => {
    expect(normaliseStatus({})).toEqual({
      power: false, temperature: null, targetTemperature: null, energy: 0, shabbat: false, fixedTemperature: false, showers: [],
    });
  });

  it("keeps shower slots whose temperature is missing as null", () => {
    expect(normaliseStatus({ showerTemperature: [{ temp: "40" }, {}] }).showers).toEqual([
      { count: 1, temperature: 40 },
      { count: 2, temperature: null },
    ]);
  });
});

describe("secretBox", () => {
  it("round-trips and doesn't store plaintext", () => {
    process.env.JWT_SECRET ||= "test-secret";
    const sealed = seal("abc123");
    expect(sealed).not.toContain("abc123");
    expect(open(sealed)).toBe("abc123");
  });
});
