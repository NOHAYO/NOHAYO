package com.nohayo.companion.ui;

import android.content.Context;
import android.util.TypedValue;

public final class Dp {
    private Dp() {}

    public static int of(Context ctx, float dp) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, dp, ctx.getResources().getDisplayMetrics()));
    }

    public static int sp(Context ctx, float sp) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_SP, sp, ctx.getResources().getDisplayMetrics()));
    }
}
