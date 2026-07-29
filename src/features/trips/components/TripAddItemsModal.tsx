import { useCreateItem } from "../../../api/items";
import type { PackingListDetail } from "../../../api/trips";
import { useBulkUpdateTripItems } from "../../../api/trips";
import { AddItemsPickerModal } from "../../../components/detail/AddItemsPickerModal";
import { useItemsDraft } from "../../../components/detail/useItemsDraft";

interface TripAddItemsModalProps {
  trip: PackingListDetail;
  onClose: () => void;
}

export function TripAddItemsModal({ trip, onClose }: TripAddItemsModalProps) {
  const draft = useItemsDraft(
    trip.categories.flatMap((category) =>
      category.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    ),
  );
  const bulkUpdateTripItems = useBulkUpdateTripItems();
  const createItem = useCreateItem();

  function handleDone() {
    if (draft.delta.length === 0) {
      onClose();
      return;
    }
    bulkUpdateTripItems.mutate(
      { tripId: trip.id, items: draft.delta },
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
      isDonePending={bulkUpdateTripItems.isPending}
    />
  );
}
