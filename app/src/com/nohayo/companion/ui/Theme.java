package com.nohayo.companion.ui;

import android.graphics.Color;

/** Central palette and metrics, matching the NOHAYO "Lifelong Development Companion" design system. */
public final class Theme {
    private Theme() {}

    // Core palette
    public static final int BG_CREAM = Color.parseColor("#F7F1E4");
    public static final int BG_CREAM_DEEP = Color.parseColor("#F1E8D6");
    public static final int TEXT_INK = Color.parseColor("#2B2420");
    public static final int TEXT_MUTED = Color.parseColor("#7A7166");
    public static final int TEXT_FAINT = Color.parseColor("#A79C8C");
    public static final int LINE = Color.parseColor("#E7DDC9");
    public static final int WHITE = Color.parseColor("#FFFFFF");

    // Terracotta (primary / parent-tool accent)
    public static final int TERRACOTTA = Color.parseColor("#A15C38");
    public static final int TERRACOTTA_DARK = Color.parseColor("#8A4B2C");
    public static final int PEACH = Color.parseColor("#F6D9CB");
    public static final int PEACH_DEEP = Color.parseColor("#F1C4AF");

    // Green (insights / independence / Garden-Notebook child theme)
    public static final int GREEN = Color.parseColor("#2E6B3E");
    public static final int GREEN_DARK = Color.parseColor("#1F4D2C");
    public static final int GREEN_TINT = Color.parseColor("#DFF0DE");
    public static final int GREEN_TINT_DEEP = Color.parseColor("#CBE7C9");

    // Blue (adolescent "own space" accent, used sparingly for info)
    public static final int BLUE = Color.parseColor("#3E5C99");
    public static final int BLUE_TINT = Color.parseColor("#E1E7F5");

    // Semantic
    public static final int WARNING_BG = Color.parseColor("#F6D9CB");
    public static final int WARNING_TEXT = Color.parseColor("#8A4B2C");

    // Metrics (dp values, converted at use-site via Dp.of)
    public static final int RADIUS_CARD = 20;
    public static final int RADIUS_BUTTON = 28;
    public static final int RADIUS_CHIP = 20;
    public static final int RADIUS_ICON_BADGE = 14;

    public static final int SPACE_XS = 4;
    public static final int SPACE_S = 8;
    public static final int SPACE_M = 16;
    public static final int SPACE_L = 24;
    public static final int SPACE_XL = 32;
}
