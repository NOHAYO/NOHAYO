import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import childrenRoutes from "./routes/children.js";
import momentsRoutes from "./routes/moments.js";
import insightsRoutes from "./routes/insights.js";
import goalsRoutes from "./routes/goals.js";
import journalRoutes from "./routes/journal.js";
import familyRoutes from "./routes/family.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => res.json({ ok: true, service: "nohayo-companion-backend" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/children", requireAuth, childrenRoutes);
  app.use("/api/children/:childId/moments", requireAuth, momentsRoutes);
  app.use("/api/children/:childId/insights", requireAuth, insightsRoutes);
  app.use("/api/children/:childId/goals", requireAuth, goalsRoutes);
  app.use("/api/children/:childId/journal", requireAuth, journalRoutes);
  app.use("/api/children/:childId/family", requireAuth, familyRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}
