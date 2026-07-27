interface ProgressRingProps {
  packed: number;
  total: number;
  size?: number;
}

const RADIUS = 13;
const STROKE_WIDTH = 3.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ packed, total, size = 34 }: ProgressRingProps) {
  const percent = total > 0 ? packed / total : 0;
  const offset = CIRCUMFERENCE * (1 - percent);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      aria-hidden
      className="-rotate-90 shrink-0"
    >
      <circle
        cx="17"
        cy="17"
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        className="stroke-[#F0E6D6]"
      />
      <circle
        cx="17"
        cy="17"
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className="stroke-accent transition-[stroke-dashoffset] duration-350"
      />
    </svg>
  );
}
