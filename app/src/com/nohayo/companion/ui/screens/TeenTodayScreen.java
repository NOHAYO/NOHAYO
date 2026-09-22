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
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/** Ages 12-18 self-view ("Own space" skin): clean, cool, direct. Your words stay yours. */
public class TeenTodayScreen implements Screen {
    @Override
    public int tabIndex() { return 0; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 24));

        LinearLayout header = UiKit.row(ctx);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(UiKit.avatarCircle(ctx, child.name.substring(0, 1).toUpperCase(), Theme.BLUE, 44));
        LinearLayout headText = UiKit.column(ctx);
        LinearLayout.LayoutParams htp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        htp.leftMargin = Dp.of(ctx, 12);
        headText.setLayoutParams(htp);
        headText.addView(UiKit.bold(ctx, "Hey " + child.name, 18f));
        headText.addView(UiKit.muted(ctx, (int) Stages.ageInYears(child.birthDateMillis) + " years"));
        header.addView(headText);
        TextView bell = new TextView(ctx);
        bell.setText("🔔");
        bell.setTextSize(20f);
        header.addView(bell);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 18));

        LinearLayout todayCard = UiKit.card(ctx, Theme.BLUE_TINT);
        todayCard.addView(UiKit.label(ctx, "Today", Theme.BLUE));
        todayCard.addView(UiKit.spacer(ctx, 8));
        todayCard.addView(UiKit.headline(ctx, "What has been taking up head space this week?", 19f));
        todayCard.addView(UiKit.spacer(ctx, 14));
        LinearLayout btnRow = UiKit.row(ctx);
        android.widget.Button write = UiKit.filledButton(ctx, "✎  Write", Theme.BLUE, Theme.WHITE, () ->
                host.push(TabJournalComposeFor(Theme.BLUE)));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        write.setLayoutParams(wlp);
        btnRow.addView(write);
        View gap = new View(ctx); gap.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); btnRow.addView(gap);
        android.widget.Button talk = UiKit.outlineButton(ctx, "🎤  Talk it out", Theme.BLUE, () -> talkItOut(host));
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        talk.setLayoutParams(tlp);
        btnRow.addView(talk);
        todayCard.addView(btnRow);
        col.addView(todayCard);
        col.addView(UiKit.spacer(ctx, 16));

        Insight featured = null;
        for (Insight i : host.repo().getInsightsForChild(child.id)) {
            if (Insight.STATUS_ACTIVE.equals(i.status)) { featured = i; break; }
        }
        if (featured != null) {
            final Insight fi = featured;
            LinearLayout forYou = UiKit.cardOutlined(ctx);
            LinearLayout row = UiKit.row(ctx);
            TextView bulb = new TextView(ctx); bulb.setText("💡  "); row.addView(bulb);
            row.addView(UiKit.bold(ctx, "For you", 15f));
            forYou.addView(row);
            forYou.addView(UiKit.spacer(ctx, 8));
            forYou.addView(UiKit.body(ctx, fi.summary));
            forYou.addView(UiKit.spacer(ctx, 12));
            LinearLayout actionRow = UiKit.row(ctx);
            actionRow.setGravity(Gravity.CENTER_VERTICAL);
            android.widget.Button build = UiKit.filledButton(ctx, "Build a simple plan", Theme.BLUE, Theme.WHITE, () -> host.push(new InsightDetailScreen(fi.id)));
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            build.setLayoutParams(blp);
            actionRow.addView(build);
            forYou.addView(actionRow);
            col.addView(forYou);
            col.addView(UiKit.spacer(ctx, 14));
        }

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        if (!goals.isEmpty()) {
            Goal g = goals.get(0);
            LinearLayout goalCard = UiKit.cardOutlined(ctx);
            goalCard.addView(UiKit.muted(ctx, "A goal you set"));
            goalCard.addView(UiKit.spacer(ctx, 4));
            goalCard.addView(UiKit.bold(ctx, g.what, 16f));
            if (g.why != null && !g.why.isEmpty()) {
                goalCard.addView(UiKit.spacer(ctx, 6));
                goalCard.addView(UiKit.muted(ctx, "Why: " + g.why));
            }
            goalCard.setOnClickListener(v -> host.push(new TabGoalsScreen(3, "Goals", Theme.BLUE, Theme.BLUE_TINT)));
            col.addView(goalCard);
            col.addView(UiKit.spacer(ctx, 14));
        }

        LinearLayout journalLink = UiKit.cardOutlined(ctx);
        LinearLayout jRow = UiKit.row(ctx);
        jRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView book = new TextView(ctx); book.setText("📖  "); jRow.addView(book);
        TextView label = UiKit.bold(ctx, "Open my journal", 15.5f);
        LinearLayout.LayoutParams jlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        label.setLayoutParams(jlp);
        jRow.addView(label);
        jRow.addView(UiKit.badge(ctx, "Private", Theme.BLUE_TINT, Theme.BLUE));
        journalLink.addView(jRow);
        journalLink.setOnClickListener(v -> host.push(teenJournal()));
        col.addView(journalLink);
        col.addView(UiKit.spacer(ctx, 12));

        LinearLayout eventsLink = UiKit.cardOutlined(ctx);
        LinearLayout evRow = UiKit.row(ctx);
        TextView compass = new TextView(ctx); compass.setText("◉  "); compass.setTextColor(Theme.BLUE); evRow.addView(compass);
        evRow.addView(UiKit.bold(ctx, "Life events", 15.5f));
        eventsLink.addView(evRow);
        eventsLink.addView(UiKit.spacer(ctx, 6));
        eventsLink.addView(UiKit.muted(ctx, "First job, driving, study path, national service."));
        eventsLink.setOnClickListener(v -> host.push(new TeenLifeEventsScreen()));
        col.addView(eventsLink);

        return col;
    }

    public static TabJournalScreen teenJournal() {
        return new TabJournalScreen(4, "Journal",
                "Private. Only you can read this unless you choose to share it.",
                Theme.BLUE, Theme.BLUE_TINT, "Not sleeping great. The exam feels huge and I keep going in circles.",
                (host, e) -> host.push(new TeenJournalEntryDetailScreen(e.id)));
    }

    private Screen TabJournalComposeFor(int accent) {
        return new TabJournalComposeScreen(accent, "What's taking up head space?");
    }

    private void talkItOut(MainActivity host) {
        Context ctx = host;
        EditText input = UiKit.editText(ctx, "Talk it out…", true);
        new AlertDialog.Builder(ctx)
                .setTitle("Talk it out")
                .setMessage("(This preview build types instead of listening.)")
                .setView(input)
                .setPositiveButton("Save to journal", (d, w) -> {
                    String text = input.getText().toString().trim();
                    if (text.isEmpty()) return;
                    JournalEntry e = new JournalEntry();
                    e.childId = host.getChild().id;
                    e.author = "You";
                    e.text = text;
                    e.timestampMillis = System.currentTimeMillis();
                    e.privateEntry = true;
                    host.repo().insertJournalEntry(e);
                    Toast.makeText(ctx, "Saved.", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
