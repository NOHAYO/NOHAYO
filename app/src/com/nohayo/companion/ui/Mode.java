package com.nohayo.companion.ui;

import com.nohayo.companion.ui.screens.AdultTodayScreen;
import com.nohayo.companion.ui.screens.CapabilityMapScreen;
import com.nohayo.companion.ui.screens.FamilyScreen;
import com.nohayo.companion.ui.screens.GardenGrownUpsScreen;
import com.nohayo.companion.ui.screens.GardenMyGardenScreen;
import com.nohayo.companion.ui.screens.GardenTodayScreen;
import com.nohayo.companion.ui.screens.InsightsScreen;
import com.nohayo.companion.ui.screens.JournalScreen;
import com.nohayo.companion.ui.screens.LegibleStoriesScreen;
import com.nohayo.companion.ui.screens.LegibleTodayScreen;
import com.nohayo.companion.ui.screens.LifeDevelopmentMapScreen;
import com.nohayo.companion.ui.screens.NotebookMyStoryScreen;
import com.nohayo.companion.ui.screens.NotebookTodayScreen;
import com.nohayo.companion.ui.screens.TabGoalsScreen;
import com.nohayo.companion.ui.screens.TeenTodayScreen;
import com.nohayo.companion.ui.screens.TimelineScreen;
import com.nohayo.companion.ui.screens.TodayScreen;

/**
 * The five age-adaptive "skins" from Design.pdf ("Five skins, one system"), plus the
 * default parent tool. Switching modes never changes the underlying data (the event
 * log, insights, goals, journal) — only who owns the account, what they see, and how
 * it looks, exactly as the design brief frames it.
 */
public enum Mode {
    PARENT("Parent tool", "Ages 0-12 · calm, warm neutrals",
            new String[]{"Today", "Timeline", "Insights", "Journal", "Family"},
            new String[]{"☀", "⏱", "💡", "📔", "👪"},
            Theme.TERRACOTTA, Theme.TERRACOTTA_DARK, Theme.PEACH, Theme.BG_CREAM,
            new ScreenFactory[]{TodayScreen::new, TimelineScreen::new, InsightsScreen::new, JournalScreen::new, FamilyScreen::new}),

    GARDEN("Garden", "Ages 4-7 · pictures and voice first",
            new String[]{"Today", "My Garden", "Grown-ups"},
            new String[]{"☀", "🌱", "👪"},
            Theme.GREEN, Theme.GREEN_DARK, Theme.GREEN_TINT, Theme.GARDEN_BG,
            new ScreenFactory[]{GardenTodayScreen::new, GardenMyGardenScreen::new, GardenGrownUpsScreen::new}),

    NOTEBOOK("Notebook", "Ages 7-12 · rounded and friendly",
            new String[]{"Today", "Goals", "Journal", "My Story"},
            new String[]{"☀", "🎯", "📔", "⏱"},
            Theme.GREEN, Theme.GREEN_DARK, Theme.GREEN_TINT, Theme.BG_CREAM,
            new ScreenFactory[]{
                    NotebookTodayScreen::new,
                    () -> new TabGoalsScreen(1, "My goals", Theme.GREEN, Theme.GREEN_TINT),
                    NotebookTodayScreen::notebookJournal,
                    NotebookMyStoryScreen::new}),

    OWN_SPACE("Own space", "Ages 12-18 · clean, cool, direct",
            new String[]{"Today", "Timeline", "Insights", "Goals", "Journal"},
            new String[]{"☀", "⏱", "💡", "🎯", "📔"},
            Theme.BLUE, Theme.BLUE_DARK, Theme.BLUE_TINT, Theme.BG_CREAM,
            new ScreenFactory[]{
                    TeenTodayScreen::new, TimelineScreen::new, InsightsScreen::new,
                    () -> new TabGoalsScreen(3, "Goals", Theme.BLUE, Theme.BLUE_TINT),
                    TeenTodayScreen::teenJournal}),

    COMPANION("Companion", "Ages 18-55 · quiet and editorial",
            new String[]{"Today", "Timeline", "Insights", "Goals", "Journal"},
            new String[]{"☀", "⏱", "💡", "🎯", "📔"},
            Theme.TEAL, Theme.TEAL_DARK, Theme.TEAL_TINT, Theme.BG_CREAM,
            new ScreenFactory[]{
                    AdultTodayScreen::new, LifeDevelopmentMapScreen::new, CapabilityMapScreen::new,
                    () -> new TabGoalsScreen(3, "Goals", Theme.TEAL, Theme.TEAL_TINT),
                    () -> new com.nohayo.companion.ui.screens.TabJournalScreen(4, "Journal", "Private, quiet, and yours.", Theme.TEAL, Theme.TEAL_TINT, "Today…", null)}),

    LEGIBLE("Legible", "Ages 55-120 · large type, high contrast",
            new String[]{"Today", "Life story", "Goals", "Journal"},
            new String[]{"☀", "📖", "🎯", "📔"},
            Theme.AMBER, Theme.AMBER_DARK, Theme.AMBER_TINT, Theme.BG_CREAM,
            new ScreenFactory[]{
                    LegibleTodayScreen::new, LegibleStoriesScreen::new,
                    () -> new TabGoalsScreen(2, "Goals", Theme.AMBER, Theme.AMBER_TINT),
                    () -> new com.nohayo.companion.ui.screens.TabJournalScreen(3, "Journal", "One memory at a time.", Theme.AMBER, Theme.AMBER_TINT, "Today…", null)});

    public final String displayName;
    public final String ageLabel;
    public final String[] tabLabels;
    public final String[] tabIcons;
    public final int accent;
    public final int accentDark;
    public final int tint;
    public final int bg;
    public final ScreenFactory[] tabScreens;

    Mode(String displayName, String ageLabel, String[] tabLabels, String[] tabIcons,
         int accent, int accentDark, int tint, int bg, ScreenFactory[] tabScreens) {
        this.displayName = displayName;
        this.ageLabel = ageLabel;
        this.tabLabels = tabLabels;
        this.tabIcons = tabIcons;
        this.accent = accent;
        this.accentDark = accentDark;
        this.tint = tint;
        this.bg = bg;
        this.tabScreens = tabScreens;
    }

    /** The mode that actually owns the account at this age (DRD §4). Garden/Notebook are
     *  always an explicit "preview as the child" choice, never auto-selected, since the
     *  parent remains the account holder through age 12. */
    public static Mode ownerForAge(double ageYears) {
        if (ageYears < 12) return PARENT;
        if (ageYears < 18) return OWN_SPACE;
        if (ageYears < 55) return COMPANION;
        return LEGIBLE;
    }
}
