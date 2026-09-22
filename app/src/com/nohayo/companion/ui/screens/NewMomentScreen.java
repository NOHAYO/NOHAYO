package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.text.format.DateFormat;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class NewMomentScreen implements Screen {

    private static final String DECIDE = "__decide__";
    private String selected = DECIDE;
    private final Map<String, TextView> chipViews = new LinkedHashMap<>();

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBarClose(ctx, "New moment", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "What did you notice?", 25f));
        col.addView(UiKit.spacer(ctx, 14));

        EditText textField = UiKit.editText(ctx, "She turned her head toward the sound of the door and smiled.", true);
        col.addView(textField);
        col.addView(UiKit.spacer(ctx, 8));
        col.addView(UiKit.muted(ctx, "Try: “Reached for the rattle.” “Laughed at the dog.”"));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "Where does it fit?", 14.5f));
        col.addView(UiKit.spacer(ctx, 10));

        List<String[]> rows = new ArrayList<>();
        rows.add(new String[]{DECIDE, Domains.PERSONAL_DEVELOPMENT});
        rows.add(new String[]{Domains.EMOTIONAL, Domains.SOCIAL, Domains.COMMUNICATION});
        rows.add(new String[]{Domains.CREATIVITY, Domains.INDEPENDENCE, Domains.LEARNING});

        for (String[] rowKeys : rows) {
            LinearLayout row = UiKit.row(ctx);
            for (int i = 0; i < rowKeys.length; i++) {
                String key = rowKeys[i];
                String label = key.equals(DECIDE) ? "Let it decide" : Domains.label(key);
                TextView chip = UiKit.chip(ctx, label, key.equals(selected), () -> select(host, key));
                LinearLayout.LayoutParams lp = UiKit.lp(ctx, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                if (i > 0) lp.leftMargin = Dp.of(ctx, 8);
                chip.setLayoutParams(lp);
                chipViews.put(key, chip);
                row.addView(chip);
            }
            col.addView(row);
            col.addView(UiKit.spacer(ctx, 8));
        }

        col.addView(UiKit.muted(ctx, "We suggest a place. You can always change it."));
        col.addView(UiKit.spacer(ctx, 18));

        LinearLayout metaCard = UiKit.cardOutlined(ctx);
        metaCard.addView(metaRow(ctx, "When", "Today, " + DateFormat.format("h:mm a", System.currentTimeMillis())));
        metaCard.addView(UiKit.divider(ctx));
        metaCard.addView(metaRow(ctx, "Written by", "You"));
        col.addView(metaCard);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.outlineButton(ctx, "🖼  Add a photo (optional)", () ->
                Toast.makeText(ctx, "Photos aren't included in this preview build.", Toast.LENGTH_SHORT).show()));
        col.addView(UiKit.spacer(ctx, 22));

        col.addView(UiKit.primaryButton(ctx, "Save to " + child.name + "'s timeline", () -> {
            String text = textField.getText().toString().trim();
            if (text.isEmpty()) {
                Toast.makeText(ctx, "Write what you noticed first.", Toast.LENGTH_SHORT).show();
                return;
            }
            String domain = selected.equals(DECIDE) ? Domains.guessFromText(text) : selected;
            Moment m = new Moment();
            m.childId = child.id;
            m.text = text;
            m.domain = domain;
            m.timestampMillis = System.currentTimeMillis();
            m.author = "You";
            host.repo().insertMoment(m);
            Toast.makeText(ctx, "Saved to " + child.name + "'s timeline.", Toast.LENGTH_SHORT).show();
            host.pop();
        }));

        return col;
    }

    private void select(MainActivity host, String key) {
        selected = key;
        for (Map.Entry<String, TextView> e : chipViews.entrySet()) {
            boolean sel = e.getKey().equals(key);
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

    private LinearLayout metaRow(Context ctx, String label, String value) {
        LinearLayout row = UiKit.row(ctx);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView l = UiKit.muted(ctx, label);
        LinearLayout.LayoutParams lp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.weight = 1f;
        l.setLayoutParams(lp);
        row.addView(l);
        row.addView(UiKit.bold(ctx, value, 14.5f));
        return row;
    }
}
