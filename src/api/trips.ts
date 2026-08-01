import {
  keepPreviousData,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useToast } from "../components/ui/Toast";
import { apiFetch } from "../lib/api/client";
import { useApiMutation } from "../lib/Tanstack/useApiMutation";
import { useApiQuery } from "../lib/Tanstack/useApiQuery";

// Flat list-mode/create-response shape — categoryId included, unlike the nested detail-mode item below.
export interface PackingListItem {
  itemId: string;
  name: string;
  categoryId: string;
  quantity: number;
  notes: string | null;
  isPacked: boolean;
  sortOrder: number | null;
}

export interface PackingList {
  id: string;
  name: string;
  eventDate: string | null;
  templateId: string | null;
  items: PackingListItem[];
  itemCount: number;
  packedCount: number;
}

export interface PackingListDetailItem {
  itemId: string;
  name: string;
  quantity: number;
  notes: string | null;
  isPacked: boolean;
  sortOrder: number | null;
}

export interface PackingListCategory {
  id: string;
  name: string;
  items: PackingListDetailItem[];
}

// GET/PATCH /lists/:id shape — categories arrive pre-grouped server-side, no client-side grouping needed.
export interface PackingListDetail {
  id: string;
  name: string;
  eventDate: string | null;
  templateId: string | null;
  categories: PackingListCategory[];
}

export const TRIPS_QUERY_KEY = ["trips"] as const;

export function fetchTrips(archived = false): Promise<PackingList[]> {
  return apiFetch<PackingList[]>(archived ? "/lists?archived=true" : "/lists");
}

export function fetchTrip(id: string): Promise<PackingListDetail> {
  return apiFetch<PackingListDetail>(`/lists/${id}`);
}

export function createTrip(input: {
  name: string;
  eventDate?: string;
  templateId?: string;
}): Promise<PackingList> {
  return apiFetch<PackingList>("/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTrip(
  id: string,
  input: { name?: string; eventDate?: string },
): Promise<PackingListDetail> {
  return apiFetch<PackingListDetail>(`/lists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// DELETE /lists/:id is a soft-delete archive, not a hard delete — GetByID still resolves for archived trips.
export function archiveTrip(id: string): Promise<void> {
  return apiFetch<void>(`/lists/${id}`, { method: "DELETE" });
}

export function restoreTrip(id: string): Promise<void> {
  return apiFetch<void>(`/lists/${id}/unarchive`, { method: "POST" });
}

export function addTripItem(
  tripId: string,
  input: { itemId: string; quantity?: number; notes?: string },
): Promise<PackingListItem> {
  return apiFetch<PackingListItem>(`/lists/${tripId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTripItem(
  tripId: string,
  itemId: string,
  input: {
    quantity?: number;
    notes?: string;
    sortOrder?: number;
    isPacked?: boolean;
  },
): Promise<PackingListItem> {
  return apiFetch<PackingListItem>(`/lists/${tripId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function removeTripItem(tripId: string, itemId: string): Promise<void> {
  return apiFetch<void>(`/lists/${tripId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function bulkUpdateTripItems(
  tripId: string,
  items: { itemId: string; quantity: number }[],
): Promise<void> {
  return apiFetch<void>(`/lists/${tripId}/items/bulk`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export function packAllTripItems(tripId: string): Promise<void> {
  return apiFetch<void>(`/lists/${tripId}/pack-all`, { method: "POST" });
}

export function unpackAllTripItems(tripId: string): Promise<void> {
  return apiFetch<void>(`/lists/${tripId}/unpack-all`, { method: "POST" });
}

function invalidateTrips(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
}

export function useTrips(archived = false) {
  return useApiQuery({
    queryKey: [...TRIPS_QUERY_KEY, "list", archived],
    queryFn: () => fetchTrips(archived),
  });
}

export function useTrip(id: string | undefined) {
  return useApiQuery({
    queryKey: [...TRIPS_QUERY_KEY, id],
    queryFn: () => fetchTrip(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({
      templateName: _templateName,
      ...input
    }: {
      name: string;
      eventDate?: string;
      templateId?: string;
      templateName?: string; // toast-only context, not sent to the API
    }) => createTrip(input),
    onSuccess: (_data, variables) => {
      invalidateTrips(queryClient);
      toast(
        variables.templateId
          ? `Seeded from ${variables.templateName}`
          : "A fresh trip awaits",
        "success",
      );
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      eventDate?: string;
    }) => updateTrip(id, input),
    onSuccess: () => invalidateTrips(queryClient),
  });
}

export function useArchiveTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({ id }: { id: string }) => archiveTrip(id),
    onSuccess: () => {
      invalidateTrips(queryClient);
      toast("Tucked away in the archive", "success");
    },
  });
}

export function useRestoreTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useApiMutation({
    mutationFn: ({ id }: { id: string }) => restoreTrip(id),
    onSuccess: () => {
      invalidateTrips(queryClient);
      toast("Back on the board", "success");
    },
  });
}

export function useAddTripItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      tripId,
      ...input
    }: {
      tripId: string;
      itemId: string;
      quantity?: number;
      notes?: string;
    }) => addTripItem(tripId, input),
    onSuccess: () => invalidateTrips(queryClient),
  });
}

export function useRemoveTripItem() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({ tripId, itemId }: { tripId: string; itemId: string }) =>
      removeTripItem(tripId, itemId),
    onSuccess: () => invalidateTrips(queryClient),
  });
}

export function useBulkUpdateTripItems() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({
      tripId,
      items,
    }: {
      tripId: string;
      items: { itemId: string; quantity: number }[];
    }) => bulkUpdateTripItems(tripId, items),
    onSuccess: () => invalidateTrips(queryClient),
  });
}

interface TripDetailPatchContext {
  queryKey: readonly [...typeof TRIPS_QUERY_KEY, string];
  previous: PackingListDetail | undefined;
}

function patchTripItems(
  detail: PackingListDetail,
  patchItem: (item: PackingListDetailItem) => PackingListDetailItem,
): PackingListDetail {
  return {
    ...detail,
    categories: detail.categories.map((category) => ({
      ...category,
      items: category.items.map(patchItem),
    })),
  };
}

// Shared by useUpdateTripItem and useBulkSetPacked, the only two optimistic
// mutations here — packed-state is read by more than the row that changed it.
function useOptimisticTripPatch<
  TVariables extends { tripId: string },
  TData = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  patchItem: (
    item: PackingListDetailItem,
    variables: TVariables,
  ) => PackingListDetailItem,
) {
  const queryClient = useQueryClient();
  return useApiMutation<TData, TVariables, TripDetailPatchContext>({
    mutationFn,
    onMutate: async (variables) => {
      const queryKey = [...TRIPS_QUERY_KEY, variables.tripId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PackingListDetail>(queryKey);

      if (previous) {
        queryClient.setQueryData(
          queryKey,
          patchTripItems(previous, (item) => patchItem(item, variables)),
        );
      }

      return { queryKey, previous };
    },
    onError: (_error, _variables, onMutateResult) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(
          onMutateResult.queryKey,
          onMutateResult.previous,
        );
      }
    },
    onSettled: () => invalidateTrips(queryClient),
  });
}

interface UpdateTripItemVariables {
  tripId: string;
  itemId: string;
  quantity?: number;
  notes?: string;
  sortOrder?: number;
  isPacked?: boolean;
}

export function useUpdateTripItem() {
  return useOptimisticTripPatch<UpdateTripItemVariables, PackingListItem>(
    ({ tripId, itemId, ...input }) => updateTripItem(tripId, itemId, input),
    (item, { itemId, quantity, notes, sortOrder, isPacked }) =>
      item.itemId === itemId
        ? {
            ...item,
            ...(quantity !== undefined && { quantity }),
            ...(notes !== undefined && { notes }),
            ...(sortOrder !== undefined && { sortOrder }),
            ...(isPacked !== undefined && { isPacked }),
          }
        : item,
  );
}

function useBulkSetPacked(
  mutationFn: (tripId: string) => Promise<void>,
  isPacked: boolean,
) {
  return useOptimisticTripPatch<{ tripId: string }, void>(
    ({ tripId }) => mutationFn(tripId),
    (item) => ({ ...item, isPacked }),
  );
}

export function usePackAllTripItems() {
  return useBulkSetPacked(packAllTripItems, true);
}

export function useUnpackAllTripItems() {
  return useBulkSetPacked(unpackAllTripItems, false);
}
