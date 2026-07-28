import type { UseTripsScreenResult } from "../useTripsScreen";

// Placeholder body for PACKFE-005 Piece 3 — proves the route-driven
// select/create/archive loop works end-to-end. Piece 4/5/6 replace this
// wholesale with the real screenshot-grounded markup.
export function TripsMobile({
  trips,
  isLoading,
  selectedTripId,
  selectedTrip,
  selectTrip,
  goToList,
  archiveTrip,
  openNewTrip,
}: UseTripsScreenResult) {
  if (isLoading) {
    return null;
  }

  if (selectedTripId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <button onClick={goToList}>Back</button>
        {selectedTrip && (
          <>
            <p>{selectedTrip.name}</p>
            <button onClick={() => archiveTrip(selectedTrip.id)}>
              Archive
            </button>
          </>
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
