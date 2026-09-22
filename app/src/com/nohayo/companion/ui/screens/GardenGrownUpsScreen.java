package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class GardenGrownUpsScreen implements Screen {
    @Override
    public int tabIndex() { return 2; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        col.setBackgroundColor(Theme.GARDEN_BG);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "Grown-ups", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "These are the people who help take care of your garden."));
        col.addView(UiKit.spacer(ctx, 18));

        List<FamilyMember> members = host.repo().getFamilyForChild(child.id);
        for (FamilyMember m : members) {
            LinearLayout card = UiKit.card(ctx, Theme.WHITE);
            LinearLayout row = UiKit.row(ctx);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.addView(UiKit.avatarCircle(ctx, m.name.substring(0, 1).toUpperCase(), Theme.GREEN, 40));
            LinearLayout text = UiKit.column(ctx);
            LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            tp.leftMargin = Dp.of(ctx, 12);
            text.setLayoutParams(tp);
            text.addView(UiKit.bold(ctx, m.name, 16f));
            text.addView(UiKit.muted(ctx, m.role));
            row.addView(text);
            card.addView(row);
            col.addView(card);
            col.addView(UiKit.spacer(ctx, 12));
        }

        LinearLayout note = UiKit.card(ctx, Theme.WHITE);
        View icon = new android.widget.TextView(ctx);
        ((android.widget.TextView) icon).setText("🌱");
        ((android.widget.TextView) icon).setTextSize(24f);
        note.addView(icon);
        note.addView(UiKit.spacer(ctx, 8));
        note.addView(UiKit.body(ctx, "They can see what you choose to share. You choose what goes in your garden."));
        col.addView(note);
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.textLink(ctx, "⚙  Preview a different life stage", Theme.TEXT_MUTED, () ->
                host.push(new ModePickerScreen())));

        return col;
    }
}
