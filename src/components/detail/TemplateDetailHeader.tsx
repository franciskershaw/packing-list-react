import type { Template } from "../../api/templates";
import { useUpdateTemplate } from "../../api/templates";
import { InlineEditableHeading } from "./InlineEditableHeading";
import { useInlineEditableField } from "./useInlineEditableField";

interface TemplateDetailHeaderProps {
  template: Template;
}

export function TemplateDetailHeader({ template }: TemplateDetailHeaderProps) {
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
    <div className="flex flex-col gap-1">
      <InlineEditableHeading variant="title" {...titleField} />
      <InlineEditableHeading
        variant="description"
        placeholder="Add a description…"
        {...descriptionField}
      />
    </div>
  );
}
