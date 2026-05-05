import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { storage } from "./storage";
import { loginSchema, signupSchema, insertExerciseSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "ironlog-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
      }

      const { email, password, displayName } = result.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        displayName: displayName || "Athlete",
      });

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        units: user.units,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const { email, password } = result.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        units: user.units,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        units: user.units,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { displayName, units } = req.body;
      const user = await storage.updateUser(req.session.userId!, { displayName, units });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        units: user.units,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/workouts", requireAuth, async (req, res) => {
    try {
      const workouts = await storage.getWorkouts(req.session.userId!);
      res.json(workouts);
    } catch (error) {
      console.error("Get workouts error:", error);
      res.status(500).json({ error: "Failed to get workouts" });
    }
  });

  app.get("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id, req.session.userId!);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      console.error("Get workout error:", error);
      res.status(500).json({ error: "Failed to get workout" });
    }
  });

  app.post("/api/workouts", requireAuth, async (req, res) => {
    try {
      const workout = await storage.saveWorkout({
        ...req.body,
        userId: req.session.userId!,
      });
      res.json(workout);
    } catch (error) {
      console.error("Save workout error:", error);
      res.status(500).json({ error: "Failed to save workout" });
    }
  });

  app.put("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const workout = await storage.updateWorkout(
        req.params.id,
        req.session.userId!,
        req.body
      );
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      console.error("Update workout error:", error);
      res.status(500).json({ error: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkout(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete workout error:", error);
      res.status(500).json({ error: "Failed to delete workout" });
    }
  });

  app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getFavorites(req.session.userId!);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.post("/api/favorites/:exerciseId", requireAuth, async (req, res) => {
    try {
      await storage.addFavorite(req.session.userId!, req.params.exerciseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:exerciseId", requireAuth, async (req, res) => {
    try {
      await storage.removeFavorite(req.session.userId!, req.params.exerciseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/exercise-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getAllExerciseHistory(req.session.userId!);
      res.json(history);
    } catch (error) {
      console.error("Get exercise history error:", error);
      res.status(500).json({ error: "Failed to get exercise history" });
    }
  });

  app.get("/api/exercise-history/:exerciseId", requireAuth, async (req, res) => {
    try {
      const history = await storage.getExerciseHistory(
        req.session.userId!,
        req.params.exerciseId
      );
      res.json(history || null);
    } catch (error) {
      console.error("Get exercise history error:", error);
      res.status(500).json({ error: "Failed to get exercise history" });
    }
  });

  app.post("/api/exercise-history", requireAuth, async (req, res) => {
    try {
      await storage.updateExerciseHistory(req.session.userId!, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Update exercise history error:", error);
      res.status(500).json({ error: "Failed to update exercise history" });
    }
  });

  app.get("/api/exercises", requireAuth, async (req, res) => {
    try {
      const exercises = await storage.getExercises(req.session.userId!);
      res.json(exercises);
    } catch (error) {
      console.error("Get exercises error:", error);
      res.status(500).json({ error: "Failed to get exercises" });
    }
  });

  app.post("/api/exercises", requireAuth, async (req, res) => {
    try {
      const result = insertExerciseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
      }
      const exercise = await storage.createExercise(req.session.userId!, result.data);
      res.json(exercise);
    } catch (error) {
      console.error("Create exercise error:", error);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  app.delete("/api/exercises/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteExercise(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exercise error:", error);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  app.patch("/api/exercises/:id", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Name is required" });
      }
      const exercise = await storage.updateExerciseName(req.params.id, req.session.userId!, name);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      console.error("Update exercise error:", error);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  app.post("/api/sync", requireAuth, async (req, res) => {
    try {
      const {
        workouts: clientWorkouts,
        favorites: clientFavorites,
        exerciseHistory: clientExerciseHistory,
      } = req.body;
      const userId = req.session.userId!;

      if (clientWorkouts && Array.isArray(clientWorkouts)) {
        for (const workout of clientWorkouts) {
          await storage.saveWorkout({ ...workout, userId });
        }
      }

      if (clientFavorites && Array.isArray(clientFavorites)) {
        const currentFavorites = await storage.getFavorites(userId);

        for (const exerciseId of clientFavorites) {
          if (!currentFavorites.includes(exerciseId)) {
            await storage.addFavorite(userId, exerciseId);
          }
        }
      }

      if (clientExerciseHistory && Array.isArray(clientExerciseHistory)) {
        for (const record of clientExerciseHistory) {
          if (record?.exerciseId && record?.exerciseName) {
            await storage.updateExerciseHistory(userId, record);
          }
        }
      }

      const workouts = await storage.getWorkouts(userId);
      const favorites = await storage.getFavorites(userId);
      const exerciseHistory = await storage.getAllExerciseHistory(userId);
      const exercises = await storage.getExercises(userId);

      res.json({ workouts, favorites, exerciseHistory, exercises });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
