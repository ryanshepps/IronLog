export const AUTH_USER_CACHE_KEY = "@ironlog/auth_user_v1";

export type StartupAuthRoute = "pending" | "main" | "auth";

export interface AuthUserSnapshot {
  id: string;
  email: string;
  displayName: string;
  units: string;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function parseCachedAuthUser(
  value: string | null,
): AuthUserSnapshot | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AuthUserSnapshot>;
    if (
      isString(parsed.id) &&
      isString(parsed.email) &&
      isString(parsed.displayName) &&
      isString(parsed.units)
    ) {
      return {
        id: parsed.id,
        email: parsed.email,
        displayName: parsed.displayName,
        units: parsed.units,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeAuthUser(user: AuthUserSnapshot): string {
  return JSON.stringify({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    units: user.units,
  });
}

export async function readCachedAuthUserFromStorage(
  storage: KeyValueStorage,
  key = AUTH_USER_CACHE_KEY,
): Promise<AuthUserSnapshot | null> {
  const value = await storage.getItem(key);
  const user = parseCachedAuthUser(value);

  if (value && !user) {
    await storage.removeItem(key);
  }

  return user;
}

export async function writeCachedAuthUserToStorage(
  storage: KeyValueStorage,
  user: AuthUserSnapshot,
  key = AUTH_USER_CACHE_KEY,
): Promise<void> {
  await storage.setItem(key, serializeAuthUser(user));
}

export async function clearCachedAuthUserFromStorage(
  storage: KeyValueStorage,
  key = AUTH_USER_CACHE_KEY,
): Promise<void> {
  await storage.removeItem(key);
}

export function getStartupAuthRoute(
  authHydrated: boolean,
  user: AuthUserSnapshot | null,
): StartupAuthRoute {
  if (!authHydrated) return "pending";
  return user ? "main" : "auth";
}
