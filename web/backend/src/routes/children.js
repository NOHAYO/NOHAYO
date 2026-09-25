import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { children, familyMembers } from "../db/schema.js";
import { loadOwnedChild } from "../middleware/ownership.js";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await db.select().from(children).where(eq(children.ownerUserId, req.userId));
  res.json(rows);
});

const createSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string(), // ISO date
  aboutText: z.string().optional().default(""),
  familyValues: z.string().optional().default(""),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { name, birthDate, aboutText, familyValues } = parsed.data;

  const [child] = await db.insert(children).values({
    ownerUserId: req.userId,
    name,
    birthDate: new Date(birthDate),
    aboutText,
    familyValues,
  }).returning();

  // Mirrors OnboardingFamilyScreen.java: the creating user is always Primary parent.
  await db.insert(familyMembers).values({
    childId: child.id,
    name: "You",
    role: "primary_parent",
    status: "active",
  });

  res.status(201).json(child);
});

router.get("/:childId", loadOwnedChild, async (req, res) => {
  res.json(req.child);
});

export default router;
