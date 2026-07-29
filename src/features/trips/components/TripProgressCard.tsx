import { usePackAllTripItems, useUnpackAllTripItems } from "../../../api/trips";
import { ProgressBar } from "../../../components/detail/ProgressBar";
import { Button } from "../../../components/ui/Button";

interface TripProgressCardProps {
  tripId: string;
  packed: number;
  total: number;
}

export function TripProgressCard({
  tripId,
  packed,
  total,
}: TripProgressCardProps) {
  const packAll = usePackAllTripItems();
  const unpackAll = useUnpackAllTripItems();
  const percent = total > 0 ? Math.round((packed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-base font-bold text-heading">
          {packed} of {total} packed
        </span>
        <span className="text-sm font-bold text-accent">{percent}%</span>
      </div>
      <ProgressBar packed={packed} total={total} />
      <div className="flex gap-3">
        <Button variant="success" onClick={() => packAll.mutate({ tripId })}>
          Pack it all
        </Button>
        <Button
          variant="default"
          size="compact"
          onClick={() => unpackAll.mutate({ tripId })}
        >
          Reset all
        </Button>
      </div>
    </div>
  );
}
