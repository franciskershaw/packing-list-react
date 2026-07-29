import { describe, expect, it } from "vitest";

import type { PackingList } from "../../api/trips";
import { sortTripsByDate } from "./sortTripsByDate";

function trip(id: string, eventDate: string | null): PackingList {
  return {
    id,
    name: id,
    eventDate,
    templateId: null,
    items: [],
    itemCount: 0,
    packedCount: 0,
  };
}

describe("sortTripsByDate", () => {
  it("sorts dated trips ascending", () => {
    const trips = [trip("later", "2026-09-01"), trip("sooner", "2026-08-01")];

    expect(sortTripsByDate(trips).map((t) => t.id)).toEqual([
      "sooner",
      "later",
    ]);
  });

  it("puts undated trips last, regardless of input order", () => {
    const trips = [trip("undated", null), trip("dated", "2026-08-01")];

    expect(sortTripsByDate(trips).map((t) => t.id)).toEqual([
      "dated",
      "undated",
    ]);
  });

  it("does not mutate the input array", () => {
    const trips = [trip("b", "2026-09-01"), trip("a", "2026-08-01")];
    const original = [...trips];

    sortTripsByDate(trips);

    expect(trips).toEqual(original);
  });
});
