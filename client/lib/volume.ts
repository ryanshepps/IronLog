export interface SetForVolume {
  weight: number;
  reps: number;
}

export function totalVolume(sets: SetForVolume[]): number {
  return sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export function averageFeeling(sets: { feeling: number }[]): number | null {
  if (sets.length === 0) return null;
  return sets.reduce((acc, s) => acc + s.feeling, 0) / sets.length;
}
