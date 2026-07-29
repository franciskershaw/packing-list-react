import { useState } from "react";

export interface ItemsDraftEntry {
  itemId: string;
  quantity: number;
}

export interface UseItemsDraftResult {
  entries: ItemsDraftEntry[];
  add: (itemId: string) => void;
  increment: (itemId: string) => void;
  decrement: (itemId: string) => void;
  bulkAdd: (itemIds: string[]) => void;
  delta: ItemsDraftEntry[];
}

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;

export function useItemsDraft(initial: ItemsDraftEntry[]): UseItemsDraftResult {
  const [pending, setPending] = useState<Map<string, number>>(new Map());

  const initialQuantityById = new Map(
    initial.map((entry) => [entry.itemId, entry.quantity]),
  );

  function effectiveQuantity(itemId: string): number {
    return pending.get(itemId) ?? initialQuantityById.get(itemId) ?? 0;
  }

  function setQuantity(itemId: string, quantity: number) {
    setPending((current) => {
      const next = new Map(current);
      next.set(itemId, Math.min(Math.max(quantity, 0), MAX_QUANTITY));
      return next;
    });
  }

  // Dropping below the floor means "gone" — a session-local item that was
  // never on the server just disappears; a pre-existing one is set to 0,
  // which the delta contract already reads as remove.
  function clear(itemId: string) {
    if (initialQuantityById.has(itemId)) {
      setQuantity(itemId, 0);
    } else {
      setPending((current) => {
        const next = new Map(current);
        next.delete(itemId);
        return next;
      });
    }
  }

  function add(itemId: string) {
    setQuantity(itemId, MIN_QUANTITY);
  }

  function increment(itemId: string) {
    setQuantity(itemId, effectiveQuantity(itemId) + 1);
  }

  function decrement(itemId: string) {
    const current = effectiveQuantity(itemId);
    if (current <= MIN_QUANTITY) {
      clear(itemId);
      return;
    }
    setQuantity(itemId, current - 1);
  }

  function bulkAdd(itemIds: string[]) {
    setPending((current) => {
      const next = new Map(current);
      for (const itemId of itemIds) {
        const effective = next.has(itemId)
          ? next.get(itemId)!
          : (initialQuantityById.get(itemId) ?? 0);
        if (effective === 0) {
          next.set(itemId, MIN_QUANTITY);
        }
      }
      return next;
    });
  }

  const entries: ItemsDraftEntry[] = [];
  for (const entry of initial) {
    const quantity = pending.has(entry.itemId)
      ? pending.get(entry.itemId)!
      : entry.quantity;
    if (quantity > 0) {
      entries.push({ itemId: entry.itemId, quantity });
    }
  }
  for (const [itemId, quantity] of pending) {
    if (!initialQuantityById.has(itemId) && quantity > 0) {
      entries.push({ itemId, quantity });
    }
  }

  const delta: ItemsDraftEntry[] = [];
  for (const [itemId, quantity] of pending) {
    // Only entries that actually differ from what the server already has
    // are real — e.g. a session-added-then-removed item settling back at
    // 0 is a no-op.
    if (quantity !== (initialQuantityById.get(itemId) ?? 0)) {
      delta.push({ itemId, quantity });
    }
  }

  return { entries, add, increment, decrement, bulkAdd, delta };
}
