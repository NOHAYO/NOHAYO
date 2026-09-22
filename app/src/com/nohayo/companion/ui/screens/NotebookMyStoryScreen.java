package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NotebookMyStoryScreen implements Screen {
    @Override
    public int tabIndex() { return 3; }

    private static class Entry {
        long ts; boolean isInsight; Moment m; Insight i;
    }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "My Story", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Everything you've shared, in one place."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Entry> entries = new ArrayList<>();
        for (Moment m : host.repo().getMomentsForChild(child.id)) {
            Entry e = new Entry(); e.ts = m.timestampMillis; e.m = m; entries.add(e);
        }
        for (Insight i : host.repo().getInsightsForChild(child.id)) {
            Entry e = new Entry(); e.ts = i.createdAtMillis; e.isInsight = true; e.i = i; entries.add(e);
        }
        Collections.sort(entries, (a, b) -> Long.compare(b.ts, a.ts));

        if (entries.isEmpty()) {
            col.addView(UiKit.muted(ctx, "Nothing here yet. Answer today's question to get started!"));
            col.addView(UiKit.spacer(ctx, 16));
            col.addView(UiKit.textLink(ctx, "⚙  Preview a different life stage", Theme.TEXT_MUTED, () ->
                    host.push(new ModePickerScreen())));
            return col;
        }

        for (Entry e : entries) {
            if (e.isInsight) {
                LinearLayout card = UiKit.card(ctx, Theme.GREEN_TINT);
                LinearLayout row = UiKit.row(ctx);
                TextView star = new TextView(ctx); star.setText("⭐  "); row.addView(star);
                row.addView(UiKit.bold(ctx, "You've been getting into " + Domains.label(e.i.domain).toLowerCase() + "!", 15f));
                card.addView(row);
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                lp.bottomMargin = Dp.of(ctx, 10);
                card.setLayoutParams(lp);
                col.addView(card);
            } else {
                LinearLayout row = UiKit.row(ctx);
                row.setGravity(Gravity.TOP);
                LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                rlp.bottomMargin = Dp.of(ctx, 12);
                row.setLayoutParams(rlp);
                TextView dot = new TextView(ctx);
                dot.setText("●");
                dot.setTextColor(Domains.color(e.m.domain));
                dot.setPadding(0, Dp.of(ctx, 4), Dp.of(ctx, 10), 0);
                row.addView(dot);
                LinearLayout text = UiKit.column(ctx);
                LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
                text.setLayoutParams(tp);
                text.addView(UiKit.body(ctx, e.m.text));
                text.addView(UiKit.muted(ctx, Screens.relativeDay(e.m.timestampMillis)));
                row.addView(text);
                col.addView(row);
            }
        }

        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.textLink(ctx, "⚙  Preview a different life stage", Theme.TEXT_MUTED, () ->
                host.push(new ModePickerScreen())));

        return col;
    }
}
