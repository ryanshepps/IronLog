import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_USER_CACHE_KEY,
  clearCachedAuthUserFromStorage,
  getStartupAuthRoute,
  parseCachedAuthUser,
  readCachedAuthUserFromStorage,
  serializeAuthUser,
  writeCachedAuthUserToStorage,
  type AuthUserSnapshot,
  type KeyValueStorage,
} from "../client/lib/auth-cache-core";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const calls: string[] = [];

  const storage: KeyValueStorage = {
    async getItem(key) {
      calls.push(`get:${key}`);
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      calls.push(`set:${key}`);
      values.set(key, value);
    },
    async removeItem(key) {
      calls.push(`remove:${key}`);
      values.delete(key);
    },
  };

  return { storage, values, calls };
}

const cachedUser: AuthUserSnapshot = {
  id: "user-1",
  email: "athlete@example.com",
  displayName: "Athlete",
  units: "lbs",
};

test("parseCachedAuthUser accepts complete cached auth users", () => {
  assert.deepEqual(parseCachedAuthUser(JSON.stringify(cachedUser)), cachedUser);
});

test("parseCachedAuthUser rejects corrupt or incomplete cached auth users", () => {
  assert.equal(parseCachedAuthUser("{"), null);
  assert.equal(
    parseCachedAuthUser(JSON.stringify({ id: "user-1", email: "a@b.com" })),
    null,
  );
});

test("auth cache storage round-trips only non-token user fields", async () => {
  const { storage, values } = createStorage();
  await writeCachedAuthUserToStorage(storage, {
    ...cachedUser,
    extra: "ignored",
  } as AuthUserSnapshot & { extra: string });

  assert.equal(values.get(AUTH_USER_CACHE_KEY), serializeAuthUser(cachedUser));
  assert.deepEqual(await readCachedAuthUserFromStorage(storage), cachedUser);

  await clearCachedAuthUserFromStorage(storage);
  assert.equal(values.has(AUTH_USER_CACHE_KEY), false);
});

test("readCachedAuthUserFromStorage clears corrupt cached values", async () => {
  const { storage, values, calls } = createStorage({
    [AUTH_USER_CACHE_KEY]: "not-json",
  });

  assert.equal(await readCachedAuthUserFromStorage(storage), null);
  assert.equal(values.has(AUTH_USER_CACHE_KEY), false);
  assert.deepEqual(calls, [
    `get:${AUTH_USER_CACHE_KEY}`,
    `remove:${AUTH_USER_CACHE_KEY}`,
  ]);
});

test("getStartupAuthRoute prevents auth flash while local hydration is pending", () => {
  assert.equal(getStartupAuthRoute(false, null), "pending");
  assert.equal(getStartupAuthRoute(false, cachedUser), "pending");
  assert.equal(getStartupAuthRoute(true, cachedUser), "main");
  assert.equal(getStartupAuthRoute(true, null), "auth");
});

test("local auth hydration only touches storage", async () => {
  const { storage, calls } = createStorage({
    [AUTH_USER_CACHE_KEY]: JSON.stringify(cachedUser),
  });

  assert.deepEqual(await readCachedAuthUserFromStorage(storage), cachedUser);
  assert.deepEqual(calls, [`get:${AUTH_USER_CACHE_KEY}`]);
});
