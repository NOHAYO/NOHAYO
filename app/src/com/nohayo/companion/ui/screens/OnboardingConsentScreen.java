package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

public class OnboardingConsentScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 32));

        col.addView(Screens.topBar(ctx, "Set up", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.label(ctx, "Step 1 of 3 · Consent", Theme.TERRACOTTA));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.headline(ctx, "Before we keep anything about your child", 25f));
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout regionCard = UiKit.cardOutlined(ctx);
        regionCard.addView(UiKit.muted(ctx, "Where you live"));
        regionCard.addView(UiKit.bold(ctx, "United States", 16f));
        TextView regionDesc = UiKit.muted(ctx, "We apply the strictest child-data rules that fit your region, such as COPPA in the US and GDPR-K in the EU and UK.");
        LinearLayout.LayoutParams rp = UiKit.lp(ctx, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rp.topMargin = Dp.of(ctx, 6);
        regionDesc.setLayoutParams(rp);
        regionCard.addView(regionDesc);
        col.addView(regionCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout stepsCard = UiKit.card(ctx, Theme.BG_CREAM_DEEP);
        stepsCard.addView(stepRow(ctx, "1", "Confirm you are this child's parent or legal guardian"));
        stepsCard.addView(UiKit.spacer(ctx, 12));
        stepsCard.addView(stepRow(ctx, "2", "Verify with the method your legal counsel sets for your region"));
        stepsCard.addView(UiKit.spacer(ctx, 12));
        stepsCard.addView(stepRow(ctx, "3", "Review what we keep, then agree"));
        col.addView(stepsCard);
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout weCard = UiKit.card(ctx, Theme.PEACH);
        LinearLayout weRow = UiKit.row(ctx);
        LinearLayout weKeep = UiKit.column(ctx);
        LinearLayout.LayoutParams wk = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        wk.weight = 1f;
        weKeep.setLayoutParams(wk);
        weKeep.addView(UiKit.bold(ctx, "We keep", 14f));
        weKeep.addView(UiKit.muted(ctx, "Your child's name and birth date, and only what you choose to write."));
        weRow.addView(weKeep);
        LinearLayout weNever = UiKit.column(ctx);
        LinearLayout.LayoutParams wn = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        wn.weight = 1f;
        wn.leftMargin = Dp.of(ctx, 12);
        weNever.setLayoutParams(wn);
        weNever.addView(UiKit.bold(ctx, "We never", 14f));
        weNever.addView(UiKit.muted(ctx, "Sell or share it, show ads, diagnose, or compare your child."));
        weRow.addView(weNever);
        weCard.addView(weRow);
        col.addView(weCard);
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout consentRow = UiKit.row(ctx);
        consentRow.setGravity(Gravity.CENTER_VERTICAL);
        CheckBox checkBox = new CheckBox(ctx);
        consentRow.addView(checkBox);
        TextView consentText = UiKit.body(ctx, "I am this child's parent or legal guardian, and I consent to this.");
        LinearLayout.LayoutParams ctp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        ctp.weight = 1f;
        consentText.setLayoutParams(ctp);
        consentRow.addView(consentText);
        col.addView(consentRow);
        col.addView(UiKit.spacer(ctx, 20));

        col.addView(UiKit.primaryButton(ctx, "Continue", () -> {
            if (!checkBox.isChecked()) {
                Toast.makeText(ctx, "Please confirm consent to continue.", Toast.LENGTH_SHORT).show();
                return;
            }
            host.push(new OnboardingChildScreen());
        }));

        return col;
    }

    private LinearLayout stepRow(Context ctx, String number, String text) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = UiKit.avatarCircle(ctx, number, Theme.TERRACOTTA, 26);
        badge.setTextSize(13f);
        row.addView(badge);
        TextView t = UiKit.body(ctx, text);
        LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.weight = 1f;
        tp.leftMargin = Dp.of(ctx, 12);
        t.setLayoutParams(tp);
        row.addView(t);
        return row;
    }
}
