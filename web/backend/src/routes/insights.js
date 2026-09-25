import { Router } from "express";
import { z } from "zod";
import { eq, desc, inArray, asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { insights, moments, goals } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";

const router = Router({ mergeParams: true });

router.get("/", loadOwnedChild, async (req, res) => {
  const rows = await db.select().from(insights)
    .where(eq(insights.childId, req.child.id))
    .orderBy(desc(insights.createdAt));
  res.json(rows);
});

router.get("/:insightId", loadOwnedChild, async (req, res) => {
  const [insight] = await db.select().from(insights).where(eq(insights.id, Number(req.params.insightId)));
  if (!insight || insight.childId !== req.child.id) return res.status(404).json({ error: "Insight not found." });

  const ids = (insight.evidenceIds || "").split(",").filter(Boolean).map(Number);
  const evidence = ids.length
    ? await db.select().from(moments).where(inArray(moments.id, ids)).orderBy(asc(moments.timestamp))
    : [];

  res.json({ ...insight, evidence });
});

const statusSchema = z.object({ status: z.enum(["tried", "dismissed"]) });

router.post("/:insightId/status", loadOwnedChild, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [insight] = await db.select().from(insights).where(eq(insights.id, Number(req.params.insightId)));
  if (!insight || insight.childId !== req.child.id) return res.status(404).json({ error: "Insight not found." });

  await db.update(insights).set({ status: parsed.data.status }).where(eq(insights.id, insight.id));

  let goal = null;
  if (parsed.data.status === "tried") {
    // Mirrors InsightDetailScreen.java's "Try a next step": seed a Goal from the recommendation.
    [goal] = await db.insert(goals).values({
      childId: req.child.id,
      what: insight.recommendation,
      why: insight.title,
      byWhen: "This week",
      howNoticed: "You'll notice it when it happens naturally, no need to force it.",
      status: "active",
    }).returning();
  }

  res.json({ insight: { ...insight, status: parsed.data.status }, goal });
});

export default router;
