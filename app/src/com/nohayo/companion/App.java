package com.nohayo.companion;

import android.app.Application;

import com.nohayo.companion.db.Repository;

public class App extends Application {
    private Repository repository;

    @Override
    public void onCreate() {
        super.onCreate();
        repository = new Repository(this);
    }

    public Repository repo() {
        return repository;
    }
}
