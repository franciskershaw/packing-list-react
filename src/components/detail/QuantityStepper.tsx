import { InteractiveButton } from "../ui/Button";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
}: QuantityStepperProps) {
  const atMin = value <= min;

  return (
    <div className="flex items-center gap-2">
      <InteractiveButton
        aria-label="Decrease quantity"
        disabled={atMin}
        onClick={() => onChange(value - 1)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-body disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </InteractiveButton>
      <span className="w-5 shrink-0 text-center text-base font-bold text-heading">
        {value}
      </span>
      <InteractiveButton
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-body"
      >
        +
      </InteractiveButton>
    </div>
  );
}
