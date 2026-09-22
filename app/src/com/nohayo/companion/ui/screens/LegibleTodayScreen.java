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
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

/** Ages 55-120 self-view ("Legible" skin): large type, high contrast, one action at a time. */
public class LegibleTodayScreen implements Screen {
    private static final String[] PROMPTS = {
            "What would you tell yourself at thirty?",
            "What is a lesson you learned the hard way?",
            "What are you proud of that no one gave you credit for?",
            "Who shaped who you became?"
    };

    @Override
    public int tabIndex() { return 0; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 22);
        col.setPadding(pad, Dp.of(ctx, 22), pad, Dp.of(ctx, 26));

        LinearLayout header = UiKit.row(ctx);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(UiKit.avatarCircle(ctx, child.name.substring(0, 1).toUpperCase(), Theme.AMBER, 48));
        LinearLayout headText = UiKit.column(ctx);
        LinearLayout.LayoutParams htp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        htp.leftMargin = Dp.of(ctx, 14);
        headText.setLayoutParams(htp);
        headText.addView(UiKit.bold(ctx, "Good morning, " + child.name, 19f));
        headText.addView(UiKit.muted(ctx, (int) Stages.ageInYears(child.birthDateMillis) + " years"));
        header.addView(headText);
        TextView bell = new TextView(ctx); bell.setText("🔔"); bell.setTextSize(22f);
        header.addView(bell);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 20));

        String prompt = PROMPTS[(int) (child.id + System.currentTimeMillis() / 86400000L) % PROMPTS.length];
        LinearLayout qCard = UiKit.card(ctx, Theme.AMBER_TINT);
        qCard.addView(UiKit.label(ctx, "A question for today", Theme.AMBER_DARK));
        qCard.addView(UiKit.spacer(ctx, 10));
        qCard.addView(UiKit.headline(ctx, prompt, 23f));
        qCard.addView(UiKit.spacer(ctx, 16));
        LinearLayout btnRow = UiKit.row(ctx);
        android.widget.Button say = UiKit.filledButton(ctx, "🎤  Say it", Theme.AMBER, Theme.WHITE, () -> sayIt(host, prompt));
        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        say.setLayoutParams(slp);
        btnRow.addView(say);
        View gap = new View(ctx); gap.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); btnRow.addView(gap);
        android.widget.Button writeIt = UiKit.outlineButton(ctx, "✎  Write it", Theme.AMBER, () ->
                host.push(new TabJournalComposeScreen(Theme.AMBER, prompt)));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        writeIt.setLayoutParams(wlp);
        btnRow.addView(writeIt);
        qCard.addView(btnRow);
        col.addView(qCard);
        col.addView(UiKit.spacer(ctx, 18));

        LinearLayout shareCard = UiKit.cardOutlined(ctx);
        LinearLayout sRow = UiKit.row(ctx);
        TextView people = new TextView(ctx); people.setText("👥  "); people.setTextSize(18f); sRow.addView(people);
        sRow.addView(UiKit.bold(ctx, "Sharing what you have learned", 16f));
        shareCard.addView(sRow);
        shareCard.addView(UiKit.spacer(ctx, 8));
        shareCard.addView(UiKit.body(ctx, "You choose who hears it. Mentoring, letters, or a story for someone younger."));
        shareCard.addView(UiKit.spacer(ctx, 12));
        shareCard.addView(UiKit.outlineButton(ctx, "See ways to pass it on", Theme.AMBER, () -> host.push(new LegibleStoriesScreen())));
        col.addView(shareCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout reviewCard = UiKit.cardOutlined(ctx);
        LinearLayout rRow = UiKit.row(ctx);
        TextView path = new TextView(ctx); path.setText("⏱  "); path.setTextSize(18f); rRow.addView(path);
        rRow.addView(UiKit.bold(ctx, "Life review", 16f));
        reviewCard.addView(rRow);
        reviewCard.addView(UiKit.spacer(ctx, 8));
        reviewCard.addView(UiKit.body(ctx, "Start anywhere: a place, a person, a season of life. There is no order."));
        col.addView(reviewCard);

        return col;
    }

    private void sayIt(MainActivity host, String prompt) {
        Context ctx = host;
        EditText input = UiKit.editText(ctx, "Tap and talk. We will write it down for you.", true);
        new AlertDialog.Builder(ctx)
                .setTitle("Say it")
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
                    Toast.makeText(ctx, "Saved to your stories.", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
