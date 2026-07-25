import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Item } from "../../api/items";
import { LibraryItemRow } from "./LibraryItemRow";

const mineItem: Item = {
  id: "1",
  name: "Socks",
  categoryId: "cat-1",
  isSystem: false,
};

const sysItem: Item = {
  id: "2",
  name: "Passport",
  categoryId: "cat-2",
  isSystem: true,
};

describe("LibraryItemRow", () => {
  it("mine row: clicking the delete button opens a confirm dialog, not onEdit", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LibraryItemRow item={mineItem} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));

    screen.getByText("Delete Socks?");
    expect(onDelete).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("mine row: confirming the delete dialog calls onDelete but not onEdit", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LibraryItemRow item={mineItem} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("mine row: clicking the row body calls onEdit", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LibraryItemRow item={mineItem} onEdit={onEdit} onDelete={onDelete} />,
    );

    const row = screen.getByText("Socks").closest('[role="button"]');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it.each([["Enter"], [" "]])(
    "mine row: pressing %s on the row calls onEdit",
    (key) => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <LibraryItemRow item={mineItem} onEdit={onEdit} onDelete={onDelete} />,
      );

      const row = screen.getByText("Socks").closest('[role="button"]');
      fireEvent.keyDown(row!, { key });

      expect(onEdit).toHaveBeenCalledTimes(1);
    },
  );

  it("sys row: renders no chevron/delete control, isn't focusable, and ignores clicks", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <LibraryItemRow item={sysItem} onEdit={onEdit} onDelete={onDelete} />,
    );

    expect(
      screen.queryByRole("button", { name: "Delete Passport" }),
    ).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    screen.getByText("Built-in");

    fireEvent.click(screen.getByText("Passport"));

    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
