package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.LinkedHashMap;
import java.util.Map;

/** DRD §31 guided life-event flows, teen slice: first job, driving, study path, national service. */
public class TeenLifeEventsScreen implements Screen {

    private static final String[] EVENTS = {"First job", "Driving", "Study path", "National service"};
    private static final String[][] STEPS = {
            {"What do you want from it?", "Know your rights", "Money basics: your first pay", "Talk it through with someone"},
            {"What driving means for you", "Learner requirements where you live", "Practice plan", "Talk it through with someone"},
            {"What subjects pull at you", "Options beyond the obvious", "Talk to someone who's done it", "Make a shortlist"},
            {"What it involves where you live", "Timing and exemptions", "What people wish they'd known", "Talk it through with someone"},
    };

    private String selectedEvent = EVENTS[0];
    private int step = 2; // matches the reference screen ("Step 2 of 4"), 1-indexed
    private final Map<String, TextView> chips = new LinkedHashMap<>();
    private LinearLayout stepsHolder;
    private TextView stepLabel;
    private MainActivity hostRef;

    @Override
    public View build(MainActivity host) {
        this.hostRef = host;
        Context ctx = host;

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.headline(ctx, "Life events", 24f));
        col.addView(UiKit.spacer(ctx, 14));

        LinearLayout row1 = UiKit.row(ctx);
        row1.addView(eventChip(host, EVENTS[0]));
        View g1 = new View(ctx); g1.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); row1.addView(g1);
        row1.addView(eventChip(host, EVENTS[1]));
        View g2 = new View(ctx); g2.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); row1.addView(g2);
        row1.addView(eventChip(host, EVENTS[2]));
        col.addView(row1);
        col.addView(UiKit.spacer(ctx, 8));
        col.addView(eventChip(host, EVENTS[3]));
        col.addView(UiKit.spacer(ctx, 18));

        LinearLayout flowCard = UiKit.cardOutlined(ctx);
        stepLabel = UiKit.label(ctx, "Step " + step + " of 4", Theme.BLUE);
        flowCard.addView(stepLabel);
        flowCard.addView(UiKit.spacer(ctx, 6));
        flowCard.addView(UiKit.headline(ctx, "Your " + selectedEvent.toLowerCase(), 21f));
        flowCard.addView(UiKit.spacer(ctx, 6));
        flowCard.addView(UiKit.muted(ctx, "Small guides for the parts people rarely explain. Skip any of them."));
        flowCard.addView(UiKit.spacer(ctx, 14));

        stepsHolder = UiKit.column(ctx);
        flowCard.addView(stepsHolder);
        col.addView(flowCard);
        renderSteps(host);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout touches = UiKit.card(ctx, Theme.BG_CREAM_DEEP);
        touches.addView(UiKit.muted(ctx, "This also touches"));
        touches.addView(UiKit.spacer(ctx, 8));
        LinearLayout tagRow = UiKit.row(ctx);
        tagRow.addView(UiKit.badge(ctx, "Independence", Theme.BLUE_TINT, Theme.BLUE));
        View g3 = new View(ctx); g3.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); tagRow.addView(g3);
        tagRow.addView(UiKit.badge(ctx, "Financial independence", Theme.BLUE_TINT, Theme.BLUE));
        touches.addView(tagRow);
        col.addView(touches);
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.filledButton(ctx, "Continue with step " + Math.min(step + 1, 4), Theme.BLUE, Theme.WHITE, () -> {
            step = Math.min(step + 1, 4);
            stepLabel.setText("Step " + step + " of 4");
            renderSteps(hostRef);
        }));

        return col;
    }

    private void renderSteps(MainActivity host) {
        Context ctx = host;
        stepsHolder.removeAllViews();
        int idx = 0;
        for (int i = 0; i < EVENTS.length; i++) if (EVENTS[i].equals(selectedEvent)) idx = i;
        String[] steps = STEPS[idx];
        for (int i = 0; i < steps.length; i++) {
            if (i > 0) stepsHolder.addView(UiKit.divider(ctx));
            LinearLayout row = UiKit.row(ctx);
            row.setGravity(Gravity.CENTER_VERTICAL);
            int n = i + 1;
            TextView badge;
            if (n < step) {
                badge = UiKit.avatarCircle(ctx, "✓", Theme.BLUE, 26);
            } else if (n == step) {
                badge = UiKit.avatarCircle(ctx, String.valueOf(n), Theme.BLUE, 26);
            } else {
                badge = UiKit.avatarCircle(ctx, String.valueOf(n), Theme.LINE, 26);
                badge.setTextColor(Theme.TEXT_MUTED);
            }
            badge.setTextSize(13f);
            row.addView(badge);
            TextView label = UiKit.body(ctx, steps[i]);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            lp.leftMargin = Dp.of(ctx, 12);
            label.setLayoutParams(lp);
            if (n == step) label.setTypeface(android.graphics.Typeface.SANS_SERIF, android.graphics.Typeface.BOLD);
            row.addView(label);
            stepsHolder.addView(row);
        }
    }

    private TextView eventChip(MainActivity host, String label) {
        TextView chip = UiKit.chip(host, label, label.equals(selectedEvent), Theme.BLUE, () -> {
            selectedEvent = label;
            step = 1;
            host.replace(this);
        });
        chips.put(label, chip);
        return chip;
    }
}
