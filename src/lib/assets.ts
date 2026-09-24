export const ASSET_KINDS = [
  { value: "trainee_work", label: "Trainee work" },
  { value: "feedback_proof", label: "Feedback proof" },
  { value: "course_material", label: "Course material" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
] as const;

// what a lecturer may set on their own uploads (feedback_proof is staff-only)
export const LECTURER_ASSET_KINDS = ASSET_KINDS.filter((k) => k.value !== "feedback_proof");

export const ASSET_KIND_LABEL: Record<string, string> = Object.fromEntries(
  ASSET_KINDS.map((k) => [k.value, k.label]),
);
