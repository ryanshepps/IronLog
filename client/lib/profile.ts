import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/contexts/AuthContext";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  units: string | null;
};

function toAuthUser(user: User, profile?: ProfileRow | null): AuthUser {
  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    displayName:
      profile?.display_name ??
      (typeof user.user_metadata.displayName === "string"
        ? user.user_metadata.displayName
        : "Athlete"),
    units: profile?.units ?? "lbs",
  };
}

export async function getCurrentProfile(user: User): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,units")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return toAuthUser(user, data);
  }

  return upsertCurrentProfile(user, {
    displayName:
      typeof user.user_metadata.displayName === "string"
        ? user.user_metadata.displayName
        : "Athlete",
    units: "lbs",
  });
}

export async function upsertCurrentProfile(
  user: User,
  updates: { displayName?: string; units?: string },
): Promise<AuthUser> {
  const profile = {
    id: user.id,
    email: user.email ?? "",
    display_name: updates.displayName ?? "Athlete",
    units: updates.units ?? "lbs",
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select("id,email,display_name,units")
    .single();

  if (error) {
    throw error;
  }

  return toAuthUser(user, data);
}
