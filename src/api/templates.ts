import { keepPreviousData, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../components/ui/Toast";
import { apiFetch } from "../lib/api/client";
import { useApiMutation } from "../lib/Tanstack/useApiMutation";
import { useApiQuery } from "../lib/Tanstack/useApiQuery";

export interface Template {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
  itemCount: number;
}

export interface TemplateItem {
  itemId: string;
  name: string;
  quantity: number;
  notes: string | null;
}

export const TEMPLATES_QUERY_KEY = ["templates"] as const;

export function fetchTemplates(): Promise<Template[]> {
  return apiFetch<Template[]>("/templates");
}

export function fetchTemplate(id: string): Promise<Template> {
  return apiFetch<Template>(`/templates/${id}`);
}

export function createTemplate(input: {
  name: string;
  description?: string;
}): Promise<Template> {
  return apiFetch<Template>("/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTemplate(
  id: string,
  input: { name?: string; description?: string },
): Promise<Template> {
  return apiFetch<Template>(`/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/templates/${id}`, { method: "DELETE" });
}

export function addTemplateItem(
  templateId: string,
  input: { itemId: string; quantity?: number; notes?: string },
): Promise<TemplateItem> {
  return apiFetch<TemplateItem>(`/templates/${templateId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTemplateItem(
  templateId: string,
  itemId: string,
  input: { quantity?: number; notes?: string },
): Promise<TemplateItem> {
  return apiFetch<TemplateItem>(`/templates/${templateId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function removeTemplateItem(
  templateId: string,
  itemId: string,
): Promise<void> {
  return apiFetch<void>(`/templates/${templateId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function bulkUpdateTemplateItems(
  templateId: string,
  items: { itemId: string; quantity: number }[],
): Promise<void> {
  return apiFetch<void>(`/templates/${templateId}/items/bulk`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export function useTemplates() {
  return useApiQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: fetchTemplates,
  });
}

export function useTemplate(id: string | undefined) {
  return useApiQuery({
    queryKey: [...TEMPLATES_QUERY_KEY, id],
    queryFn: () => fetchTemplate(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string;
    }) => updateTemplate(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({ id }: { id: string; name: string }) => deleteTemplate(id),
    onSuccess: (_data, variables) => {
      // exact: true — a prefix match would refetch (and 404) the
      // still-mounted detail query for the id just deleted.
      void queryClient.invalidateQueries({
        queryKey: TEMPLATES_QUERY_KEY,
        exact: true,
      });
      toast(`${variables.name} removed`, "success");
    },
  });
}

export function useAddTemplateItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      templateId,
      ...input
    }: {
      templateId: string;
      itemId: string;
      quantity?: number;
      notes?: string;
    }) => addTemplateItem(templateId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TEMPLATES_QUERY_KEY, variables.templateId],
      });
    },
  });
}

export function useUpdateTemplateItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      templateId,
      itemId,
      ...input
    }: {
      templateId: string;
      itemId: string;
      quantity?: number;
      notes?: string;
    }) => updateTemplateItem(templateId, itemId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TEMPLATES_QUERY_KEY, variables.templateId],
      });
    },
  });
}

export function useRemoveTemplateItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      templateId,
      itemId,
    }: {
      templateId: string;
      itemId: string;
    }) => removeTemplateItem(templateId, itemId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TEMPLATES_QUERY_KEY, variables.templateId],
      });
    },
  });
}

export function useBulkUpdateTemplateItems() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      templateId,
      items,
    }: {
      templateId: string;
      items: { itemId: string; quantity: number }[];
    }) => bulkUpdateTemplateItems(templateId, items),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TEMPLATES_QUERY_KEY, variables.templateId],
      });
    },
  });
}
