package com.nohayo.companion.ui.screens;

import android.app.DatePickerDialog;
import android.content.Context;
import android.text.format.DateFormat;
import android.view.View;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.nohayo.companion.MainActivity;
import com.nohayo.companion.model.Child;
import com.nohayo.companion.model.FamilyMember;
import com.nohayo.companion.ui.Dp;
import com.nohayo.companion.ui.Mode;
import com.nohayo.companion.ui.Screen;
import com.nohayo.companion.ui.Theme;
import com.nohayo.companion.ui.UiKit;

import java.util.Calendar;

/** DRD §48: multi-generational support. An adult can start their own child's profile
 *  from inside their own longstanding account. */
public class ParenthoodLifeEventScreen implements Screen {
    private long selectedBirthMillis;

    @Override
    public View build(MainActivity host) {
        Context ctx = host;
        Child child = host.getChild();

        LinearLayout col = UiKit.column(ctx);
        int pad = Dp.of(ctx, 20);
        col.setPadding(pad, Dp.of(ctx, 20), pad, Dp.of(ctx, 28));

        col.addView(Screens.topBar(ctx, "Life event · Parenthood", () -> host.pop()));
        col.addView(UiKit.spacer(ctx, 16));
        col.addView(UiKit.headline(ctx, "Congratulations, " + child.name + ".", 27f));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.body(ctx, "Your own record began when someone wrote down what they noticed. Now it is your turn to do that for someone else."));
        col.addView(UiKit.spacer(ctx, 16));

        LinearLayout note = UiKit.card(ctx, Theme.TEAL_TINT);
        note.addView(infoRow(ctx, "👤", "Your baby gets a separate profile"));
        note.addView(UiKit.spacer(ctx, 8));
        note.addView(infoRow(ctx, "🔒", "Yours stays yours. Nothing is shared between them"));
        note.addView(UiKit.spacer(ctx, 8));
        note.addView(infoRow(ctx, "🛡", "You start with consent, the same as your parents did"));
        col.addView(note);
        col.addView(UiKit.spacer(ctx, 18));

        col.addView(UiKit.bold(ctx, "Baby's name", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        android.widget.EditText nameField = UiKit.editText(ctx, "e.g. Yara", false);
        col.addView(nameField);
        col.addView(UiKit.spacer(ctx, 14));

        col.addView(UiKit.bold(ctx, "Birth date", 13.5f));
        col.addView(UiKit.spacer(ctx, 6));
        selectedBirthMillis = System.currentTimeMillis();
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
        col.addView(UiKit.spacer(ctx, 28));

        col.addView(UiKit.filledButton(ctx, "Start the profile", Theme.TEAL, Theme.WHITE, () -> {
            String babyName = nameField.getText().toString().trim();
            if (babyName.isEmpty()) {
                Toast.makeText(ctx, "Add a name first.", Toast.LENGTH_SHORT).show();
                return;
            }
            Child baby = new Child();
            baby.name = babyName;
            baby.birthDateMillis = selectedBirthMillis;
            baby.aboutText = "";
            baby.familyValues = child.familyValues;
            long id = host.repo().insertChild(baby);
            baby.id = id;

            FamilyMember you = new FamilyMember();
            you.childId = id;
            you.name = "You";
            you.role = "Primary parent";
            you.status = "Active";
            host.repo().insertFamilyMember(you);

            Toast.makeText(ctx, "Started " + babyName + "'s profile. Switch back to " + child.name + " any time from Settings.", Toast.LENGTH_LONG).show();
            host.switchChild(baby);
            host.switchMode(Mode.PARENT);
        }));
        col.addView(UiKit.spacer(ctx, 10));
        col.addView(UiKit.textLink(ctx, "Not now", Theme.TEXT_MUTED, () -> host.pop()));

        return col;
    }

    private LinearLayout infoRow(Context ctx, String emoji, String text) {
        LinearLayout row = UiKit.row(ctx);
        TextView icon = new TextView(ctx);
        icon.setText(emoji + "  ");
        row.addView(icon);
        row.addView(UiKit.body(ctx, text));
        return row;
    }
}
