package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class JournalScreen implements Screen {
    @Override
    public int tabIndex() { return 3; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "Journal", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Private to you. Only you can read what you write here."));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.primaryButton(ctx, "+  Write an entry", () -> host.push(new NewJournalEntryScreen())));
        col.addView(UiKit.spacer(ctx, 20));

        List<JournalEntry> entries = host.repo().getJournalForChild(child.id);
        if (entries.isEmpty()) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.body(ctx, "Nothing written yet. This space is just for you to reflect, no prompts required."));
            col.addView(empty);
        } else {
            for (JournalEntry e : entries) {
                col.addView(entryCard(ctx, e));
                col.addView(UiKit.spacer(ctx, 12));
            }
        }

        return col;
    }

    private LinearLayout entryCard(Context ctx, JournalEntry e) {
        LinearLayout card = UiKit.cardOutlined(ctx);
        LinearLayout top = UiKit.row(ctx);
        top.addView(UiKit.muted(ctx, Screens.fullDate(e.timestampMillis) + " · " + e.author));
        card.addView(top);
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.body(ctx, e.text));
        if (e.privateEntry) {
            card.addView(UiKit.spacer(ctx, 10));
            card.addView(UiKit.badge(ctx, "🔒 Private", Theme.BG_CREAM_DEEP, Theme.TEXT_MUTED));
        }
        return card;
    }
}
