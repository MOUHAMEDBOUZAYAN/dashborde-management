export function StatusScreen({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
