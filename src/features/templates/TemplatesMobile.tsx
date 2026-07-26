import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { TemplateItemRow } from "./TemplateItemRow";
import type { UseTemplatesScreenResult } from "./useTemplatesScreen";

// Placeholder body for PACKFE-004 Piece 3 — proves the route-driven
// select/create/delete loop works end-to-end. Piece 4a/4b/4c/6 replace
// this wholesale with the real screenshot-grounded markup.
export function TemplatesMobile({
  templates,
  isLoading,
  selectedTemplateId,
  selectedTemplate,
  selectTemplate,
  goToList,
  createTemplate,
  deleteTemplate,
}: UseTemplatesScreenResult) {
  if (isLoading) {
    return null;
  }

  if (selectedTemplateId) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <button onClick={goToList}>Back</button>
        {selectedTemplate && (
          <>
            <TemplateDetailHeader
              key={selectedTemplate.id}
              template={selectedTemplate}
            />
            {selectedTemplate.items.map((item) => (
              <TemplateItemRow
                key={item.itemId}
                templateId={selectedTemplate.id}
                item={item}
              />
            ))}
            <button
              onClick={() =>
                deleteTemplate(selectedTemplate.id, selectedTemplate.name)
              }
            >
              Delete
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <button onClick={createTemplate}>+ New</button>
      <ul>
        {templates.map((template) => (
          <li key={template.id}>
            <button onClick={() => selectTemplate(template.id)}>
              {template.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
