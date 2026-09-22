package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/** Goals tab reused, with a different accent, by every life-stage skin that gives Goals its own tab. */
public class TabGoalsScreen implements Screen {
    private final int tabIndex;
    private final String title;
    private final int accent;
    private final int tint;

    public TabGoalsScreen(int tabIndex, String title, int accent, int tint) {
        this.tabIndex = tabIndex;
        this.title = title;
        this.accent = accent;
        this.tint = tint;
    }

    @Override
    public int tabIndex() { return tabIndex; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, title, 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Light and low-pressure. No streaks, no success rate."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        if (goals.isEmpty()) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.body(ctx, "No goals yet. Add one, or try a next step from an insight."));
            col.addView(empty);
        } else {
            for (Goal g : goals) {
                col.addView(goalCard(host, g));
                col.addView(UiKit.spacer(ctx, 12));
            }
        }

        col.addView(UiKit.spacer(ctx, 8));
        col.addView(UiKit.outlineButton(ctx, "+  Add a goal", accent, () -> host.push(new NewGoalScreen())));

        return col;
    }

    private LinearLayout goalCard(MainActivity host, Goal g) {
        Context ctx = host;
        boolean noticed = Goal.STATUS_NOTICED.equals(g.status);
        LinearLayout card = UiKit.card(ctx, noticed ? tint : Theme.BG_CREAM_DEEP);
        card.addView(UiKit.bold(ctx, g.what, 16f));
        if (g.why != null && !g.why.isEmpty()) {
            card.addView(UiKit.spacer(ctx, 6));
            card.addView(UiKit.muted(ctx, "Why: " + g.why));
        }
        if (g.byWhen != null && !g.byWhen.isEmpty()) {
            card.addView(UiKit.spacer(ctx, 2));
            card.addView(UiKit.muted(ctx, "By: " + g.byWhen));
        }
        card.addView(UiKit.spacer(ctx, 10));
        if (noticed) {
            card.addView(UiKit.badge(ctx, "✓ Noticed", accent, Theme.WHITE));
        } else {
            card.addView(UiKit.outlineButton(ctx, "Mark as noticed", accent, () -> {
                host.repo().updateGoalStatus(g.id, Goal.STATUS_NOTICED);
                host.replace(new TabGoalsScreen(tabIndex, title, accent, tint));
            }));
        }
        return card;
    }
}
