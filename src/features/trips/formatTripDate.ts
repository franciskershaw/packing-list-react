// Parses at midday, not midnight, so a UTC-behind-local timezone can't roll
// a date-only string back to the previous day.
export function formatTripDate(date: string | null): string {
  if (date === null) {
    return "No date yet";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
