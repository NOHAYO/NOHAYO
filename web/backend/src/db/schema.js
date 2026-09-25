import {
  pgTable, serial, text, timestamp, integer, boolean, varchar, pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Mirrors the same event-log-first model as the Android app's SQLite schema
 * (db/DbHelper.java), extended with real multi-user accounts since the web
 * app is a shared, authenticated surface rather than a single local profile.
 * DRD §8: the moment log is append-only and is the system of record; insight,
 * goal, and journal_entry rows are derived/authored records that reference it.
 */

export const roleEnum = pgEnum("family_role", [
  "primary_parent",
  "co_parent",
  "guardian",
  "viewer_only",
]);

export const insightStatusEnum = pgEnum("insight_status", ["active", "tried", "dismissed"]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "noticed"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "pending"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birth_date").notNull(),
  aboutText: text("about_text").default(""),
  familyValues: text("family_values").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moments = pgTable("moments", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  domain: varchar("domain", { length: 64 }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  confidenceTier: varchar("confidence_tier", { length: 64 }).notNull(),
  confidenceLevel: integer("confidence_level").notNull(),
  evidenceIds: text("evidence_ids").default(""), // comma-separated moment ids
  recommendation: text("recommendation"),
  recommendationEffort: varchar("recommendation_effort", { length: 64 }),
  recommendationFor: varchar("recommendation_for", { length: 255 }),
  status: insightStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  what: text("what").notNull(),
  why: text("why").default(""),
  byWhen: varchar("by_when", { length: 255 }).default(""),
  howNoticed: text("how_noticed").default(""),
  status: goalStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 255 }).notNull(),
  text: text("text").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: roleEnum("role").notNull(),
  status: memberStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
