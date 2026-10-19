/** Parser CSV sederhana (mendukung tanda kutip dan pemisah koma/titik koma). */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (q) {
      if (c === '"' && clean[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** Terima YYYY-MM-DD atau DD-MM-YYYY; kembalikan YYYY-MM-DD, "" jika kosong, null jika tidak valid. */
export function normalizeDate(v: string): string | "" | null {
  const s = v.trim();
  if (!s) return "";
  let y: string, m: string, d: string;
  let x = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (x) [, y, m, d] = x;
  else if ((x = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/))) [, d, m, y] = x;
  else return null;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const dt = new Date(iso + "T00:00:00Z");
  return isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso ? null : iso;
}
