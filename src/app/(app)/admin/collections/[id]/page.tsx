import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssetGrid } from "@/components/app/AssetGrid";
import { toAssetItems, type FileRowLike } from "@/lib/asset-view";

export const dynamic = "force-dynamic";

export default async function CollectionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();

  const { data: collection } = await supabase.from("collections").select("id, name, description").eq("id", id).maybeSingle();
  if (!collection) notFound();

  const [{ data: rows }, { data: progs }, { data: lecturers }] = await Promise.all([
    supabase.from("collection_items").select("file:file_id(id, name, title, asset_kind, source, link_url, type, path, program_id, owner_id, uploaded_at, featured)").eq("collection_id", id),
    supabase.from("programs").select("id, name"),
    supabase.from("users").select("id, full_name, email").eq("role", "lecturer"),
  ]);
  const programNames: Record<string, string> = {};
  for (const p of (progs ?? []) as { id: string; name: string }[]) programNames[p.id] = p.name;
  const lecturerNames: Record<string, string> = {};
  for (const l of (lecturers ?? []) as { id: string; full_name: string | null; email: string }[]) lecturerNames[l.id] = l.full_name || l.email;

  const fileRows = ((rows ?? []) as Record<string, unknown>[])
    .map((r) => (Array.isArray(r.file) ? r.file[0] : r.file) as FileRowLike | null)
    .filter((f): f is FileRowLike => !!f);
  const items = await toAssetItems(supabase, fileRows, { programNames, lecturerNames });

  return (
    <div className="space-y-6">
      <Link href="/admin/collections" className="text-sm text-muted hover:text-ink">← Back to collections</Link>
      <div><h1 className="text-2xl font-extrabold text-ink">{collection.name}</h1>{collection.description && <p className="mt-1 text-sm text-muted">{collection.description}</p>}</div>
      <AssetGrid items={items} showLecturer canShare={me.role === "admin" || me.role === "management"} canFeature={me.role === "admin" || me.role === "management"} canDelete={isAdmin} collectionId={id} selectable />
    </div>
  );
}
