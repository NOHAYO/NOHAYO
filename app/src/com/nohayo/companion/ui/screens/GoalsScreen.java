package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class GoalsScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Goals", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, child.name + "'s goals", 24f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Light and low-pressure. No streaks, no success rate."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        if (goals.isEmpty()) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.body(ctx, "No goals yet. Add one yourself, or try a next step from an insight."));
            col.addView(empty);
        } else {
            for (Goal g : goals) {
                col.addView(goalCard(host, g));
                col.addView(UiKit.spacer(ctx, 12));
            }
        }

        col.addView(UiKit.spacer(ctx, 8));
        col.addView(UiKit.outlineButton(ctx, "+  Add a goal", () -> host.push(new NewGoalScreen())));

        return col;
    }

    private LinearLayout goalCard(MainActivity host, Goal g) {
        Context ctx = host;
        boolean noticed = Goal.STATUS_NOTICED.equals(g.status);
        LinearLayout card = UiKit.card(ctx, noticed ? Theme.GREEN_TINT : Theme.BG_CREAM_DEEP);
        card.addView(UiKit.bold(ctx, g.what, 16f));
        if (g.why != null && !g.why.isEmpty()) {
            card.addView(UiKit.spacer(ctx, 6));
            card.addView(UiKit.muted(ctx, "Why: " + g.why));
        }
        if (g.byWhen != null && !g.byWhen.isEmpty()) {
            card.addView(UiKit.spacer(ctx, 2));
            card.addView(UiKit.muted(ctx, "By: " + g.byWhen));
        }
        if (g.howNoticed != null && !g.howNoticed.isEmpty()) {
            card.addView(UiKit.spacer(ctx, 2));
            card.addView(UiKit.muted(ctx, "How we'll notice: " + g.howNoticed));
        }
        card.addView(UiKit.spacer(ctx, 10));
        if (noticed) {
            card.addView(UiKit.badge(ctx, "✓ Noticed", Theme.GREEN, Theme.WHITE));
        } else {
            card.addView(UiKit.outlineButton(ctx, "Mark as noticed", () -> {
                host.repo().updateGoalStatus(g.id, Goal.STATUS_NOTICED);
                host.replace(new GoalsScreen());
            }));
        }
        return card;
    }
}
