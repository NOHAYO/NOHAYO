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

/** Journal tab reused, with a different accent and framing, across life-stage skins. */
public class TabJournalScreen implements Screen {
    public interface EntryTap { void onTap(MainActivity host, JournalEntry e); }

    private final int tabIndex;
    private final String title;
    private final String subtitle;
    private final int accent;
    private final int tint;
    private final String composeHint;
    private final EntryTap onEntryTap; // nullable

    public TabJournalScreen(int tabIndex, String title, String subtitle, int accent, int tint, String composeHint, EntryTap onEntryTap) {
        this.tabIndex = tabIndex;
        this.title = title;
        this.subtitle = subtitle;
        this.accent = accent;
        this.tint = tint;
        this.composeHint = composeHint;
        this.onEntryTap = onEntryTap;
    }

    @Override
    public int tabIndex() { return tabIndex; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, title, 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, subtitle));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.filledButton(ctx, "+  Write an entry", accent, Theme.WHITE, () ->
                host.push(new TabJournalComposeScreen(accent, composeHint))));
        col.addView(UiKit.spacer(ctx, 20));

        List<JournalEntry> entries = host.repo().getJournalForChild(child.id);
        if (entries.isEmpty()) {
            LinearLayout empty = UiKit.cardOutlined(ctx);
            empty.addView(UiKit.body(ctx, "Nothing written yet."));
            col.addView(empty);
        } else {
            for (JournalEntry e : entries) {
                LinearLayout card = entryCard(ctx, e);
                if (onEntryTap != null) card.setOnClickListener(v -> onEntryTap.onTap(host, e));
                col.addView(card);
                col.addView(UiKit.spacer(ctx, 12));
            }
        }

        col.addView(UiKit.spacer(ctx, 12));
        col.addView(UiKit.textLink(ctx, "⚙  Preview a different life stage", Theme.TEXT_MUTED, () ->
                host.push(new ModePickerScreen())));

        return col;
    }

    private LinearLayout entryCard(Context ctx, JournalEntry e) {
        LinearLayout card = UiKit.cardOutlined(ctx);
        card.addView(UiKit.muted(ctx, Screens.fullDate(e.timestampMillis) + " · " + e.author));
        card.addView(UiKit.spacer(ctx, 8));
        card.addView(UiKit.body(ctx, e.text));
        if (e.privateEntry) {
            card.addView(UiKit.spacer(ctx, 10));
            card.addView(UiKit.badge(ctx, "🔒 Private", Theme.BG_CREAM_DEEP, Theme.TEXT_MUTED));
        }
        return card;
    }
}
