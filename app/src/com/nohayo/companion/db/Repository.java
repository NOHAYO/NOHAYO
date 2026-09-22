package com.nohayo.companion.db;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.model.Moment;

import java.util.ArrayList;
import java.util.List;

/** Simple synchronous data-access layer over SQLite. The event log (moments) is append-only;
 *  insights/goals/journal are derived or user-authored records referencing it. */
public class Repository {
    private final DbHelper helper;

    public Repository(Context ctx) {
        this.helper = new DbHelper(ctx);
    }

    // ---------------- Child ----------------

    public long insertChild(Child c) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("name", c.name);
        v.put("birth_date_millis", c.birthDateMillis);
        v.put("about_text", c.aboutText);
        v.put("family_values", c.familyValues);
        return db.insert("child", null, v);
    }

    public Child getFirstChild() {
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery("SELECT id,name,birth_date_millis,about_text,family_values FROM child ORDER BY id ASC LIMIT 1", null);
        Child c = null;
        if (cur.moveToFirst()) {
            c = new Child();
            c.id = cur.getLong(0);
            c.name = cur.getString(1);
            c.birthDateMillis = cur.getLong(2);
            c.aboutText = cur.getString(3);
            c.familyValues = cur.getString(4);
        }
        cur.close();
        return c;
    }

    public List<Child> getAllChildren() {
        List<Child> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery("SELECT id,name,birth_date_millis,about_text,family_values FROM child ORDER BY id ASC", null);
        while (cur.moveToNext()) {
            Child c = new Child();
            c.id = cur.getLong(0);
            c.name = cur.getString(1);
            c.birthDateMillis = cur.getLong(2);
            c.aboutText = cur.getString(3);
            c.familyValues = cur.getString(4);
            out.add(c);
        }
        cur.close();
        return out;
    }

    public void clearAllData() {
        SQLiteDatabase db = helper.getWritableDatabase();
        db.execSQL("DELETE FROM child");
        db.execSQL("DELETE FROM moment");
        db.execSQL("DELETE FROM insight");
        db.execSQL("DELETE FROM goal");
        db.execSQL("DELETE FROM journal_entry");
        db.execSQL("DELETE FROM family_member");
    }

    // ---------------- Moment (event log) ----------------

    public long insertMoment(Moment m) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("child_id", m.childId);
        v.put("text", m.text);
        v.put("domain", m.domain);
        v.put("timestamp_millis", m.timestampMillis);
        v.put("author", m.author);
        return db.insert("moment", null, v);
    }

    public List<Moment> getMomentsForChild(long childId) {
        List<Moment> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,text,domain,timestamp_millis,author FROM moment WHERE child_id=? ORDER BY timestamp_millis DESC",
                new String[]{String.valueOf(childId)});
        while (cur.moveToNext()) {
            out.add(readMoment(cur));
        }
        cur.close();
        return out;
    }

    public List<Moment> getMomentsByIds(List<Long> ids) {
        List<Moment> out = new ArrayList<>();
        if (ids.isEmpty()) return out;
        SQLiteDatabase db = helper.getReadableDatabase();
        StringBuilder placeholders = new StringBuilder();
        String[] args = new String[ids.size()];
        for (int i = 0; i < ids.size(); i++) {
            placeholders.append(i == 0 ? "?" : ",?");
            args[i] = String.valueOf(ids.get(i));
        }
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,text,domain,timestamp_millis,author FROM moment WHERE id IN (" + placeholders + ") ORDER BY timestamp_millis ASC",
                args);
        while (cur.moveToNext()) {
            out.add(readMoment(cur));
        }
        cur.close();
        return out;
    }

    private Moment readMoment(Cursor cur) {
        Moment m = new Moment();
        m.id = cur.getLong(0);
        m.childId = cur.getLong(1);
        m.text = cur.getString(2);
        m.domain = cur.getString(3);
        m.timestampMillis = cur.getLong(4);
        m.author = cur.getString(5);
        return m;
    }

    // ---------------- Insight ----------------

    public long insertInsight(Insight ins) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = insightValues(ins);
        return db.insert("insight", null, v);
    }

    public void updateInsightStatus(long id, String status) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("status", status);
        db.update("insight", v, "id=?", new String[]{String.valueOf(id)});
    }

    public void updateInsight(Insight ins) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = insightValues(ins);
        db.update("insight", v, "id=?", new String[]{String.valueOf(ins.id)});
    }

    private ContentValues insightValues(Insight ins) {
        ContentValues v = new ContentValues();
        v.put("child_id", ins.childId);
        v.put("domain", ins.domain);
        v.put("title", ins.title);
        v.put("summary", ins.summary);
        v.put("confidence_tier", ins.confidenceTier);
        v.put("confidence_level", ins.confidenceLevel);
        v.put("evidence_ids", ins.evidenceIds);
        v.put("recommendation", ins.recommendation);
        v.put("recommendation_effort", ins.recommendationEffort);
        v.put("recommendation_for", ins.recommendationFor);
        v.put("created_at_millis", ins.createdAtMillis);
        v.put("status", ins.status);
        return v;
    }

    public List<Insight> getInsightsForChild(long childId) {
        List<Insight> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,domain,title,summary,confidence_tier,confidence_level,evidence_ids," +
                        "recommendation,recommendation_effort,recommendation_for,created_at_millis,status " +
                        "FROM insight WHERE child_id=? ORDER BY created_at_millis DESC",
                new String[]{String.valueOf(childId)});
        while (cur.moveToNext()) {
            out.add(readInsight(cur));
        }
        cur.close();
        return out;
    }

    public Insight getInsight(long id) {
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,domain,title,summary,confidence_tier,confidence_level,evidence_ids," +
                        "recommendation,recommendation_effort,recommendation_for,created_at_millis,status " +
                        "FROM insight WHERE id=?",
                new String[]{String.valueOf(id)});
        Insight out = null;
        if (cur.moveToFirst()) out = readInsight(cur);
        cur.close();
        return out;
    }

    private Insight readInsight(Cursor cur) {
        Insight ins = new Insight();
        ins.id = cur.getLong(0);
        ins.childId = cur.getLong(1);
        ins.domain = cur.getString(2);
        ins.title = cur.getString(3);
        ins.summary = cur.getString(4);
        ins.confidenceTier = cur.getString(5);
        ins.confidenceLevel = cur.getInt(6);
        ins.evidenceIds = cur.getString(7);
        ins.recommendation = cur.getString(8);
        ins.recommendationEffort = cur.getString(9);
        ins.recommendationFor = cur.getString(10);
        ins.createdAtMillis = cur.getLong(11);
        ins.status = cur.getString(12);
        return ins;
    }

    // ---------------- Goal ----------------

    public long insertGoal(Goal g) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("child_id", g.childId);
        v.put("what", g.what);
        v.put("why", g.why);
        v.put("by_when", g.byWhen);
        v.put("how_noticed", g.howNoticed);
        v.put("created_at_millis", g.createdAtMillis);
        v.put("status", g.status);
        return db.insert("goal", null, v);
    }

    public void updateGoalStatus(long id, String status) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("status", status);
        db.update("goal", v, "id=?", new String[]{String.valueOf(id)});
    }

    public List<Goal> getGoalsForChild(long childId) {
        List<Goal> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,what,why,by_when,how_noticed,created_at_millis,status FROM goal WHERE child_id=? ORDER BY created_at_millis DESC",
                new String[]{String.valueOf(childId)});
        while (cur.moveToNext()) {
            Goal g = new Goal();
            g.id = cur.getLong(0);
            g.childId = cur.getLong(1);
            g.what = cur.getString(2);
            g.why = cur.getString(3);
            g.byWhen = cur.getString(4);
            g.howNoticed = cur.getString(5);
            g.createdAtMillis = cur.getLong(6);
            g.status = cur.getString(7);
            out.add(g);
        }
        cur.close();
        return out;
    }

    // ---------------- Journal ----------------

    public long insertJournalEntry(JournalEntry e) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("child_id", e.childId);
        v.put("author", e.author);
        v.put("text", e.text);
        v.put("timestamp_millis", e.timestampMillis);
        v.put("private_entry", e.privateEntry ? 1 : 0);
        return db.insert("journal_entry", null, v);
    }

    public List<JournalEntry> getJournalForChild(long childId) {
        List<JournalEntry> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,author,text,timestamp_millis,private_entry FROM journal_entry WHERE child_id=? ORDER BY timestamp_millis DESC",
                new String[]{String.valueOf(childId)});
        while (cur.moveToNext()) {
            JournalEntry e = new JournalEntry();
            e.id = cur.getLong(0);
            e.childId = cur.getLong(1);
            e.author = cur.getString(2);
            e.text = cur.getString(3);
            e.timestampMillis = cur.getLong(4);
            e.privateEntry = cur.getInt(5) == 1;
            out.add(e);
        }
        cur.close();
        return out;
    }

    public JournalEntry getJournalEntry(long id) {
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,author,text,timestamp_millis,private_entry FROM journal_entry WHERE id=?",
                new String[]{String.valueOf(id)});
        JournalEntry e = null;
        if (cur.moveToFirst()) {
            e = new JournalEntry();
            e.id = cur.getLong(0);
            e.childId = cur.getLong(1);
            e.author = cur.getString(2);
            e.text = cur.getString(3);
            e.timestampMillis = cur.getLong(4);
            e.privateEntry = cur.getInt(5) == 1;
        }
        cur.close();
        return e;
    }

    // ---------------- Family ----------------

    public long insertFamilyMember(FamilyMember f) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("child_id", f.childId);
        v.put("name", f.name);
        v.put("role", f.role);
        v.put("status", f.status);
        return db.insert("family_member", null, v);
    }

    public List<FamilyMember> getFamilyForChild(long childId) {
        List<FamilyMember> out = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cur = db.rawQuery(
                "SELECT id,child_id,name,role,status FROM family_member WHERE child_id=? ORDER BY id ASC",
                new String[]{String.valueOf(childId)});
        while (cur.moveToNext()) {
            FamilyMember f = new FamilyMember();
            f.id = cur.getLong(0);
            f.childId = cur.getLong(1);
            f.name = cur.getString(2);
            f.role = cur.getString(3);
            f.status = cur.getString(4);
            out.add(f);
        }
        cur.close();
        return out;
    }
}
