const RADIUS = 13;
const STROKE_WIDTH = 3.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SpinnerProps {
  size?: number;
}

// Same arc/stroke language as ProgressRing, but a fixed-length arc that
// spins continuously instead of a percentage-filled one.
export function Spinner({ size = 34 }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="17"
        cy="17"
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE}`}
        className="stroke-accent"
      />
    </svg>
  );
}
