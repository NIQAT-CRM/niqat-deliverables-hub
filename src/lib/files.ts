export const FILE_CATEGORIES = [
  { value: "student_work", label: "Student work" },
  { value: "standout_project", label: "Standout project" },
  { value: "course_material", label: "Course material" },
  { value: "other", label: "Other" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  FILE_CATEGORIES.map((c) => [c.value, c.label]),
);

export const CATEGORY_ORDER = FILE_CATEGORIES.map((c) => c.value);
