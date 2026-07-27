import { useState } from "react";

import { BackHeader } from "../../components/detail/BackHeader";
import { CategoryGroupCard } from "../../components/detail/CategoryGroupCard";
import { CollectionItemRow } from "../../components/detail/CollectionItemRow";
import { PackedCheckbox } from "../../components/detail/PackedCheckbox";
import { ProgressBar } from "../../components/detail/ProgressBar";
import { ProgressRing } from "../../components/detail/ProgressRing";
import { RailRow } from "../../components/detail/RailRow";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";

// Piece 2 demo harness — temporary, same pattern as PACKFE-003 Piece 2's
// LibraryScreen demo. Remove once Pieces 3-7 assemble the real screen.
export function TripsScreen() {
  const [expanded, setExpanded] = useState(true);
  const [swimwearPacked, setSwimwearPacked] = useState(false);
  const [sunCreamPacked, setSunCreamPacked] = useState(true);
  const [railSelected, setRailSelected] = useState(true);
  const [date, setDate] = useState("");

  return (
    <div className="flex min-h-full flex-col gap-8 bg-bg p-6 text-body">
      <p className="text-xs font-bold tracking-wide text-tertiary uppercase">
        Piece 2 demo harness — temporary
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-bold text-heading">
          BackHeader — trailing slot, no eyebrow label
        </h2>
        <BackHeader
          onBack={() => {}}
          trailing={
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-heading">
                A
              </div>
              <Button variant="default" size="compact">
                Edit
              </Button>
            </>
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-bold text-heading">
          ProgressRing (4/13, 0/0 empty-trip clamp) + ProgressBar (8/12)
        </h2>
        <div className="flex items-center gap-4">
          <ProgressRing packed={4} total={13} />
          <ProgressRing packed={0} total={0} />
          <div className="max-w-60 flex-1">
            <ProgressBar packed={8} total={12} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-bold text-heading">
          RailRow with leading ring (click to toggle selected)
        </h2>
        <div className="max-w-80">
          <RailRow
            title="Holiday to Spain"
            meta="2 Aug 2026 · 4 of 13 packed"
            selected={railSelected}
            onClick={() => setRailSelected((v) => !v)}
            leading={<ProgressRing packed={4} total={13} />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-bold text-heading">
          CategoryGroupCard (collapsible) + CollectionItemRow
          (role=&quot;checkbox&quot;, click a row to toggle packed)
        </h2>
        <CategoryGroupCard
          name="Clothing"
          count={`${[swimwearPacked, sunCreamPacked].filter(Boolean).length}/2`}
          collapsible
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        >
          <CollectionItemRow
            leading={<PackedCheckbox packed={swimwearPacked} />}
            name="Swimwear"
            checked={swimwearPacked}
            struck={swimwearPacked}
            onClick={() => setSwimwearPacked((v) => !v)}
            trailing={
              <span className="rounded-md bg-[#F0E6D6] px-1.5 py-0.5 text-xs text-tertiary">
                ×2
              </span>
            }
          />
          <CollectionItemRow
            leading={<PackedCheckbox packed={sunCreamPacked} />}
            name="Sun cream"
            notes="Factor 50"
            checked={sunCreamPacked}
            struck={sunCreamPacked}
            onClick={() => setSunCreamPacked((v) => !v)}
            trailing={<span />}
          />
        </CategoryGroupCard>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-bold text-heading">
          TextField type=&quot;date&quot; with a real associated &lt;label
          htmlFor&gt;
        </h2>
        <label
          htmlFor="demo-date"
          className="text-[11px] font-bold tracking-wide text-tertiary uppercase"
        >
          When
        </label>
        <TextField id="demo-date" type="date" value={date} onChange={setDate} />
      </section>
    </div>
  );
}
