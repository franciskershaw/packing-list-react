import type { UseTemplatesScreenResult } from "./useTemplatesScreen";

// Placeholder body for PACKFE-004 Piece 3 — proves the route-driven
// select/create/delete loop works end-to-end. Piece 4a/4b/4c/6 replace
// this wholesale with the real screenshot-grounded markup.
export function TemplatesDesktop({
  templates,
  isLoading,
  selectedTemplate,
  selectTemplate,
  createTemplate,
  deleteTemplate,
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
      <main>
        {selectedTemplate ? (
          <>
            <p>{selectedTemplate.name}</p>
            <button
              onClick={() =>
                deleteTemplate(selectedTemplate.id, selectedTemplate.name)
              }
            >
              Delete
            </button>
          </>
        ) : (
          <p>No template selected</p>
        )}
      </main>
    </div>
  );
}
