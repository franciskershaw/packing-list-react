import { BackHeader } from "../../../components/detail/BackHeader";
import { EmptyStatePanel } from "../../../components/detail/EmptyStatePanel";
import { ProgressRing } from "../../../components/detail/ProgressRing";
import { RailRow } from "../../../components/detail/RailRow";
import { TripDetailHeader } from "../../../components/detail/TripDetailHeader";
import { MOBILE_NAV_CLEARANCE_SPACER_CLASS } from "../../../components/nav/AppShell";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { useAuth } from "../../auth/AuthContext";
import { formatTripDate } from "../formatTripDate";
import type { UseTripsScreenResult } from "../useTripsScreen";
import { ArchiveButton } from "./ArchiveButton";
import { ArchivedTripRow } from "./ArchivedTripRow";
import { TripDetailBody } from "./TripDetailBody";

export function TripsMobile({
  trips,
  archivedTrips,
  isLoading,
  selectedTripId,
  selectedTrip,
  selectTrip,
  goToList,
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
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (selectedTripId) {
    return (
      <div className="flex flex-col">
        <div className="sticky top-0 z-10 flex flex-col gap-4 bg-bg p-6 pb-4">
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
            <TripDetailHeader
              key={selectedTrip.id}
              trip={selectedTrip}
              onAddItems={openAddItems}
            />
          )}
        </div>
        {selectedTrip && (
          <div key={selectedTrip.id} className="px-6 pb-6">
            <TripDetailBody
              trip={selectedTrip}
              isEditMode={isEditMode}
              collapsedCategoryIds={collapsedCategoryIds}
              toggleCategoryCollapsed={toggleCategoryCollapsed}
              onAddItems={openAddItems}
            />
          </div>
        )}
        <div className={MOBILE_NAV_CLEARANCE_SPACER_CLASS} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
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
        <Button variant="accent" className="shrink-0" onClick={openNewTrip}>
          + New trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyStatePanel
          title="Nowhere to be?"
          message="Start a list anyway — future you says thanks."
          actionLabel="+ New trip"
          onAction={openNewTrip}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((trip) => (
            <RailRow
              key={trip.id}
              leading={
                <ProgressRing
                  packed={trip.packedCount}
                  total={trip.itemCount}
                />
              }
              surface="flush"
              showChevron
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
        <div className="flex flex-col gap-3">
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
  );
}
