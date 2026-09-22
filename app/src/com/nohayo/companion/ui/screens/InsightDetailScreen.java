package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

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

import java.util.ArrayList;
import java.util.List;

public class InsightDetailScreen implements Screen {
    private final long insightId;

    public InsightDetailScreen(long insightId) {
        this.insightId = insightId;
    }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();
        Insight ins = host.repo().getInsight(insightId);

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Insight", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));

        if (ins == null) {
            col.addView(UiKit.muted(ctx, "This insight is no longer available."));
            return col;
        }

        col.addView(UiKit.label(ctx, Domains.label(ins.domain), Domains.color(ins.domain)));
        col.addView(UiKit.spacer(ctx, 8));
        col.addView(UiKit.headline(ctx, ins.title, 23f));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.confidenceDots(ctx, ins.confidenceLevel, 3, Domains.color(ins.domain)));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.bold(ctx, ins.confidenceTier, 13.5f));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(UiKit.body(ctx, ins.summary));
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout evidenceCard = UiKit.cardOutlined(ctx);
        evidenceCard.addView(UiKit.bold(ctx, "Why you are seeing this", 15.5f));
        evidenceCard.addView(UiKit.spacer(ctx, 12));

        List<Long> ids = new ArrayList<>();
        if (ins.evidenceIds != null && !ins.evidenceIds.isEmpty()) {
            for (String s : ins.evidenceIds.split(",")) {
                try { ids.add(Long.parseLong(s.trim())); } catch (NumberFormatException ignored) {}
            }
        }
        List<Moment> evidence = host.repo().getMomentsByIds(ids);
        for (int i = 0; i < evidence.size(); i++) {
            Moment m = evidence.get(i);
            if (i > 0) evidenceCard.addView(UiKit.divider(ctx));
            LinearLayout row = UiKit.column(ctx);
            LinearLayout metaRow = UiKit.row(ctx);
            metaRow.setGravity(Gravity.CENTER_VERTICAL);
            TextView when = UiKit.muted(ctx, Screens.fullDate(m.timestampMillis));
            LinearLayout.LayoutParams wlp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
            wlp.weight = 1f;
            when.setLayoutParams(wlp);
            metaRow.addView(when);
            metaRow.addView(UiKit.badge(ctx, "You noted", Theme.GREEN_TINT, Theme.GREEN_DARK));
            row.addView(metaRow);
            row.addView(UiKit.spacer(ctx, 4));
            row.addView(UiKit.body(ctx, "“" + m.text + "”"));
            evidenceCard.addView(row);
        }
        evidenceCard.addView(UiKit.divider(ctx));
        LinearLayout inferredRow = UiKit.column(ctx);
        LinearLayout inferredMeta = UiKit.row(ctx);
        inferredMeta.setGravity(Gravity.CENTER_VERTICAL);
        TextView inferredLabel = UiKit.muted(ctx, "Our reading");
        LinearLayout.LayoutParams ilp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        ilp.weight = 1f;
        inferredLabel.setLayoutParams(ilp);
        inferredMeta.addView(inferredLabel);
        inferredMeta.addView(UiKit.badge(ctx, "Inferred", Theme.LINE, Theme.TEXT_MUTED));
        inferredRow.addView(inferredMeta);
        inferredRow.addView(UiKit.spacer(ctx, 4));
        inferredRow.addView(UiKit.body(ctx, evidence.size() + " related moments logged in " + Domains.label(ins.domain).toLowerCase() + "."));
        evidenceCard.addView(inferredRow);
        col.addView(evidenceCard);
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout recCard = UiKit.card(ctx, Domains.tint(ins.domain));
        recCard.addView(UiKit.label(ctx, "One small thing to try", Domains.color(ins.domain)));
        recCard.addView(UiKit.spacer(ctx, 8));
        recCard.addView(UiKit.bold(ctx, ins.recommendation, 16f));
        recCard.addView(UiKit.spacer(ctx, 10));
        LinearLayout tagRow = UiKit.row(ctx);
        TextView effort = UiKit.badge(ctx, ins.recommendationEffort, Theme.WHITE, Theme.TEXT_MUTED);
        tagRow.addView(effort);
        View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); tagRow.addView(g);
        tagRow.addView(UiKit.badge(ctx, ins.recommendationFor, Theme.WHITE, Theme.TEXT_MUTED));
        recCard.addView(tagRow);
        col.addView(recCard);
        col.addView(UiKit.spacer(ctx, 18));

        boolean isActive = Insight.STATUS_ACTIVE.equals(ins.status);
        LinearLayout btnRow = UiKit.row(ctx);
        LinearLayout.LayoutParams b1 = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        b1.weight = 1f;
        android.widget.Button tryBtn = UiKit.greenButton(ctx, isActive ? "Try a next step" : "Tried", () -> {
            if (!Insight.STATUS_ACTIVE.equals(ins.status)) return;
            host.repo().updateInsightStatus(ins.id, Insight.STATUS_TRIED);
            Goal goal = new Goal();
            goal.childId = child.id;
            goal.what = ins.recommendation;
            goal.why = ins.title;
            goal.byWhen = "This week";
            goal.howNoticed = "You'll notice it when it happens naturally, no need to force it.";
            goal.createdAtMillis = System.currentTimeMillis();
            goal.status = Goal.STATUS_ACTIVE;
            host.repo().insertGoal(goal);
            Toast.makeText(ctx, "Added to Goals.", Toast.LENGTH_SHORT).show();
            host.pop();
        });
        tryBtn.setLayoutParams(b1);
        tryBtn.setEnabled(isActive);
        btnRow.addView(tryBtn);

        View gap = new View(ctx); gap.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 12), 1)); btnRow.addView(gap);

        LinearLayout.LayoutParams b2 = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        b2.weight = 1f;
        android.widget.Button notHelpfulBtn = UiKit.outlineButton(ctx, "Not helpful", () -> {
            host.repo().updateInsightStatus(ins.id, Insight.STATUS_DISMISSED);
            host.pop();
        });
        notHelpfulBtn.setLayoutParams(b2);
        notHelpfulBtn.setEnabled(isActive);
        btnRow.addView(notHelpfulBtn);
        col.addView(btnRow);
        col.addView(UiKit.spacer(ctx, 16));

        TextView disclaimer = UiKit.muted(ctx, "If something about " + child.name + "'s development worries you, a qualified professional is the right person to ask.");
        disclaimer.setGravity(Gravity.CENTER);
        col.addView(disclaimer);

        return col;
    }
}
