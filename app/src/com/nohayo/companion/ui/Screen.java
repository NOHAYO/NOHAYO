package com.nohayo.companion.ui;

import android.view.View;

import com.nohayo.companion.MainActivity;

/** A single app screen: builds its own content view on demand. */
public interface Screen {
    View build(MainActivity host);

    /** Bottom-nav tab index this screen belongs to, or -1 if it's a sub-screen / onboarding step. */
    default int tabIndex() { return -1; }
}
