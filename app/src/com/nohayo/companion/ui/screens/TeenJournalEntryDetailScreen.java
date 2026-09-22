package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

/** The "companion reflection" a private teen journal entry gets, matching Design.pdf's Own-space journal. */
public class TeenJournalEntryDetailScreen implements Screen {
    private final long entryId;

    public TeenJournalEntryDetailScreen(long entryId) {
        this.entryId = entryId;
    }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        JournalEntry e = host.repo().getJournalEntry(entryId);

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        LinearLayout topBar = UiKit.row(ctx);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        TextView back = new TextView(ctx);
        back.setText("‹");
        back.setTextSize(24f);
        back.setPadding(0, 0, Dp.of(ctx, 16), 0);
        back.setOnClickListener(v -> host.pop());
        topBar.addView(back);
        TextView when = UiKit.muted(ctx, e == null ? "" : Screens.fullDate(e.timestampMillis));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        when.setLayoutParams(wlp);
        when.setGravity(Gravity.CENTER);
        topBar.addView(when);
        topBar.addView(UiKit.badge(ctx, "Private", Theme.BLUE_TINT, Theme.BLUE));
        col.addView(topBar);
        col.addView(UiKit.spacer(ctx, 16));

        if (e == null) {
            col.addView(UiKit.muted(ctx, "This entry is no longer available."));
            return col;
        }

        LinearLayout textCard = UiKit.cardOutlined(ctx);
        textCard.addView(UiKit.body(ctx, e.text));
        col.addView(textCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout reflection = UiKit.card(ctx, Theme.BLUE_TINT);
        reflection.addView(UiKit.body(ctx, "That sounds like a lot to carry. Breaking things into smaller pieces helps some people. So does talking to someone you trust."));
        reflection.addView(UiKit.spacer(ctx, 12));
        reflection.addView(UiKit.filledButton(ctx, "Make a simple plan", Theme.BLUE, Theme.WHITE, () ->
                Toast.makeText(ctx, "Try: pick the smallest first step and set a time for it.", Toast.LENGTH_LONG).show()));
        reflection.addView(UiKit.spacer(ctx, 8));
        reflection.addView(UiKit.outlineButton(ctx, "👥  Think about who I could talk to", Theme.BLUE, () ->
                Toast.makeText(ctx, "Like a parent, a teacher, or a school counsellor. Nobody is told unless you choose.", Toast.LENGTH_LONG).show()));
        col.addView(reflection);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout controls = UiKit.cardOutlined(ctx);
        LinearLayout onlyYou = UiKit.row(ctx);
        TextView lock = new TextView(ctx); lock.setText("🔒  "); onlyYou.addView(lock);
        onlyYou.addView(UiKit.body(ctx, "Only you can see this"));
        controls.addView(onlyYou);
        controls.addView(UiKit.divider(ctx));

        LinearLayout share = UiKit.row(ctx);
        share.setGravity(Gravity.CENTER_VERTICAL);
        TextView shareIcon = new TextView(ctx); shareIcon.setText("↑  "); share.addView(shareIcon);
        TextView shareLabel = UiKit.body(ctx, "Share this entry with someone");
        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        shareLabel.setLayoutParams(slp);
        share.addView(shareLabel);
        TextView chevron = new TextView(ctx); chevron.setText("›"); chevron.setTextSize(20f); share.addView(chevron);
        share.setOnClickListener(v -> Toast.makeText(ctx, "You choose exactly who sees it, one entry at a time.", Toast.LENGTH_SHORT).show());
        controls.addView(share);
        controls.addView(UiKit.divider(ctx));

        controls.addView(UiKit.toggleRow(ctx, "Let the companion learn from this entry", "Off unless you turn it on", false,
                checked -> Toast.makeText(ctx, checked ? "This entry can now inform your insights." : "This entry stays out of your insights.", Toast.LENGTH_SHORT).show()));
        col.addView(controls);

        return col;
    }
}
