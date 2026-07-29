import { ChevronRight } from "lucide-react";

import type { PackingList } from "../../../api/trips";
import { ProgressRing } from "../../../components/detail/ProgressRing";
import { formatTripDate } from "../formatTripDate";

interface TripListCardProps {
  trip: PackingList;
  onClick: () => void;
}

export function TripListCard({ trip, onClick }: TripListCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3 text-left active:opacity-70"
    >
      <ProgressRing packed={trip.packedCount} total={trip.itemCount} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-base font-bold text-heading">
          {trip.name}
        </p>
        <p className="mt-0.5 truncate text-sm text-secondary">
          {formatTripDate(trip.eventDate)} · {trip.packedCount} of{" "}
          {trip.itemCount} packed
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-tertiary" />
    </button>
  );
}
