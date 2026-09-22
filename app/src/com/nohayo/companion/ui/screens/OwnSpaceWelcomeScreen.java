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

/** The one-time privacy-education moment shown around age 12 (DRD §4, early adolescence). */
public class OwnSpaceWelcomeScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 48), pad, Dp.of(ctx, 32));

        col.addView(UiKit.label(ctx, "Welcome to your own space", Theme.BLUE));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.headline(ctx, "This space is yours.", 32f));
        col.addView(UiKit.spacer(ctx, 10));
        TextView sub = UiKit.body(ctx, "You are getting older, so more of this is up to you. Here is exactly how it works.");
        sub.setTextColor(Theme.TEXT_MUTED);
        col.addView(sub);
        col.addView(UiKit.spacer(ctx, 26));

        col.addView(rule(ctx, "🔒", "Your journal is private", "Your parents cannot read it."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(rule(ctx, "👁", "They see themes, not your words", "A short summary, nothing you wrote."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(rule(ctx, "↑", "You decide what to share", "One thing at a time, only if you choose."));
        col.addView(UiKit.spacer(ctx, 24));

        LinearLayout note = UiKit.card(ctx, Theme.BLUE_TINT);
        note.addView(UiKit.body(ctx, "If something ever feels too heavy, we can show you ways to talk to someone you trust. It is always your choice."));
        col.addView(note);
        col.addView(UiKit.spacer(ctx, 40));

        col.addView(UiKit.filledButton(ctx, "Got it", Theme.BLUE, Theme.WHITE, () -> host.replace(new TeenTodayScreen())));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(UiKit.outlineButton(ctx, "👁  Show me what my parents see", Theme.BLUE, () ->
                Toast.makeText(ctx, "They'll see short summaries of themes, plus anything you choose to share.", Toast.LENGTH_LONG).show()));

        return col;
    }

    private LinearLayout rule(Context ctx, String emoji, String title, String desc) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = new TextView(ctx);
        badge.setText(emoji);
        badge.setTextSize(18f);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(UiKit.roundedBg(Theme.BLUE_TINT, 14, ctx));
        badge.setLayoutParams(new LinearLayout.LayoutParams(Dp.of(ctx, 40), Dp.of(ctx, 40)));
        row.addView(badge);
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        tp.leftMargin = Dp.of(ctx, 14);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, title, 15.5f));
        text.addView(UiKit.muted(ctx, desc));
        row.addView(text);
        return row;
    }
}
