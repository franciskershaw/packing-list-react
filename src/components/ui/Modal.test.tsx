import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Trigger</button>
      {open && (
        <Modal
          title="Test modal"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
          desktopWidth="lg:w-[460px]"
        >
          <button>Inside modal</button>
        </Modal>
      )}
    </div>
  );
}

describe("Modal", () => {
  it("closes when clicking outside the card", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText("Trigger"));
    screen.getByText("Test modal");

    // Radix registers its outside-pointerdown listener via setTimeout(0),
    // and defers the actual dismissal to the click event that follows.
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the card", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText("Trigger"));

    fireEvent.pointerDown(screen.getByText("Inside modal"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText("Trigger"));

    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
      code: "Escape",
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the trigger on close", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByText("Trigger");
    // fireEvent.click doesn't simulate the browser's native click-to-focus
    // behavior, so focus explicitly to mirror what a real click would do.
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole("dialog"), {
      key: "Escape",
      code: "Escape",
    });

    expect(document.activeElement).toBe(trigger);
  });
});
