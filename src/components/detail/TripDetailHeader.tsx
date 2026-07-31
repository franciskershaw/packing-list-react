import type { ReactNode } from "react";

import type { PackingListDetail } from "../../api/trips";
import { useUpdateTrip } from "../../api/trips";
import { formatTripDate } from "../../features/trips/formatTripDate";
import { tripItemCount } from "../../features/trips/tripItemCount";
import { Button } from "../ui/Button";
import { InlineEditableHeading } from "./InlineEditableHeading";
import { useInlineEditableField } from "./useInlineEditableField";

interface TripDetailHeaderProps {
  trip: PackingListDetail;
  onAddItems: () => void;
  trailing?: ReactNode;
}

export function TripDetailHeader({
  trip,
  onAddItems,
  trailing,
}: TripDetailHeaderProps) {
  const updateTrip = useUpdateTrip();

  const titleField = useInlineEditableField({
    savedValue: trip.name,
    onSave: (name) => updateTrip.mutate({ id: trip.id, name }),
    allowBlank: false,
  });

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <InlineEditableHeading variant="title" {...titleField} />
        <p className="text-sm text-secondary">
          {formatTripDate(trip.eventDate)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        {tripItemCount(trip) > 0 && (
          <Button variant="accent" onClick={onAddItems}>
            + Add items
          </Button>
        )}
      </div>
    </div>
  );
}
