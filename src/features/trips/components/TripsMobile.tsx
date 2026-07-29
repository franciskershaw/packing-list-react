import type { UseTripsScreenResult } from "../useTripsScreen";

// Placeholder body for PACKFE-005 Piece 3 — proves the route-driven
// select/create/archive loop works end-to-end. Piece 6 replaces this
// wholesale with the real screenshot-grounded markup. The bare item list
// and "+ Add items" button are Piece 4 additions, temporary until Piece 6.
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
            <button onClick={openAddItems}>+ Add items</button>
            {selectedTrip.categories.map((category) => (
              <div key={category.id}>
                <p>{category.name}</p>
                <ul>
                  {category.items.map((item) => (
                    <li key={item.itemId}>
                      {item.name} ×{item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
