export const TEAM_CAPABILITIES = [
  { key: "can_view_lecturers", label: "View lecturers" },
  { key: "can_download_files", label: "Download files" },
  { key: "can_export_cv", label: "Export CV" },
  { key: "can_manage_feedback", label: "Manage feedback" },
  { key: "can_manage_groups", label: "Manage groups" },
  { key: "can_view_audit", label: "View audit log" },
] as const;

export type CapabilityKey = (typeof TEAM_CAPABILITIES)[number]["key"];
