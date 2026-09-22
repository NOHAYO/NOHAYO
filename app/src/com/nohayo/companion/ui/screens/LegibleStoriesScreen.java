package com.nohayo.companion.ui.screens;

import android.app.AlertDialog;
import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/** Voice-first "life story" collection, ages 55-120. Large type, one action at a time. */
public class LegibleStoriesScreen implements Screen {
    @Override
    public int tabIndex() { return 1; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 22);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 26));

        LinearLayout toolsRow = UiKit.row(ctx);
        toolsRow.addView(UiKit.outlineButton(ctx, "T+  Larger text", Theme.AMBER, () ->
                Toast.makeText(ctx, "Larger text is on across the app in the full product.", Toast.LENGTH_SHORT).show()));
        View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); toolsRow.addView(g);
        toolsRow.addView(UiKit.outlineButton(ctx, "🔊  Read aloud", Theme.AMBER, () ->
                Toast.makeText(ctx, "Text-to-speech isn't wired up in this preview build.", Toast.LENGTH_SHORT).show()));
        col.addView(toolsRow);
        col.addView(UiKit.spacer(ctx, 20));

        col.addView(UiKit.headline(ctx, "Tell me about a place that felt like home.", 24f));
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout micWrap = UiKit.column(ctx);
        micWrap.setGravity(Gravity.CENTER);
        TextView mic = new TextView(ctx);
        mic.setText("🎤");
        mic.setTextSize(36f);
        mic.setGravity(Gravity.CENTER);
        mic.setTextColor(Theme.WHITE);
        mic.setBackground(UiKit.roundedBg(Theme.AMBER, 60, ctx));
        LinearLayout.LayoutParams micLp = new LinearLayout.LayoutParams(Dp.of(ctx, 120), Dp.of(ctx, 120));
        mic.setLayoutParams(micLp);
        mic.setOnClickListener(v -> record(host));
        micWrap.addView(mic);
        micWrap.addView(UiKit.spacer(ctx, 14));
        TextView helper = UiKit.muted(ctx, "Tap and talk. We will write it down for you.");
        helper.setGravity(Gravity.CENTER);
        micWrap.addView(helper);
        col.addView(micWrap);
        col.addView(UiKit.spacer(ctx, 26));

        List<JournalEntry> entries = host.repo().getJournalForChild(child.id);
        for (JournalEntry e : entries) {
            LinearLayout row = UiKit.cardOutlined(ctx);
            LinearLayout inner = UiKit.row(ctx);
            inner.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout text = UiKit.column(ctx);
            LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            text.setLayoutParams(tp);
            String title = e.text.length() > 42 ? e.text.substring(0, 42) + "…" : e.text;
            text.addView(UiKit.bold(ctx, title, 16f));
            text.addView(UiKit.muted(ctx, "Told " + Screens.relativeDay(e.timestampMillis).toLowerCase()));
            inner.addView(text);
            TextView chevron = new TextView(ctx); chevron.setText("›"); chevron.setTextSize(22f); inner.addView(chevron);
            row.addView(inner);
            col.addView(row);
            col.addView(UiKit.spacer(ctx, 10));
        }

        return col;
    }

    private void record(MainActivity host) {
        Context ctx = host;
        EditText input = UiKit.editText(ctx, "Tap and talk…", true);
        new AlertDialog.Builder(ctx)
                .setTitle("Tell your story")
                .setMessage("(This preview build types instead of listening.)")
                .setView(input)
                .setPositiveButton("Save", (d, w) -> {
                    String text = input.getText().toString().trim();
                    if (text.isEmpty()) return;
                    JournalEntry e = new JournalEntry();
                    e.childId = host.getChild().id;
                    e.author = "You";
                    e.text = text;
                    e.timestampMillis = System.currentTimeMillis();
                    e.privateEntry = false;
                    host.repo().insertJournalEntry(e);
                    host.replace(new LegibleStoriesScreen());
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
