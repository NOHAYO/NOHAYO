package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

public class OnboardingWelcomeScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 48), pad, Dp.of(ctx, 32));

        LinearLayout brand = UiKit.row(ctx);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        TextView mark = new TextView(ctx);
        mark.setText("◉");
        mark.setTextSize(20f);
        mark.setTextColor(Theme.TERRACOTTA);
        brand.addView(mark);
        TextView wordmark = UiKit.bold(ctx, "  The Plan", 17f);
        brand.addView(wordmark);
        TextView subtitle = UiKit.muted(ctx, "   working title");
        brand.addView(subtitle);
        col.addView(brand);

        col.addView(UiKit.spacer(ctx, 28));
        TextView headline = UiKit.headline(ctx, "A private record that grows up with your child.", 30f);
        col.addView(headline);

        col.addView(UiKit.spacer(ctx, 14));
        TextView body = UiKit.body(ctx, "No scores. No labels. Just what you notice, and what it might mean, kept for the person your child is becoming.");
        body.setTextColor(Theme.TEXT_MUTED);
        col.addView(body);

        col.addView(UiKit.spacer(ctx, 28));
        col.addView(featureRow(ctx, "🍃", "Never a score or a label", "Growth is shown as a story over time, not a ranking."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(featureRow(ctx, "💡", "Every insight shows its evidence", "Tap “why” to see exactly what it is based on."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(featureRow(ctx, "🔒", "Privacy that moves with age", "As your child grows, the record becomes theirs."));

        col.addView(UiKit.spacer(ctx, 40));
        col.addView(UiKit.primaryButton(ctx, "Get started", () ->
                host.push(new OnboardingConsentScreen())));

        col.addView(UiKit.textLink(ctx, "I already have an account", Theme.TERRACOTTA, () ->
                Toast.makeText(ctx, "This demo build keeps one local profile on this device.", Toast.LENGTH_SHORT).show()));

        TextView footer = UiKit.muted(ctx, "You will only be asked for a little at a time.");
        footer.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams flp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        flp.topMargin = Dp.of(ctx, 4);
        footer.setLayoutParams(flp);
        footer.setGravity(Gravity.CENTER);
        col.addView(footer);

        return col;
    }

    private LinearLayout featureRow(Context ctx, String emoji, String title, String desc) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);

        TextView badge = new TextView(ctx);
        badge.setText(emoji);
        badge.setTextSize(18f);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(UiKit.roundedBg(Theme.PEACH, 14, ctx));
        badge.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 40), Dp.of(ctx, 40)));
        row.addView(badge);

        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.weight = 1f;
        tp.leftMargin = Dp.of(ctx, 14);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, title, 15.5f));
        TextView d = UiKit.muted(ctx, desc);
        text.addView(d);
        row.addView(text);

        return row;
    }
}
