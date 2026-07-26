import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useItems } from "../../api/items";
import type { Template } from "../../api/templates";
import { CategoryGroupCard } from "../../components/detail/CategoryGroupCard";
import { EmptyStatePanel } from "../../components/detail/EmptyStatePanel";
import { Button, InteractiveButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { groupTemplateItems } from "./groupTemplateItems";
import { TemplateItemRow } from "./TemplateItemRow";

interface TemplateDetailBodyProps {
  template: Template;
  deleteTemplate: (id: string, name: string) => void;
}

export function TemplateDetailBody({
  template,
  deleteTemplate,
}: TemplateDetailBodyProps) {
  const categories = useCategories();
  const items = useItems();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isLoading = categories.isLoading || items.isLoading;
  const groups = isLoading
    ? []
    : groupTemplateItems(
        template.items,
        items.data ?? [],
        categories.data ?? [],
      );

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 0 ? (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <CategoryGroupCard
              key={group.category.id}
              name={group.category.name}
              count={group.entries.length}
            >
              {group.entries.map((entry) => (
                <TemplateItemRow
                  key={entry.itemId}
                  templateId={template.id}
                  item={entry}
                />
              ))}
            </CategoryGroupCard>
          ))}
        </div>
      ) : (
        <EmptyStatePanel
          title="Nothing in here yet"
          message="Click here to start building it."
          actionLabel="+ Add items"
          onAction={() =>
            toast("The add-items picker is coming soon", "success")
          }
        />
      )}

      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <Button
          variant="secondary"
          className="lg:w-auto lg:rounded-full lg:px-5 lg:py-2 lg:text-sm"
          onClick={() => toast("Trip creation is coming soon", "success")}
        >
          Use for a new trip
        </Button>
        <InteractiveButton
          onClick={() => setConfirmOpen(true)}
          className="self-center text-sm font-bold text-notice-text lg:self-auto lg:shrink-0"
        >
          Delete template
        </InteractiveButton>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title={`Delete ${template.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirmOpen(false);
            deleteTemplate(template.id, template.name);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
