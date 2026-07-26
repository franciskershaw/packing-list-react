import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useInlineEditableField } from "./useInlineEditableField";

// Mirrors how InlineEditableHeading will consume the hook's returned props.
function TestField({
  savedValue,
  onSave,
  allowBlank = false,
}: {
  savedValue: string;
  onSave: (value: string) => void;
  allowBlank?: boolean;
}) {
  const field = useInlineEditableField({ savedValue, onSave, allowBlank });
  return (
    <input
      aria-label="field"
      value={field.value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      onKeyDown={field.onKeyDown}
    />
  );
}

function renderField(options: { savedValue: string; allowBlank?: boolean }): {
  input: HTMLInputElement;
  onSave: ReturnType<typeof vi.fn>;
} {
  const onSave = vi.fn();
  render(<TestField {...options} onSave={onSave} />);
  return { input: screen.getByLabelText("field") as HTMLInputElement, onSave };
}

describe("useInlineEditableField", () => {
  it("does not save on blur when the value is unchanged", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
    });

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves the trimmed value on blur when it changed", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  Beach holiday  " } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenCalledWith("Beach holiday");
    expect(input.value).toBe("Beach holiday");
  });

  it("reverts a blank title on blur without saving", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
      allowBlank: false,
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(onSave).not.toHaveBeenCalled();
    expect(input.value).toBe("Festival essentials");
  });

  it("saves a blank description on blur instead of reverting", () => {
    const { input, onSave } = renderField({
      savedValue: "Mud-proof and music-ready.",
      allowBlank: true,
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenCalledWith("");
    expect(input.value).toBe("");
  });

  it("Enter commits the change and blurs the field, without double-firing the save (master-spec.md's double-commit guard)", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Beach holiday" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSave).toHaveBeenCalledWith("Beach holiday");
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(input);
  });

  it("Escape reverts to the last-saved value and blurs, without saving", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Something else entirely" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(input.value).toBe("Festival essentials");
    expect(document.activeElement).not.toBe(input);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("consecutive edit/blur cycles each commit independently (the Enter/Escape suppress guard doesn't leak into unrelated blurs)", () => {
    const { input, onSave } = renderField({
      savedValue: "Festival essentials",
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  Beach holiday  " } });
    fireEvent.blur(input);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "  City weekend  " } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenNthCalledWith(1, "Beach holiday");
    expect(onSave).toHaveBeenNthCalledWith(2, "City weekend");
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
