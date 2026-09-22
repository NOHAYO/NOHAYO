package com.nohayo.companion.model;

public class Goal {
    public static final String STATUS_ACTIVE = "active";
    public static final String STATUS_NOTICED = "noticed"; // light "success" marker, never a score

    public long id;
    public long childId;
    public String what;
    public String why;
    public String byWhen;
    public String howNoticed;
    public long createdAtMillis;
    public String status;

    public Goal() {}
}
