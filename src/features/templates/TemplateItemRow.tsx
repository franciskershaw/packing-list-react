import type { TemplateItem } from "../../api/templates";
import {
  useRemoveTemplateItem,
  useUpdateTemplateItem,
} from "../../api/templates";
import { CollectionItemRow } from "../../components/detail/CollectionItemRow";
import { QuantityStepper } from "../../components/detail/QuantityStepper";
import { useDebouncedQuantity } from "../../components/detail/useDebouncedQuantity";
import { DeleteIconButton } from "../../components/ui/DeleteIconButton";

interface TemplateItemRowProps {
  templateId: string;
  item: TemplateItem;
}

export function TemplateItemRow({ templateId, item }: TemplateItemRowProps) {
  const updateItem = useUpdateTemplateItem();
  const removeItem = useRemoveTemplateItem();

  const quantity = useDebouncedQuantity({
    value: item.quantity,
    min: 1,
    onCommit: (quantity) =>
      updateItem.mutateAsync({ templateId, itemId: item.itemId, quantity }),
  });

  return (
    <CollectionItemRow
      leading={
        <DeleteIconButton
          label={item.name}
          confirm={false}
          onClick={() => removeItem.mutate({ templateId, itemId: item.itemId })}
        />
      }
      name={item.name}
      notes={item.notes}
      trailing={
        <QuantityStepper
          value={quantity.value}
          min={1}
          onChange={(next) =>
            next > quantity.value ? quantity.increment() : quantity.decrement()
          }
        />
      }
    />
  );
}
