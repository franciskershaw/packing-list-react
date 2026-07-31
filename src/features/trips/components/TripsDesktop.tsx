import { EmptyStatePanel } from "../../../components/detail/EmptyStatePanel";
import { ProgressRing } from "../../../components/detail/ProgressRing";
import { RailRow } from "../../../components/detail/RailRow";
import { TripDetailHeader } from "../../../components/detail/TripDetailHeader";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/AuthContext";
import { formatTripDate } from "../formatTripDate";
import { tripItemCount } from "../tripItemCount";
import type { UseTripsScreenResult } from "../useTripsScreen";
import { ArchiveButton } from "./ArchiveButton";
import { ArchivedTripRow } from "./ArchivedTripRow";
import { TripDetailBody } from "./TripDetailBody";

export function TripsDesktop({
  trips,
  archivedTrips,
  isLoading,
  selectedTrip,
  isSelectedLoading,
  selectTrip,
  archiveTrip,
  restoreTrip,
  openNewTrip,
  openAddItems,
  showArchived,
  toggleArchived,
  isEditMode,
  toggleEditMode,
  collapsedCategoryIds,
  toggleCategoryCollapsed,
}: UseTripsScreenResult) {
  const { user } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex h-full gap-6">
      <aside className="flex w-96 shrink-0 flex-col gap-4 border-r border-border py-12 pr-6 pl-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              {user?.name
                ? `Where to next, ${user.name.split(" ")[0]}?`
                : "Your trips"}
            </h1>
            <p className="mt-0.5 text-sm text-secondary">
              {trips.length === 0
                ? "A blank slate."
                : `${trips.length} trip${trips.length === 1 ? "" : "s"} in the works.`}
            </p>
          </div>
          <Button variant="primary" size="compact" onClick={openNewTrip}>
            + New trip
          </Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {trips.length === 0 ? (
            <EmptyStatePanel
              title="Nowhere to be?"
              message="Start a list anyway — future you says thanks."
              actionLabel="+ New trip"
              onAction={openNewTrip}
            />
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              {trips.map((trip) => (
                <RailRow
                  key={trip.id}
                  leading={
                    <ProgressRing
                      packed={trip.packedCount}
                      total={trip.itemCount}
                    />
                  }
                  selected={trip.id === selectedTrip?.id}
                  onClick={() => selectTrip(trip.id)}
                >
                  <p className="truncate font-heading text-base font-bold text-heading">
                    {trip.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-secondary">
                    {formatTripDate(trip.eventDate)} · {trip.packedCount} of{" "}
                    {trip.itemCount} packed
                  </p>
                </RailRow>
              ))}
            </div>
          )}

          {archivedTrips.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={toggleArchived}
                className="cursor-pointer self-start text-sm font-bold text-secondary"
              >
                {showArchived
                  ? `Hide archived (${archivedTrips.length})`
                  : `Show archived (${archivedTrips.length})`}
              </button>
              {showArchived &&
                archivedTrips.map((trip) => (
                  <ArchivedTripRow
                    key={trip.id}
                    trip={trip}
                    onRestore={() => restoreTrip(trip.id)}
                  />
                ))}
            </div>
          )}
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {selectedTrip ? (
          <>
            <div className="sticky top-0 z-10 bg-bg pt-12 pr-12 pb-4">
              <TripDetailHeader
                key={selectedTrip.id}
                trip={selectedTrip}
                onAddItems={openAddItems}
                trailing={
                  <>
                    <ArchiveButton
                      onClick={() => archiveTrip(selectedTrip.id)}
                    />
                    {tripItemCount(selectedTrip) > 0 && (
                      <Button variant="outline" onClick={toggleEditMode}>
                        {isEditMode ? "Done" : "Edit"}
                      </Button>
                    )}
                  </>
                }
              />
            </div>
            <div key={selectedTrip.id} className="pr-12 pb-12">
              <TripDetailBody
                trip={selectedTrip}
                isEditMode={isEditMode}
                collapsedCategoryIds={collapsedCategoryIds}
                toggleCategoryCollapsed={toggleCategoryCollapsed}
                onAddItems={openAddItems}
              />
            </div>
          </>
        ) : isSelectedLoading ? null : (
          <div className="flex h-full items-center justify-center py-12 pr-12">
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
