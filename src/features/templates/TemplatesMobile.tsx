import { Fragment } from "react";

import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { TemplateDetailBody } from "./TemplateDetailBody";
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
          <Fragment key={selectedTemplate.id}>
            <TemplateDetailHeader template={selectedTemplate} />
            <TemplateDetailBody
              template={selectedTemplate}
              deleteTemplate={deleteTemplate}
            />
          </Fragment>
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
