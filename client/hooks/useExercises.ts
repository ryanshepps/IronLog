import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { ExerciseRecord } from "@shared/schema";

const EXERCISES_KEY = ["/api/exercises"] as const;

export function useExercises() {
  return useQuery<ExerciseRecord[]>({
    queryKey: EXERCISES_KEY,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category: string; muscleGroups?: string[] }) => {
      const res = await apiRequest("POST", "/api/exercises", data);
      return res.json() as Promise<ExerciseRecord>;
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
      await apiRequest("DELETE", `/api/exercises/${id}`);
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
      const res = await apiRequest("PATCH", `/api/exercises/${id}`, { name });
      return res.json() as Promise<ExerciseRecord>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISES_KEY });
    },
  });
}
