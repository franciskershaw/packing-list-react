import type { PackingListDetailItem } from "../../../api/trips";
import { useRemoveTripItem, useUpdateTripItem } from "../../../api/trips";
import { CollectionItemRow } from "../../../components/detail/CollectionItemRow";
import { PackedCheckbox } from "../../../components/detail/PackedCheckbox";
import { QuantityStepper } from "../../../components/detail/QuantityStepper";
import { useDebouncedQuantity } from "../../../components/detail/useDebouncedQuantity";
import { DeleteIconButton } from "../../../components/ui/DeleteIconButton";

interface TripItemRowProps {
  tripId: string;
  item: PackingListDetailItem;
  isEditMode: boolean;
}

export function TripItemRow({ tripId, item, isEditMode }: TripItemRowProps) {
  const updateItem = useUpdateTripItem();
  const removeItem = useRemoveTripItem();

  const quantity = useDebouncedQuantity({
    value: item.quantity,
    min: 1,
    onCommit: (quantity) =>
      updateItem.mutateAsync({ tripId, itemId: item.itemId, quantity }),
  });

  if (isEditMode) {
    return (
      <CollectionItemRow
        leading={
          <DeleteIconButton
            label={item.name}
            confirm={false}
            onClick={() => removeItem.mutate({ tripId, itemId: item.itemId })}
          />
        }
        name={item.name}
        notes={item.notes}
        trailing={
          <QuantityStepper
            value={quantity.value}
            onChange={(next) =>
              next > quantity.value
                ? quantity.increment()
                : quantity.decrement()
            }
          />
        }
      />
    );
  }

  return (
    <CollectionItemRow
      leading={<PackedCheckbox packed={item.isPacked} />}
      onClick={() =>
        updateItem.mutate({
          tripId,
          itemId: item.itemId,
          isPacked: !item.isPacked,
        })
      }
      checked={item.isPacked}
      struck={item.isPacked}
      name={item.name}
      notes={item.notes}
      trailing={
        item.quantity > 1 ? (
          <span className="rounded-md bg-bg-subtle px-2 py-1 text-xs font-bold text-secondary">
            ×{item.quantity}
          </span>
        ) : undefined
      }
    />
  );
}
