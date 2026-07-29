import { useCreateItem } from "../../api/items";
import type { Template } from "../../api/templates";
import { useBulkUpdateTemplateItems } from "../../api/templates";
import { AddItemsPickerModal } from "../../components/detail/AddItemsPickerModal";
import { useItemsDraft } from "../../components/detail/useItemsDraft";

interface TemplateAddItemsModalProps {
  template: Template;
  onClose: () => void;
}

export function TemplateAddItemsModal({
  template,
  onClose,
}: TemplateAddItemsModalProps) {
  const draft = useItemsDraft(template.items);
  const bulkUpdateTemplateItems = useBulkUpdateTemplateItems();
  const createItem = useCreateItem();

  function handleDone() {
    if (draft.delta.length === 0) {
      onClose();
      return;
    }
    bulkUpdateTemplateItems.mutate(
      { templateId: template.id, items: draft.delta },
      { onSuccess: onClose },
    );
  }

  return (
    <AddItemsPickerModal
      entries={draft.entries}
      onAdd={draft.add}
      onIncrement={draft.increment}
      onDecrement={draft.decrement}
      onBulkAdd={draft.bulkAdd}
      onCreateAndAdd={({ name, categoryId }) =>
        createItem.mutate(
          { name, categoryId },
          {
            onSuccess: (item) => draft.add(item.id),
          },
        )
      }
      onClose={onClose}
      onDone={handleDone}
      isDonePending={bulkUpdateTemplateItems.isPending}
    />
  );
}
