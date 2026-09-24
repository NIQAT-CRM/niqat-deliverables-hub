import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateCollection } from "@/components/app/CreateCollection";
import { DeleteCollectionButton } from "@/components/app/DeleteCollectionButton";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  await requireUser();
  const supabase = await createClient();
  const [{ data: cols }, { data: items }] = await Promise.all([
    supabase.from("collections").select("id, name, description, created_at").order("created_at", { ascending: false }),
    supabase.from("collection_items").select("collection_id"),
  ]);
  const counts: Record<string, number> = {};
  for (const it of (items ?? []) as { collection_id: string }[]) counts[it.collection_id] = (counts[it.collection_id] ?? 0) + 1;
  const rows = (cols ?? []) as { id: string; name: string; description: string | null; created_at: string }[];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold text-ink">Collections</h1><p className="mt-1 text-sm text-muted">Curate assets from any instructor into shareable sets.</p></div>
      <CreateCollection />
      {rows.length === 0 ? (
        <EmptyState title="No collections yet" description="Create one, then add assets from the Data hub." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-card border border-line bg-card p-5 shadow-card transition-all hover:border-niqat/40 hover:shadow-card-hover hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/collections/${c.id}`} className="font-bold text-ink hover:text-niqat">{c.name}</Link>
                <DeleteCollectionButton id={c.id} />
              </div>
              {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
              <p className="mt-3 text-xs text-faint">{counts[c.id] ?? 0} assets</p>
              <Link href={`/admin/collections/${c.id}`} className="mt-3 inline-block text-sm font-semibold text-niqat hover:text-niqat-hover">Open</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
