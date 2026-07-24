import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../lib/api/client";
import { useApiMutation } from "../lib/Tanstack/useApiMutation";

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  isSystem: boolean;
}

export interface ItemsQueryParams {
  categoryId?: string;
  search?: string;
}

export const ITEMS_QUERY_KEY = ["items"] as const;

export function fetchItems(params?: ItemsQueryParams): Promise<Item[]> {
  const query = new URLSearchParams();
  if (params?.categoryId) {
    query.set("category_id", params.categoryId);
  }
  if (params?.search) {
    query.set("search", params.search);
  }
  const queryString = query.toString();
  return apiFetch<Item[]>(`/items${queryString ? `?${queryString}` : ""}`);
}

export function createItem(input: {
  name: string;
  categoryId: string;
}): Promise<Item> {
  return apiFetch<Item>("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateItem(
  id: string,
  input: { name?: string; categoryId?: string },
): Promise<Item> {
  return apiFetch<Item>(`/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteItem(id: string): Promise<void> {
  return apiFetch<void>(`/items/${id}`, { method: "DELETE" });
}

export function useItems(params?: ItemsQueryParams) {
  return useQuery({
    queryKey: [...ITEMS_QUERY_KEY, params],
    queryFn: () => fetchItems(params),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: createItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      categoryId?: string;
    }) => updateItem(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
