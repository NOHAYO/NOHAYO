package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** DRD §38: capabilities -> interests -> opportunities/experiences -> goals -> outcomes, traceable. */
public class LifeDevelopmentMapScreen implements Screen {
    @Override
    public int tabIndex() { return 1; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "Life development map", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Follow the line to see why a suggestion exists."));
        col.addView(UiKit.spacer(ctx, 20));

        List<Moment> moments = host.repo().getMomentsForChild(child.id);
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Moment m : moments) {
            Integer c = counts.get(m.domain);
            counts.put(m.domain, c == null ? 1 : c + 1);
        }
        String topDomain = null;
        int best = 0;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (e.getValue() > best) { best = e.getValue(); topDomain = e.getKey(); }
        }

        if (topDomain == null) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.body(ctx, "Log a few moments to start tracing your own line from capability to outcome."));
            col.addView(empty);
            return col;
        }

        Moment interestMoment = null, experienceMoment = null;
        for (Moment m : moments) {
            if (!topDomain.equals(m.domain)) continue;
            if (interestMoment == null) interestMoment = m;
            else if (experienceMoment == null) { experienceMoment = m; break; }
        }

        Insight insightForDomain = null;
        for (Insight i : host.repo().getInsightsForChild(child.id)) {
            if (topDomain.equals(i.domain)) { insightForDomain = i; break; }
        }

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        Goal goal = goals.isEmpty() ? null : goals.get(0);

        col.addView(mapStep(ctx, "Capabilities", insightForDomain != null ? insightForDomain.title : Domains.label(topDomain) + " is showing up often"));
        col.addView(mapStep(ctx, "Interests", interestMoment != null ? interestMoment.text : Domains.label(topDomain)));
        col.addView(mapStep(ctx, "Experiences", experienceMoment != null ? experienceMoment.text : "Waiting for a second logged moment"));
        col.addView(mapStep(ctx, "Goal", goal != null ? goal.what : "No goal set yet"));
        col.addView(mapStep(ctx, "Outcome", goal != null && Goal.STATUS_NOTICED.equals(goal.status) ? "Noticed: " + goal.what : "Not yet — outcomes appear once a goal is noticed"));
        col.addView(UiKit.spacer(ctx, 8));

        if (interestMoment != null) {
            LinearLayout quote = UiKit.card(ctx, Theme.TEAL_TINT);
            LinearLayout row = UiKit.row(ctx);
            android.widget.TextView bulb = new android.widget.TextView(ctx);
            bulb.setText("💡  ");
            row.addView(bulb);
            row.addView(UiKit.bold(ctx, "Traced back to your own words", 14.5f));
            quote.addView(row);
            quote.addView(UiKit.spacer(ctx, 8));
            quote.addView(UiKit.body(ctx, "“" + interestMoment.text + "” — " + Screens.relativeDay(interestMoment.timestampMillis)));
            col.addView(quote);
        }

        return col;
    }

    private LinearLayout mapStep(Context ctx, String label, String text) {
        LinearLayout wrap = UiKit.column(ctx);
        wrap.addView(UiKit.label(ctx, label, Theme.TEAL_DARK));
        wrap.addView(UiKit.spacer(ctx, 6));

        LinearLayout row = UiKit.row(ctx);
        View bar = new View(ctx);
        bar.setBackgroundColor(Theme.TEAL);
        bar.setLayoutParams(new LinearLayout.LayoutParams(Dp.of(ctx, 4), ViewGroup.LayoutParams.MATCH_PARENT));
        row.addView(bar);

        LinearLayout card = UiKit.card(ctx, Theme.TEAL_TINT);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        clp.leftMargin = Dp.of(ctx, 10);
        card.setLayoutParams(clp);
        card.addView(UiKit.bold(ctx, text, 15f));
        row.addView(card);
        wrap.addView(row);
        wrap.addView(UiKit.spacer(ctx, 14));
        return wrap;
    }
}
