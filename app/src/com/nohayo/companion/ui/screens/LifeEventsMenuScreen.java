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

/** DRD §31 guided life-event flows, adult slice. */
public class LifeEventsMenuScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Life events", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(menuCard(host, "💼", "Career orientation", "Compare choices against what you've written about yourself.", () -> host.push(new CareerOrientationScreen())));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(menuCard(host, "👶", "Parenthood", "Start a separate profile for a new child of your own.", () -> host.push(new ParenthoodLifeEventScreen())));
        col.addView(UiKit.spacer(ctx, 12));
        col.addView(menuCard(host, "❤", "Relationships", "Guided reflection for a major relationship step.", () ->
                android.widget.Toast.makeText(ctx, "This flow is sketched in the DRD roadmap, not built in this preview.", android.widget.Toast.LENGTH_SHORT).show()));

        return col;
    }

    private LinearLayout menuCard(MainActivity host, String emoji, String title, String desc, UiKit.Action onClick) {
        Context ctx = host;
        LinearLayout card = UiKit.cardOutlined(ctx);
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView icon = new TextView(ctx);
        icon.setText(emoji);
        icon.setTextSize(22f);
        icon.setGravity(Gravity.CENTER);
        icon.setBackground(UiKit.roundedBg(Theme.TEAL_TINT, 14, ctx));
        icon.setLayoutParams(new LinearLayout.LayoutParams(Dp.of(ctx, 44), Dp.of(ctx, 44)));
        row.addView(icon);
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        tp.leftMargin = Dp.of(ctx, 14);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, title, 15.5f));
        text.addView(UiKit.muted(ctx, desc));
        row.addView(text);
        card.addView(row);
        card.setOnClickListener(v -> onClick.run());
        return card;
    }
}
