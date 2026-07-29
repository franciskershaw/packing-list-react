import { useState } from "react";

export interface ItemsDraftEntry {
  itemId: string;
  quantity: number;
}

export interface UseItemsDraftResult {
  entries: ItemsDraftEntry[];
  add: (itemId: string) => void;
  increment: (itemId: string) => void;
  bulkAdd: (itemIds: string[]) => void;
  delta: ItemsDraftEntry[];
}

const MAX_QUANTITY = 999;

export function useItemsDraft(initial: ItemsDraftEntry[]): UseItemsDraftResult {
  const [pending, setPending] = useState<Map<string, number>>(new Map());

  const initialQuantityById = new Map(
    initial.map((entry) => [entry.itemId, entry.quantity]),
  );

  function setQuantity(itemId: string, quantity: number) {
    setPending((current) => {
      const next = new Map(current);
      next.set(itemId, Math.min(quantity, MAX_QUANTITY));
      return next;
    });
  }

  function add(itemId: string) {
    setQuantity(itemId, (initialQuantityById.get(itemId) ?? 0) + 1);
  }

  function increment(itemId: string) {
    const current = pending.get(itemId) ?? initialQuantityById.get(itemId) ?? 0;
    setQuantity(itemId, current + 1);
  }

  function bulkAdd(itemIds: string[]) {
    setPending((current) => {
      const next = new Map(current);
      for (const itemId of itemIds) {
        if (!initialQuantityById.has(itemId) && !next.has(itemId)) {
          next.set(itemId, 1);
        }
      }
      return next;
    });
  }

  const entries = initial.map((entry) =>
    pending.has(entry.itemId)
      ? { itemId: entry.itemId, quantity: pending.get(entry.itemId)! }
      : entry,
  );
  for (const [itemId, quantity] of pending) {
    if (!initialQuantityById.has(itemId)) {
      entries.push({ itemId, quantity });
    }
  }

  const delta = Array.from(pending, ([itemId, quantity]) => ({
    itemId,
    quantity,
  }));

  return { entries, add, increment, bulkAdd, delta };
}
