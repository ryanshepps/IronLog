import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser } from "@/contexts/AuthContext";
import {
  clearCachedAuthUserFromStorage,
  readCachedAuthUserFromStorage,
  writeCachedAuthUserToStorage,
} from "@/lib/auth-cache-core";

export function readCachedAuthUser(): Promise<AuthUser | null> {
  return readCachedAuthUserFromStorage(AsyncStorage);
}

export function writeCachedAuthUser(user: AuthUser): Promise<void> {
  return writeCachedAuthUserToStorage(AsyncStorage, user);
}

export function clearCachedAuthUser(): Promise<void> {
  return clearCachedAuthUserFromStorage(AsyncStorage);
}
