import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").default("Athlete"),
  units: text("units").default("lbs"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  muscleGroups: jsonb("muscle_groups").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercisesRelations = relations(exercises, ({ one }) => ({
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  favorites: many(favorites),
  exercises: many(exercises),
}));

export const workouts = pgTable("workouts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  exercises: jsonb("exercises").notNull().default([]),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutsRelations = relations(workouts, ({ one }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
}));

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const exerciseHistory = pgTable("exercise_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  lastWeight: integer("last_weight").default(0),
  lastReps: integer("last_reps").default(0),
  lastFeeling: integer("last_feeling").default(5),
  lastPerformed: timestamp("last_performed"),
  personalRecord: integer("personal_record").default(0),
});

export const exerciseHistoryRelations = relations(exerciseHistory, ({ one }) => ({
  user: one(users, {
    fields: [exerciseHistory.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  displayName: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  name: true,
  category: true,
  muscleGroups: true,
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  units: z.enum(["kg", "lbs"]).optional(),
});

export const workoutSetSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  weight: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  feeling: z.number().int().min(1).max(10),
  timestamp: z.number(),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
});

const dateCoerce = z
  .union([z.number(), z.string(), z.date(), z.null()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

export const upsertWorkoutSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  exercises: z.array(workoutExerciseSchema),
  completedAt: dateCoerce.optional(),
});

export const exerciseHistoryRecordSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  lastWeight: z.number().nonnegative().optional(),
  lastReps: z.number().int().nonnegative().optional(),
  lastFeeling: z.number().int().min(1).max(10).optional(),
  lastPerformed: dateCoerce.optional(),
  personalRecord: z.number().nonnegative().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = typeof workouts.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type ExerciseHistoryRecord = typeof exerciseHistory.$inferSelect;
export type ExerciseRecord = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
