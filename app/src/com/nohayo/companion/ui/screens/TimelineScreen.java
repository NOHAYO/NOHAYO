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
import java.util.Comparator;
import java.util.List;

public class TimelineScreen implements Screen {

    private static final int FILTER_ALL = 0;
    private static final int FILTER_MOMENTS = 1;
    private static final int FILTER_INSIGHTS = 2;
    private int filter = FILTER_ALL;

    private LinearLayout listContainer;
    private MainActivity hostRef;

    @Override
    public int tabIndex() { return 1; }

    @Override
    public View build(MainActivity host) {
        this.hostRef = host;
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, child.name + "'s story so far", 25f));
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout chipRow = UiKit.row(ctx);
        chipRow.addView(filterChip(host, "All", FILTER_ALL));
        chipRow.addView(UiKit.spacer(ctx, 0));
        View g1 = new View(ctx); g1.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); chipRow.addView(g1);
        chipRow.addView(filterChip(host, "Moments", FILTER_MOMENTS));
        View g2 = new View(ctx); g2.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 8), 1)); chipRow.addView(g2);
        chipRow.addView(filterChip(host, "Insights", FILTER_INSIGHTS));
        col.addView(chipRow);
        col.addView(UiKit.spacer(ctx, 18));

        listContainer = UiKit.column(ctx);
        col.addView(listContainer);
        renderList(host);

        return col;
    }

    private TextView filterChip(MainActivity host, String label, int value) {
        return UiKit.chip(host, label, filter == value, () -> {
            filter = value;
            renderList(host);
        });
    }

    private static class Entry {
        long timestamp;
        boolean isInsight;
        Moment moment;
        Insight insight;
    }

    private void renderList(MainActivity host) {
        Context ctx = host;
        listContainer.removeAllViews();
        Child child = host.getChild();

        List<Entry> entries = new ArrayList<>();
        if (filter != FILTER_INSIGHTS) {
            for (Moment m : host.repo().getMomentsForChild(child.id)) {
                Entry e = new Entry();
                e.timestamp = m.timestampMillis;
                e.moment = m;
                entries.add(e);
            }
        }
        if (filter != FILTER_MOMENTS) {
            for (Insight ins : host.repo().getInsightsForChild(child.id)) {
                Entry e = new Entry();
                e.timestamp = ins.createdAtMillis;
                e.isInsight = true;
                e.insight = ins;
                entries.add(e);
            }
        }
        Collections.sort(entries, (a, b) -> Long.compare(b.timestamp, a.timestamp));

        if (entries.isEmpty()) {
            listContainer.addView(UiKit.muted(ctx, "Nothing here yet. Log a moment from Today to start the story."));
            return;
        }

        Integer lastAge = null;
        for (Entry e : entries) {
            int age = ageAt(child.birthDateMillis, e.timestamp);
            if (lastAge == null || age != lastAge) {
                TextView ageLabel = UiKit.label(ctx, "Age " + age, Theme.GREEN_DARK);
                LinearLayout.LayoutParams lp = UiKit.lp(ctx, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                lp.topMargin = Dp.of(ctx, 14);
                lp.bottomMargin = Dp.of(ctx, 8);
                ageLabel.setLayoutParams(lp);
                listContainer.addView(ageLabel);
                lastAge = age;
            }
            listContainer.addView(entryRow(host, e));
        }
    }

    private int ageAt(long birthMillis, long atMillis) {
        long diff = atMillis - birthMillis;
        if (diff < 0) diff = 0;
        return (int) (diff / (365.25 * 24 * 60 * 60 * 1000.0));
    }

    private View entryRow(MainActivity host, Entry e) {
        Context ctx = host;
        if (e.isInsight) {
            Insight ins = e.insight;
            LinearLayout card = UiKit.card(ctx, Theme.GREEN_TINT);
            LinearLayout titleRow = UiKit.row(ctx);
            TextView bulb = new TextView(ctx);
            bulb.setText("💡 ");
            titleRow.addView(bulb);
            titleRow.addView(UiKit.label(ctx, "Insight", Theme.GREEN_DARK));
            card.addView(titleRow);
            card.addView(UiKit.spacer(ctx, 6));
            card.addView(UiKit.bold(ctx, ins.title, 15.5f));
            card.addView(UiKit.spacer(ctx, 4));
            int count = ins.evidenceIds == null || ins.evidenceIds.isEmpty() ? 0 : ins.evidenceIds.split(",").length;
            card.addView(UiKit.muted(ctx, ins.confidenceTier + " · " + count + " moments"));
            LinearLayout.LayoutParams lp = UiKit.lp(ctx, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.bottomMargin = Dp.of(ctx, 10);
            card.setLayoutParams(lp);
            card.setOnClickListener(v -> host.push(new InsightDetailScreen(ins.id)));
            return card;
        } else {
            Moment m = e.moment;
            LinearLayout row = UiKit.row(ctx);
            row.setGravity(Gravity.TOP);
            LinearLayout.LayoutParams rlp = UiKit.lp(ctx, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            rlp.bottomMargin = Dp.of(ctx, 12);
            row.setLayoutParams(rlp);

            TextView dot = new TextView(ctx);
            dot.setText("■");
            dot.setTextColor(Domains.color(m.domain));
            dot.setTextSize(11f);
            dot.setPadding(0, Dp.of(ctx, 4), Dp.of(ctx, 10), 0);
            row.addView(dot);

            LinearLayout text = UiKit.column(ctx);
            LinearLayout.LayoutParams tp = UiKit.lp(ctx, 0, ViewGroup.LayoutParams.WRAP_CONTENT);
            tp.weight = 1f;
            text.setLayoutParams(tp);
            text.addView(UiKit.body(ctx, m.text));
            text.addView(UiKit.muted(ctx, Screens.relativeDay(m.timestampMillis) + " · " + m.author + " · " + Domains.label(m.domain)));
            row.addView(text);
            return row;
        }
    }
}
