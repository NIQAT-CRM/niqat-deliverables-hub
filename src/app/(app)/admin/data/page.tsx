import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssetGrid } from "@/components/app/AssetGrid";
import { toAssetItems, type FileRowLike } from "@/lib/asset-view";
import { ASSET_KINDS } from "@/lib/assets";

export const dynamic = "force-dynamic";

const sel = "h-[42px] rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export default async function DataHub({ searchParams }: { searchParams: Promise<{ kind?: string; program?: string; q?: string }> }) {
  const { kind, program, q } = await searchParams;
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();

  let query = supabase
    .from("files")
    .select("id, name, title, asset_kind, source, link_url, type, path, program_id, owner_id, uploaded_at, last_downloaded_at, last_downloaded_by")
    .order("uploaded_at", { ascending: false })
    .limit(200);
  if (kind) query = query.eq("asset_kind", kind);
  if (program) query = query.eq("program_id", program);
  if (q) query = query.or(`name.ilike.%${q}%,title.ilike.%${q}%`);

  const [{ data: files }, { data: progs }, { data: lecturers }] = await Promise.all([
    query,
    supabase.from("programs").select("id, name").order("name"),
    supabase.from("users").select("id, full_name, email").eq("role", "lecturer"),
  ]);

  const programNames: Record<string, string> = {};
  for (const p of (progs ?? []) as { id: string; name: string }[]) programNames[p.id] = p.name;
  const lecturerNames: Record<string, string> = {};
  for (const l of (lecturers ?? []) as { id: string; full_name: string | null; email: string }[]) lecturerNames[l.id] = l.full_name || l.email;

  const items = await toAssetItems(supabase, (files ?? []) as FileRowLike[], { programNames, lecturerNames });

  const chip = (label: string, params: Record<string, string>) => {
    const sp = new URLSearchParams(params as Record<string, string>);
    const href = `/admin/data${sp.toString() ? `?${sp}` : ""}`;
    const active = (params.kind ?? "") === (kind ?? "") && !params.__reset;
    return <Link key={label} href={href} className={`rounded-control px-3 py-1.5 text-sm font-medium ${active ? "bg-niqat-soft text-niqat" : "text-muted hover:text-ink"}`}>{label}</Link>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Data hub</h1>
        <p className="mt-1 text-sm text-muted">Every asset across all instructors. {items.length} shown.</p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/data">
        <input name="q" defaultValue={q ?? ""} placeholder="Search…" className={`${sel} min-w-[180px] flex-1`} />
        <select name="kind" defaultValue={kind ?? ""} className={sel}>
          <option value="">All types</option>
          {ASSET_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select name="program" defaultValue={program ?? ""} className={sel}>
          <option value="">All programs</option>
          {(progs ?? []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" className="h-[42px] rounded-control bg-niqat px-4 text-sm font-semibold text-white hover:bg-niqat-hover">Filter</button>
        {(kind || program || q) && <Link href="/admin/data" className="text-sm text-muted hover:text-ink">Clear</Link>}
      </form>

      <AssetGrid items={items} canDelete={isAdmin} showLecturer />
    </div>
  );
}
