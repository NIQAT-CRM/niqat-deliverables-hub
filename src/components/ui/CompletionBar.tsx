export function CompletionBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Profile completeness</span>
        <span className="font-semibold text-ink">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line2">
        <div className="h-full rounded-full bg-niqat" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
