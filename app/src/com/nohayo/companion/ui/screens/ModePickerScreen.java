package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Mode;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/**
 * "Five skins, one system": lets you preview any life-stage skin against the same
 * record. In the real product the skin that owns the account follows the person's
 * actual age automatically (DRD §4) — this picker is this preview build's way of
 * letting you see the whole design in one place, on one seeded profile.
 */
public class ModePickerScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Preview a life stage", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "One record, every chapter", 24f));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.muted(ctx, "Switching skins never changes " + (child != null ? child.name + "'s" : "the") + " record — only who owns the account, what they see, and how it looks."));
        col.addView(UiKit.spacer(ctx, 18));

        for (Mode m : Mode.values()) {
            col.addView(modeCard(host, m));
            col.addView(UiKit.spacer(ctx, 12));
        }

        LinearLayout transition = UiKit.cardOutlined(ctx);
        transition.addView(UiKit.bold(ctx, "🔐  18th-birthday moment", 15.5f));
        transition.addView(UiKit.spacer(ctx, 6));
        transition.addView(UiKit.muted(ctx, "The one-time ownership-transfer screen (DRD §26)."));
        transition.setOnClickListener(v -> host.push(new OwnershipTransferScreen()));
        col.addView(transition);
        col.addView(UiKit.spacer(ctx, 24));

        List<Child> children = host.repo().getAllChildren();
        if (children.size() > 1) {
            col.addView(UiKit.bold(ctx, "Switch profile", 15f));
            col.addView(UiKit.spacer(ctx, 4));
            col.addView(UiKit.muted(ctx, "DRD §48: an adult can hold their own record and start a child's."));
            col.addView(UiKit.spacer(ctx, 10));
            for (Child c : children) {
                col.addView(childRow(host, c));
                col.addView(UiKit.spacer(ctx, 10));
            }
        }

        return col;
    }

    private LinearLayout modeCard(MainActivity host, Mode m) {
        Context ctx = host;
        boolean active = m == host.mode();
        LinearLayout card = UiKit.card(ctx, active ? m.tint : Theme.BG_CREAM_DEEP);
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, m.displayName, 16.5f));
        text.addView(UiKit.muted(ctx, m.ageLabel));
        row.addView(text);
        if (active) {
            row.addView(UiKit.badge(ctx, "Current", m.accent, Theme.WHITE));
        }
        card.addView(row);
        card.setOnClickListener(v -> {
            host.switchMode(m);
            if (m == Mode.OWN_SPACE) host.push(new OwnSpaceWelcomeScreen());
        });
        return card;
    }

    private LinearLayout childRow(MainActivity host, Child c) {
        Context ctx = host;
        boolean active = host.getChild() != null && host.getChild().id == c.id;
        LinearLayout row = UiKit.cardOutlined(ctx);
        LinearLayout inner = UiKit.row(ctx);
        inner.setGravity(Gravity.CENTER_VERTICAL);
        inner.addView(UiKit.avatarCircle(ctx, c.name.substring(0, 1).toUpperCase(), Theme.TERRACOTTA, 36));
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        tp.leftMargin = Dp.of(ctx, 10);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, c.name, 15f));
        text.addView(UiKit.muted(ctx, Stages.ageLabel(c.birthDateMillis)));
        inner.addView(text);
        if (active) inner.addView(UiKit.badge(ctx, "Active", Theme.TERRACOTTA, Theme.WHITE));
        row.addView(inner);
        row.setOnClickListener(v -> {
            host.switchChild(c);
            host.switchMode(Mode.ownerForAge(Stages.ageInYears(c.birthDateMillis)));
        });
        return row;
    }
}
