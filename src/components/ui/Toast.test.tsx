import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "./Toast";

function ToastTrigger({ message }: { message: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast(message)}>{`Trigger: ${message}`}</button>
  );
}

describe("ToastProvider queue", () => {
  it("renders a toast when triggered", async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Hello" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger: Hello"));

    await screen.findByText("Hello");
  });

  it("stacks multiple toasts at once", async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="First" />
        <ToastTrigger message="Second" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger: First"));
    fireEvent.click(screen.getByText("Trigger: Second"));

    await screen.findByText("First");
    await screen.findByText("Second");
  });

  it("dismissing one toast leaves the others", async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="First" />
        <ToastTrigger message="Second" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger: First"));
    fireEvent.click(screen.getByText("Trigger: Second"));
    await screen.findByText("First");
    await screen.findByText("Second");

    const firstToast = (await screen.findByText("First")).closest(
      '[data-testid="toast"]',
    ) as HTMLElement;
    fireEvent.click(
      within(firstToast).getByRole("button", { name: /dismiss/i }),
    );

    await waitFor(() => expect(screen.queryByText("First")).toBeNull());
    screen.getByText("Second");
  });

  it("gives repeated toasts with the same message independent identities", async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Duplicate" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Trigger: Duplicate"));
    await screen.findByText("Duplicate");
    fireEvent.click(screen.getByText("Trigger: Duplicate"));

    await waitFor(() =>
      expect(screen.getAllByText("Duplicate")).toHaveLength(2),
    );

    const toasts = screen.getAllByTestId("toast");
    const dismissButtons = within(toasts[0]).getAllByRole("button", {
      name: /dismiss/i,
    });
    fireEvent.click(dismissButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByText("Duplicate")).toHaveLength(1),
    );
  });
});
