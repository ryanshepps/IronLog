import { 
  users, 
  workouts, 
  favorites, 
  exerciseHistory,
  type User, 
  type InsertUser,
  type Workout,
  type InsertWorkout,
  type Favorite,
  type ExerciseHistoryRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: string, userId: string): Promise<Workout | undefined>;
  saveWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: string, userId: string, updates: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: string, userId: string): Promise<void>;
  
  getFavorites(userId: string): Promise<string[]>;
  addFavorite(userId: string, exerciseId: string): Promise<void>;
  removeFavorite(userId: string, exerciseId: string): Promise<void>;
  
  getExerciseHistory(userId: string, exerciseId: string): Promise<ExerciseHistoryRecord | undefined>;
  getAllExerciseHistory(userId: string): Promise<ExerciseHistoryRecord[]>;
  updateExerciseHistory(userId: string, record: Partial<ExerciseHistoryRecord> & { exerciseId: string; exerciseName: string }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
    return db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date));
  }

  async getWorkout(id: string, userId: string): Promise<Workout | undefined> {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
    return workout || undefined;
  }

  async saveWorkout(workout: InsertWorkout): Promise<Workout> {
    const existing = await this.getWorkout(workout.id!, workout.userId);
    
    if (existing) {
      const [updated] = await db
        .update(workouts)
        .set(workout)
        .where(eq(workouts.id, workout.id!))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(workouts)
      .values(workout)
      .returning();
    return created;
  }

  async updateWorkout(id: string, userId: string, updates: Partial<Workout>): Promise<Workout | undefined> {
    const [workout] = await db
      .update(workouts)
      .set(updates)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning();
    return workout || undefined;
  }

  async deleteWorkout(id: string, userId: string): Promise<void> {
    await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
  }

  async getFavorites(userId: string): Promise<string[]> {
    const favs = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return favs.map(f => f.exerciseId);
  }

  async addFavorite(userId: string, exerciseId: string): Promise<void> {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.exerciseId, exerciseId)));
    
    if (existing.length === 0) {
      await db.insert(favorites).values({ userId, exerciseId });
    }
  }

  async removeFavorite(userId: string, exerciseId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.exerciseId, exerciseId)));
  }

  async getExerciseHistory(userId: string, exerciseId: string): Promise<ExerciseHistoryRecord | undefined> {
    const [record] = await db
      .select()
      .from(exerciseHistory)
      .where(and(eq(exerciseHistory.userId, userId), eq(exerciseHistory.exerciseId, exerciseId)));
    return record || undefined;
  }

  async getAllExerciseHistory(userId: string): Promise<ExerciseHistoryRecord[]> {
    return db
      .select()
      .from(exerciseHistory)
      .where(eq(exerciseHistory.userId, userId));
  }

  async updateExerciseHistory(
    userId: string, 
    record: Partial<ExerciseHistoryRecord> & { exerciseId: string; exerciseName: string }
  ): Promise<void> {
    const existing = await this.getExerciseHistory(userId, record.exerciseId);
    
    if (existing) {
      await db
        .update(exerciseHistory)
        .set({
          ...record,
          lastPerformed: new Date(),
          personalRecord: Math.max(existing.personalRecord || 0, record.lastWeight || 0),
        })
        .where(eq(exerciseHistory.id, existing.id));
    } else {
      await db.insert(exerciseHistory).values({
        userId,
        ...record,
        lastPerformed: new Date(),
        personalRecord: record.lastWeight || 0,
      });
    }
  }
}

export const storage = new DatabaseStorage();
