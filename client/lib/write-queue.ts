import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

const QUEUE_KEY = "@ironlog/write_queue_v1";

export type QueuedOp = {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  enqueuedAt: number;
};

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

export async function enqueue(op: Omit<QueuedOp, "id" | "enqueuedAt">): Promise<void> {
  const queue = await readQueue();
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    enqueuedAt: Date.now(),
  });
  await writeQueue(queue);
}

export async function pushOrQueue(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<void> {
  try {
    await apiRequest(method, path, body);
    flushQueue().catch(() => {});
  } catch (error) {
    console.warn(`[write-queue] enqueueing ${method} ${path}:`, error);
    await enqueue({ method, path, body });
  }
}

export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let queue = await readQueue();
    const remaining: QueuedOp[] = [];
    for (const op of queue) {
      try {
        await apiRequest(op.method, op.path, op.body);
      } catch (error) {
        console.warn(`[write-queue] retry failed ${op.method} ${op.path}`);
        remaining.push(op);
      }
    }
    await writeQueue(remaining);
  } finally {
    flushing = false;
  }
}
