import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { pool } from "./db/client.js";

const app = createApp();

/** Integration tests against a live Postgres (run `npm run db:migrate` first).
 *  Each run uses a unique email so it's safe to re-run without resetting the DB. */
const uniqueEmail = `test-${Date.now()}@nohayo.com`;

describe("NOHAYO companion API", () => {
  let token;
  let childId;

  it("health check responds", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("signs up a new user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: uniqueEmail, password: "password123", name: "Test Parent" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/children");
    expect(res.status).toBe(401);
  });

  it("creates a child profile", async () => {
    const res = await request(app)
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Child", birthDate: "2021-01-01", aboutText: "Curious." });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Child");
    childId = res.body.id;
  });

  it("logs moments and generates an insight after a second matching moment", async () => {
    const first = await request(app)
      .post(`/api/children/${childId}/moments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Chose her own outfit today.", domain: "independence" });
    expect(first.status).toBe(201);
    expect(first.body.newInsights).toHaveLength(0); // only one moment so far

    const second = await request(app)
      .post(`/api/children/${childId}/moments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Picked her own shoes without being asked.", domain: "independence" });
    expect(second.status).toBe(201);
    expect(second.body.newInsights).toHaveLength(1);
    expect(second.body.newInsights[0].domain).toBe("independence");
  });

  it("another user cannot access this child's record", async () => {
    const other = await request(app)
      .post("/api/auth/signup")
      .send({ email: `other-${Date.now()}@nohayo.com`, password: "password123", name: "Someone Else" });

    const res = await request(app)
      .get(`/api/children/${childId}/moments`)
      .set("Authorization", `Bearer ${other.body.token}`);
    expect(res.status).toBe(403);
  });

  afterAll(async () => {
    await pool.end();
  });
});
