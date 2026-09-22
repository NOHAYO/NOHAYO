package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.text.format.DateFormat;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

/** Small shared building blocks used by several screens. */
final class Screens {
    private Screens() {}

    static LinearLayout topBar(Context ctx, String title, UiKit.Action onBack) {
        LinearLayout bar = UiKit.row(ctx);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView back = new TextView(ctx);
        back.setText("‹");
        back.setTextSize(24f);
        back.setTextColor(Theme.TEXT_INK);
        back.setPadding(Dp.of(ctx, 4), 0, Dp.of(ctx, 16), 0);
        back.setOnClickListener(v -> onBack.run());
        bar.addView(back);

        TextView label = UiKit.bold(ctx, title, 15f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        label.setLayoutParams(lp);
        label.setGravity(Gravity.CENTER);
        bar.addView(label);

        View spacer = new View(ctx);
        spacer.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 28), Dp.of(ctx, 1)));
        bar.addView(spacer);

        return bar;
    }

    static LinearLayout topBarClose(Context ctx, String title, UiKit.Action onClose) {
        LinearLayout bar = UiKit.row(ctx);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView label = UiKit.bold(ctx, title, 15f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        label.setLayoutParams(lp);
        label.setGravity(Gravity.CENTER);
        bar.addView(label);

        TextView close = new TextView(ctx);
        close.setText("✕");
        close.setTextSize(18f);
        close.setTextColor(Theme.TEXT_INK);
        close.setPadding(Dp.of(ctx, 16), 0, Dp.of(ctx, 4), 0);
        close.setOnClickListener(v -> onClose.run());

        LinearLayout wrap = UiKit.row(ctx);
        wrap.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        wrap.setGravity(Gravity.CENTER_VERTICAL);
        View leftSpacer = new View(ctx);
        leftSpacer.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 28), Dp.of(ctx, 1)));
        wrap.addView(leftSpacer);
        wrap.addView(label);
        wrap.addView(close);
        return wrap;
    }

    static String relativeDay(long timestampMillis) {
        long diffDays = (System.currentTimeMillis() - timestampMillis) / (24L * 60 * 60 * 1000);
        if (diffDays <= 0) return "Today";
        if (diffDays == 1) return "Yesterday";
        if (diffDays < 7) return DateFormat.format("EEE", timestampMillis).toString();
        return DateFormat.format("MMM d", timestampMillis).toString();
    }

    static String fullDate(long timestampMillis) {
        return DateFormat.format("MMM d, yyyy", timestampMillis).toString();
    }
}
