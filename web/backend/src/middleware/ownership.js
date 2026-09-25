import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { children } from "../db/schema.js";

/** Loads a child by :childId and confirms the authenticated user owns it.
 *  (Family-member viewer/co-parent access by invited email is a natural next
 *  step but out of scope for this MVP backend — see README "Known gaps".) */
export async function loadOwnedChild(req, res, next) {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId)) return res.status(400).json({ error: "Invalid child id." });

  const [child] = await db.select().from(children).where(eq(children.id, childId));
  if (!child) return res.status(404).json({ error: "Child not found." });
  if (child.ownerUserId !== req.userId) return res.status(403).json({ error: "You don't have access to this child's record." });

  req.child = child;
  next();
}
