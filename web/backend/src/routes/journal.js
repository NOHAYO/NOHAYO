import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { journalEntries } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";

const router = Router({ mergeParams: true });

router.get("/", loadOwnedChild, async (req, res) => {
  const rows = await db.select().from(journalEntries)
    .where(eq(journalEntries.childId, req.child.id))
    .orderBy(desc(journalEntries.timestamp));
  res.json(rows);
});

const createSchema = z.object({
  text: z.string().min(1),
  author: z.string().optional().default("You"),
  isPrivate: z.boolean().optional().default(true),
});

router.post("/", loadOwnedChild, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [entry] = await db.insert(journalEntries).values({
    childId: req.child.id,
    ...parsed.data,
  }).returning();

  res.status(201).json(entry);
});

export default router;
