import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { pool } from "./db/client.js";
import { createMockDolphin, MOCK_EMAIL, MOCK_PASSWORD, MOCK_API_KEY, MOCK_DEVICE } from "../scripts/dolphin-mock.js";

/** Boiler routes against a live Postgres (run `npm run db:migrate` first) and
 *  the in-process mock Dolphin API. */
const app = createApp();
const mock = createMockDolphin();
const dev = `/api/boiler/devices/${MOCK_DEVICE}`;

describe("Boiler controls API", () => {
  let auth;

  beforeAll(async () => {
    await new Promise((r) => mock.server.listen(0, r));
    process.env.DOLPHIN_BASE_URL = `http://127.0.0.1:${mock.server.address().port}/HA/V1`;
    const res = await request(app).post("/api/auth/signup")
      .send({ email: `boiler-${Date.now()}@nohayo.com`, password: "password123", name: "Boiler Tester" });
    auth = { Authorization: `Bearer ${res.body.token}` };
  });

  afterAll(async () => {
    await new Promise((r) => mock.server.close(r));
    await pool.end();
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
    expect(res.status).toBe(502);
  });

  it("links the account and stores the key encrypted", async () => {
    const res = await request(app).post("/api/boiler/link").set(auth).send({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.devices).toEqual([{ deviceName: MOCK_DEVICE }]);
    expect(JSON.stringify(res.body)).not.toContain(MOCK_API_KEY);

    const { rows } = await pool.query("select api_key_encrypted from boiler_accounts where dolphin_email = $1", [MOCK_EMAIL]);
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

  it("returns 502 when Dolphin refuses a command, e.g. a boiler not on this account", async () => {
    const res = await request(app).post("/api/boiler/devices/SOMEONE-ELSES-BOILER/heat").set(auth).send({ temperature: 50 });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/refused/);
  });

  it("answers with an error, not a hung request, when the stored key can't be decrypted", async () => {
    const { rows } = await pool.query("select api_key_encrypted from boiler_accounts where dolphin_email = $1", [MOCK_EMAIL]);
    const good = rows[0].api_key_encrypted;
    await pool.query("update boiler_accounts set api_key_encrypted = 'v1:garbage' where dolphin_email = $1", [MOCK_EMAIL]);
    try {
      const res = await request(app).get(dev).set(auth).timeout(3000);
      expect(res.status).toBe(500);
    } finally {
      await pool.query("update boiler_accounts set api_key_encrypted = $1 where dolphin_email = $2", [good, MOCK_EMAIL]);
    }
  });

  it("unlinks", async () => {
    expect((await request(app).delete("/api/boiler/link").set(auth)).body).toEqual({ linked: false });
    expect((await request(app).get("/api/boiler").set(auth)).body.linked).toBe(false);
  });
});
