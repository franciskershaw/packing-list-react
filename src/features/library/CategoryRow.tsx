import { useState } from "react";

import type { Category } from "../../api/categories";
import { Button } from "../../components/ui/Button";
import { DeleteIconButton } from "../../components/ui/DeleteIconButton";
import { SystemBadge } from "../../components/ui/SystemBadge";
import { TextField } from "../../components/ui/TextField";

interface CategoryRowProps {
  category: Category;
  itemCount: number;
  isRenaming: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
}

export function CategoryRow({
  category,
  itemCount,
  isRenaming,
  onStartRename,
  onCancelRename,
  onSave,
  onDelete,
}: CategoryRowProps) {
  const [draftName, setDraftName] = useState(category.name);
  const trimmedName = draftName.trim();
  const saveDisabled = trimmedName === "";

  function handleSave() {
    if (saveDisabled) {
      return;
    }
    onSave(trimmedName);
  }

  if (isRenaming) {
    return (
      <div className="flex items-center gap-2 border-b border-[#f3eada] px-4 py-3">
        <div className="flex-1">
          <TextField
            value={draftName}
            onChange={setDraftName}
            placeholder="Category name"
            autoFocus
            onSubmit={handleSave}
          />
        </div>
        <Button variant="success" disabled={saveDisabled} onClick={handleSave}>
          Save
        </Button>
        <Button size="compact" onClick={onCancelRename}>
          Cancel
        </Button>
      </div>
    );
  }

  if (category.isSystem) {
    return (
      <div className="flex items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5">
        <span className="flex-1 text-[14.5px] font-semibold text-heading">
          {category.name}
        </span>
        <span className="text-xs text-tertiary">{itemCount} items</span>
        <SystemBadge />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        setDraftName(category.name);
        onStartRename();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDraftName(category.name);
          onStartRename();
        }
      }}
      className="group flex cursor-pointer items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5 active:opacity-70 lg:hover:bg-bg-subtle lg:active:opacity-100"
    >
      <span className="flex-1 text-[14.5px] font-semibold text-heading lg:group-hover:text-accent-hover">
        {category.name}
      </span>
      <span className="text-xs text-tertiary">{itemCount} items</span>
      <DeleteIconButton label={category.name} onClick={onDelete} />
    </div>
  );
}
