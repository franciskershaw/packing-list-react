import { BackHeader } from "../../../components/detail/BackHeader";
import { TripDetailHeader } from "../../../components/detail/TripDetailHeader";
import { Button } from "../../../components/ui/Button";
import type { UseTripsScreenResult } from "../useTripsScreen";
import { ArchiveButton } from "./ArchiveButton";
import { TripDetailBody } from "./TripDetailBody";

// Detail view rebuilt for Piece 6. The no-selection list body below is
// still Piece 3's placeholder, unchanged — Piece 7's job.
export function TripsMobile({
  trips,
  isLoading,
  selectedTripId,
  selectedTrip,
  selectTrip,
  goToList,
  archiveTrip,
  openNewTrip,
  openAddItems,
  isEditMode,
  toggleEditMode,
  collapsedCategoryIds,
  toggleCategoryCollapsed,
}: UseTripsScreenResult) {
  if (isLoading) {
    return null;
  }

  if (selectedTripId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <BackHeader
          onBack={goToList}
          trailing={
            selectedTrip && (
              <>
                <ArchiveButton onClick={() => archiveTrip(selectedTrip.id)} />
                <Button variant="outline" onClick={toggleEditMode}>
                  {isEditMode ? "Done" : "Edit"}
                </Button>
              </>
            )
          }
        />
        {selectedTrip && (
          <div key={selectedTrip.id} className="flex flex-col gap-4">
            <TripDetailHeader trip={selectedTrip} onAddItems={openAddItems} />
            <TripDetailBody
              trip={selectedTrip}
              isEditMode={isEditMode}
              collapsedCategoryIds={collapsedCategoryIds}
              toggleCategoryCollapsed={toggleCategoryCollapsed}
              onAddItems={openAddItems}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <button onClick={openNewTrip}>+ New trip</button>
      <ul>
        {trips.map((trip) => (
          <li key={trip.id}>
            <button onClick={() => selectTrip(trip.id)}>{trip.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
