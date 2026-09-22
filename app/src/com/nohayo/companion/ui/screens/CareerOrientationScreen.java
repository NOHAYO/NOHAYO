package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

/** DRD §31/§39 career-orientation life event: weighs a real decision against the person's own record. */
public class CareerOrientationScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();
        int age = (int) Stages.ageInYears(child.birthDateMillis);

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Career orientation · age " + age, () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "Two offers, through your own values", 25f));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.muted(ctx, "Illustrative: in the full product this is drawn from what you've written over the years. Not a verdict."));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(compareCard(ctx, "Making things", "“I lose track of time when I am making things.”",
                "Offer A · Product studio", "Plenty of room", "Offer B · Public health group", "Less at first"));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(compareCard(ctx, "Learning from people ahead of me", "From your goals",
                "Offer A · Product studio", "Small team, few mentors", "Offer B · Public health group", "Strong mentors"));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(compareCard(ctx, "Helping people directly", "From several journal entries",
                "Offer A · Product studio", "Indirect", "Offer B · Public health group", "Direct"));
        col.addView(UiKit.spacer(ctx, 20));

        col.addView(UiKit.filledButton(ctx, "Talk it through", Theme.PLUM, Theme.WHITE, () ->
                host.push(new TabJournalComposeScreen(Theme.PLUM, "Thinking through the two offers…"))));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.outlineButton(ctx, "Add a third option", Theme.PLUM, () -> host.pop()));

        return col;
    }

    private LinearLayout compareCard(Context ctx, String theme, String source, String aLabel, String aVal, String bLabel, String bVal) {
        LinearLayout card = UiKit.cardOutlined(ctx);
        card.addView(UiKit.bold(ctx, theme, 15.5f));
        card.addView(UiKit.spacer(ctx, 4));
        card.addView(UiKit.muted(ctx, source));
        card.addView(UiKit.spacer(ctx, 10));
        LinearLayout row = UiKit.row(ctx);
        row.addView(offerBox(ctx, aLabel, aVal));
        View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); row.addView(g);
        row.addView(offerBox(ctx, bLabel, bVal));
        card.addView(row);
        return card;
    }

    private LinearLayout offerBox(Context ctx, String label, String val) {
        LinearLayout box = UiKit.column(ctx);
        box.setBackground(UiKit.roundedBg(Theme.PLUM_TINT, 14, ctx));
        box.setPadding(Dp.of(ctx, 12), Dp.of(ctx, 10), Dp.of(ctx, 12), Dp.of(ctx, 10));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        box.setLayoutParams(lp);
        box.addView(UiKit.bold(ctx, label, 12.5f));
        box.addView(UiKit.body(ctx, val));
        return box;
    }
}
