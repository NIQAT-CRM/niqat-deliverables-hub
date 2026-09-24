import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssetGrid } from "@/components/app/AssetGrid";
import { toAssetItems, type FileRowLike, type AssetItem } from "@/lib/asset-view";
import { ASSET_KINDS } from "@/lib/assets";

export const dynamic = "force-dynamic";

const sel = "h-[42px] rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

type SP = { kind?: string; program?: string; q?: string; ftype?: string; from?: string; to?: string; sort?: string };

function matchesType(it: AssetItem, ftype: string): boolean {
  if (!ftype) return true;
  if (ftype === "link") return it.source === "link";
  if (ftype === "image") return it.isImage;
  if (ftype === "pdf") return it.isPdf;
  if (ftype === "video") return false; // reserved
  if (ftype === "other") return it.source !== "link" && !it.isImage && !it.isPdf;
  return true;
}

export default async function DataHub({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const canManage = me.role === "admin" || me.role === "management";
  const supabase = await createClient();

  const cols = "id, name, title, asset_kind, source, link_url, type, path, program_id, owner_id, uploaded_at, last_downloaded_at, last_downloaded_by, featured";

  let query = supabase.from("files").select(cols).limit(300);
  if (sp.kind) query = query.eq("asset_kind", sp.kind);
  if (sp.program) query = query.eq("program_id", sp.program);
  if (sp.q) query = query.or(`name.ilike.%${sp.q}%,title.ilike.%${sp.q}%`);
  if (sp.from) query = query.gte("uploaded_at", sp.from);
  if (sp.to) query = query.lte("uploaded_at", `${sp.to}T23:59:59`);
  if (sp.sort === "oldest") query = query.order("uploaded_at", { ascending: true });
  else if (sp.sort === "downloaded") query = query.order("last_downloaded_at", { ascending: false, nullsFirst: false });
  else query = query.order("uploaded_at", { ascending: false });

  const [{ data: files }, { data: featured }, { data: progs }, { data: lecturers }] = await Promise.all([
    query,
    supabase.from("files").select(cols).eq("featured", true).order("uploaded_at", { ascending: false }).limit(8),
    supabase.from("programs").select("id, name").order("name"),
    supabase.from("users").select("id, full_name, email").eq("role", "lecturer"),
  ]);

  const programNames: Record<string, string> = {};
  for (const p of (progs ?? []) as { id: string; name: string }[]) programNames[p.id] = p.name;
  const lecturerNames: Record<string, string> = {};
  for (const l of (lecturers ?? []) as { id: string; full_name: string | null; email: string }[]) lecturerNames[l.id] = l.full_name || l.email;

  let items = await toAssetItems(supabase, (files ?? []) as FileRowLike[], { programNames, lecturerNames });
  if (sp.ftype) items = items.filter((it) => matchesType(it, sp.ftype!));
  const featuredItems = await toAssetItems(supabase, (featured ?? []) as FileRowLike[], { programNames, lecturerNames });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Data hub</h1>
        <p className="mt-1 text-sm text-muted">Every asset across all instructors. {items.length} shown.</p>
      </div>

      {featuredItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-ink">Featured</h2>
          <AssetGrid items={featuredItems} canDelete={isAdmin} canFeature={canManage} canShare={canManage} showLecturer />
        </div>
      )}

      <form className="flex flex-wrap items-end gap-2" action="/admin/data">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search…" className={`${sel} min-w-[160px] flex-1`} />
        <select name="kind" defaultValue={sp.kind ?? ""} className={sel}><option value="">All kinds</option>{ASSET_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
        <select name="ftype" defaultValue={sp.ftype ?? ""} className={sel}><option value="">All types</option><option value="image">Images</option><option value="pdf">PDF</option><option value="link">Links</option><option value="other">Other</option></select>
        <select name="program" defaultValue={sp.program ?? ""} className={sel}><option value="">All programs</option>{(progs ?? []).map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className={sel} aria-label="From" />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className={sel} aria-label="To" />
        <select name="sort" defaultValue={sp.sort ?? ""} className={sel}><option value="">Newest</option><option value="oldest">Oldest</option><option value="downloaded">Recently downloaded</option></select>
        <button type="submit" className="h-[42px] rounded-control bg-niqat px-4 text-sm font-semibold text-white hover:bg-niqat-hover">Filter</button>
        {(sp.kind || sp.program || sp.q || sp.ftype || sp.from || sp.to || sp.sort) && <Link href="/admin/data" className="text-sm text-muted hover:text-ink">Clear</Link>}
      </form>

      <AssetGrid items={items} canDelete={isAdmin} canFeature={canManage} canShare={canManage} showLecturer selectable />
    </div>
  );
}
