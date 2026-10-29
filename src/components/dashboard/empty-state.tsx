export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-xl border px-4 py-10 text-center sm:rounded-2xl sm:px-6 sm:py-12"
      style={{
        backgroundColor: "var(--dash-surface)",
        borderColor: "var(--dash-border)",
      }}
    >
      <p className="text-base font-semibold" style={{ color: "var(--dash-text)" }}>
        {title}
      </p>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--dash-muted)" }}>
        {description}
      </p>
    </div>
  );
}
