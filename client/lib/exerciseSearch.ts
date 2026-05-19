import Fuse, { type IFuseOptions } from "fuse.js";
import { Exercise } from "@/types/workout";

const FUSE_OPTIONS: IFuseOptions<Exercise> = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "muscleGroups", weight: 0.25 },
    { name: "category", weight: 0.15 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
  useExtendedSearch: true,
};

export function buildExerciseFuse(exercises: Exercise[]): Fuse<Exercise> {
  return new Fuse(exercises, FUSE_OPTIONS);
}

export function searchExercises(
  fuse: Fuse<Exercise>,
  query: string,
  limit = 50,
): Exercise[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return [];
  const pattern = tokens.map((t) => `'${t}`).join(" ");
  return fuse.search(pattern, { limit }).map((r) => r.item);
}
