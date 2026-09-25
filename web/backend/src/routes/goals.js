import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { goals } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";

const router = Router({ mergeParams: true });

router.get("/", loadOwnedChild, async (req, res) => {
  const rows = await db.select().from(goals)
    .where(eq(goals.childId, req.child.id))
    .orderBy(desc(goals.createdAt));
  res.json(rows);
});

const createSchema = z.object({
  what: z.string().min(1),
  why: z.string().optional().default(""),
  byWhen: z.string().optional().default(""),
  howNoticed: z.string().optional().default(""),
});

router.post("/", loadOwnedChild, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [goal] = await db.insert(goals).values({
    childId: req.child.id,
    ...parsed.data,
    status: "active",
  }).returning();

  res.status(201).json(goal);
});

router.post("/:goalId/notice", loadOwnedChild, async (req, res) => {
  const [goal] = await db.select().from(goals).where(eq(goals.id, Number(req.params.goalId)));
  if (!goal || goal.childId !== req.child.id) return res.status(404).json({ error: "Goal not found." });

  await db.update(goals).set({ status: "noticed" }).where(eq(goals.id, goal.id));
  res.json({ ...goal, status: "noticed" });
});

export default router;
