package com.nohayo.companion;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.nohayo.companion.db.Repository;
import com.nohayo.companion.engine.Stages;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Mode;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;
import com.nohayo.companion.ui.screens.OnboardingWelcomeScreen;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class MainActivity extends Activity {

    private Repository repo;
    private Child child;
    private Mode currentMode = Mode.PARENT;

    private final Deque<Screen> stack = new ArrayDeque<>();
    private LinearLayout root;
    private FrameLayout contentFrame;
    private FrameLayout navHolder;
    private final List<LinearLayout> tabViews = new ArrayList<>();
    private final List<TextView> tabIcons = new ArrayList<>();
    private final List<TextView> tabLabelsViews = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        repo = ((App) getApplication()).repo();

        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Theme.BG_CREAM);

        contentFrame = new FrameLayout(this);
        contentFrame.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(contentFrame);

        navHolder = new FrameLayout(this);
        navHolder.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(navHolder);

        setContentView(root);

        child = repo.getFirstChild();
        if (child == null) {
            rebuildNav(Mode.PARENT);
            push(new OnboardingWelcomeScreen());
        } else {
            switchMode(Mode.ownerForAge(Stages.ageInYears(child.birthDateMillis)));
        }
    }

    public Repository repo() { return repo; }

    public Child getChild() { return child; }

    public void setChild(Child c) { this.child = c; }

    /** Switches the active profile (DRD §48 multi-generational support) without changing screens itself. */
    public void switchChild(Child c) { this.child = c; }

    public void reloadChild() {
        if (child != null) {
            Child fresh = repo.getFirstChild();
            if (fresh != null) child = fresh;
        }
    }

    public Mode mode() { return currentMode; }

    // ---------------- navigation ----------------

    public void push(Screen s) {
        stack.addLast(s);
        render(s);
    }

    public void resetToScreen(Screen s) {
        stack.clear();
        stack.addLast(s);
        render(s);
    }

    public void replace(Screen s) {
        if (!stack.isEmpty()) stack.removeLast();
        stack.addLast(s);
        render(s);
    }

    public void pop() {
        if (stack.size() > 1) {
            stack.removeLast();
            render(stack.peekLast());
        }
    }

    /** Switches to a different age-stage skin (a different bottom-nav set) and opens its first tab.
     *  The underlying record (moments/insights/goals/journal) is unchanged; only the lens changes. */
    public void switchMode(Mode mode) {
        currentMode = mode;
        rebuildNav(mode);
        stack.clear();
        Screen homeScreen = mode.tabScreens[0].create();
        stack.addLast(homeScreen);
        render(homeScreen);
    }

    public void switchModeTab(int index) {
        stack.clear();
        Screen s = currentMode.tabScreens[index].create();
        stack.addLast(s);
        render(s);
    }

    @Override
    public void onBackPressed() {
        if (stack.size() > 1) {
            pop();
        } else {
            super.onBackPressed();
        }
    }

    private void render(Screen s) {
        contentFrame.removeAllViews();
        View content = s.build(this);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        scroll.setBackgroundColor(currentMode.bg);
        content.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        scroll.addView(content);
        contentFrame.addView(scroll);

        boolean showNav = s.tabIndex() >= 0;
        navHolder.setVisibility(showNav ? View.VISIBLE : View.GONE);
        if (showNav) {
            highlightTab(s.tabIndex());
        }
    }

    // ---------------- bottom nav ----------------

    private void rebuildNav(Mode mode) {
        navHolder.removeAllViews();
        tabViews.clear();
        tabIcons.clear();
        tabLabelsViews.clear();

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Theme.WHITE);
        bar.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        bar.setPadding(0, Dp.of(this, 8), 0, Dp.of(this, 10));

        View topLine = new View(this);
        topLine.setBackgroundColor(Theme.LINE);

        LinearLayout wrapper = new LinearLayout(this);
        wrapper.setOrientation(LinearLayout.VERTICAL);
        wrapper.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        wrapper.addView(topLine, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Dp.of(this, 1)));
        wrapper.addView(bar);

        for (int i = 0; i < mode.tabLabels.length; i++) {
            final int index = i;
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            item.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            item.setPadding(0, Dp.of(this, 6), 0, 0);

            TextView icon = new TextView(this);
            icon.setText(mode.tabIcons[i]);
            icon.setTextSize(18f);
            icon.setGravity(Gravity.CENTER);
            icon.setPadding(Dp.of(this, 14), Dp.of(this, 4), Dp.of(this, 14), Dp.of(this, 4));

            TextView label = new TextView(this);
            label.setText(mode.tabLabels[i]);
            label.setTextSize(11.5f);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, Dp.of(this, 2), 0, 0);

            item.addView(icon);
            item.addView(label);
            item.setOnClickListener(v -> switchModeTab(index));

            bar.addView(item);
            tabViews.add(item);
            tabIcons.add(icon);
            tabLabelsViews.add(label);
        }
        navHolder.addView(wrapper);
    }

    private void highlightTab(int index) {
        for (int i = 0; i < tabViews.size(); i++) {
            boolean selected = i == index;
            TextView icon = tabIcons.get(i);
            TextView label = tabLabelsViews.get(i);
            int color = selected ? currentMode.accent : Theme.TEXT_FAINT;
            label.setTextColor(color);
            label.setTypeface(Typeface.SANS_SERIF, selected ? Typeface.BOLD : Typeface.NORMAL);
            if (selected) {
                icon.setBackground(UiKit.roundedBg(currentMode.tint, 14, this));
            } else {
                icon.setBackground(null);
            }
        }
    }
}
