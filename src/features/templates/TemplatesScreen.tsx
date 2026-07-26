import { useState } from "react";

import { BackHeader } from "../../components/detail/BackHeader";
import { CategoryGroupCard } from "../../components/detail/CategoryGroupCard";
import { CollectionItemRow } from "../../components/detail/CollectionItemRow";
import { EmptyStatePanel } from "../../components/detail/EmptyStatePanel";
import { InlineEditableHeading } from "../../components/detail/InlineEditableHeading";
import { QuantityStepper } from "../../components/detail/QuantityStepper";
import { RailRow } from "../../components/detail/RailRow";
import { Button } from "../../components/ui/Button";
import { DeleteIconButton } from "../../components/ui/DeleteIconButton";

// Temporary demo harness for PACKFE-004 Piece 2's atoms — no real screen
// exists yet to render them in. Removed once Piece 3/4 assemble the real
// TemplatesScreen/Mobile/Desktop split.
export function TemplatesScreen() {
  const [title, setTitle] = useState("Festival essentials");
  const [description, setDescription] = useState("Mud-proof and music-ready.");
  const [quantities, setQuantities] = useState({ tshirts: 4, charger: 2 });
  const [selectedRail, setSelectedRail] = useState("festival");

  return (
    <div className="mx-auto flex w-full max-w-220 flex-col gap-8 p-6 lg:p-12">
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          BackHeader
        </h2>
        <BackHeader label="Template" onBack={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          InlineEditableHeading
        </h2>
        <div className="rounded-card border border-border p-4">
          <InlineEditableHeading
            variant="title"
            value={title}
            onChange={setTitle}
            placeholder="Untitled template"
          />
          <InlineEditableHeading
            variant="description"
            value={description}
            onChange={setDescription}
            placeholder="Add a description…"
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          RailRow (selected vs. unselected)
        </h2>
        <div className="flex w-[330px] flex-col gap-1 rounded-card border border-border p-2">
          <RailRow
            title="Festival essentials"
            meta="18 items · Mud-proof and music-ready."
            selected={selectedRail === "festival"}
            onClick={() => setSelectedRail("festival")}
          />
          <RailRow
            title="Beach holiday"
            meta="13 items · Sun, sea, minimal faff."
            selected={selectedRail === "beach"}
            onClick={() => setSelectedRail("beach")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          CategoryGroupCard + CollectionItemRow + QuantityStepper +
          DeleteIconButton (confirm=false)
        </h2>
        <CategoryGroupCard name="Clothing" count={2}>
          <CollectionItemRow
            leading={
              <DeleteIconButton
                label="T-shirts"
                confirm={false}
                onClick={() => {}}
              />
            }
            name="T-shirts"
            trailing={
              <QuantityStepper
                value={quantities.tshirts}
                onChange={(value) =>
                  setQuantities((q) => ({ ...q, tshirts: value }))
                }
              />
            }
          />
          <CollectionItemRow
            leading={
              <DeleteIconButton
                label="Portable charger"
                confirm={false}
                onClick={() => {}}
              />
            }
            name="Portable charger"
            notes="Charge before leaving"
            trailing={
              <QuantityStepper
                value={quantities.charger}
                onChange={(value) =>
                  setQuantities((q) => ({ ...q, charger: value }))
                }
              />
            }
          />
        </CategoryGroupCard>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          EmptyStatePanel
        </h2>
        <EmptyStatePanel
          title="Nothing in here yet"
          message="Click here to start building it."
          actionLabel="+ Add items"
          onAction={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-heading">
          Button variant="secondary"
        </h2>
        <Button variant="secondary" onClick={() => {}}>
          Use for a new trip
        </Button>
      </section>
    </div>
  );
}
