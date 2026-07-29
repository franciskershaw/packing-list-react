import type { PackingListDetail } from "../../../api/trips";
import { CategoryGroupCard } from "../../../components/detail/CategoryGroupCard";
import { EmptyStatePanel } from "../../../components/detail/EmptyStatePanel";
import { TripItemRow } from "./TripItemRow";
import { TripProgressCard } from "./TripProgressCard";

interface TripDetailBodyProps {
  trip: PackingListDetail;
  isEditMode: boolean;
  collapsedCategoryIds: Set<string>;
  toggleCategoryCollapsed: (categoryId: string) => void;
  onAddItems: () => void;
}

export function TripDetailBody({
  trip,
  isEditMode,
  collapsedCategoryIds,
  toggleCategoryCollapsed,
  onAddItems,
}: TripDetailBodyProps) {
  const allItems = trip.categories.flatMap((category) => category.items);
  const total = allItems.length;
  const packed = allItems.filter((item) => item.isPacked).length;
  const allPacked = total > 0 && packed === total;

  if (total === 0) {
    return (
      <EmptyStatePanel
        title="Nothing packed yet"
        message="Click here to start building your list."
        actionLabel="+ Add items"
        onAction={onAddItems}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TripProgressCard tripId={trip.id} packed={packed} total={total} />

      {!isEditMode && allPacked && (
        <div className="rounded-2xl border border-accent-secondary bg-[#E9EFE3] px-4 py-3 text-center">
          <p className="text-sm font-bold text-heading">
            All packed! Have a great trip.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {trip.categories.map((category) => {
          const categoryPacked = category.items.filter(
            (item) => item.isPacked,
          ).length;
          return (
            <CategoryGroupCard
              key={category.id}
              name={category.name}
              count={`${categoryPacked}/${category.items.length}`}
              collapsible
              expanded={!collapsedCategoryIds.has(category.id)}
              onToggle={() => toggleCategoryCollapsed(category.id)}
            >
              {category.items.map((item) => (
                <TripItemRow
                  key={item.itemId}
                  tripId={trip.id}
                  item={item}
                  isEditMode={isEditMode}
                />
              ))}
            </CategoryGroupCard>
          );
        })}
      </div>
    </div>
  );
}
