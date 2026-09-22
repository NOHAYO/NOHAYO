package com.nohayo.companion.model;

public class Moment {
    public long id;
    public long childId;
    public String text;
    public String domain;
    public long timestampMillis;
    public String author; // "You", "Co-parent", or child's name for self-authored entries

    public Moment() {}
}
