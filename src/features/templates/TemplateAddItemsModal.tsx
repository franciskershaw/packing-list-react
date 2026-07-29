import { useCreateItem } from "../../api/items";
import type { Template } from "../../api/templates";
import { useAddTemplateItem, useUpdateTemplateItem } from "../../api/templates";
import { AddItemsPickerModal } from "../../components/detail/AddItemsPickerModal";

interface TemplateAddItemsModalProps {
  template: Template;
  onClose: () => void;
}

export function TemplateAddItemsModal({
  template,
  onClose,
}: TemplateAddItemsModalProps) {
  const addTemplateItem = useAddTemplateItem();
  const updateTemplateItem = useUpdateTemplateItem();
  const createItem = useCreateItem();

  return (
    <AddItemsPickerModal
      entries={template.items}
      onAdd={(itemId) =>
        addTemplateItem.mutate({ templateId: template.id, itemId })
      }
      onIncrement={(itemId) => {
        const entry = template.items.find((item) => item.itemId === itemId);
        updateTemplateItem.mutate({
          templateId: template.id,
          itemId,
          quantity: (entry?.quantity ?? 0) + 1,
        });
      }}
      onBulkAdd={() => {
        // TODO(PACKFE-009): resolve client-side via useItemsDraft.bulkAdd,
        // no request until Done. bulkAddItems/useBulkAddItems is dead code
        // pending deletion (PACK-035 deleted its server endpoint).
      }}
      onCreateAndAdd={({ name, categoryId }) =>
        createItem.mutate(
          { name, categoryId },
          {
            onSuccess: (item) =>
              addTemplateItem.mutate({
                templateId: template.id,
                itemId: item.id,
              }),
          },
        )
      }
      onClose={onClose}
      onDone={() => {
        // TODO(PACKFE-009): flush useItemsDraft's delta via
        // useBulkUpdateTemplateItems, close only on success.
      }}
    />
  );
}
