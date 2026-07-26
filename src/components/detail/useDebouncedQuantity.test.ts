import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedQuantity } from "./useDebouncedQuantity";

describe("useDebouncedQuantity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only commits once for a rapid burst of taps (trailing debounce)", () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedQuantity({ value: 1, onCommit }),
    );

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("commits the value from the last tap, not the first", () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedQuantity({ value: 1, onCommit }),
    );

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onCommit).toHaveBeenCalledWith(4);
    expect(result.current.value).toBe(4);
  });

  it("reverts the displayed value to the last-confirmed prop value when the commit rejects", async () => {
    const onCommit = vi.fn().mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() =>
      useDebouncedQuantity({ value: 2, onCommit }),
    );

    act(() => {
      result.current.increment();
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(result.current.value).toBe(2);
  });

  it("does not fire a commit if unmounted before the debounce fires", () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      useDebouncedQuantity({ value: 1, onCommit }),
    );

    act(() => {
      result.current.increment();
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onCommit).not.toHaveBeenCalled();
  });
});
