import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRemoteExercise,
  deleteRemoteExercise,
  getRemoteExercises,
  renameRemoteExercise,
} from "@/lib/remote-sync";
import type { Exercise } from "@/types/workout";

const EXERCISES_KEY = ["exercises"] as const;

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: EXERCISES_KEY,
    queryFn: getRemoteExercises,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category: string; muscleGroups?: string[] }) => {
      return createRemoteExercise(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteRemoteExercise(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });
    },
  });
}

export function useRenameExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return renameRemoteExercise(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });
    },
  });
}
