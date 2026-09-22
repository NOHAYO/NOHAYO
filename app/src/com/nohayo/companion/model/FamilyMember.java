package com.nohayo.companion.model;

public class FamilyMember {
    public long id;
    public long childId;
    public String name;
    public String role; // Primary parent, Co-parent, Guardian, Viewer-only
    public String status; // Active, Pending

    public FamilyMember() {}
}
