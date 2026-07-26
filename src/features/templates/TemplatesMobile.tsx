import { BackHeader } from "../../components/detail/BackHeader";
import { EmptyStatePanel } from "../../components/detail/EmptyStatePanel";
import { TemplateDetailHeader } from "../../components/detail/TemplateDetailHeader";
import { Button } from "../../components/ui/Button";
import { TemplateDetailBody } from "./TemplateDetailBody";
import { TemplateListCard } from "./TemplateListCard";
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
      <div className="flex flex-col gap-4 p-6">
        <BackHeader label="TEMPLATE" onBack={goToList} />
        {selectedTemplate && (
          <div key={selectedTemplate.id} className="flex flex-col gap-2">
            <TemplateDetailHeader
              template={selectedTemplate}
              onAddItems={openAddItems}
              autoFocusTitle={selectedTemplate.id === justCreatedTemplateId}
            />
            <TemplateDetailBody
              template={selectedTemplate}
              deleteTemplate={deleteTemplate}
              onAddItems={openAddItems}
            />
          </div>
        )}
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
            Build once, pack forever.
          </p>
        </div>
        <Button variant="accent" className="shrink-0" onClick={createTemplate}>
          + New
        </Button>
      </div>

      {!isLoading &&
        (templates.length === 0 ? (
          <EmptyStatePanel
            title="No templates yet"
            message="Click below to build your first one."
            actionLabel="+ New template"
            onAction={createTemplate}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((template) => (
              <TemplateListCard
                key={template.id}
                name={template.name}
                itemCount={template.itemCount}
                description={template.description}
                onClick={() => selectTemplate(template.id)}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
