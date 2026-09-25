import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { moments } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";
import { guessFromText } from "../engine/domains.js";
import { refreshInsights } from "../engine/insightEngine.js";

const router = Router({ mergeParams: true });

router.get("/", loadOwnedChild, async (req, res) => {
  const rows = await db.select().from(moments)
    .where(eq(moments.childId, req.child.id))
    .orderBy(desc(moments.timestamp));
  res.json(rows);
});

const createSchema = z.object({
  text: z.string().min(1),
  domain: z.string().optional(), // omit to let the server decide, matching "Let it decide" in the app
  author: z.string().optional().default("You"),
});

router.post("/", loadOwnedChild, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { text, domain, author } = parsed.data;

  const [moment] = await db.insert(moments).values({
    childId: req.child.id,
    text,
    domain: domain || guessFromText(text),
    author,
  }).returning();

  const newInsights = await refreshInsights(req.child.id, req.child.name);

  res.status(201).json({ moment, newInsights });
});

export default router;
