import JSZip from "jszip";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/types";

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let ids: string[] = [];
  try {
    const body = await request.json();
    ids = Array.isArray(body?.ids) ? body.ids.slice(0, 200) : [];
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ error: "No files selected." }, { status: 400 });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("files")
    .select("id, name, title, path, source, link_url")
    .in("id", ids);
  if (!rows || rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const zip = new JSZip();
  const used = new Set<string>();
  const uniqueName = (base: string) => {
    let n = base, i = 1;
    while (used.has(n)) { const dot = base.lastIndexOf("."); n = dot > 0 ? `${base.slice(0, dot)}(${i})${base.slice(dot)}` : `${base}(${i})`; i++; }
    used.add(n);
    return n;
  };

  for (const r of rows as { id: string; name: string; title: string | null; path: string; source: string; link_url: string | null }[]) {
    // audit every download
    try { await supabase.rpc("log_download", { p_file_id: r.id }); } catch { /* non-critical */ }
    if (r.source === "link") {
      zip.file(uniqueName(`${(r.title || r.name || "link")}.txt`), r.link_url || "");
      continue;
    }
    const { data: blob } = await supabase.storage.from("lecturer-files").download(r.path);
    if (blob) {
      const buf = Buffer.from(await blob.arrayBuffer());
      zip.file(uniqueName(r.name || "file"), buf);
    }
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });
  const bytes = new Uint8Array(content);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="niqat-assets-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
