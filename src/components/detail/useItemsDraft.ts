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

export function useItemsDraft(initial: ItemsDraftEntry[]): UseItemsDraftResult {
  return {
    entries: initial,
    add: () => {},
    increment: () => {},
    bulkAdd: () => {},
    delta: [],
  };
}
