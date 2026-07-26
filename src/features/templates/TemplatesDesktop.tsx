import { Fragment } from "react";

import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { TemplateDetailBody } from "./TemplateDetailBody";
import type { UseTemplatesScreenResult } from "./useTemplatesScreen";

// Placeholder body for PACKFE-004 Piece 3 — proves the route-driven
// select/create/delete loop works end-to-end. Piece 4a/4b/4c/6 replace
// this wholesale with the real screenshot-grounded markup.
export function TemplatesDesktop({
  templates,
  isLoading,
  selectedTemplate,
  isSelectedLoading,
  selectTemplate,
  createTemplate,
  deleteTemplate,
  openAddItems,
}: UseTemplatesScreenResult) {
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex gap-6 p-12">
      <aside className="flex flex-col gap-2">
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
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-4">
        {selectedTemplate ? (
          <Fragment key={selectedTemplate.id}>
            <TemplateDetailHeader
              template={selectedTemplate}
              onAddItems={openAddItems}
            />
            <TemplateDetailBody
              template={selectedTemplate}
              deleteTemplate={deleteTemplate}
              onAddItems={openAddItems}
            />
          </Fragment>
        ) : isSelectedLoading ? null : (
          <p>No template selected</p>
        )}
      </main>
    </div>
  );
}
