import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTemplates } from "../../../api/templates";
import { useCreateTrip } from "../../../api/trips";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { TextField } from "../../../components/ui/TextField";

interface NewTripModalProps {
  preselectedTemplateId: string | null;
  onClose: () => void;
}

const SCRATCH = "scratch";

export function NewTripModal({
  preselectedTemplateId,
  onClose,
}: NewTripModalProps) {
  const { data: templates = [] } = useTemplates();
  const createTrip = useCreateTrip();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startFrom, setStartFrom] = useState(preselectedTemplateId ?? SCRATCH);

  const trimmedName = name.trim();
  const submitDisabled = trimmedName === "";

  function handleCreate() {
    if (submitDisabled) {
      return;
    }
    const template = templates.find((t) => t.id === startFrom);
    createTrip.mutate(
      {
        name: trimmedName,
        eventDate: eventDate || undefined,
        templateId: template?.id,
        templateName: template?.name,
      },
      {
        onSuccess: (trip) => {
          onClose();
          navigate(`/trips/${trip.id}`);
        },
      },
    );
  }

  return (
    <Modal
      title="New trip"
      desktopWidth="lg:w-[460px]"
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          disabled={submitDisabled || createTrip.isPending}
          onClick={handleCreate}
        >
          Create trip
        </Button>
      }
    >
      <label
        htmlFor="trip-name"
        className="mb-2 block text-[11px] font-bold tracking-wide text-tertiary uppercase"
      >
        Name
      </label>
      <TextField
        id="trip-name"
        value={name}
        onChange={setName}
        placeholder="e.g. Cornwall camping"
        autoFocus
      />

      <label
        htmlFor="trip-date"
        className="mt-3.5 mb-2 block text-[11px] font-bold tracking-wide text-tertiary uppercase"
      >
        When
      </label>
      <TextField
        id="trip-date"
        type="date"
        value={eventDate}
        onChange={setEventDate}
      />

      <p className="mt-3.5 mb-2 text-[11px] font-bold tracking-wide text-tertiary uppercase">
        Start from
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setStartFrom(SCRATCH)}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${
            startFrom === SCRATCH
              ? "border-accent bg-bg text-heading"
              : "border-border bg-bg text-heading"
          }`}
        >
          Start from scratch
        </button>
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setStartFrom(template.id)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold ${
              startFrom === template.id
                ? "border-accent bg-bg text-heading"
                : "border-border bg-bg text-heading"
            }`}
          >
            <span>{template.name}</span>
            <span className="font-normal text-secondary">
              {template.itemCount} items
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
