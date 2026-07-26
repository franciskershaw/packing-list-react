import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DESKTOP_QUERY, useMediaQuery } from "./useMediaQuery";

type ChangeListener = (event: MediaQueryListEvent) => void;

// jsdom doesn't implement matchMedia at all, so every test hand-rolls a
// minimal MediaQueryList: a mutable `matches` flag plus the single
// "change" listener the hook is expected to register.
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let listener: ChangeListener | undefined;

  window.matchMedia = vi.fn().mockReturnValue({
    get matches() {
      return matches;
    },
    media: "",
    addEventListener: (type: string, callback: ChangeListener) => {
      if (type === "change") listener = callback;
    },
    removeEventListener: (type: string, callback: ChangeListener) => {
      if (type === "change" && listener === callback) listener = undefined;
    },
  } as MediaQueryList);

  return {
    setMatches(next: boolean) {
      matches = next;
      listener?.({ matches } as MediaQueryListEvent);
    },
  };
}

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the media query's initial match state (true)", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY));

    expect(result.current).toBe(true);
  });

  it("returns the media query's initial match state (false)", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY));

    expect(result.current).toBe(false);
  });

  it("updates when the underlying media query's match state changes", () => {
    const mock = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY));
    expect(result.current).toBe(false);

    act(() => mock.setMatches(true));

    expect(result.current).toBe(true);
  });

  it("unsubscribes from change events on unmount", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: "",
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList);

    const { unmount } = renderHook(() => useMediaQuery(DESKTOP_QUERY));
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
