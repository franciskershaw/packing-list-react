import type { PackingList } from "../../api/trips";

// Ascending by date, undated trips last — eventDate is an ISO date-only
// string ("YYYY-MM-DD"), so plain string comparison already sorts
// chronologically.
export function sortTripsByDate(trips: PackingList[]): PackingList[] {
  return [...trips].sort((a, b) => {
    if (a.eventDate === null && b.eventDate === null) {
      return 0;
    }
    if (a.eventDate === null) {
      return 1;
    }
    if (b.eventDate === null) {
      return -1;
    }
    return a.eventDate.localeCompare(b.eventDate);
  });
}
