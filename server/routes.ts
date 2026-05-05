import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { storage } from "./storage";
import {
  loginSchema,
  signupSchema,
  insertExerciseSchema,
  type User,
} from "@shared/schema";

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

function wrap(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

function toUserDTO(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    units: user.units,
  };
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

  app.post("/api/auth/signup", wrap(async (req, res) => {
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
    res.json(toUserDTO(user));
  }));

  app.post("/api/auth/login", wrap(async (req, res) => {
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
    res.json(toUserDTO(user));
  }));

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", wrap(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json(toUserDTO(user));
  }));

  app.put("/api/auth/profile", requireAuth, wrap(async (req, res) => {
    const { displayName, units } = req.body;
    const user = await storage.updateUser(req.session.userId!, { displayName, units });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(toUserDTO(user));
  }));

  app.get("/api/workouts", requireAuth, wrap(async (req, res) => {
    const workouts = await storage.getWorkouts(req.session.userId!);
    res.json(workouts);
  }));

  app.get("/api/workouts/:id", requireAuth, wrap(async (req, res) => {
    const workout = await storage.getWorkout(req.params.id, req.session.userId!);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }
    res.json(workout);
  }));

  app.post("/api/workouts", requireAuth, wrap(async (req, res) => {
    const workout = await storage.saveWorkout({
      ...req.body,
      userId: req.session.userId!,
    });
    res.json(workout);
  }));

  app.put("/api/workouts/:id", requireAuth, wrap(async (req, res) => {
    const workout = await storage.updateWorkout(
      req.params.id,
      req.session.userId!,
      req.body
    );
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }
    res.json(workout);
  }));

  app.delete("/api/workouts/:id", requireAuth, wrap(async (req, res) => {
    await storage.deleteWorkout(req.params.id, req.session.userId!);
    res.json({ success: true });
  }));

  app.get("/api/favorites", requireAuth, wrap(async (req, res) => {
    const favorites = await storage.getFavorites(req.session.userId!);
    res.json(favorites);
  }));

  app.post("/api/favorites/:exerciseId", requireAuth, wrap(async (req, res) => {
    await storage.addFavorite(req.session.userId!, req.params.exerciseId);
    res.json({ success: true });
  }));

  app.delete("/api/favorites/:exerciseId", requireAuth, wrap(async (req, res) => {
    await storage.removeFavorite(req.session.userId!, req.params.exerciseId);
    res.json({ success: true });
  }));

  app.get("/api/exercise-history", requireAuth, wrap(async (req, res) => {
    const history = await storage.getAllExerciseHistory(req.session.userId!);
    res.json(history);
  }));

  app.get("/api/exercise-history/:exerciseId", requireAuth, wrap(async (req, res) => {
    const history = await storage.getExerciseHistory(
      req.session.userId!,
      req.params.exerciseId
    );
    res.json(history || null);
  }));

  app.post("/api/exercise-history", requireAuth, wrap(async (req, res) => {
    await storage.updateExerciseHistory(req.session.userId!, req.body);
    res.json({ success: true });
  }));

  app.get("/api/exercises", requireAuth, wrap(async (req, res) => {
    const exercises = await storage.getExercises(req.session.userId!);
    res.json(exercises);
  }));

  app.post("/api/exercises", requireAuth, wrap(async (req, res) => {
    const result = insertExerciseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.flatten() });
    }
    const exercise = await storage.createExercise(req.session.userId!, result.data);
    res.json(exercise);
  }));

  app.delete("/api/exercises/:id", requireAuth, wrap(async (req, res) => {
    await storage.deleteExercise(req.params.id, req.session.userId!);
    res.json({ success: true });
  }));

  app.patch("/api/exercises/:id", requireAuth, wrap(async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }
    const exercise = await storage.updateExerciseName(req.params.id, req.session.userId!, name);
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }
    res.json(exercise);
  }));

  app.post("/api/sync", requireAuth, wrap(async (req, res) => {
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

    const [workouts, favorites, exerciseHistory, exercises] = await Promise.all([
      storage.getWorkouts(userId),
      storage.getFavorites(userId),
      storage.getAllExerciseHistory(userId),
      storage.getExercises(userId),
    ]);

    res.json({ workouts, favorites, exerciseHistory, exercises });
  }));

  const httpServer = createServer(app);

  return httpServer;
}
