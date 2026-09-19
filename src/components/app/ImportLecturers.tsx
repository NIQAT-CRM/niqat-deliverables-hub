"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  importLecturers,
  type ImportRow,
  type ImportResult,
} from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/Button";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toRows(matrix: string[][]): ImportRow[] {
  if (matrix.length === 0) return [];
  const header = matrix[0].map((h) => h.trim().toLowerCase());
  const known = ["email", "name", "full_name", "full name", "password", "pass"];
  const hasHeader = header.some((h) => known.includes(h));
  let idxName = 0;
  let idxEmail = 1;
  let idxPass = 2;
  let start = 0;
  if (hasHeader) {
    start = 1;
    const find = (names: string[]) => header.findIndex((h) => names.includes(h));
    const n = find(["full_name", "name", "full name"]);
    const e = find(["email", "e-mail"]);
    const p = find(["password", "pass"]);
    idxName = n >= 0 ? n : 0;
    idxEmail = e >= 0 ? e : 1;
    idxPass = p >= 0 ? p : 2;
  }
  const out: ImportRow[] = [];
  for (let i = start; i < matrix.length; i++) {
    const r = matrix[i];
    out.push({
      full_name: (r[idxName] || "").trim(),
      email: (r[idxEmail] || "").trim(),
      password: (r[idxPass] || "").trim(),
    });
  }
  return out;
}

export function ImportLecturers() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setResult(null);
    setError(null);
    setRows([]);
    setFileName(null);
    if (!file) return;
    const text = await file.text();
    const parsed = toRows(parseCSV(text));
    if (parsed.length === 0) {
      setError("Couldn't find any rows in that file.");
      return;
    }
    setRows(parsed);
    setFileName(file.name);
  }

  function runImport() {
    setError(null);
    setResult(null);
    setBusy(true);
    (async () => {
      const res = await importLecturers(rows);
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult(res);
      router.refresh();
    })();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink">CSV format</h2>
        <p className="mt-1 text-sm text-muted">
          Three columns with a header row: <code>full_name</code>, <code>email</code>,{" "}
          <code>password</code>. Each password must be at least 8 characters.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card bg-surface p-3 text-xs text-muted">
{`full_name,email,password
Jane Doe,jane@niqat.com,TempPass123
Omar Ali,omar@niqat.com,TempPass456`}
        </pre>

        <div className="mt-4 flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            variant="secondary"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Choose CSV
          </Button>
          {fileName && (
            <span className="text-sm text-muted">
              {fileName} — {rows.length} {rows.length === 1 ? "row" : "rows"}
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-4">
            <Button type="button" disabled={busy} onClick={runImport}>
              {busy ? "Importing…" : `Import ${rows.length} lecturers`}
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-card bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Import result</h2>
          <p className="mt-1 text-sm text-muted">
            Created {result.created}{" "}
            {result.created === 1 ? "lecturer" : "lecturers"}.
            {result.failures.length > 0
              ? ` ${result.failures.length} skipped.`
              : " No errors."}
          </p>
          {result.failures.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {result.failures.map((f, i) => (
                <li key={i} className="text-muted">
                  <span className="text-ink">{f.email}</span> — {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
