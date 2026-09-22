package com.nohayo.companion;

import android.app.Activity;
import android.content.Context;
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
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;
import com.nohayo.companion.ui.screens.FamilyScreen;
import com.nohayo.companion.ui.screens.InsightsScreen;
import com.nohayo.companion.ui.screens.JournalScreen;
import com.nohayo.companion.ui.screens.OnboardingWelcomeScreen;
import com.nohayo.companion.ui.screens.TimelineScreen;
import com.nohayo.companion.ui.screens.TodayScreen;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class MainActivity extends Activity {

    private static final String[] TAB_LABELS = {"Today", "Timeline", "Insights", "Journal", "Family"};
    private static final String[] TAB_ICONS = {"☀", "⏱", "💡", "📔", "👪"};

    private Repository repo;
    private Child child;

    private final Deque<Screen> stack = new ArrayDeque<>();
    private FrameLayout contentFrame;
    private LinearLayout bottomNav;
    private final List<LinearLayout> tabViews = new ArrayList<>();
    private final List<TextView> tabIcons = new ArrayList<>();
    private final List<TextView> tabLabelsViews = new ArrayList<>();
    private int currentTab = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        repo = ((App) getApplication()).repo();

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Theme.BG_CREAM);

        contentFrame = new FrameLayout(this);
        contentFrame.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(contentFrame);

        bottomNav = buildBottomNav();
        root.addView(bottomNav);

        setContentView(root);

        child = repo.getFirstChild();
        if (child == null) {
            push(new OnboardingWelcomeScreen());
        } else {
            switchTab(0);
        }
    }

    public Repository repo() { return repo; }

    public Child getChild() { return child; }

    public void setChild(Child c) { this.child = c; }

    public void reloadChild() {
        if (child != null) {
            Child fresh = repo.getFirstChild();
            if (fresh != null) child = fresh;
        }
    }

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

    public void switchTab(int index) {
        stack.clear();
        Screen root;
        switch (index) {
            case 1: root = new TimelineScreen(); break;
            case 2: root = new InsightsScreen(); break;
            case 3: root = new JournalScreen(); break;
            case 4: root = new FamilyScreen(); break;
            default: root = new TodayScreen(); break;
        }
        currentTab = index;
        stack.addLast(root);
        render(root);
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
        scroll.setBackgroundColor(Theme.BG_CREAM);
        content.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        scroll.addView(content);
        contentFrame.addView(scroll);

        boolean showNav = s.tabIndex() >= 0;
        bottomNav.setVisibility(showNav ? View.VISIBLE : View.GONE);
        if (showNav) {
            currentTab = s.tabIndex();
            highlightTab(currentTab);
        }
    }

    // ---------------- bottom nav ----------------

    private LinearLayout buildBottomNav() {
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

        for (int i = 0; i < TAB_LABELS.length; i++) {
            final int index = i;
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            item.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            item.setPadding(0, Dp.of(this, 6), 0, 0);

            TextView icon = new TextView(this);
            icon.setText(TAB_ICONS[i]);
            icon.setTextSize(18f);
            icon.setGravity(Gravity.CENTER);
            icon.setPadding(Dp.of(this, 14), Dp.of(this, 4), Dp.of(this, 14), Dp.of(this, 4));

            TextView label = new TextView(this);
            label.setText(TAB_LABELS[i]);
            label.setTextSize(11.5f);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, Dp.of(this, 2), 0, 0);

            item.addView(icon);
            item.addView(label);
            item.setOnClickListener(v -> switchTab(index));

            bar.addView(item);
            tabViews.add(item);
            tabIcons.add(icon);
            tabLabelsViews.add(label);
        }
        return wrapper;
    }

    private void highlightTab(int index) {
        for (int i = 0; i < tabViews.size(); i++) {
            boolean selected = i == index;
            TextView icon = tabIcons.get(i);
            TextView label = tabLabelsViews.get(i);
            int color = selected ? Theme.TERRACOTTA : Theme.TEXT_FAINT;
            label.setTextColor(color);
            label.setTypeface(Typeface.SANS_SERIF, selected ? Typeface.BOLD : Typeface.NORMAL);
            if (selected) {
                icon.setBackground(UiKit.roundedBg(Theme.PEACH, 14, this));
            } else {
                icon.setBackground(null);
            }
        }
    }
}
