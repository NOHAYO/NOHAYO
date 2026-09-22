package com.nohayo.companion.ui;

import android.content.Context;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Reusable, programmatically-built UI primitives shared across every screen. */
public final class UiKit {
    private UiKit() {}

    public static GradientDrawable roundedBg(int color, int radiusDp, Context ctx) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(Dp.of(ctx, radiusDp));
        return d;
    }

    public static GradientDrawable roundedStroke(Context ctx, int fill, int stroke, float strokeDp, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setStroke(Math.round(strokeDp * ctx.getResources().getDisplayMetrics().density), stroke);
        d.setCornerRadius(Dp.of(ctx, radiusDp));
        return d;
    }

    public static LinearLayout column(Context ctx) {
        LinearLayout l = new LinearLayout(ctx);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    public static LinearLayout row(Context ctx) {
        LinearLayout l = new LinearLayout(ctx);
        l.setOrientation(LinearLayout.HORIZONTAL);
        return l;
    }

    public static LinearLayout.LayoutParams lp(Context ctx, int w, int h) {
        return new LinearLayout.LayoutParams(w, h);
    }

    public static LinearLayout.LayoutParams lpMargin(Context ctx, int w, int h, int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w, h);
        p.topMargin = Dp.of(ctx, top);
        return p;
    }

    public static LinearLayout card(Context ctx, int bgColor) {
        LinearLayout c = column(ctx);
        c.setBackground(roundedBg(bgColor, Theme.RADIUS_CARD, ctx));
        int pad = Dp.of(ctx, Theme.SPACE_M + 4);
        c.setPadding(pad, pad, pad, pad);
        return c;
    }

    public static LinearLayout cardOutlined(Context ctx) {
        LinearLayout c = column(ctx);
        c.setBackground(roundedStroke(ctx, Theme.BG_CREAM, Theme.LINE, 1.2f, Theme.RADIUS_CARD));
        int pad = Dp.of(ctx, Theme.SPACE_M + 4);
        c.setPadding(pad, pad, pad, pad);
        return c;
    }

    public static TextView headline(Context ctx, String text, float sp) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(sp);
        tv.setTypeface(Typeface.SERIF, Typeface.BOLD);
        tv.setTextColor(Theme.TEXT_INK);
        return tv;
    }

    public static TextView label(Context ctx, String text, int color) {
        TextView tv = new TextView(ctx);
        tv.setText(text.toUpperCase());
        tv.setTextSize(12f);
        tv.setLetterSpacing(0.06f);
        tv.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        tv.setTextColor(color);
        return tv;
    }

    public static TextView body(Context ctx, String text) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(15.5f);
        tv.setTextColor(Theme.TEXT_INK);
        tv.setLineSpacing(Dp.of(ctx, 2), 1f);
        return tv;
    }

    public static TextView bold(Context ctx, String text, float sp) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(sp);
        tv.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        tv.setTextColor(Theme.TEXT_INK);
        return tv;
    }

    public static TextView muted(Context ctx, String text) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(13.5f);
        tv.setTextColor(Theme.TEXT_MUTED);
        return tv;
    }

    public interface Action { void run(); }

    private static Button buttonBase(Context ctx, String label) {
        Button b = new Button(ctx);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(16f);
        b.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        b.setPadding(Dp.of(ctx, 20), Dp.of(ctx, 14), Dp.of(ctx, 20), Dp.of(ctx, 14));
        b.setStateListAnimator(null);
        b.setElevation(0);
        return b;
    }

    public static Button primaryButton(Context ctx, String label, Action onClick) {
        Button b = buttonBase(ctx, label);
        b.setBackground(roundedBg(Theme.TERRACOTTA, Theme.RADIUS_BUTTON, ctx));
        b.setTextColor(Theme.WHITE);
        b.setOnClickListener(v -> onClick.run());
        return b;
    }

    public static Button greenButton(Context ctx, String label, Action onClick) {
        Button b = buttonBase(ctx, label);
        b.setBackground(roundedBg(Theme.GREEN, Theme.RADIUS_BUTTON, ctx));
        b.setTextColor(Theme.WHITE);
        b.setOnClickListener(v -> onClick.run());
        return b;
    }

    public static Button outlineButton(Context ctx, String label, Action onClick) {
        Button b = buttonBase(ctx, label);
        b.setBackground(roundedStroke(ctx, Theme.BG_CREAM, Theme.LINE, 1.3f, Theme.RADIUS_BUTTON));
        b.setTextColor(Theme.TEXT_INK);
        b.setOnClickListener(v -> onClick.run());
        return b;
    }

    public static TextView textLink(Context ctx, String label, int color, Action onClick) {
        TextView tv = new TextView(ctx);
        tv.setText(label);
        tv.setTextSize(15f);
        tv.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        tv.setTextColor(color);
        tv.setGravity(Gravity.CENTER);
        tv.setPadding(0, Dp.of(ctx, 10), 0, Dp.of(ctx, 10));
        tv.setOnClickListener(v -> onClick.run());
        return tv;
    }

    public static TextView chip(Context ctx, String text, boolean selected, Action onClick) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(14f);
        tv.setTypeface(Typeface.SANS_SERIF, selected ? Typeface.BOLD : Typeface.NORMAL);
        tv.setPadding(Dp.of(ctx, 16), Dp.of(ctx, 10), Dp.of(ctx, 16), Dp.of(ctx, 10));
        if (selected) {
            tv.setBackground(roundedBg(Theme.TERRACOTTA, Theme.RADIUS_CHIP, ctx));
            tv.setTextColor(Theme.WHITE);
        } else {
            tv.setBackground(roundedStroke(ctx, Theme.BG_CREAM, Theme.LINE, 1.2f, Theme.RADIUS_CHIP));
            tv.setTextColor(Theme.TEXT_INK);
        }
        tv.setOnClickListener(v -> onClick.run());
        return tv;
    }

    public static TextView badge(Context ctx, String text, int bg, int fg) {
        TextView tv = new TextView(ctx);
        tv.setText(text);
        tv.setTextSize(12f);
        tv.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        tv.setTextColor(fg);
        tv.setBackground(roundedBg(bg, Theme.RADIUS_CHIP, ctx));
        tv.setPadding(Dp.of(ctx, 12), Dp.of(ctx, 5), Dp.of(ctx, 12), Dp.of(ctx, 5));
        return tv;
    }

    public static EditText editText(Context ctx, String hint, boolean multiline) {
        EditText et = new EditText(ctx);
        et.setHint(hint);
        et.setHintTextColor(Theme.TEXT_FAINT);
        et.setTextColor(Theme.TEXT_INK);
        et.setTextSize(15.5f);
        et.setBackground(roundedStroke(ctx, Theme.WHITE, Theme.LINE, 1.2f, 14));
        int padH = Dp.of(ctx, 16);
        int padV = Dp.of(ctx, multiline ? 14 : 12);
        et.setPadding(padH, padV, padH, padV);
        if (multiline) {
            et.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
            et.setMinLines(3);
            et.setGravity(Gravity.TOP | Gravity.START);
        } else {
            et.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
            et.setSingleLine(true);
        }
        return et;
    }

    public static View divider(Context ctx) {
        View v = new View(ctx);
        v.setBackgroundColor(Theme.LINE);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Dp.of(ctx, 1));
        p.topMargin = Dp.of(ctx, Theme.SPACE_S);
        p.bottomMargin = Dp.of(ctx, Theme.SPACE_S);
        v.setLayoutParams(p);
        return v;
    }

    public static View spacer(Context ctx, int dp) {
        View v = new View(ctx);
        v.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Dp.of(ctx, dp)));
        return v;
    }

    public static TextView avatarCircle(Context ctx, String initial, int bg, int size) {
        TextView tv = new TextView(ctx);
        tv.setText(initial);
        tv.setTextColor(Theme.WHITE);
        tv.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        tv.setTextSize(size / 2.4f);
        tv.setGravity(Gravity.CENTER);
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(bg);
        tv.setBackground(d);
        tv.setLayoutParams(new LinearLayout.LayoutParams(Dp.of(ctx, size), Dp.of(ctx, size)));
        return tv;
    }

    /** Row of small dots representing confidence tier (filled vs empty). */
    public static LinearLayout confidenceDots(Context ctx, int filled, int total, int color) {
        LinearLayout row = row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        for (int i = 0; i < total; i++) {
            View dot = new View(ctx);
            GradientDrawable d = new GradientDrawable();
            d.setShape(GradientDrawable.OVAL);
            d.setColor(i < filled ? color : Theme.LINE);
            dot.setBackground(d);
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(Dp.of(ctx, 22), Dp.of(ctx, 6));
            p.rightMargin = Dp.of(ctx, 4);
            dot.setLayoutParams(p);
            row.addView(dot);
        }
        return row;
    }
}
