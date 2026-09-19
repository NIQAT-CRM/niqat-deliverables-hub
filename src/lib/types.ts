// Types mirror the live Supabase schema (verified against project dasqlwxlpycjhjyhnkcp).
export type UserRole = "admin" | "management" | "marketing" | "lecturer";
export type ProfileStatus = "draft" | "locked" | "edit_requested";
export type ProgramType = "diploma" | "course" | "service";
export type FeedbackKind = "text" | "image" | "file";
export type GrantScope = "group" | "lecturer";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  cv_url: string | null;
  contact_links: Record<string, string>;
  experience: unknown[];
  certificates: unknown[];
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export const STAFF_ROLES: UserRole[] = ["admin", "management", "marketing"];
export const isStaff = (r: UserRole) => STAFF_ROLES.includes(r);
