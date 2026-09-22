package com.nohayo.companion.model;

public class Insight {
    public static final String STATUS_ACTIVE = "active";
    public static final String STATUS_TRIED = "tried";
    public static final String STATUS_DISMISSED = "dismissed";

    public long id;
    public long childId;
    public String domain;
    public String title;
    public String summary;
    public String confidenceTier; // "Emerging pattern" / "Consistent pattern" / "Well-supported pattern"
    public int confidenceLevel;   // 1..3
    public String evidenceIds;    // comma-separated Moment ids
    public String recommendation;
    public String recommendationEffort; // e.g. "5 minutes"
    public String recommendationFor;    // "You and " + child name
    public long createdAtMillis;
    public String status;

    public Insight() {}
}
