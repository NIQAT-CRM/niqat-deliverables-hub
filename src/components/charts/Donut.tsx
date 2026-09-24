export function Donut({
  segments,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F0EC" strokeWidth="3.8" pathLength={100} />
          {total > 0 &&
            segments.map((s, i) => {
              const pct = (s.value / total) * 100;
              const el = (
                <circle
                  key={i}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="3.8"
                  pathLength={100}
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += pct;
              return el;
            })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-extrabold text-ink">{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-muted">{s.label}</span>
            <span className="font-semibold text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
