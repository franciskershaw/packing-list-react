import { useCreateItem } from "../../api/items";
import type { Template } from "../../api/templates";
import {
  useAddTemplateItem,
  useBulkAddItems,
  useUpdateTemplateItem,
} from "../../api/templates";
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
  const bulkAddItems = useBulkAddItems();
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
      onBulkAdd={(categoryId) =>
        bulkAddItems.mutate({ templateId: template.id, categoryId })
      }
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
    />
  );
}
