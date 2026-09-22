package com.nohayo.companion.engine;

import com.nohayo.companion.db.Repository;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A small, fully explainable, rule-based stand-in for the DRD's insight-generation engine
 * (§9-10). It never scores or labels: it only notices repetition within a domain and turns
 * it into a hypothesis, always citing the exact logged moments behind it.
 */
public class InsightEngine {

    public static class Template {
        public final String title;
        public final String summary;
        public final String recommendation;
        public final String effort;
        Template(String t, String s, String r, String e) { title = t; summary = s; recommendation = r; effort = e; }
    }

    private static Template template(String domain, String name) {
        switch (domain) {
            case Domains.INDEPENDENCE:
                return new Template(
                        name + " is reaching for more say in their own routines",
                        "This pattern suggests " + name + " is enjoying making their own choices. It is one possibility, not a conclusion about who " + name + " is.",
                        "Let " + name + " pick between two options for something routine, like an outfit or a snack.",
                        "5 minutes");
            case Domains.LEARNING:
                return new Template(
                        name + " is leaning into learning something new",
                        "This pattern suggests " + name + " is curious and motivated to figure things out right now.",
                        "Leave out a related book, tool, or open-ended activity for " + name + " to explore at their own pace.",
                        "10 minutes");
            case Domains.SOCIAL:
                return new Template(
                        name + " is warming up to shared moments with others",
                        "This pattern suggests " + name + " finds connection with other people energizing at the moment.",
                        "Set up a simple shared activity with a friend or family member this week.",
                        "15 minutes");
            case Domains.PERSONAL_DEVELOPMENT:
            default:
                return new Template(
                        name + " is showing more of who they are",
                        "This pattern suggests " + name + " is exploring their own preferences and sense of self.",
                        "Ask " + name + " what they'd like to do this weekend, and really let them choose.",
                        "5 minutes");
        }
    }

    private static String tierFor(int count) {
        if (count >= 6) return "Well-supported pattern";
        if (count >= 4) return "Consistent pattern";
        return "Emerging pattern";
    }

    private static int levelFor(int count) {
        if (count >= 6) return 3;
        if (count >= 4) return 2;
        return 1;
    }

    /** Scans the event log per MVP domain and creates or refreshes hypothesis-style insights. */
    public static List<Insight> refresh(Repository repo, Child child) {
        List<Insight> created = new ArrayList<>();
        List<Moment> all = repo.getMomentsForChild(child.id);
        Map<String, List<Moment>> byDomain = new LinkedHashMap<>();
        for (Moment m : all) {
            List<Moment> list = byDomain.get(m.domain);
            if (list == null) {
                list = new ArrayList<>();
                byDomain.put(m.domain, list);
            }
            list.add(m);
        }

        List<Insight> existing = repo.getInsightsForChild(child.id);

        for (String domain : Domains.MVP_INSIGHT_DOMAINS) {
            List<Moment> moments = byDomain.get(domain);
            if (moments == null || moments.size() < 2) continue;

            Insight activeForDomain = null;
            for (Insight ins : existing) {
                if (domain.equals(ins.domain) && Insight.STATUS_ACTIVE.equals(ins.status)) {
                    activeForDomain = ins;
                    break;
                }
            }
            int evidenceCount = Math.min(moments.size(), 6);
            if (activeForDomain != null) {
                int existingEvidence = activeForDomain.evidenceIds == null || activeForDomain.evidenceIds.isEmpty()
                        ? 0 : activeForDomain.evidenceIds.split(",").length;
                if (evidenceCount <= existingEvidence) continue; // nothing new to say
            }

            Template t = template(domain, child.name == null || child.name.isEmpty() ? "Your child" : child.name);
            Insight ins = activeForDomain != null ? activeForDomain : new Insight();
            ins.childId = child.id;
            ins.domain = domain;
            ins.title = t.title;
            ins.summary = t.summary;
            ins.confidenceTier = tierFor(moments.size());
            ins.confidenceLevel = levelFor(moments.size());
            StringBuilder ids = new StringBuilder();
            for (int i = 0; i < evidenceCount; i++) {
                if (i > 0) ids.append(",");
                ids.append(moments.get(i).id);
            }
            ins.evidenceIds = ids.toString();
            ins.recommendation = t.recommendation;
            ins.recommendationEffort = t.effort;
            ins.recommendationFor = "You and " + (child.name == null || child.name.isEmpty() ? "your child" : child.name);
            ins.createdAtMillis = System.currentTimeMillis();
            ins.status = Insight.STATUS_ACTIVE;
            if (activeForDomain != null) {
                repo.updateInsight(ins);
            } else {
                repo.insertInsight(ins);
            }
            created.add(ins);
        }
        return created;
    }
}
