import type { SupabaseClient } from "@supabase/supabase-js";

export type AssetItem = {
  id: string;
  name: string;
  title: string | null;
  asset_kind: string;
  source: string;
  link_url: string | null;
  isImage: boolean;
  isPdf: boolean;
  previewUrl: string | null;
  uploaded_at: string;
  programName?: string | null;
  lecturerName?: string | null;
  downloadedLabel?: string | null;
  featured: boolean;
  size: number | null;
  fileType: string | null;
};

export type FileRowLike = {
  id: string;
  name: string;
  title: string | null;
  asset_kind: string;
  source: string;
  link_url: string | null;
  type: string | null;
  path: string;
  size?: number | null;
  uploaded_at: string;
  program_id?: string | null;
  owner_id?: string | null;
  last_downloaded_at?: string | null;
  last_downloaded_by?: string | null;
  featured?: boolean | null;
};

export async function toAssetItems(
  supabase: SupabaseClient,
  rows: FileRowLike[],
  opts: {
    programNames?: Record<string, string>;
    lecturerNames?: Record<string, string>;
    downloaderNames?: Record<string, string>;
  } = {},
): Promise<AssetItem[]> {
  return Promise.all(
    rows.map(async (f) => {
      const isImage = !!f.type && f.type.startsWith("image/");
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      let previewUrl: string | null = null;
      if (f.source !== "link" && (isImage || isPdf)) {
        const { data } = await supabase.storage.from("lecturer-files").createSignedUrl(f.path, 3600);
        previewUrl = data?.signedUrl ?? null;
      }
      const dl =
        f.last_downloaded_at
          ? `Downloaded ${new Date(f.last_downloaded_at).toLocaleDateString()}${
              f.last_downloaded_by && opts.downloaderNames?.[f.last_downloaded_by]
                ? ` by ${opts.downloaderNames[f.last_downloaded_by]}`
                : ""
            }`
          : null;
      return {
        id: f.id,
        name: f.name,
        title: f.title,
        asset_kind: f.asset_kind,
        source: f.source,
        link_url: f.link_url,
        isImage,
        isPdf,
        previewUrl,
        uploaded_at: f.uploaded_at,
        programName: f.program_id ? opts.programNames?.[f.program_id] ?? null : null,
        lecturerName: f.owner_id ? opts.lecturerNames?.[f.owner_id] ?? null : null,
        downloadedLabel: dl,
        featured: !!f.featured,
        size: f.size ?? null,
        fileType: f.type,
      };
    }),
  );
}
