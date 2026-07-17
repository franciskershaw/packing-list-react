type RoutePlaceholderProps = {
  title: string;
};

export function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-heading">{title}</h1>
      <p className="mt-2 font-body text-secondary">Coming soon.</p>
    </div>
  );
}
