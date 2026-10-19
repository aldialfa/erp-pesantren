"use client";
import { useState, useTransition } from "react";
import { setLinkStatus } from "./actions";

export interface Pending {
  student_id: string; guardian_id: string; relation: string;
  studentName: string; nis: string; guardianName: string; phone: string | null; hasAccount: boolean;
}

export default function PendingList({ items }: { items: Pending[] }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (p: Pending, s: "disetujui" | "ditolak") =>
    start(async () => { const r = await setLinkStatus(p.student_id, p.guardian_id, s); setMsg({ ok: r.ok, text: r.message }); });

  if (items.length === 0) return <p className="card text-sm text-slate-500">Tidak ada hubungan wali yang menunggu persetujuan.</p>;
  return (
    <div className="space-y-3">
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <ul className="space-y-3">
        {items.map((p) => (
          <li key={`${p.student_id}-${p.guardian_id}`} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-navy-800">{p.guardianName} <span className="font-normal text-slate-500">sebagai {p.relation}</span></p>
              <p className="text-sm text-slate-600">dari {p.studentName} (NIS {p.nis})</p>
              <p className="text-xs text-slate-500">{p.phone ?? "tanpa telepon"} · {p.hasAccount ? "punya akun portal" : "belum punya akun portal"}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn" disabled={pending} onClick={() => run(p, "disetujui")}>Setujui</button>
              <button className="btn-ghost" disabled={pending} onClick={() => run(p, "ditolak")}>Tolak</button>
            </div>
          </li>))}
      </ul>
    </div>
  );
}
