import type { ProfileStatus } from "@/lib/types";

const MAP: Record<ProfileStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-st-draft-bg text-st-draft-fg" },
  locked: { label: "Locked", cls: "bg-st-locked-bg text-st-locked-fg" },
  edit_requested: { label: "Edit requested", cls: "bg-st-edit-bg text-st-edit-fg" },
};

export function StatusBadge({ status }: { status: ProfileStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-line2 px-2.5 py-1 text-xs font-semibold text-faint">
        —
      </span>
    );
  }
  const s = MAP[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
