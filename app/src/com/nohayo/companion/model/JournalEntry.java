package com.nohayo.companion.model;

public class JournalEntry {
    public long id;
    public long childId;
    public String author;
    public String text;
    public long timestampMillis;
    public boolean privateEntry;

    public JournalEntry() {}
}
