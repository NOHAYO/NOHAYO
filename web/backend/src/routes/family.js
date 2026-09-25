import { Router } from "express";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/client.js";
import { familyMembers } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";

const router = Router({ mergeParams: true });

router.get("/", loadOwnedChild, async (req, res) => {
  const rows = await db.select().from(familyMembers)
    .where(eq(familyMembers.childId, req.child.id))
    .orderBy(asc(familyMembers.id));
  res.json(rows);
});

const inviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  role: z.enum(["co_parent", "guardian", "viewer_only"]),
});

router.post("/", loadOwnedChild, async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [member] = await db.insert(familyMembers).values({
    childId: req.child.id,
    ...parsed.data,
    status: "pending",
  }).returning();

  // A real invite email would be sent here (DRD §3 relationship types); this
  // MVP backend records the invite so the UI has something real to show.
  res.status(201).json(member);
});

export default router;
