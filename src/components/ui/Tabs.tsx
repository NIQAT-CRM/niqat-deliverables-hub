"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { label: string; badge?: number; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-line">
        {tabs.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${active === i ? "border-niqat text-niqat" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
            {typeof t.badge === "number" && t.badge > 0 && <span className="ml-1.5 rounded-full bg-niqat-soft px-1.5 py-0.5 text-[11px] font-bold text-niqat">{t.badge}</span>}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}
