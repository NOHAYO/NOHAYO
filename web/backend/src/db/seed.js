import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, pool } from "./client.js";
import { users, children, familyMembers, moments } from "./schema.js";
import { refreshInsights } from "../engine/insightEngine.js";

async function seed() {
  console.log("Seeding demo data...");

  const passwordHash = await bcrypt.hash("password123", 10);
  const [user] = await db.insert(users).values({
    email: "demo@nohayo.com",
    passwordHash,
    name: "Demo Parent",
  }).returning();

  const [child] = await db.insert(children).values({
    ownerUserId: user.id,
    name: "Noa",
    birthDate: new Date(Date.now() - 5 * 365.25 * 24 * 60 * 60 * 1000),
    aboutText: "Curious, watches faces closely, calms down when we sing.",
    familyValues: "",
  }).returning();

  await db.insert(familyMembers).values({ childId: child.id, name: "You", role: "primary_parent", status: "active" });
  await db.insert(familyMembers).values({ childId: child.id, name: "Grandma", role: "viewer_only", status: "pending" });

  const seedMoments = [
    ["Insisted on the yellow raincoat.", "independence", 21],
    ["Dressed herself, shoes on the wrong feet, very proud.", "independence", 14],
    ["Chose the bedtime story and the order.", "independence", 7],
    ["Asked how the moon changes shape.", "learning", 10],
    ["Wanted to learn the names of all the dinosaurs.", "learning", 3],
  ];
  for (const [text, domain, daysAgo] of seedMoments) {
    await db.insert(moments).values({
      childId: child.id,
      text,
      domain,
      author: "You",
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  await refreshInsights(child.id, child.name);

  console.log("Seed complete. Login with demo@nohayo.com / password123");
  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
