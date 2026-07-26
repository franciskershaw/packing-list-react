import { useEffect, useRef, useState } from "react";

export interface UseDebouncedQuantityOptions {
  value: number;
  min?: number;
  onCommit: (value: number) => Promise<unknown>;
}

export interface UseDebouncedQuantityResult {
  value: number;
  increment: () => void;
  decrement: () => void;
}

const COMMIT_DELAY_MS = 400;

export function useDebouncedQuantity({
  value,
  min = 1,
  onCommit,
}: UseDebouncedQuantityOptions): UseDebouncedQuantityResult {
  const [draft, setDraft] = useState(value);
  // Ref, not just state, so a same-tick burst of taps each build on the last tap.
  const draftRef = useRef(value);
  const valueRef = useRef(value);
  valueRef.current = value;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  function schedule(next: number) {
    draftRef.current = next;
    setDraft(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCommit(next).catch(() => {
        draftRef.current = valueRef.current;
        setDraft(valueRef.current);
      });
    }, COMMIT_DELAY_MS);
  }

  return {
    value: draft,
    increment: () => schedule(draftRef.current + 1),
    decrement: () => schedule(Math.max(min, draftRef.current - 1)),
  };
}
