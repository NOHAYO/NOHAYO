package com.nohayo.companion.engine;

import java.util.concurrent.TimeUnit;

/** MVP-relevant slice of the twelve-stage life-stage model (DRD §5), ages 0-12. */
public final class Stages {
    private Stages() {}

    public static class Stage {
        public final String name;
        public final String ageLabel;
        public final String whatToExpect;
        Stage(String n, String a, String w) { name = n; ageLabel = a; whatToExpect = w; }
    }

    public static double ageInYears(long birthDateMillis) {
        long ageMillis = System.currentTimeMillis() - birthDateMillis;
        if (ageMillis < 0) ageMillis = 0;
        return ageMillis / (365.25 * 24 * 60 * 60 * 1000.0);
    }

    public static int ageInMonths(long birthDateMillis) {
        long ageMillis = System.currentTimeMillis() - birthDateMillis;
        if (ageMillis < 0) ageMillis = 0;
        return (int) TimeUnit.MILLISECONDS.toDays(ageMillis) / 30;
    }

    public static String ageLabel(long birthDateMillis) {
        double years = ageInYears(birthDateMillis);
        if (years < 2) {
            int months = ageInMonths(birthDateMillis);
            return months + (months == 1 ? " month" : " months");
        }
        int y = (int) years;
        return y + (y == 1 ? " year" : " years");
    }

    public static Stage current(long birthDateMillis) {
        double years = ageInYears(birthDateMillis);
        if (years < 2) return new Stage("Infant", "0-2",
                "Around 4-6 months many babies start reaching, babbling and showing interest in food. Every child has their own pace.");
        if (years < 4) return new Stage("Toddler", "2-4",
                "Between 2 and 4, first routines and self-care foundations take shape: dressing, simple choices, first words becoming sentences.");
        if (years < 7) return new Stage("Early Childhood", "4-7",
                "Ages 4-7 tend to bring habits, responsibility, and foundational skills, like tidying up, first chores, and growing independence.");
        if (years < 10) return new Stage("School Age", "7-10",
                "Ages 7-10 often bring academics, chores, and first ownership of tasks, and the first steps of independence outside the home.");
        if (years < 13) return new Stage("Preteen", "10-12",
                "Ages 10-12 often bring goal-setting, first financial concepts, and the beginnings of identity formation.");
        return new Stage("Early Adolescence", "12-14",
                "The next stage brings puberty, social complexity, and a growing need for private reflection.");
    }

    public static Stage next(long birthDateMillis) {
        double years = ageInYears(birthDateMillis);
        if (years < 2) return new Stage("Toddler", "2-4", "Routines and self-care foundations.");
        if (years < 4) return new Stage("Early Childhood", "4-7", "Habits, responsibility, first chores.");
        if (years < 7) return new Stage("School Age", "7-10", "Academics, chores, first ownership of tasks.");
        if (years < 10) return new Stage("Preteen", "10-12", "Goal-setting, first financial concepts, identity begins.");
        return new Stage("Early Adolescence", "12-14", "Puberty, social complexity, private reflection introduced.");
    }
}
