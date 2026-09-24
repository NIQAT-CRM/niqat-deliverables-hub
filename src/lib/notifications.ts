export function notificationLabel(event: string, name: string): string {
  switch (event) {
    case "file_uploaded":
      return `${name} uploaded a new file`;
    case "edit_requested":
      return `${name} requested a profile edit`;
    case "profile_reopened":
      return "Your profile was reopened for editing";
    case "file_deletion_requested":
      return `${name} requested a file deletion`;
    case "feedback_added":
      return "New feedback was added to your profile";
    default:
      return event.replace(/_/g, " ");
  }
}

export function notificationHref(event: string, refId: string | null): string | null {
  if (!refId) return null;
  switch (event) {
    case "file_uploaded":
    case "edit_requested":
    case "file_deletion_requested":
      return `/admin/lecturers/${refId}`;
    case "profile_reopened":
    case "feedback_added":
      return "/me";
    default:
      return null;
  }
}

// icon path key per event (paths live in the page)
export function notificationIcon(event: string): "file" | "edit" | "reopen" | "bell" {
  if (event === "file_uploaded") return "file";
  if (event === "edit_requested") return "edit";
  if (event === "profile_reopened") return "reopen";
  return "bell";
}

export function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
