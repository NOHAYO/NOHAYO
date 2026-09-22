package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.UiKit;

public class NewGoalScreen implements Screen {
    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBarClose(ctx, "New goal", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "A small goal for " + child.name, 23f));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "What", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        EditText whatField = UiKit.editText(ctx, "e.g. Try tying shoelaces without help", false);
        col.addView(whatField);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.bold(ctx, "Why", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        EditText whyField = UiKit.editText(ctx, "e.g. She's been asking to do it herself", true);
        col.addView(whyField);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.bold(ctx, "By when", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        EditText byWhenField = UiKit.editText(ctx, "e.g. This month", false);
        col.addView(byWhenField);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.bold(ctx, "How it'll be noticed", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        EditText noticedField = UiKit.editText(ctx, "e.g. She does it on her own one morning", true);
        col.addView(noticedField);
        col.addView(UiKit.spacer(ctx, 24));

        col.addView(UiKit.primaryButton(ctx, "Save goal", () -> {
            String what = whatField.getText().toString().trim();
            if (what.isEmpty()) {
                Toast.makeText(ctx, "Add what the goal is first.", Toast.LENGTH_SHORT).show();
                return;
            }
            Goal g = new Goal();
            g.childId = child.id;
            g.what = what;
            g.why = whyField.getText().toString().trim();
            g.byWhen = byWhenField.getText().toString().trim();
            g.howNoticed = noticedField.getText().toString().trim();
            g.createdAtMillis = System.currentTimeMillis();
            g.status = Goal.STATUS_ACTIVE;
            host.repo().insertGoal(g);
            host.pop();
        }));

        return col;
    }
}
