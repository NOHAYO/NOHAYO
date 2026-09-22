package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class InsightsScreen implements Screen {
    @Override
    public int tabIndex() { return 2; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "Insights", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Hypotheses, never verdicts. Every one shows its evidence."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Insight> insights = host.repo().getInsightsForChild(child.id);
        if (insights.isEmpty()) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.bold(ctx, "Nothing yet", 15f));
            empty.addView(UiKit.spacer(ctx, 6));
            empty.addView(UiKit.muted(ctx, "Insights appear once a few related moments build up a pattern, usually after 2-3 logged moments in the same area. Try logging a moment from Today."));
            col.addView(empty);
            return col;
        }

        for (Insight ins : insights) {
            col.addView(insightCard(host, ins));
            col.addView(UiKit.spacer(ctx, 14));
        }

        return col;
    }

    private LinearLayout insightCard(MainActivity host, Insight ins) {
        Context ctx = host;
        int bg = Insight.STATUS_ACTIVE.equals(ins.status) ? Domains.tint(ins.domain) : Theme.BG_CREAM_DEEP;
        LinearLayout card = UiKit.card(ctx, bg);
        LinearLayout.LayoutParams lp = UiKit.lp(ctx, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        card.setLayoutParams(lp);

        LinearLayout top = UiKit.row(ctx);
        top.addView(UiKit.label(ctx, Domains.label(ins.domain), Domains.color(ins.domain)));
        View spacer = new View(ctx);
        LinearLayout.LayoutParams sp = UiKit.lp(ctx, 0, 1);
        sp.weight = 1f;
        spacer.setLayoutParams(sp);
        top.addView(spacer);
        if (!Insight.STATUS_ACTIVE.equals(ins.status)) {
            String tag = Insight.STATUS_TRIED.equals(ins.status) ? "Tried" : "Not helpful";
            top.addView(UiKit.badge(ctx, tag, Theme.LINE, Theme.TEXT_MUTED));
        }
        card.addView(top);
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.bold(ctx, ins.title, 17f));
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.confidenceDots(ctx, ins.confidenceLevel, 3, Domains.color(ins.domain)));
        card.addView(UiKit.spacer(ctx, 4));
        card.addView(UiKit.muted(ctx, ins.confidenceTier));
        card.addView(UiKit.spacer(ctx, 10));
        card.addView(UiKit.textLink(ctx, "Why am I seeing this?", Domains.color(ins.domain), () -> host.push(new InsightDetailScreen(ins.id))));

        card.setOnClickListener(v -> host.push(new InsightDetailScreen(ins.id)));
        return card;
    }
}
