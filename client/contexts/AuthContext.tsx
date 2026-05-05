import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { runMigrationV1IfNeeded } from "@/lib/migration";

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
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; units?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/me", baseUrl), {
        credentials: "include",
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        runMigrationV1IfNeeded(userData.id).catch((e) =>
          console.error("Migration error:", e)
        );
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const userData = await res.json();
    setUser(userData);
    runMigrationV1IfNeeded(userData.id).catch((e) =>
      console.error("Migration error:", e)
    );
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", {
      email,
      password,
      displayName: displayName || "Athlete"
    });
    const userData = await res.json();
    setUser(userData);
    runMigrationV1IfNeeded(userData.id).catch((e) =>
      console.error("Migration error:", e)
    );
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: { displayName?: string; units?: string }) => {
    const res = await apiRequest("PUT", "/api/auth/profile", updates);
    const userData = await res.json();
    setUser(userData);
  }, []);

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
