import { BackHeader } from "../../components/detail/BackHeader";
import { EmptyStatePanel } from "../../components/detail/EmptyStatePanel";
import { RailRow } from "../../components/detail/RailRow";
import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { MOBILE_NAV_CLEARANCE_SPACER_CLASS } from "../../components/nav/AppShell";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { TemplateDetailBody } from "./TemplateDetailBody";
import type { UseTemplatesScreenResult } from "./useTemplatesScreen";

export function TemplatesMobile({
  templates,
  isLoading,
  selectedTemplateId,
  selectedTemplate,
  selectTemplate,
  goToList,
  createTemplate,
  deleteTemplate,
  openAddItems,
  justCreatedTemplateId,
}: UseTemplatesScreenResult) {
  if (selectedTemplateId) {
    return (
      <div className="flex flex-col">
        <div className="sticky top-0 z-10 flex flex-col gap-4 bg-bg p-6 pb-2">
          <BackHeader label="TEMPLATE" onBack={goToList} />
          {selectedTemplate && (
            <TemplateDetailHeader
              key={selectedTemplate.id}
              template={selectedTemplate}
              onAddItems={openAddItems}
              autoFocusTitle={selectedTemplate.id === justCreatedTemplateId}
            />
          )}
        </div>
        {selectedTemplate && (
          <div key={selectedTemplate.id} className="px-6 pb-6">
            <TemplateDetailBody
              template={selectedTemplate}
              deleteTemplate={deleteTemplate}
              onAddItems={openAddItems}
            />
          </div>
        )}
        <div className={MOBILE_NAV_CLEARANCE_SPACER_CLASS} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading">
            Templates
          </h1>
          <p className="mt-0.5 text-sm text-secondary">
            Your reusable packing lists.
          </p>
        </div>
        <Button variant="accent" className="shrink-0" onClick={createTemplate}>
          + New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : templates.length === 0 ? (
        <EmptyStatePanel
          title="No templates yet"
          message="Click below to build your first one."
          actionLabel="+ New template"
          onAction={createTemplate}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <RailRow
              key={template.id}
              surface="flush"
              showChevron
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
  );
}
