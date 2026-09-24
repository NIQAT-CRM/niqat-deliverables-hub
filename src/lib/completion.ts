type Profileish = {
  bio?: string | null;
  contact_links?: Record<string, string> | null;
  experience?: unknown;
  certificates?: unknown;
  avatar_url?: string | null;
};

export function profileCompletion(p: Profileish | null, hasProgram: boolean): number {
  if (!p) return 0;
  const checks = [
    !!(p.bio && p.bio.trim()),
    !!(p.contact_links && Object.values(p.contact_links).some((v) => v)),
    Array.isArray(p.experience) && p.experience.length > 0,
    Array.isArray(p.certificates) && p.certificates.length > 0,
    !!p.avatar_url,
    hasProgram,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
