import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  useArchiveTrip,
  useRestoreTrip,
  useTrip,
  useTrips,
} from "../../api/trips";
import type { PackingList, PackingListDetail } from "../../api/trips";
import { sortTripsByDate } from "./sortTripsByDate";

export interface UseTripsScreenResult {
  trips: PackingList[];
  archivedTrips: PackingList[];
  isLoading: boolean;
  selectedTripId: string | undefined;
  selectedTrip: PackingListDetail | undefined;
  isSelectedLoading: boolean;
  selectTrip: (id: string) => void;
  goToList: () => void;
  archiveTrip: (id: string) => void;
  restoreTrip: (id: string) => void;
  isNewTripOpen: boolean;
  preselectedTemplateId: string | null;
  openNewTrip: () => void;
  closeNewTrip: () => void;
  isAddItemsOpen: boolean;
  openAddItems: () => void;
  closeAddItems: () => void;
  showArchived: boolean;
  toggleArchived: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  collapsedCategoryIds: Set<string>;
  toggleCategoryCollapsed: (categoryId: string) => void;
}

export function useTripsScreen(): UseTripsScreenResult {
  const { tripId } = useParams<{ tripId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const trips = useTrips(false);
  const archivedTrips = useTrips(true);
  const selected = useTrip(tripId);
  const archiveTripMutation = useArchiveTrip();
  const restoreTripMutation = useRestoreTrip();

  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<
    string | null
  >(null);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(
    new Set(),
  );

  // isEditMode/collapsed groups are per-trip — must not leak into the next
  // trip selected, including via browser back/forward, not just the
  // explicit selectTrip/goToList callbacks below.
  useEffect(() => {
    setIsEditMode(false);
    setCollapsedCategoryIds(new Set());
  }, [tripId]);

  // Cross-screen open, per Templates' "Use for a new trip":
  // /trips?new=<templateId> opens the modal preselecting that template,
  // then the param is dropped so it doesn't reopen on refresh/back-nav.
  const newFromTemplateId = searchParams.get("new");
  useEffect(() => {
    if (newFromTemplateId) {
      setPreselectedTemplateId(newFromTemplateId);
      setIsNewTripOpen(true);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("new");
          return next;
        },
        { replace: true },
      );
    }
  }, [newFromTemplateId, setSearchParams]);

  return {
    trips: sortTripsByDate(trips.data ?? []),
    archivedTrips: archivedTrips.data ?? [],
    isLoading: trips.isLoading,
    selectedTripId: tripId,
    selectedTrip: selected.data,
    isSelectedLoading: selected.isLoading,
    selectTrip: (id) => navigate(`/trips/${id}`),
    goToList: () => navigate("/trips"),
    archiveTrip: (id) =>
      archiveTripMutation.mutate(
        { id },
        { onSuccess: () => navigate("/trips") },
      ),
    restoreTrip: (id) => restoreTripMutation.mutate({ id }),
    isNewTripOpen,
    preselectedTemplateId,
    openNewTrip: () => setIsNewTripOpen(true),
    closeNewTrip: () => {
      setIsNewTripOpen(false);
      setPreselectedTemplateId(null);
    },
    isAddItemsOpen,
    openAddItems: () => setIsAddItemsOpen(true),
    closeAddItems: () => setIsAddItemsOpen(false),
    showArchived,
    toggleArchived: () => setShowArchived((v) => !v),
    isEditMode,
    toggleEditMode: () => setIsEditMode((v) => !v),
    collapsedCategoryIds,
    toggleCategoryCollapsed: (categoryId) =>
      setCollapsedCategoryIds((prev) => {
        const next = new Set(prev);
        if (next.has(categoryId)) {
          next.delete(categoryId);
        } else {
          next.add(categoryId);
        }
        return next;
      }),
  };
}
