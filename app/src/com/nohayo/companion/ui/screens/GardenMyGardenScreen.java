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
import com.nohayo.companion.model.Moment;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.List;

public class GardenMyGardenScreen implements Screen {
    private static final String[][] PLOTS = {
            {Domains.CREATIVITY, "🌻", "Drawing & making"},
            {Domains.SOCIAL, "🌼", "Playing with others"},
            {Domains.LEARNING, "🌷", "Stories & learning"},
            {Domains.INDEPENDENCE, "🌱", "Doing it myself"},
            {Domains.EMOTIONAL, "🌸", "Feelings"},
    };

    @Override
    public int tabIndex() { return 1; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();
        LinearLayout col = UiKit.column(ctx);
        col.setBackgroundColor(Theme.GARDEN_BG);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 24), pad, Dp.of(ctx, 24));

        col.addView(UiKit.headline(ctx, "My Garden", 26f));
        col.addView(UiKit.spacer(ctx, 4));
        col.addView(UiKit.muted(ctx, "Every flower is something you've enjoyed."));
        col.addView(UiKit.spacer(ctx, 18));

        List<Moment> moments = host.repo().getMomentsForChild(child.id);

        LinearLayout grid = UiKit.column(ctx);
        for (int i = 0; i < PLOTS.length; i += 2) {
            LinearLayout row = UiKit.row(ctx);
            row.addView(plot(ctx, PLOTS[i], moments));
            if (i + 1 < PLOTS.length) {
                View g = new View(ctx); g.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 12), 1)); row.addView(g);
                row.addView(plot(ctx, PLOTS[i + 1], moments));
            } else {
                View filler = new View(ctx);
                filler.setLayoutParams(new LinearLayout.LayoutParams(0, 0, 1f));
                row.addView(filler);
            }
            col.addView(row);
            col.addView(UiKit.spacer(ctx, 12));
        }

        return col;
    }

    private LinearLayout plot(Context ctx, String[] plot, List<Moment> moments) {
        String domain = plot[0], emoji = plot[1], label = plot[2];
        int count = 0;
        for (Moment m : moments) if (domain.equals(m.domain)) count++;

        LinearLayout card = UiKit.column(ctx);
        card.setGravity(Gravity.CENTER);
        card.setBackground(UiKit.roundedBg(count > 0 ? Theme.GREEN_TINT : Theme.WHITE, 20, ctx));
        card.setPadding(0, Dp.of(ctx, 18), 0, Dp.of(ctx, 14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        card.setLayoutParams(lp);

        TextView icon = new TextView(ctx);
        icon.setText(count > 0 ? emoji : "🌱");
        icon.setTextSize(count >= 3 ? 34f : 26f);
        icon.setGravity(Gravity.CENTER);
        card.addView(icon);

        TextView text = UiKit.bold(ctx, label, 13f);
        text.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tlp.topMargin = Dp.of(ctx, 8);
        text.setLayoutParams(tlp);
        card.addView(text);

        TextView status = UiKit.muted(ctx, count == 0 ? "Not planted yet" : count == 1 ? "Just sprouted" : count < 3 ? "Growing" : "Blooming");
        status.setGravity(Gravity.CENTER);
        card.addView(status);

        return card;
    }
}
