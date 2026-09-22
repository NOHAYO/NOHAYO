package com.nohayo.companion.ui.screens;

import android.app.AlertDialog;
import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

public class SettingsScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Settings & privacy", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "At every age", 15f));
        col.addView(UiKit.spacer(ctx, 10));
        LinearLayout principles = UiKit.cardOutlined(ctx);
        String[] rules = {
                "No scores or labels", "Every insight shows its evidence",
                "Hypotheses, never verdicts", "Nothing diagnosed",
                "Quiet, low-frequency notifications", "No comparing people"
        };
        for (int i = 0; i < rules.length; i++) {
            if (i > 0) principles.addView(UiKit.divider(ctx));
            LinearLayout row = UiKit.row(ctx);
            TextView check = new TextView(ctx);
            check.setText("✓  ");
            check.setTextColor(Theme.GREEN);
            row.addView(check);
            row.addView(UiKit.body(ctx, rules[i]));
            principles.addView(row);
        }
        col.addView(principles);
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "Data & region", 15f));
        col.addView(UiKit.spacer(ctx, 10));
        LinearLayout dataCard = UiKit.cardOutlined(ctx);
        dataCard.addView(settingsRow(ctx, "Region", "United States (COPPA)"));
        dataCard.addView(UiKit.divider(ctx));
        dataCard.addView(settingsRow(ctx, "Data ownership", "Transfers to " + child.name + " at age of majority"));
        dataCard.addView(UiKit.divider(ctx));
        dataCard.addView(settingsRow(ctx, "Storage", "On this device only, in this preview build"));
        col.addView(dataCard);
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.primaryButton(ctx, "🌈  Preview a different life stage", () -> host.push(new ModePickerScreen())));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "About", 15f));
        col.addView(UiKit.spacer(ctx, 10));
        LinearLayout about = UiKit.cardOutlined(ctx);
        about.addView(UiKit.body(ctx, "The Plan, a Lifelong Development Companion by NOHAYO. This build is an offline product-validation preview: a working core, not yet connected to the full recommendation and insight backend described in the design brief."));
        col.addView(about);
        col.addView(UiKit.spacer(ctx, 24));

        col.addView(UiKit.outlineButton(ctx, "Reset app data", () -> confirmReset(host)));

        return col;
    }

    private LinearLayout settingsRow(Context ctx, String label, String value) {
        LinearLayout row = UiKit.column(ctx);
        row.addView(UiKit.muted(ctx, label));
        row.addView(UiKit.bold(ctx, value, 14.5f));
        return row;
    }

    private void confirmReset(MainActivity host) {
        new AlertDialog.Builder(host)
                .setTitle("Reset app data?")
                .setMessage("This clears the local profile and every moment, insight, goal, and journal entry on this device. This cannot be undone.")
                .setPositiveButton("Reset", (dialog, which) -> {
                    host.repo().clearAllData();
                    host.setChild(null);
                    host.resetToScreen(new OnboardingWelcomeScreen());
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
