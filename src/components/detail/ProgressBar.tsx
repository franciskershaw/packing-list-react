interface ProgressBarProps {
  packed: number;
  total: number;
}

export function ProgressBar({ packed, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((packed / total) * 100) : 0;

  return (
    <div className="h-1.75 w-full rounded-full bg-[#F0E6D6]" aria-hidden>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-350"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
