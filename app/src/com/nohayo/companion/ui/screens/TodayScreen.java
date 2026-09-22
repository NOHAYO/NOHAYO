package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.engine.InsightEngine;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class TodayScreen implements Screen {
    @Override
    public int tabIndex() { return 0; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();
        InsightEngine.refresh(host.repo(), child);

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 24));

        LinearLayout header = UiKit.row(ctx);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(UiKit.avatarCircle(ctx, initials(child.name), Theme.TERRACOTTA, 44));
        LinearLayout headText = UiKit.column(ctx);
        LinearLayout.LayoutParams htp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        htp.weight = 1f;
        htp.leftMargin = Dp.of(ctx, 12);
        headText.setLayoutParams(htp);
        headText.addView(UiKit.bold(ctx, child.name, 17f));
        Stages.Stage stage = Stages.current(child.birthDateMillis);
        headText.addView(UiKit.muted(ctx, Stages.ageLabel(child.birthDateMillis) + " · " + stage.name));
        header.addView(headText);
        TextView bell = new TextView(ctx);
        bell.setText("🔔");
        bell.setTextSize(20f);
        header.addView(bell);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 20));

        List<Insight> insights = host.repo().getInsightsForChild(child.id);
        Insight featured = null;
        for (Insight i : insights) {
            if (Insight.STATUS_ACTIVE.equals(i.status)) { featured = i; break; }
        }

        if (featured != null) {
            col.addView(buildInsightCard(host, featured));
        } else {
            col.addView(buildPromptCard(host, child));
        }
        col.addView(UiKit.spacer(ctx, 20));

        List<Moment> moments = host.repo().getMomentsForChild(child.id);
        col.addView(UiKit.bold(ctx, "Noticed this week", 16f));
        col.addView(UiKit.spacer(ctx, 10));
        if (moments.isEmpty()) {
            col.addView(UiKit.muted(ctx, "Nothing logged yet. Your first moment will show up here."));
        } else {
            LinearLayout list = UiKit.cardOutlined(ctx);
            int shown = 0;
            for (Moment m : moments) {
                if (shown >= 5) break;
                if (shown > 0) list.addView(UiKit.divider(ctx));
                list.addView(momentRow(ctx, m));
                shown++;
            }
            col.addView(list);
        }
        col.addView(UiKit.spacer(ctx, 20));

        Stages.Stage next = Stages.next(child.birthDateMillis);
        LinearLayout expectCard = UiKit.cardOutlined(ctx);
        LinearLayout expectHeader = UiKit.row(ctx);
        TextView compass = new TextView(ctx);
        compass.setText("◉  ");
        compass.setTextColor(Theme.TERRACOTTA);
        expectHeader.addView(compass);
        expectHeader.addView(UiKit.bold(ctx, "Coming up · " + next.name, 15f));
        expectCard.addView(expectHeader);
        expectCard.addView(UiKit.spacer(ctx, 8));
        expectCard.addView(UiKit.muted(ctx, next.whatToExpect));
        col.addView(expectCard);
        col.addView(UiKit.spacer(ctx, 20));

        col.addView(UiKit.outlineButton(ctx, "🎯  Goals", () -> host.push(new GoalsScreen())));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(UiKit.primaryButton(ctx, "🎤  Log a moment", () -> host.push(new NewMomentScreen())));

        return col;
    }

    private LinearLayout buildPromptCard(MainActivity host, Child child) {
        Context ctx = host;
        LinearLayout card = UiKit.card(ctx, Theme.PEACH);
        card.addView(UiKit.label(ctx, "A gentle thing to notice", Theme.TERRACOTTA_DARK));
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.headline(ctx, promptFor(child), 20f));
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.body(ctx, "Notice it a few times, then jot it down. Small moments add up to a picture."));
        card.addView(UiKit.spacer(ctx, 16));
        card.addView(UiKit.primaryButton(ctx, "🎤  Log a moment", () -> host.push(new NewMomentScreen())));
        return card;
    }

    private String promptFor(Child child) {
        Stages.Stage stage = Stages.current(child.birthDateMillis);
        switch (stage.name) {
            case "Infant": return "Does " + child.name + " follow your face when you move?";
            case "Toddler": return "What did " + child.name + " insist on doing today?";
            case "Early Childhood": return "What did " + child.name + " choose for themselves today?";
            case "School Age": return "What is " + child.name + " getting better at without help?";
            default: return "What did " + child.name + " get curious about today?";
        }
    }

    private LinearLayout buildInsightCard(MainActivity host, Insight insight) {
        Context ctx = host;
        LinearLayout card = UiKit.card(ctx, Theme.GREEN_TINT);
        card.addView(UiKit.label(ctx, "New insight · " + Domains.label(insight.domain), Theme.GREEN_DARK));
        card.addView(UiKit.spacer(ctx, 8));
        TextView title = UiKit.headline(ctx, insight.title, 19f);
        card.addView(title);
        card.addView(UiKit.spacer(ctx, 10));
        card.addView(UiKit.confidenceDots(ctx, insight.confidenceLevel, 3, Theme.GREEN));
        card.addView(UiKit.spacer(ctx, 4));
        card.addView(UiKit.muted(ctx, insight.confidenceTier));
        card.addView(UiKit.spacer(ctx, 14));
        final Insight fi = insight;
        card.addView(UiKit.textLink(ctx, "Why am I seeing this?", Theme.GREEN_DARK, () -> host.push(new InsightDetailScreen(fi.id))));
        col_addReadButton(host, card, fi);
        return card;
    }

    private void col_addReadButton(MainActivity host, LinearLayout card, Insight insight) {
        card.addView(UiKit.greenButton(host, "Read it", () -> host.push(new InsightDetailScreen(insight.id))));
    }

    private LinearLayout momentRow(Context ctx, Moment m) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView dot = new TextView(ctx);
        dot.setText("•");
        dot.setTextColor(Domains.color(m.domain));
        dot.setTextSize(20f);
        row.addView(dot);
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.weight = 1f;
        tp.leftMargin = Dp.of(ctx, 6);
        text.setLayoutParams(tp);
        text.addView(UiKit.body(ctx, m.text));
        text.addView(UiKit.muted(ctx, Screens.relativeDay(m.timestampMillis) + " · " + m.author));
        row.addView(text);
        return row;
    }

    private String initials(String name) {
        if (name == null || name.isEmpty()) return "?";
        return name.substring(0, 1).toUpperCase();
    }
}
