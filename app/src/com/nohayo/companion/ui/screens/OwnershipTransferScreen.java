package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

/** DRD §26 data-ownership transition, dramatized at the design's default milestone (18th birthday). */
public class OwnershipTransferScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 40), pad, Dp.of(ctx, 32));

        col.addView(Screens.topBar(ctx, "", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 20));
        col.addView(UiKit.label(ctx, "Your 18th birthday", Theme.PLUM));
        col.addView(UiKit.spacer(ctx, 8));
        col.addView(UiKit.headline(ctx, "This account is now yours.", 30f));
        col.addView(UiKit.spacer(ctx, 24));

        LinearLayout diagram = UiKit.row(ctx);
        diagram.setGravity(Gravity.CENTER_VERTICAL);
        diagram.addView(UiKit.avatarCircle(ctx, "Parent", Theme.PLUM_TINT_DEEP, 64));
        TextView arrow = new TextView(ctx);
        arrow.setText("  →→→  ");
        arrow.setTextColor(Theme.PLUM);
        diagram.addView(arrow);
        diagram.addView(UiKit.avatarCircle(ctx, "You", Theme.PLUM, 64));
        LinearLayout diagramWrap = UiKit.column(ctx);
        diagramWrap.setGravity(Gravity.CENTER);
        diagramWrap.addView(diagram);
        col.addView(diagramWrap);
        col.addView(UiKit.spacer(ctx, 28));

        col.addView(bullet(ctx, "🌟", "Your record comes with you", "Everything since you were logged as a baby, in one place."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(bullet(ctx, "🔒", "Your parents' access has ended", "That is the default. Nothing was deleted."));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(bullet(ctx, "👥", "You choose who comes back", "Invite them with fresh permissions, or not at all."));
        col.addView(UiKit.spacer(ctx, 36));

        col.addView(UiKit.filledButton(ctx, "Review my record", Theme.PLUM, Theme.WHITE, () -> host.push(new TimelineScreen())));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.outlineButton(ctx, "Choose who to invite", Theme.PLUM, () -> host.push(new NewFamilyMemberScreen())));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.textLink(ctx, "⤓  Export my record", Theme.PLUM, () ->
                Toast.makeText(ctx, child.name + "'s record would export as a file here in the full product.", Toast.LENGTH_SHORT).show()));

        return col;
    }

    private LinearLayout bullet(Context ctx, String emoji, String title, String desc) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = new TextView(ctx);
        badge.setText(emoji);
        badge.setTextSize(18f);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(UiKit.roundedBg(Theme.PLUM_TINT, 14, ctx));
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
