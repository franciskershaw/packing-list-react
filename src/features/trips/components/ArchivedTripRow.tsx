import type { PackingList } from "../../../api/trips";
import { Button } from "../../../components/ui/Button";
import { formatTripDate } from "../formatTripDate";

interface ArchivedTripRowProps {
  trip: PackingList;
  onRestore: () => void;
}

// Non-tappable — this row's only interaction is the Restore pill,
// unlike TripListCard's whole-row click into the active list.
export function ArchivedTripRow({ trip, onRestore }: ArchivedTripRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-subtle px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-base font-bold text-heading">
          {trip.name}
        </p>
        <p className="mt-0.5 truncate text-sm text-secondary">
          {formatTripDate(trip.eventDate)} · {trip.packedCount} of{" "}
          {trip.itemCount} packed
        </p>
      </div>
      <Button variant="success" onClick={onRestore}>
        Restore
      </Button>
    </div>
  );
}
