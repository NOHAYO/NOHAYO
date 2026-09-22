package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/** Ages 18-55 self-view ("Companion" skin): quiet, editorial. Evidence before advice. */
public class AdultTodayScreen implements Screen {
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
        header.addView(UiKit.avatarCircle(ctx, child.name.substring(0, 1).toUpperCase(), Theme.TEAL, 44));
        LinearLayout headText = UiKit.column(ctx);
        LinearLayout.LayoutParams htp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        htp.leftMargin = Dp.of(ctx, 12);
        headText.setLayoutParams(htp);
        headText.addView(UiKit.bold(ctx, "Good morning, " + child.name, 17f));
        headText.addView(UiKit.muted(ctx, (int) Stages.ageInYears(child.birthDateMillis) + " years"));
        header.addView(headText);
        TextView bell = new TextView(ctx); bell.setText("🔔"); bell.setTextSize(20f);
        header.addView(bell);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 18));

        List<Insight> insights = host.repo().getInsightsForChild(child.id);
        int activeCount = 0;
        for (Insight i : insights) if (Insight.STATUS_ACTIVE.equals(i.status)) activeCount++;
        if (activeCount > 0) {
            LinearLayout review = UiKit.card(ctx, Theme.TEAL_TINT);
            review.addView(UiKit.label(ctx, "Your quarterly review is ready", Theme.TEAL_DARK));
            review.addView(UiKit.spacer(ctx, 8));
            review.addView(UiKit.headline(ctx, activeCount == 1 ? "One theme stood out this season" : activeCount + " themes stood out this season", 19f));
            review.addView(UiKit.spacer(ctx, 8));
            review.addView(UiKit.body(ctx, "Patterns from what you've logged recently keep showing up. Nothing here is a verdict, just evidence."));
            review.addView(UiKit.spacer(ctx, 12));
            review.addView(UiKit.filledButton(ctx, "Read the review", Theme.TEAL, Theme.WHITE, () ->
                    host.push(new CapabilityMapScreen())));
            col.addView(review);
            col.addView(UiKit.spacer(ctx, 16));
        }

        LinearLayout todayCard = UiKit.cardOutlined(ctx);
        todayCard.addView(UiKit.muted(ctx, "Today"));
        todayCard.addView(UiKit.spacer(ctx, 4));
        todayCard.addView(UiKit.bold(ctx, "What gave you energy this week?", 17f));
        todayCard.addView(UiKit.spacer(ctx, 12));
        LinearLayout btnRow = UiKit.row(ctx);
        android.widget.Button write = UiKit.outlineButton(ctx, "✎  Write", Theme.TEAL, () ->
                host.push(new TabJournalComposeScreen(Theme.TEAL, "What gave you energy this week?")));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        write.setLayoutParams(wlp);
        btnRow.addView(write);
        View gap = new View(ctx); gap.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); btnRow.addView(gap);
        android.widget.Button talk = UiKit.outlineButton(ctx, "🎤  Talk it out", Theme.TEAL, () ->
                host.push(new TabJournalComposeScreen(Theme.TEAL, "Talk it out…")));
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        talk.setLayoutParams(tlp);
        btnRow.addView(talk);
        todayCard.addView(btnRow);
        col.addView(todayCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout eventCard = UiKit.cardOutlined(ctx);
        LinearLayout eRow = UiKit.row(ctx);
        TextView compass = new TextView(ctx); compass.setText("◉  "); compass.setTextColor(Theme.TEAL); eRow.addView(compass);
        eRow.addView(UiKit.bold(ctx, "A life event may be near", 15f));
        eventCard.addView(eRow);
        eventCard.addView(UiKit.spacer(ctx, 8));
        eventCard.addView(UiKit.body(ctx, "If something big is shifting, a guided flow can help you think it through."));
        eventCard.addView(UiKit.spacer(ctx, 12));
        eventCard.addView(UiKit.outlineButton(ctx, "Start a guided flow", Theme.TEAL, () -> host.push(new LifeEventsMenuScreen())));
        col.addView(eventCard);
        col.addView(UiKit.spacer(ctx, 16));

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        if (!goals.isEmpty()) {
            Goal g = goals.get(0);
            LinearLayout goalCard = UiKit.cardOutlined(ctx);
            LinearLayout gRow = UiKit.row(ctx);
            gRow.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout gText = UiKit.column(ctx);
            LinearLayout.LayoutParams gtp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            gText.setLayoutParams(gtp);
            gText.addView(UiKit.muted(ctx, "Goal"));
            gText.addView(UiKit.bold(ctx, g.what, 15.5f));
            gRow.addView(gText);
            TextView chevron = new TextView(ctx); chevron.setText("›"); chevron.setTextSize(20f); gRow.addView(chevron);
            goalCard.addView(gRow);
            goalCard.setOnClickListener(v -> host.push(new TabGoalsScreen(3, "Goals", Theme.TEAL, Theme.TEAL_TINT)));
            col.addView(goalCard);
        }

        return col;
    }
}
