import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "../components/ui/Toast";
import { apiFetch } from "../lib/api/client";
import { useApiMutation } from "../lib/Tanstack/useApiMutation";
import { useApiQuery } from "../lib/Tanstack/useApiQuery";

export interface Category {
  id: string;
  name: string;
  isSystem: boolean;
}

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(name: string): Promise<Category> {
  return apiFetch<Category>("/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateCategory(id: string, name: string): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

export function useCategories() {
  return useApiQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, name),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast(`Renamed to ${data.name}`, "success");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteCategory(id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast(`${variables.name} removed`, "success");
    },
  });
}
