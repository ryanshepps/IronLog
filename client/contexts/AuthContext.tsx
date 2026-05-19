import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentProfile, upsertCurrentProfile } from "@/lib/profile";
import { flushQueue } from "@/lib/write-queue";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  units: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setUser(null);
        return;
      }

      const profile = await getCurrentProfile(data.user);
      setUser(profile);
      flushQueue().catch((e) => console.error("Queue flush error:", e));
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        refreshUser();
      }, 0);
    });

    return () => {
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
      setUser(profile);
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
        setUser(profile);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
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
      setUser(userData);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
