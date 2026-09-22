package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.JournalEntry;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

public class TabJournalComposeScreen implements Screen {
    private final int accent;
    private final String hint;

    public TabJournalComposeScreen(int accent, String hint) {
        this.accent = accent;
        this.hint = hint;
    }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBarClose(ctx, "New entry", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "What's on your mind?", 23f));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.muted(ctx, "This stays private to you."));
        col.addView(UiKit.spacer(ctx, 16));

        EditText field = UiKit.editText(ctx, hint, true);
        field.setMinLines(8);
        col.addView(field);
        col.addView(UiKit.spacer(ctx, 22));

        col.addView(UiKit.filledButton(ctx, "Save entry", accent, Theme.WHITE, () -> {
            String text = field.getText().toString().trim();
            if (text.isEmpty()) {
                Toast.makeText(ctx, "Write something first.", Toast.LENGTH_SHORT).show();
                return;
            }
            JournalEntry e = new JournalEntry();
            e.childId = child.id;
            e.author = "You";
            e.text = text;
            e.timestampMillis = System.currentTimeMillis();
            e.privateEntry = true;
            host.repo().insertJournalEntry(e);
            host.pop();
        }));

        return col;
    }
}
