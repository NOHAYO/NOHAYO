package com.nohayo.companion.ui.screens;

import android.app.DatePickerDialog;
import android.content.Context;
import android.text.format.DateFormat;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.Calendar;

public class OnboardingChildScreen implements Screen {

    private long selectedBirthMillis;

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 24);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 32));

        col.addView(Screens.topBar(ctx, "Set up", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.label(ctx, "Step 2 of 3 · About your child", Theme.TERRACOTTA));
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(UiKit.headline(ctx, "Tell us about your child", 26f));
        col.addView(UiKit.spacer(ctx, 20));

        col.addView(UiKit.bold(ctx, "Child's name", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        android.widget.EditText nameField = UiKit.editText(ctx, "e.g. Noa", false);
        col.addView(nameField);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.bold(ctx, "Birth date", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));

        Calendar defaultCal = Calendar.getInstance();
        defaultCal.add(Calendar.YEAR, -5);
        selectedBirthMillis = defaultCal.getTimeInMillis();

        TextView dateField = new TextView(ctx);
        dateField.setText(DateFormat.format("MMMM d, yyyy", selectedBirthMillis));
        dateField.setTextColor(Theme.TEXT_INK);
        dateField.setTextSize(15.5f);
        dateField.setBackground(UiKit.roundedStroke(ctx, Theme.WHITE, Theme.LINE, 1.2f, 14));
        dateField.setPadding(Dp.of(ctx, 16), Dp.of(ctx, 14), Dp.of(ctx, 16), Dp.of(ctx, 14));
        dateField.setOnClickListener(v -> {
            Calendar c = Calendar.getInstance();
            c.setTimeInMillis(selectedBirthMillis);
            new DatePickerDialog(ctx, (picker, year, month, day) -> {
                Calendar chosen = Calendar.getInstance();
                chosen.set(year, month, day, 0, 0, 0);
                selectedBirthMillis = chosen.getTimeInMillis();
                dateField.setText(DateFormat.format("MMMM d, yyyy", selectedBirthMillis));
            }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show();
        });
        col.addView(dateField);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.bold(ctx, "In your own words", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        android.widget.EditText aboutField = UiKit.editText(ctx, "Curious, watches faces closely, calms down when we sing.", true);
        col.addView(aboutField);
        TextView aboutHint = UiKit.muted(ctx, "Personality, interests, anything you want us to keep in mind. We never ask diagnostic questions.");
        col.addView(UiKit.spacer(ctx, 6));
        col.addView(aboutHint);
        col.addView(UiKit.spacer(ctx, 16));

        col.addView(UiKit.bold(ctx, "Family values or traditions to respect (optional)", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        android.widget.EditText valuesField = UiKit.editText(ctx, "Add a few words", false);
        col.addView(valuesField);
        col.addView(UiKit.spacer(ctx, 28));

        col.addView(UiKit.primaryButton(ctx, "Continue", () -> {
            String name = nameField.getText().toString().trim();
            if (name.isEmpty()) {
                Toast.makeText(ctx, "Add your child's name to continue.", Toast.LENGTH_SHORT).show();
                return;
            }
            Child draft = new Child();
            draft.name = name;
            draft.birthDateMillis = selectedBirthMillis;
            draft.aboutText = aboutField.getText().toString().trim();
            draft.familyValues = valuesField.getText().toString().trim();
            host.push(new OnboardingFamilyScreen(draft));
        }));

        TextView footer = UiKit.muted(ctx, "Add more any time. We only ask for what a feature needs.");
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(footer);

        return col;
    }
}
