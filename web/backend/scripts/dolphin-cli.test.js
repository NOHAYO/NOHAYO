import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createMockDolphin, MOCK_EMAIL, MOCK_PASSWORD, MOCK_API_KEY, MOCK_DEVICE } from "./dolphin-mock.js";

/** Runs the real `npm run dolphin` CLI as a child process against the mock API. */
const CLI = fileURLToPath(new URL("./dolphin-cli.js", import.meta.url));
const mock = createMockDolphin();
let base;

function cli(args, env = {}) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      { env: { PATH: process.env.PATH, DOLPHIN_BASE_URL: base, DOLPHIN_EMAIL: MOCK_EMAIL, DOLPHIN_API_KEY: MOCK_API_KEY, ...env } },
      (err, stdout, stderr) => resolve({ code: err ? err.code : 0, stdout, stderr }),
    );
  });
}

describe("dolphin CLI (against the mock API)", () => {
  beforeAll(async () => {
    await new Promise((r) => mock.server.listen(0, r));
    base = `http://127.0.0.1:${mock.server.address().port}/HA/V1`;
  });
  afterAll(() => new Promise((r) => mock.server.close(r)));
  beforeEach(() => {
    Object.assign(mock.device, { Power: "OFF", Temperature: 31, targetTemperature: 0, Shabbat: "OFF", fixedTemperature: "OFF" });
  });

  it("prints usage with no command", async () => {
    const r = await cli([]);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/Usage/);
  });

  it("logs in with a password and prints the key", async () => {
    const r = await cli(["login"], { DOLPHIN_API_KEY: "", DOLPHIN_PASSWORD: MOCK_PASSWORD });
    expect(r.code).toBe(0);
    expect(r.stdout.trim()).toBe(MOCK_API_KEY);
    expect(r.stderr).toContain(base);
  });

  it("fails cleanly on a wrong password", async () => {
    const r = await cli(["devices"], { DOLPHIN_API_KEY: "", DOLPHIN_PASSWORD: "wrong" });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Error: Dolphin rejected/);
  });

  it("login with a wrong password says so instead of printing \"failed\" as a key", async () => {
    const r = await cli(["login"], { DOLPHIN_API_KEY: "", DOLPHIN_PASSWORD: "wrong" });
    expect(r.code).toBe(1);
    expect(r.stdout).not.toMatch(/failed/);
    expect(r.stderr).toMatch(/rejected that email or password/);
  });

  it("login checks a supplied API key before printing it", async () => {
    const r = await cli(["login"], { DOLPHIN_API_KEY: "not-a-real-key" });
    expect(r.code).toBe(1);
    expect(r.stdout).toBe("");
  });

  it("needs DOLPHIN_EMAIL", async () => {
    const r = await cli(["devices"], { DOLPHIN_EMAIL: "" });
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Missing DOLPHIN_EMAIL/);
  });

  it("lists devices and shows status for the first boiler by default", async () => {
    expect((await cli(["devices"])).stdout.trim()).toBe(MOCK_DEVICE);
    const r = await cli(["status"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(MOCK_DEVICE);
    expect(r.stdout).toMatch(/water\s+31 °C/);
    expect(r.stdout).toMatch(/heating\s+off/);
  });

  it("heats and stops", async () => {
    let r = await cli(["on", "60"]);
    expect(r.stdout).toMatch(/heating\s+ON → 60 °C/);
    expect(mock.calls.at(-2)).toMatchObject({ endpoint: "turnOnManually", fields: { temperature: "60", deviceName: MOCK_DEVICE } });
    r = await cli(["off", MOCK_DEVICE]);
    expect(r.stdout).toMatch(/heating\s+off/);
  });

  it("rejects an out-of-range temperature without calling Dolphin", async () => {
    const before = mock.calls.length;
    const r = await cli(["on", "90"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/20 to 71/);
    expect(mock.calls.slice(before).some((c) => c.endpoint === "turnOnManually")).toBe(false);
  });

  it("toggles fixed temperature and Shabbat", async () => {
    expect((await cli(["fixed", "50"])).stdout).toMatch(/fixed temp\s+on/);
    expect((await cli(["fixed", "off"])).stdout).toMatch(/fixed temp\s+off/);
    expect((await cli(["shabbat", "on"])).stdout).toMatch(/shabbat\s+on/);
    expect((await cli(["shabbat", "off"])).stdout).toMatch(/shabbat\s+off/);
  });

  it("heats for N showers, skips when already hot, and refuses during Shabbat", async () => {
    let r = await cli(["showers", "3"]);
    expect(r.stdout).toMatch(/heating\s+ON → 52 °C/);

    mock.device.Power = "OFF";
    mock.device.Temperature = 60;
    r = await cli(["showers", "2"]);
    expect(r.stdout).toMatch(/Already hot enough/);

    mock.device.Temperature = 31;
    mock.device.Shabbat = "ON";
    r = await cli(["showers", "2"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Shabbat/);
    expect(mock.device.Power).toBe("OFF");
  });

  it("errors for a shower count the boiler doesn't have", async () => {
    const r = await cli(["showers", "9"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/No setting for 9 showers/);
  });

  it("reports a refused command instead of claiming success", async () => {
    const r = await cli(["on", "60", "SOMEONE-ELSES-BOILER"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/refused turnOnManually/);
  });
});
