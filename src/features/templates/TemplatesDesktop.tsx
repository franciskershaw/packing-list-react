import { EmptyStatePanel } from "../../components/detail/EmptyStatePanel";
import { RailRow } from "../../components/detail/RailRow";
import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { TemplateDetailBody } from "./TemplateDetailBody";
import type { UseTemplatesScreenResult } from "./useTemplatesScreen";

export function TemplatesDesktop({
  templates,
  isLoading,
  selectedTemplate,
  isSelectedLoading,
  selectTemplate,
  createTemplate,
  deleteTemplate,
  openAddItems,
  justCreatedTemplateId,
}: UseTemplatesScreenResult) {
  return (
    <div className="flex h-full gap-6">
      <aside className="flex w-96 shrink-0 flex-col gap-4 border-r border-border py-12 pr-6 pl-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              Templates
            </h1>
            <p className="mt-0.5 text-sm text-secondary">
              Your reusable packing lists.
            </p>
          </div>
          <Button variant="primary" size="compact" onClick={createTemplate}>
            + New template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            {templates.length === 0 ? (
              <EmptyStatePanel
                title="No templates yet"
                message="Click below to build your first one."
                actionLabel="+ New template"
                onAction={createTemplate}
              />
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                {templates.map((template) => (
                  <RailRow
                    key={template.id}
                    selected={template.id === selectedTemplate?.id}
                    onClick={() => selectTemplate(template.id)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-heading text-base font-bold text-heading">
                        {template.name}
                      </span>
                      <span className="shrink-0 text-sm text-secondary">
                        {template.itemCount} items
                      </span>
                    </div>
                    <p className="truncate text-sm text-secondary">
                      {template.description || "No description yet"}
                    </p>
                  </RailRow>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {!isLoading &&
          (selectedTemplate ? (
            <>
              <div className="sticky top-0 z-10 bg-bg pt-12 pr-12 pb-4">
                <TemplateDetailHeader
                  key={selectedTemplate.id}
                  template={selectedTemplate}
                  onAddItems={openAddItems}
                  autoFocusTitle={selectedTemplate.id === justCreatedTemplateId}
                />
              </div>
              <div key={selectedTemplate.id} className="pr-12 pb-12">
                <TemplateDetailBody
                  template={selectedTemplate}
                  deleteTemplate={deleteTemplate}
                  onAddItems={openAddItems}
                />
              </div>
            </>
          ) : isSelectedLoading ? null : (
            <div className="flex h-full items-center justify-center py-12 pr-12">
              <div className="max-w-75 text-center">
                <p className="font-heading text-lg font-bold text-heading">
                  No template selected
                </p>
                <p className="mt-1 text-sm text-secondary">
                  Pick one from the list to see what&rsquo;s inside.
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
