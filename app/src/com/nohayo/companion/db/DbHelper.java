package com.nohayo.companion.db;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DbHelper extends SQLiteOpenHelper {
    private static final String NAME = "nohayo_companion.db";
    private static final int VERSION = 1;

    public DbHelper(Context ctx) {
        super(ctx.getApplicationContext(), NAME, null, VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE child (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "name TEXT," +
                "birth_date_millis INTEGER," +
                "about_text TEXT," +
                "family_values TEXT)");

        db.execSQL("CREATE TABLE moment (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "child_id INTEGER," +
                "text TEXT," +
                "domain TEXT," +
                "timestamp_millis INTEGER," +
                "author TEXT)");

        db.execSQL("CREATE TABLE insight (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "child_id INTEGER," +
                "domain TEXT," +
                "title TEXT," +
                "summary TEXT," +
                "confidence_tier TEXT," +
                "confidence_level INTEGER," +
                "evidence_ids TEXT," +
                "recommendation TEXT," +
                "recommendation_effort TEXT," +
                "recommendation_for TEXT," +
                "created_at_millis INTEGER," +
                "status TEXT)");

        db.execSQL("CREATE TABLE goal (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "child_id INTEGER," +
                "what TEXT," +
                "why TEXT," +
                "by_when TEXT," +
                "how_noticed TEXT," +
                "created_at_millis INTEGER," +
                "status TEXT)");

        db.execSQL("CREATE TABLE journal_entry (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "child_id INTEGER," +
                "author TEXT," +
                "text TEXT," +
                "timestamp_millis INTEGER," +
                "private_entry INTEGER)");

        db.execSQL("CREATE TABLE family_member (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "child_id INTEGER," +
                "name TEXT," +
                "role TEXT," +
                "status TEXT)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS child");
        db.execSQL("DROP TABLE IF EXISTS moment");
        db.execSQL("DROP TABLE IF EXISTS insight");
        db.execSQL("DROP TABLE IF EXISTS goal");
        db.execSQL("DROP TABLE IF EXISTS journal_entry");
        db.execSQL("DROP TABLE IF EXISTS family_member");
        onCreate(db);
    }
}
