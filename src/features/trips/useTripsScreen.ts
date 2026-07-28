import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  useArchiveTrip,
  useRestoreTrip,
  useTrip,
  useTrips,
} from "../../api/trips";
import type { PackingList, PackingListDetail } from "../../api/trips";

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

  const trips = useTrips(false);
  const archivedTrips = useTrips(true);
  const selected = useTrip(tripId);
  const archiveTripMutation = useArchiveTrip();
  const restoreTripMutation = useRestoreTrip();

  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
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

  return {
    trips: trips.data ?? [],
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
    openNewTrip: () => setIsNewTripOpen(true),
    closeNewTrip: () => setIsNewTripOpen(false),
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
