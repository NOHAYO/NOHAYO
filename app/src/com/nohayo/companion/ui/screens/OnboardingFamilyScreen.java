package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Mode;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

public class OnboardingFamilyScreen implements Screen {
    private final Child draft;

    public OnboardingFamilyScreen(Child draft) {
        this.draft = draft;
    }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 32));

        col.addView(Screens.topBar(ctx, "Set up", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.label(ctx, "Step 3 of 3 · Family", Theme.TERRACOTTA));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.headline(ctx, draft.name + "'s family", 26f));
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout memberCard = UiKit.cardOutlined(ctx);
        LinearLayout memberRow = UiKit.row(ctx);
        memberRow.setGravity(Gravity.CENTER_VERTICAL);
        memberRow.addView(UiKit.avatarCircle(ctx, "Y", Theme.TERRACOTTA, 42));
        LinearLayout text = UiKit.column(ctx);
        LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, LinearLayout.LayoutParams.WRAP_CONTENT);
        tp.weight = 1f;
        tp.leftMargin = Dp.of(ctx, 12);
        text.setLayoutParams(tp);
        text.addView(UiKit.bold(ctx, "You", 15.5f));
        text.addView(UiKit.muted(ctx, "Primary parent"));
        memberRow.addView(text);
        memberRow.addView(UiKit.badge(ctx, "Full access", Theme.PEACH, Theme.TERRACOTTA_DARK));
        memberCard.addView(memberRow);
        col.addView(memberCard);
        col.addView(UiKit.spacer(ctx, 12));

        TextView note = UiKit.muted(ctx, "You can invite a co-parent, guardian, or viewer-only relative from the Family tab any time. Access always follows the role you choose.");
        col.addView(note);
        col.addView(UiKit.spacer(ctx, 28));

        col.addView(UiKit.primaryButton(ctx, "Finish setup", () -> {
            long childId = host.repo().insertChild(draft);
            draft.id = childId;

            FamilyMember you = new FamilyMember();
            you.childId = childId;
            you.name = "You";
            you.role = "Primary parent";
            you.status = "Active";
            host.repo().insertFamilyMember(you);

            host.setChild(draft);
            host.switchMode(Mode.PARENT);
        }));

        return col;
    }
}
