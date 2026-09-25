import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { moments, insights } from "../db/schema.js";
import { DOMAINS, MVP_INSIGHT_DOMAINS } from "./domains.js";

/**
 * Port of engine/InsightEngine.java: a small, fully explainable, rule-based
 * stand-in for the DRD's insight-generation engine (§9-10). It never scores
 * or labels — it only notices repetition within a domain and turns it into a
 * hypothesis, always citing the exact logged moments behind it.
 */

function template(domain, name) {
  switch (domain) {
    case DOMAINS.INDEPENDENCE:
      return {
        title: `${name} is reaching for more say in their own routines`,
        summary: `This pattern suggests ${name} is enjoying making their own choices. It is one possibility, not a conclusion about who ${name} is.`,
        recommendation: `Let ${name} pick between two options for something routine, like an outfit or a snack.`,
        effort: "5 minutes",
      };
    case DOMAINS.LEARNING:
      return {
        title: `${name} is leaning into learning something new`,
        summary: `This pattern suggests ${name} is curious and motivated to figure things out right now.`,
        recommendation: `Leave out a related book, tool, or open-ended activity for ${name} to explore at their own pace.`,
        effort: "10 minutes",
      };
    case DOMAINS.SOCIAL:
      return {
        title: `${name} is warming up to shared moments with others`,
        summary: `This pattern suggests ${name} finds connection with other people energizing at the moment.`,
        recommendation: "Set up a simple shared activity with a friend or family member this week.",
        effort: "15 minutes",
      };
    default:
      return {
        title: `${name} is showing more of who they are`,
        summary: `This pattern suggests ${name} is exploring their own preferences and sense of self.`,
        recommendation: `Ask ${name} what they'd like to do this weekend, and really let them choose.`,
        effort: "5 minutes",
      };
  }
}

function tierFor(count) {
  if (count >= 6) return "Well-supported pattern";
  if (count >= 4) return "Consistent pattern";
  return "Emerging pattern";
}

function levelFor(count) {
  if (count >= 6) return 3;
  if (count >= 4) return 2;
  return 1;
}

/** Scans the event log per MVP domain and creates or refreshes hypothesis-style insights. */
export async function refreshInsights(childId, childName) {
  const allMoments = await db.select().from(moments).where(eq(moments.childId, childId));
  const byDomain = new Map();
  for (const m of allMoments) {
    if (!byDomain.has(m.domain)) byDomain.set(m.domain, []);
    byDomain.get(m.domain).push(m);
  }

  const existing = await db.select().from(insights).where(eq(insights.childId, childId));
  const created = [];

  for (const domain of MVP_INSIGHT_DOMAINS) {
    const domainMoments = byDomain.get(domain);
    if (!domainMoments || domainMoments.length < 2) continue;

    const activeForDomain = existing.find((i) => i.domain === domain && i.status === "active");
    const evidenceCount = Math.min(domainMoments.length, 6);
    if (activeForDomain) {
      const existingEvidence = activeForDomain.evidenceIds ? activeForDomain.evidenceIds.split(",").length : 0;
      if (evidenceCount <= existingEvidence) continue; // nothing new to say
    }

    const name = childName || "Your child";
    const t = template(domain, name);
    const evidenceIds = domainMoments.slice(0, evidenceCount).map((m) => m.id).join(",");

    const row = {
      childId,
      domain,
      title: t.title,
      summary: t.summary,
      confidenceTier: tierFor(domainMoments.length),
      confidenceLevel: levelFor(domainMoments.length),
      evidenceIds,
      recommendation: t.recommendation,
      recommendationEffort: t.effort,
      recommendationFor: `You and ${name}`,
      status: "active",
    };

    if (activeForDomain) {
      await db.update(insights).set(row).where(eq(insights.id, activeForDomain.id));
      created.push({ ...row, id: activeForDomain.id });
    } else {
      const [inserted] = await db.insert(insights).values(row).returning();
      created.push(inserted);
    }
  }

  return created;
}
