package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class FamilyScreen implements Screen {
    @Override
    public int tabIndex() { return 4; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, child.name + "'s family", 26f));
        col.addView(UiKit.spacer(ctx, 18));

        LinearLayout memberList = UiKit.cardOutlined(ctx);
        List<FamilyMember> members = host.repo().getFamilyForChild(child.id);
        for (int i = 0; i < members.size(); i++) {
            if (i > 0) memberList.addView(UiKit.divider(ctx));
            memberList.addView(memberRow(ctx, members.get(i)));
        }
        col.addView(memberList);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.outlineButton(ctx, "+  Invite someone", () -> host.push(new NewFamilyMemberScreen())));
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout accessCard = UiKit.cardOutlined(ctx);
        accessCard.addView(UiKit.bold(ctx, "Access follows the role", 15.5f));
        accessCard.addView(UiKit.spacer(ctx, 12));
        LinearLayout row1 = UiKit.row(ctx);
        row1.addView(UiKit.badge(ctx, "Primary parent", Theme.TERRACOTTA, Theme.WHITE));
        View g1 = new View(ctx); g1.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); row1.addView(g1);
        row1.addView(UiKit.badge(ctx, "Co-parent", Theme.BG_CREAM_DEEP, Theme.TEXT_INK));
        accessCard.addView(row1);
        accessCard.addView(UiKit.spacer(ctx, 8));
        LinearLayout row2 = UiKit.row(ctx);
        row2.addView(UiKit.badge(ctx, "Guardian", Theme.BG_CREAM_DEEP, Theme.TEXT_INK));
        View g2 = new View(ctx); g2.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); row2.addView(g2);
        row2.addView(UiKit.badge(ctx, "Viewer only", Theme.BG_CREAM_DEEP, Theme.TEXT_INK));
        accessCard.addView(row2);
        accessCard.addView(UiKit.spacer(ctx, 12));
        accessCard.addView(UiKit.muted(ctx, "Viewers never see journals or sensitive topics. You choose what each person sees."));
        col.addView(accessCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout householdsCard = UiKit.card(ctx, Theme.PEACH);
        LinearLayout hTitle = UiKit.row(ctx);
        TextView icon = new TextView(ctx);
        icon.setText("👪  ");
        hTitle.addView(icon);
        hTitle.addView(UiKit.bold(ctx, "Two households?", 15f));
        householdsCard.addView(hTitle);
        householdsCard.addView(UiKit.spacer(ctx, 8));
        householdsCard.addView(UiKit.body(ctx, "Each parent can have their own account linked to " + child.name + ", with visibility set separately, as any guardianship arrangement requires."));
        col.addView(householdsCard);
        col.addView(UiKit.spacer(ctx, 16));

        TextView footer = UiKit.muted(ctx, "Each child has one profile. Siblings are never compared anywhere in the app.");
        footer.setGravity(Gravity.CENTER);
        col.addView(footer);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.textLink(ctx, "⚙  Settings & privacy", Theme.TEXT_MUTED, () -> host.push(new SettingsScreen())));

        return col;
    }

    private LinearLayout memberRow(Context ctx, FamilyMember m) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(UiKit.avatarCircle(ctx, m.name.substring(0, 1).toUpperCase(), Theme.TERRACOTTA, 40));
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.weight = 1f;
        tp.leftMargin = Dp.of(ctx, 12);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, m.name, 15.5f));
        text.addView(UiKit.muted(ctx, m.role));
        row.addView(text);
        boolean pending = "Pending".equals(m.status);
        row.addView(UiKit.badge(ctx, pending ? "Pending" : accessLabel(m.role), pending ? Theme.BG_CREAM_DEEP : Theme.PEACH, pending ? Theme.TEXT_MUTED : Theme.TERRACOTTA_DARK));
        return row;
    }

    private String accessLabel(String role) {
        if ("Primary parent".equals(role) || "Co-parent".equals(role)) return "Full access";
        if ("Guardian".equals(role)) return "Full access";
        return "Summaries you pick";
    }
}
