import type { Template } from "../../api/templates";
import { useUpdateTemplate } from "../../api/templates";
import { Button } from "../ui/Button";
import { InlineEditableHeading } from "./InlineEditableHeading";
import { useInlineEditableField } from "./useInlineEditableField";

interface TemplateDetailHeaderProps {
  template: Template;
  onAddItems: () => void;
  autoFocusTitle?: boolean;
}

export function TemplateDetailHeader({
  template,
  onAddItems,
  autoFocusTitle,
}: TemplateDetailHeaderProps) {
  const updateTemplate = useUpdateTemplate();

  const titleField = useInlineEditableField({
    savedValue: template.name,
    onSave: (name) => updateTemplate.mutate({ id: template.id, name }),
    allowBlank: false,
  });

  const descriptionField = useInlineEditableField({
    savedValue: template.description ?? "",
    onSave: (description) =>
      updateTemplate.mutate({ id: template.id, description }),
    allowBlank: true,
  });

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <InlineEditableHeading
          variant="title"
          autoFocus={autoFocusTitle}
          {...titleField}
        />
        <InlineEditableHeading
          variant="description"
          placeholder="Add a description…"
          {...descriptionField}
        />
      </div>
      <Button variant="accent" className="shrink-0" onClick={onAddItems}>
        + Add items
      </Button>
    </div>
  );
}
