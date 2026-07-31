import type { PackingListDetail } from "../../api/trips";

export function tripItemCount(trip: PackingListDetail): number {
  return trip.categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
}
