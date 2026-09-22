package com.nohayo.companion.ui.screens;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.FrameLayout;
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

/** Ages 4-7 child self-view ("Garden" skin): pictures and voice first, no reading needed. */
public class GardenTodayScreen implements Screen {
    @Override
    public int tabIndex() { return 0; }

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        col.setBackgroundColor(Theme.GARDEN_BG);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 24));

        LinearLayout header = UiKit.row(ctx);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(UiKit.avatarCircle(ctx, initials(child.name), Theme.GREEN, 48));
        TextView hi = UiKit.headline(ctx, "  Hi " + child.name + "!", 26f);
        header.addView(hi);
        col.addView(header);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(skyHill(ctx));
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.headline(ctx, "What did you like today?", 21f));
        col.addView(UiKit.spacer(ctx, 14));

        LinearLayout row = UiKit.row(ctx);
        row.addView(bigButton(host, "🎨", "Drawing", Color("#F7C9C9"), Domains.CREATIVITY));
        row.addView(UiKit.spacer(ctx, 0));
        View g1 = new View(ctx); g1.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); row.addView(g1);
        row.addView(bigButton(host, "🌍", "Playing", Color("#F6DFA6"), Domains.SOCIAL));
        View g2 = new View(ctx); g2.setLayoutParams(UiKit.lp(ctx, Dp.of(ctx, 10), 1)); row.addView(g2);
        row.addView(bigButton(host, "📖", "Stories", Color("#B9DDF3"), Domains.LEARNING));
        col.addView(row);
        col.addView(UiKit.spacer(ctx, 20));

        LinearLayout micWrap = UiKit.column(ctx);
        micWrap.setGravity(Gravity.CENTER);
        TextView mic = new TextView(ctx);
        mic.setText("🎤  Say it out loud");
        mic.setTextSize(17f);
        mic.setTypeface(android.graphics.Typeface.SANS_SERIF, android.graphics.Typeface.BOLD);
        mic.setTextColor(Theme.WHITE);
        mic.setGravity(Gravity.CENTER);
        mic.setBackground(UiKit.roundedBg(Theme.GREEN, 30, ctx));
        mic.setPadding(Dp.of(ctx, 24), Dp.of(ctx, 16), Dp.of(ctx, 24), Dp.of(ctx, 16));
        mic.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        mic.setOnClickListener(v -> sayItOutLoud(host));
        micWrap.addView(mic);
        col.addView(micWrap);

        return col;
    }

    private void sayItOutLoud(MainActivity host) {
        Context ctx = host;
        EditText input = UiKit.editText(ctx, "Tell us what happened today...", true);
        new AlertDialog.Builder(ctx)
                .setTitle("Say it out loud")
                .setMessage("(This preview build types instead of listening.)")
                .setView(input)
                .setPositiveButton("Save", (d, w) -> {
                    String text = input.getText().toString().trim();
                    if (text.isEmpty()) return;
                    Moment m = new Moment();
                    m.childId = host.getChild().id;
                    m.text = text;
                    m.domain = Domains.guessFromText(text);
                    m.timestampMillis = System.currentTimeMillis();
                    m.author = host.getChild().name;
                    host.repo().insertMoment(m);
                    Toast.makeText(ctx, "Saved to your garden! 🌱", Toast.LENGTH_SHORT).show();
                    host.replace(new GardenTodayScreen());
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private LinearLayout bigButton(MainActivity host, String emoji, String label, int bg, String domain) {
        Context ctx = host;
        LinearLayout btn = UiKit.column(ctx);
        btn.setGravity(Gravity.CENTER);
        btn.setBackground(UiKit.roundedBg(bg, 22, ctx));
        btn.setPadding(0, Dp.of(ctx, 18), 0, Dp.of(ctx, 14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        btn.setLayoutParams(lp);
        TextView icon = new TextView(ctx);
        icon.setText(emoji);
        icon.setTextSize(30f);
        icon.setGravity(Gravity.CENTER);
        btn.addView(icon);
        TextView text = new TextView(ctx);
        text.setText(label);
        text.setTextSize(14f);
        text.setTypeface(android.graphics.Typeface.SANS_SERIF, android.graphics.Typeface.BOLD);
        text.setTextColor(Theme.TEXT_INK);
        text.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tlp.topMargin = Dp.of(ctx, 6);
        text.setLayoutParams(tlp);
        btn.addView(text);
        btn.setOnClickListener(v -> {
            Moment m = new Moment();
            m.childId = host.getChild().id;
            m.text = "Chose " + label.toLowerCase() + " today";
            m.domain = domain;
            m.timestampMillis = System.currentTimeMillis();
            m.author = host.getChild().name;
            host.repo().insertMoment(m);
            Toast.makeText(ctx, "Nice! Added to your garden.", Toast.LENGTH_SHORT).show();
        });
        return btn;
    }

    private FrameLayout skyHill(Context ctx) {
        FrameLayout scene = new FrameLayout(ctx);
        scene.setBackground(UiKit.roundedBg(Theme.GARDEN_SKY, 22, ctx));
        scene.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Dp.of(ctx, 130)));
        scene.setClipToOutline(false);

        View sun = new View(ctx);
        GradientDrawable sunD = new GradientDrawable();
        sunD.setShape(GradientDrawable.OVAL);
        sunD.setColor(Color("#F6C453"));
        sun.setBackground(sunD);
        FrameLayout.LayoutParams sunLp = new FrameLayout.LayoutParams(Dp.of(ctx, 36), Dp.of(ctx, 36));
        sunLp.gravity = Gravity.TOP | Gravity.END;
        sunLp.topMargin = Dp.of(ctx, 14);
        sunLp.rightMargin = Dp.of(ctx, 16);
        scene.addView(sun, sunLp);

        View hill = new View(ctx);
        GradientDrawable hillD = new GradientDrawable();
        hillD.setColor(Theme.GARDEN_HILL);
        hillD.setCornerRadii(new float[]{200, 200, 200, 200, 0, 0, 0, 0});
        hill.setBackground(hillD);
        FrameLayout.LayoutParams hillLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Dp.of(ctx, 70));
        hillLp.gravity = Gravity.BOTTOM;
        hillLp.leftMargin = Dp.of(ctx, -30);
        hillLp.rightMargin = Dp.of(ctx, -30);
        scene.addView(hill, hillLp);

        LinearLayout flowers = UiKit.row(ctx);
        flowers.setGravity(Gravity.BOTTOM);
        String[] petals = {"🌷", "🌼", "🌸"};
        for (String p : petals) {
            TextView f = new TextView(ctx);
            f.setText(p);
            f.setTextSize(22f);
            LinearLayout.LayoutParams flp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            flp.leftMargin = Dp.of(ctx, 10);
            f.setLayoutParams(flp);
            flowers.addView(f);
        }
        FrameLayout.LayoutParams flowersLp = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        flowersLp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        flowersLp.bottomMargin = Dp.of(ctx, 10);
        scene.addView(flowers, flowersLp);

        return scene;
    }

    private int Color(String hex) {
        return android.graphics.Color.parseColor(hex);
    }

    private String initials(String name) {
        if (name == null || name.isEmpty()) return "?";
        return name.substring(0, 1).toUpperCase();
    }
}
