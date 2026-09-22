package com.nohayo.companion.engine;

import com.nohayo.companion.ui.Theme;

import java.util.LinkedHashMap;
import java.util.Map;

/** The development domains a moment can be tagged with (DRD §6, MVP subset highlighted). */
public final class Domains {
    private Domains() {}

    public static final String PERSONAL_DEVELOPMENT = "personal_development";
    public static final String EMOTIONAL = "emotional";
    public static final String SOCIAL = "social";
    public static final String COMMUNICATION = "communication";
    public static final String INDEPENDENCE = "independence";
    public static final String LEARNING = "learning";
    public static final String CREATIVITY = "creativity";
    public static final String RESILIENCE = "resilience";

    /** Domains the MVP insight engine actively reasons over (DRD §47). */
    public static final String[] MVP_INSIGHT_DOMAINS = {
            PERSONAL_DEVELOPMENT, LEARNING, INDEPENDENCE, SOCIAL
    };

    public static final String[] ALL = {
            PERSONAL_DEVELOPMENT, EMOTIONAL, SOCIAL, COMMUNICATION,
            INDEPENDENCE, LEARNING, CREATIVITY, RESILIENCE
    };

    public static String label(String key) {
        switch (key) {
            case PERSONAL_DEVELOPMENT: return "Personal development";
            case EMOTIONAL: return "Emotional";
            case SOCIAL: return "Social";
            case COMMUNICATION: return "Communication";
            case INDEPENDENCE: return "Independence";
            case LEARNING: return "Learning";
            case CREATIVITY: return "Creativity";
            case RESILIENCE: return "Resilience";
            default: return key;
        }
    }

    public static int color(String key) {
        switch (key) {
            case INDEPENDENCE:
            case LEARNING:
                return Theme.GREEN;
            case SOCIAL:
            case COMMUNICATION:
                return Theme.BLUE;
            default:
                return Theme.TERRACOTTA;
        }
    }

    public static int tint(String key) {
        switch (key) {
            case INDEPENDENCE:
            case LEARNING:
                return Theme.GREEN_TINT;
            case SOCIAL:
            case COMMUNICATION:
                return Theme.BLUE_TINT;
            default:
                return Theme.PEACH;
        }
    }

    /** Simple keyword heuristic used when the parent lets the app decide the domain. */
    public static String guessFromText(String text) {
        if (text == null) return PERSONAL_DEVELOPMENT;
        String t = text.toLowerCase();
        Map<String, String[]> keywords = new LinkedHashMap<>();
        keywords.put(INDEPENDENCE, new String[]{"picked", "chose", "herself", "himself", "on her own", "on his own", "dressed", "by myself", "own choice", "decided"});
        keywords.put(SOCIAL, new String[]{"friend", "shared", "played with", "grandma", "grandpa", "sibling", "classmate", "hug", "smiled at"});
        keywords.put(COMMUNICATION, new String[]{"said", "talked", "asked", "explained", "told us", "words", "sentence"});
        keywords.put(LEARNING, new String[]{"learn", "read", "counted", "wrote", "school", "figured out", "practiced", "curious"});
        keywords.put(CREATIVITY, new String[]{"drew", "drawing", "painted", "made up", "invented", "song", "story", "imagin"});
        keywords.put(EMOTIONAL, new String[]{"cried", "upset", "happy", "excited", "scared", "proud", "frustrated", "calmed"});
        keywords.put(RESILIENCE, new String[]{"tried again", "kept going", "didn't give up", "fell", "failed", "practice"});
        for (Map.Entry<String, String[]> e : keywords.entrySet()) {
            for (String k : e.getValue()) {
                if (t.contains(k)) return e.getKey();
            }
        }
        return PERSONAL_DEVELOPMENT;
    }
}
