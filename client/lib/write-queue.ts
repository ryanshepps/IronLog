import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addRemoteFavorite,
  deleteRemoteWorkout,
  removeRemoteFavorite,
  upsertRemoteExerciseHistory,
  upsertRemoteWorkout,
} from "@/lib/remote-sync";
import type { ExerciseHistory, Workout } from "@/types/workout";

const QUEUE_KEY = "@ironlog/write_queue_v2";

type QueuedOpPayload =
  | { type: "upsertWorkout"; workout: Workout }
  | { type: "deleteWorkout"; workoutId: string }
  | { type: "addFavorite"; exerciseId: string }
  | { type: "removeFavorite"; exerciseId: string }
  | { type: "upsertExerciseHistory"; record: ExerciseHistory };

export type QueuedOp = QueuedOpPayload & {
  id: string;
  enqueuedAt: number;
};

type NewQueuedOp = QueuedOpPayload;

let flushing = false;

async function readQueue(): Promise<QueuedOp[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function writeQueue(ops: QueuedOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

async function dispatchQueuedOp(op: NewQueuedOp): Promise<void> {
  switch (op.type) {
    case "upsertWorkout":
      await upsertRemoteWorkout(op.workout);
      return;
    case "deleteWorkout":
      await deleteRemoteWorkout(op.workoutId);
      return;
    case "addFavorite":
      await addRemoteFavorite(op.exerciseId);
      return;
    case "removeFavorite":
      await removeRemoteFavorite(op.exerciseId);
      return;
    case "upsertExerciseHistory":
      await upsertRemoteExerciseHistory(op.record);
      return;
  }
}

export async function enqueue(op: NewQueuedOp): Promise<void> {
  const queue = await readQueue();
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    enqueuedAt: Date.now(),
  });
  await writeQueue(queue);
}

export async function pushOrQueue(op: NewQueuedOp): Promise<void> {
  try {
    await dispatchQueuedOp(op);
    flushQueue().catch(() => {});
  } catch (error) {
    console.warn(`[write-queue] enqueueing ${op.type}:`, error);
    await enqueue(op);
  }
}

export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const queue = await readQueue();
    const remaining: QueuedOp[] = [];
    for (const op of queue) {
      const { id: _id, enqueuedAt: _enqueuedAt, ...payload } = op;
      try {
        await dispatchQueuedOp(payload);
      } catch (error) {
        console.warn(`[write-queue] retry failed ${op.type}`);
        remaining.push(op);
      }
    }
    await writeQueue(remaining);
  } finally {
    flushing = false;
  }
}
