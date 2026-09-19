import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/app/PrintButton";

export const dynamic = "force-dynamic";

const printCss = `
@media print {
  aside { display: none !important; }
  .pl-60 { padding-left: 0 !important; }
  .no-print { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  body { background: #fff !important; }
}
`;

export default async function LecturerCV({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  // Every export MUST go through log_export. Handle 42501 gracefully.
  const { error: logErr } = await supabase.rpc("log_export", {
    p_target: id,
    p_target_type: "lecturer",
    p_metadata: { kind: "cv" },
  });

  if (logErr) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-bold text-ink">Export not permitted</h1>
        <p className="text-sm text-muted">
          You don't have permission to export this lecturer's CV. Ask an admin for export
          access.
        </p>
        <Link href={`/admin/lecturers/${id}`} className="text-sm font-medium text-niqat">
          ← Back
        </Link>
      </div>
    );
  }

  const { data: lecturer } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("id", id)
    .maybeSingle();
  if (!lecturer || lecturer.role !== "lecturer") notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("bio, contact_links, experience, certificates")
    .eq("user_id", id)
    .maybeSingle();

  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;
  const experience = Array.isArray(profile?.experience) ? (profile!.experience as Record<string, string>[]) : [];
  const certificates = Array.isArray(profile?.certificates) ? (profile!.certificates as Record<string, string>[]) : [];
  const linkEntries = Object.entries(links).filter(([, v]) => v);

  return (
    <div className="space-y-5">
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <div className="no-print flex items-center justify-between">
        <Link href={`/admin/lecturers/${id}`} className="text-sm text-muted hover:text-ink">
          ← Back
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl rounded-card border border-line bg-white p-10 shadow-card">
        <header className="border-b-2 border-niqat pb-5">
          <h1 className="text-3xl font-extrabold text-ink">{lecturer.full_name || lecturer.email}</h1>
          <p className="mt-1 text-sm text-muted">Lecturer · Niqat</p>
          {linkEntries.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {linkEntries.map(([k, v]) => `${k}: ${v}`).join("   •   ")}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">{lecturer.email}</p>
        </header>

        {bio && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-niqat">Profile</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{bio}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-niqat">Experience</h2>
            <ul className="mt-2 space-y-3">
              {experience.map((e, i) => (
                <li key={i}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-semibold text-ink">
                      {e.title || "—"}
                      {e.organization ? ` · ${e.organization}` : ""}
                    </p>
                    {e.period && <span className="shrink-0 text-xs text-muted">{e.period}</span>}
                  </div>
                  {e.description && <p className="mt-0.5 text-sm text-muted">{e.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {certificates.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-niqat">Certificates</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {certificates.map((c, i) => (
                <li key={i}>
                  {c.name || "—"}
                  {c.issuer ? ` · ${c.issuer}` : ""}
                  {c.year ? ` (${c.year})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-10 border-t border-line pt-4 text-center text-xs text-faint">
          Niqat — Beyond Education
        </footer>
      </article>
    </div>
  );
}
