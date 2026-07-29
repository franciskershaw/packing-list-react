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

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
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

  it("decrement() lowers an existing entry's quantity by one and records it in the delta", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 3 }]),
    );

    act(() => result.current.decrement("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 2 },
    ]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 2 },
    ]);
  });

  it("decrement() at quantity 1 on a session-added item removes it with no trace in the delta", () => {
    const { result } = renderHook(() => useItemsDraft([]));

    act(() => result.current.add("item-socks"));
    act(() => result.current.decrement("item-socks"));

    expect(result.current.entries).toEqual([]);
    expect(result.current.delta).toEqual([]);
  });

  it("decrement() at quantity 1 on a pre-existing item drops it from entries and sends quantity 0", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 1 }]),
    );

    act(() => result.current.decrement("item-socks"));

    expect(result.current.entries).toEqual([]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 0 },
    ]);
  });

  it("decrementing a pre-existing item all the way from 3 removes it on the third tap", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 3 }]),
    );

    act(() => result.current.decrement("item-socks"));
    act(() => result.current.decrement("item-socks"));
    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);

    act(() => result.current.decrement("item-socks"));

    expect(result.current.entries).toEqual([]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 0 },
    ]);
  });

  it("add() after decrementing a pre-existing item to removal restarts it at quantity 1, not its original quantity", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 3 }]),
    );

    act(() => result.current.decrement("item-socks"));
    act(() => result.current.decrement("item-socks"));
    act(() => result.current.decrement("item-socks"));
    act(() => result.current.add("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
    expect(result.current.delta).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
  });

  it("removing and re-adding a pre-existing item back to its original quantity produces no delta at all", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 1 }]),
    );

    act(() => result.current.decrement("item-socks"));
    act(() => result.current.add("item-socks"));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
    expect(result.current.delta).toEqual([]);
  });

  it("bulkAdd() re-adds an item that was decremented to removal this session", () => {
    const { result } = renderHook(() =>
      useItemsDraft([{ itemId: "item-socks", quantity: 1 }]),
    );

    act(() => result.current.decrement("item-socks"));
    act(() => result.current.bulkAdd(["item-socks"]));

    expect(result.current.entries).toEqual([
      { itemId: "item-socks", quantity: 1 },
    ]);
  });
});
