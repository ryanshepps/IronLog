import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  clearCachedAuthUser,
  readCachedAuthUser,
  writeCachedAuthUser,
} from "@/lib/auth-cache";
import { getCurrentProfile, upsertCurrentProfile } from "@/lib/profile";
import { flushQueue } from "@/lib/write-queue";
import {
  createStartupAuthReconciler,
  shouldClearCachedUserAfterAuthFailure,
} from "@/lib/auth-reconciliation";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  units: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  authHydrated: boolean;
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    displayName?: string;
    units?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toFallbackAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      typeof user.user_metadata.displayName === "string"
        ? user.user_metadata.displayName
        : "Athlete",
    units: "lbs",
  };
}

async function clearCachedAuthUserSafely() {
  try {
    await clearCachedAuthUser();
  } catch (error) {
    console.error("Error clearing cached auth user:", error);
  }
}

async function writeCachedAuthUserSafely(user: AuthUser) {
  try {
    await writeCachedAuthUser(user);
  } catch (error) {
    console.error("Error caching auth user:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const authRequestId = useRef(0);

  const refreshUser = useCallback(async () => {
    const requestId = ++authRequestId.current;
    const isCurrentRequest = () => requestId === authRequestId.current;
    setIsCheckingAuth(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isCurrentRequest()) return;

      if (!session) {
        await clearCachedAuthUserSafely();
        if (!isCurrentRequest()) return;
        setUser(null);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!isCurrentRequest()) return;

      if (error || !data.user) {
        if (error && !shouldClearCachedUserAfterAuthFailure(error)) {
          console.error("Error validating user:", error);
          return;
        }

        await clearCachedAuthUserSafely();
        await supabase.auth.signOut();
        if (!isCurrentRequest()) return;
        setUser(null);
        return;
      }

      let profile: AuthUser;
      try {
        profile = await getCurrentProfile(data.user);
      } catch (profileError) {
        console.error("Error refreshing profile:", profileError);
        if (!isCurrentRequest()) return;
        setUser((currentUser) => currentUser ?? toFallbackAuthUser(data.user));
        return;
      }

      if (!isCurrentRequest()) return;
      await writeCachedAuthUserSafely(profile);
      if (!isCurrentRequest()) return;
      setUser(profile);
      flushQueue().catch((e) => console.error("Queue flush error:", e));
    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      if (isCurrentRequest()) {
        setIsCheckingAuth(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const startupAuth = createStartupAuthReconciler((hasSession) => {
      if (hasSession) {
        refreshUser();
        return;
      }

      authRequestId.current += 1;
      setIsCheckingAuth(false);
      clearCachedAuthUserSafely();
      setUser(null);
    });

    async function hydrateCachedUser() {
      try {
        const cachedUser = await readCachedAuthUser();
        if (!active) return;
        setUser(cachedUser);
      } catch (error) {
        console.error("Error hydrating cached auth user:", error);
        if (!active) return;
        setUser(null);
      } finally {
        if (active) {
          setAuthHydrated(true);
          startupAuth.markHydrated();
        }
      }
    }

    hydrateCachedUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        if (!active) return;

        if (event === "INITIAL_SESSION") {
          startupAuth.recordInitialSession(!!session);
          return;
        }

        if (event === "SIGNED_OUT" || !session) {
          authRequestId.current += 1;
          setIsCheckingAuth(false);
          clearCachedAuthUserSafely();
          setUser(null);
          return;
        }

        refreshUser();
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const profile = await getCurrentProfile(data.user);
      await writeCachedAuthUserSafely(profile);
      setUser(profile);
      setAuthHydrated(true);
      flushQueue().catch((e) => console.error("Queue flush error:", e));
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const name = displayName || "Athlete";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        const profile = await upsertCurrentProfile(data.user, {
          displayName: name,
          units: "lbs",
        });
        await writeCachedAuthUserSafely(profile);
        setUser(profile);
        setAuthHydrated(true);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    await clearCachedAuthUserSafely();
    setUser(null);
    setAuthHydrated(true);
  }, []);

  const updateProfile = useCallback(
    async (updates: { displayName?: string; units?: string }) => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        throw error ?? new Error("Not authenticated");
      }

      const userData = await upsertCurrentProfile(data.user, {
        displayName: updates.displayName ?? user?.displayName,
        units: updates.units ?? user?.units,
      });
      await writeCachedAuthUserSafely(userData);
      setUser(userData);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !authHydrated,
        authHydrated,
        isCheckingAuth,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
