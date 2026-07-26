import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export interface UseInlineEditableFieldOptions {
  savedValue: string;
  onSave: (value: string) => void;
  allowBlank: boolean;
}

export interface UseInlineEditableFieldResult {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function useInlineEditableField({
  savedValue,
  onSave,
  allowBlank,
}: UseInlineEditableFieldOptions): UseInlineEditableFieldResult {
  const [draft, setDraft] = useState(savedValue);
  const suppressNextBlur = useRef(false);

  function commit() {
    const trimmed = draft.trim();
    if (!allowBlank && trimmed === "") {
      setDraft(savedValue);
      return;
    }
    setDraft(trimmed);
    if (trimmed !== savedValue) {
      onSave(trimmed);
    }
  }

  return {
    value: draft,
    onChange: setDraft,
    onBlur: () => {
      if (suppressNextBlur.current) {
        suppressNextBlur.current = false;
        return;
      }
      commit();
    },
    onKeyDown: (event) => {
      if (event.key === "Enter") {
        suppressNextBlur.current = true;
        commit();
        event.currentTarget.blur();
      } else if (event.key === "Escape") {
        suppressNextBlur.current = true;
        setDraft(savedValue);
        event.currentTarget.blur();
      }
    },
  };
}
