package com.nohayo.companion.ui.screens;

import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.engine.Domains;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.Goal;
import com.nohayo.companion.model.Insight;
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

/** Ages 7-12 child self-view ("Notebook" skin): rounded, friendly, honest about who can read what. */
public class NotebookTodayScreen implements Screen {
    private static final String[] PROMPTS = {
            "What is something you would like to learn to do?",
            "What made you laugh today?",
            "What's something you're proud of this week?",
            "If you could learn anything, what would it be?"
    };

    @Override
    public int tabIndex() { return 0; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 24));

        LinearLayout header = UiKit.row(ctx);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(UiKit.avatarCircle(ctx, child.name.substring(0, 1).toUpperCase(), Theme.GREEN, 44));
        LinearLayout headText = UiKit.column(ctx);
        LinearLayout.LayoutParams htp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        htp.leftMargin = Dp.of(ctx, 12);
        headText.setLayoutParams(htp);
        headText.addView(UiKit.bold(ctx, "Hi " + child.name, 18f));
        headText.addView(UiKit.muted(ctx, "Age " + (int) Stages.ageInYears(child.birthDateMillis) + " · this is your space"));
        header.addView(headText);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 18));

        String prompt = PROMPTS[(int) (child.id + System.currentTimeMillis() / 86400000L) % PROMPTS.length];
        LinearLayout qCard = UiKit.card(ctx, Theme.GREEN_TINT);
        qCard.addView(UiKit.label(ctx, "Today's question", Theme.GREEN_DARK));
        qCard.addView(UiKit.spacer(ctx, 8));
        qCard.addView(UiKit.headline(ctx, prompt, 19f));
        qCard.addView(UiKit.spacer(ctx, 12));
        EditText answer = UiKit.editText(ctx, "Type your answer…", false);
        qCard.addView(answer);
        col.addView(qCard);
        col.addView(UiKit.spacer(ctx, 14));
        col.addView(UiKit.greenButton(ctx, "Save my answer", () -> {
            String text = answer.getText().toString().trim();
            if (text.isEmpty()) return;
            Moment m = new Moment();
            m.childId = child.id;
            m.text = prompt + " — " + text;
            m.domain = Domains.guessFromText(text);
            m.timestampMillis = System.currentTimeMillis();
            m.author = child.name;
            host.repo().insertMoment(m);
            Toast.makeText(ctx, "Saved to your notebook!", Toast.LENGTH_SHORT).show();
            host.replace(new NotebookTodayScreen());
        }));
        col.addView(UiKit.spacer(ctx, 18));

        Insight featured = null;
        for (Insight i : host.repo().getInsightsForChild(child.id)) {
            if (Insight.STATUS_ACTIVE.equals(i.status)) { featured = i; break; }
        }
        if (featured != null) {
            final Insight fi = featured;
            LinearLayout newCard = UiKit.cardOutlined(ctx);
            LinearLayout titleRow = UiKit.row(ctx);
            TextView bulb = new TextView(ctx);
            bulb.setText("💡  ");
            titleRow.addView(bulb);
            titleRow.addView(UiKit.bold(ctx, "New for you", 15f));
            newCard.addView(titleRow);
            newCard.addView(UiKit.spacer(ctx, 8));
            newCard.addView(UiKit.body(ctx, kidCopy(fi)));
            newCard.addView(UiKit.spacer(ctx, 12));
            LinearLayout btnRow = UiKit.row(ctx);
            btnRow.setGravity(Gravity.CENTER_VERTICAL);
            android.widget.Button show = UiKit.greenButton(ctx, "Show me ideas", () -> host.push(new InsightDetailScreen(fi.id)));
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            show.setLayoutParams(blp);
            btnRow.addView(show);
            newCard.addView(btnRow);
            col.addView(newCard);
            col.addView(UiKit.spacer(ctx, 14));
        }

        List<Goal> goals = host.repo().getGoalsForChild(child.id);
        LinearLayout goalCard = UiKit.cardOutlined(ctx);
        LinearLayout goalRow = UiKit.row(ctx);
        goalRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout goalText = UiKit.column(ctx);
        LinearLayout.LayoutParams gtp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        goalText.setLayoutParams(gtp);
        goalText.addView(UiKit.muted(ctx, "My goal"));
        goalText.addView(UiKit.bold(ctx, goals.isEmpty() ? "Set your first goal" : goals.get(0).what, 16f));
        goalRow.addView(goalText);
        TextView chevron = new TextView(ctx);
        chevron.setText("›");
        chevron.setTextSize(22f);
        goalRow.addView(chevron);
        goalCard.addView(goalRow);
        goalCard.setOnClickListener(v -> host.push(new TabGoalsScreen(1, "My goals", Theme.GREEN, Theme.GREEN_TINT)));
        col.addView(goalCard);
        col.addView(UiKit.spacer(ctx, 12));

        LinearLayout journalCard = UiKit.cardOutlined(ctx);
        LinearLayout jRow = UiKit.row(ctx);
        jRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView pencil = new TextView(ctx);
        pencil.setText("✎  ");
        jRow.addView(pencil);
        jRow.addView(UiKit.bold(ctx, "Write in my journal", 15.5f));
        journalCard.addView(jRow);
        journalCard.addView(UiKit.spacer(ctx, 6));
        journalCard.addView(UiKit.muted(ctx, "Right now, grown-ups can read your journal. Around age 12 you get a private space."));
        journalCard.setOnClickListener(v -> host.push(notebookJournal()));
        col.addView(journalCard);

        return col;
    }

    public static TabJournalScreen notebookJournal() {
        return new TabJournalScreen(2, "My journal",
                "Right now, grown-ups can read your journal. Around age 12 you get a private space.",
                Theme.GREEN, Theme.GREEN_TINT, "Today I…", null);
    }

    private String kidCopy(Insight ins) {
        return "You've written about " + Domains.label(ins.domain).toLowerCase() + " a few times lately. Want a few ideas to try?";
    }
}
