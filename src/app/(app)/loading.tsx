export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-48 rounded-control bg-line2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-card bg-line2" />
        ))}
      </div>
    </div>
  );
}
