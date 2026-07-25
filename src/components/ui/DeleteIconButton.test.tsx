import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeleteIconButton } from "./DeleteIconButton";

describe("DeleteIconButton", () => {
  it("clicking the icon opens a confirm dialog without calling onClick yet", () => {
    const onClick = vi.fn();
    render(<DeleteIconButton label="Socks" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));

    screen.getByText("Delete Socks?");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("confirming the dialog calls onClick and closes it", () => {
    const onClick = vi.fn();
    render(<DeleteIconButton label="Socks" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Delete Socks?")).toBeNull();
  });

  it("cancelling the dialog closes it without calling onClick", () => {
    const onClick = vi.fn();
    render(<DeleteIconButton label="Socks" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete Socks?")).toBeNull();
  });

  it("clicking the icon still stops propagation to a parent handler", () => {
    const onClick = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <DeleteIconButton label="Socks" onClick={onClick} />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Socks" }));

    expect(onParentClick).not.toHaveBeenCalled();
  });
});
