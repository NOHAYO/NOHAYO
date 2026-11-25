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
    await expect(dead.getDevices(MOCK_EMAIL, MOCK_API_KEY)).rejects.toBeInstanceOf(DolphinError);
  });
});

describe("normaliseStatus", () => {
  it("treats non-positive temperatures as unknown", () => {
    expect(normaliseStatus({ Temperature: 0, targetTemperature: -1 })).toMatchObject({ temperature: null, targetTemperature: null });
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
