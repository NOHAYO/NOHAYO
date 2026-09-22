package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** DRD §37: a qualitative, non-numeric visualization. Never a spider-chart score. */
public class CapabilityMapScreen implements Screen {
    @Override
    public int tabIndex() { return 2; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "Capability map", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Not a score. It shows where you express yourself and where you have not yet had the chance."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Moment> moments = host.repo().getMomentsForChild(child.id);
        Set<String> growingDomains = new HashSet<>();
        for (Insight i : host.repo().getInsightsForChild(child.id)) {
            if (Insight.STATUS_ACTIVE.equals(i.status)) growingDomains.add(i.domain);
        }

        String[] domains = Domains.ALL;
        for (int i = 0; i < domains.length; i += 2) {
            LinearLayout row = UiKit.row(ctx);
            row.addView(domainCard(ctx, domains[i], moments, growingDomains));
            if (i + 1 < domains.length) {
                View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 12), 1)); row.addView(g);
                row.addView(domainCard(ctx, domains[i + 1], moments, growingDomains));
            } else {
                View filler = new View(ctx);
                filler.setLayoutParams(new LinearLayout.LayoutParams(0, 0, 1f));
                row.addView(filler);
            }
            col.addView(row);
            col.addView(UiKit.spacer(ctx, 12));
        }

        col.addView(UiKit.textLink(ctx, "See all 16 domains", Theme.TEAL, () ->
                Toast.makeText(ctx, "The remaining domains from the DRD light up here as you log more.", Toast.LENGTH_SHORT).show()));

        return col;
    }

    private LinearLayout domainCard(Context ctx, String domain, List<Moment> moments, Set<String> growing) {
        int count = 0;
        for (Moment m : moments) if (domain.equals(m.domain)) count++;

        LinearLayout card = UiKit.cardOutlined(ctx);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        card.setLayoutParams(lp);
        card.addView(UiKit.bold(ctx, Domains.label(domain), 15f));
        card.addView(UiKit.spacer(ctx, 6));
        card.addView(UiKit.muted(ctx, blurb(domain, count)));
        card.addView(UiKit.spacer(ctx, 16));

        boolean exercised = count >= 2;
        LinearLayout tagRow = UiKit.row(ctx);
        tagRow.addView(UiKit.badge(ctx, exercised ? "Well exercised" : "Room to try", exercised ? Theme.TEAL_TINT : Theme.BG_CREAM_DEEP, exercised ? Theme.TEAL_DARK : Theme.TEXT_MUTED));
        View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); tagRow.addView(g);
        TextView trend = new TextView(ctx);
        trend.setTextSize(12f);
        trend.setTextColor(Theme.TEXT_MUTED);
        trend.setText(growing.contains(domain) ? "↗ Growing" : "— Steady");
        tagRow.addView(trend);
        card.addView(tagRow);

        return card;
    }

    private String blurb(String domain, int count) {
        if (count == 0) return "Not yet logged. An opportunity, not a gap.";
        switch (domain) {
            case Domains.INDEPENDENCE: return "Shows up when routines are yours to shape.";
            case Domains.LEARNING: return "Follows interests deeply.";
            case Domains.SOCIAL: return "Comes through in shared moments.";
            case Domains.COMMUNICATION: return "Growing comfort putting things into words.";
            case Domains.CREATIVITY: return "Shows up when there is time and space.";
            case Domains.EMOTIONAL: return "Comes through in how you describe your days.";
            case Domains.RESILIENCE: return "Came through in how you've handled change.";
            default: return "Logged " + count + " time" + (count == 1 ? "" : "s") + " recently.";
        }
    }
}
