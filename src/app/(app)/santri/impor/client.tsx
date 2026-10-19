"use client";
import { useState, useTransition } from "react";
import { parseCsv } from "@/lib/csv";
import { importStudents, type ImportReport } from "../actions";

const TEMPLATE = "nis,nama_lengkap,jenis_kelamin,tempat_lahir,tanggal_lahir,tanggal_masuk,alamat,telepon,program\n" +
  "2026001,Contoh Santri,L,Bandung,15-03-2012,01-07-2026,Jl. Contoh No. 1,08123456789,Reguler\n";

export default function ImportClient() {
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, start] = useTransition();

  async function onFile(f: File | undefined) {
    setReport(null);
    if (!f) return setRows(null);
    setRows(parseCsv(await f.text()));
  }

  return (
    <div className="card space-y-4">
      <p className="text-sm text-slate-600">
        Kolom wajib: <b>nis, nama_lengkap, jenis_kelamin</b> (L/P). Tanggal boleh DD-MM-YYYY atau YYYY-MM-DD. Maksimal 500 baris.
        Baris yang ganda atau salah dilewati dan dilaporkan; baris valid tetap disimpan.
      </p>
      <a className="btn-ghost" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="template-santri.csv">Unduh templat CSV</a>
      <div><label className="label" htmlFor="f">Berkas CSV</label>
        <input id="f" type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} /></div>
      {rows && <p className="text-sm">{rows.length} baris terbaca.</p>}
      {rows && rows.length > 0 && (
        <button className="btn" disabled={pending}
          onClick={() => start(async () => setReport(await importStudents(rows)))}>
          {pending ? "Mengimpor..." : "Mulai impor"}</button>)}
      {report && (
        <div role="status" className="space-y-2">
          <p className="text-sm font-medium text-emerald-700">{report.inserted} santri berhasil diimpor.</p>
          {report.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{report.errors.length} baris bermasalah:</p>
              <ul className="mt-1 max-h-60 list-disc overflow-auto pl-5 text-sm text-red-700">
                {report.errors.map((e, i) => <li key={i}>{e.line ? `Baris ${e.line}: ` : ""}{e.message}</li>)}
              </ul>
            </div>)}
        </div>)}
    </div>
  );
}
