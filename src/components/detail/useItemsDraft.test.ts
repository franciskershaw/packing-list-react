import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useItemsDraft } from "./useItemsDraft";

describe("useItemsDraft", () => {
  it("starts with entries mirroring the initial list and an empty delta", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 2 }]),
    );

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 2 },
    ]);
    expect(result.current.delta).toEqual([]);
  });

  it("add() adds a not-yet-present item at quantity 1 and puts it in the delta", () => {
    const { result } = renderHook(() => useItemsDraft([]));

    act(() => result.current.add("item-socks"));

    expect(result.current.entries).toEqual([]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
  });

  it("increment() raises an existing entry's quantity by one and records it in the delta", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 2 }]),
    );

    act(() => result.current.increment("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 3 },
    ]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 3 },
    ]);
  });

  it("increment() on an item not yet in the draft starts it at quantity 1", () => {
    const { result } = renderHook(() => useItemsDraft([]));

    act(() => result.current.increment("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
  });

  it("increment() clamps at 999, matching the backend's validation range", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 999 }]),
    );

    act(() => result.current.increment("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 999 },
    ]);
  });

  it("bulkAdd() adds only the ids not already in the draft, at quantity 1 each", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 3 }]),
    );

    act(() =>
      result.current.bulkAdd(["item-socks", "item-tshirt", "item-shorts"]),
    );

    expect(result.current.entries).toEqual(
      expect.arrayContaining([
        { itemId: "item-socks", quantity: 3 },
        { itemId: "item-tshirt", quantity: 1 },
        { itemId: "item-shorts", quantity: 1 },
      ]),
    );
    expect(result.current.delta).toEqual(
      expect.arrayContaining([
        { itemId: "item-tshirt", quantity: 1 },
        { itemId: "item-shorts", quantity: 1 },
      ]),
    );
    expect(result.current.delta).not.toContainEqual(
      expect.objectContaining({ itemId: "item-socks" }),
    );
  });

  it("delta only ever contains items changed this session, never untouched initial entries", () => {
    const { result } = renderHook(() =>
      useItemsDraft([
        { itemId: "item-socks", quantity: 2 },
        { itemId: "item-tshirt", quantity: 1 },
      ]),
    );

    act(() => result.current.increment("item-socks"));

    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 3 },
    ]);
  });
});
