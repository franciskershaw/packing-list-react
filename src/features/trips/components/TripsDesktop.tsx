import { TripDetailHeader } from "../../../components/detail/TripDetailHeader";
import { Button } from "../../../components/ui/Button";
import type { UseTripsScreenResult } from "../useTripsScreen";
import { ArchiveButton } from "./ArchiveButton";
import { TripDetailBody } from "./TripDetailBody";

// Detail pane rebuilt for Piece 6. The rail/list body below is still
// Piece 3's placeholder, unchanged — Piece 7's job.
export function TripsDesktop({
  trips,
  isLoading,
  selectedTrip,
  isSelectedLoading,
  selectTrip,
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

  return (
    <div className="flex gap-6 p-12">
      <aside className="flex flex-col gap-2">
        <button onClick={openNewTrip}>+ New trip</button>
        <ul>
          {trips.map((trip) => (
            <li key={trip.id}>
              <button onClick={() => selectTrip(trip.id)}>{trip.name}</button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="min-h-0 min-w-0 flex-1">
        {selectedTrip ? (
          <div key={selectedTrip.id} className="flex flex-col gap-4">
            <TripDetailHeader
              trip={selectedTrip}
              onAddItems={openAddItems}
              trailing={
                <>
                  <ArchiveButton onClick={() => archiveTrip(selectedTrip.id)} />
                  <Button variant="outline" onClick={toggleEditMode}>
                    {isEditMode ? "Done" : "Edit"}
                  </Button>
                </>
              }
            />
            <TripDetailBody
              trip={selectedTrip}
              isEditMode={isEditMode}
              collapsedCategoryIds={collapsedCategoryIds}
              toggleCategoryCollapsed={toggleCategoryCollapsed}
              onAddItems={openAddItems}
            />
          </div>
        ) : isSelectedLoading ? null : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-75 text-center">
              <p className="font-heading text-lg font-bold text-heading">
                Pick a trip
              </p>
              <p className="mt-1 text-sm text-secondary">
                Pick one on the left to start packing.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
