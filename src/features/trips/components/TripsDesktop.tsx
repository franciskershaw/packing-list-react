import type { UseTripsScreenResult } from "../useTripsScreen";

// Placeholder body for PACKFE-005 Piece 3 — proves the route-driven
// select/create/archive loop works end-to-end. Piece 6 replaces this
// wholesale with the real screenshot-grounded markup. The bare item list
// and "+ Add items" button are Piece 4 additions, temporary until Piece 6.
export function TripsDesktop({
  trips,
  isLoading,
  selectedTrip,
  selectTrip,
  archiveTrip,
  openNewTrip,
  openAddItems,
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
      <main>
        {selectedTrip ? (
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
        ) : (
          <p>No trip selected</p>
        )}
      </main>
    </div>
  );
}
