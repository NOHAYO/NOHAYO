package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.LinkedHashMap;
import java.util.Map;

public class NewFamilyMemberScreen implements Screen {
    private String role = "Co-parent";
    private final Map<String, TextView> chips = new LinkedHashMap<>();

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBarClose(ctx, "Invite someone", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "Invite someone to " + child.name + "'s family", 22f));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "Name", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        EditText nameField = UiKit.editText(ctx, "e.g. Grandma", false);
        col.addView(nameField);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.bold(ctx, "Role", 13.5f));
        col.addView(UiKit.spacer(ctx, 8));
        LinearLayout row1 = UiKit.row(ctx);
        row1.addView(roleChip(host, "Co-parent"));
        View g1 = new View(ctx); g1.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); row1.addView(g1);
        row1.addView(roleChip(host, "Guardian"));
        col.addView(row1);
        col.addView(UiKit.spacer(ctx, 8));
        col.addView(roleChip(host, "Viewer-only"));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.muted(ctx, "Viewers never see journals or sensitive topics, only the summaries you choose to share."));
        col.addView(UiKit.spacer(ctx, 24));

        col.addView(UiKit.primaryButton(ctx, "Send invite", () -> {
            String name = nameField.getText().toString().trim();
            if (name.isEmpty()) {
                Toast.makeText(ctx, "Add a name first.", Toast.LENGTH_SHORT).show();
                return;
            }
            FamilyMember m = new FamilyMember();
            m.childId = child.id;
            m.name = name;
            m.role = role;
            m.status = "Pending";
            host.repo().insertFamilyMember(m);
            Toast.makeText(ctx, "Invitation sent to " + name + ".", Toast.LENGTH_SHORT).show();
            host.pop();
        }));

        return col;
    }

    private TextView roleChip(MainActivity host, String value) {
        TextView chip = UiKit.chip(host, value, value.equals(role), () -> selectRole(host, value));
        chips.put(value, chip);
        return chip;
    }

    private void selectRole(MainActivity host, String value) {
        role = value;
        for (Map.Entry<String, TextView> e : chips.entrySet()) {
            boolean sel = e.getKey().equals(value);
            TextView chip = e.getValue();
            if (sel) {
                chip.setBackground(UiKit.roundedBg(Theme.TERRACOTTA, Theme.RADIUS_CHIP, host));
                chip.setTextColor(Theme.WHITE);
            } else {
                chip.setBackground(UiKit.roundedStroke(host, Theme.BG_CREAM, Theme.LINE, 1.2f, Theme.RADIUS_CHIP));
                chip.setTextColor(Theme.TEXT_INK);
            }
        }
    }
}
