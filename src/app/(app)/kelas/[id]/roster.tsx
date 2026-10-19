"use client";
import { useState, useTransition } from "react";
import { enrollStudent, unenrollStudent } from "../actions";

export default function Roster({ classId, members, options, canManage }:
  { classId: string; members: { id: string; name: string; nis: string }[]; options: { id: string; label: string }[]; canManage: boolean }) {
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.message }); if (r.ok) setSel(""); });

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="card flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="sel">Tambah santri ke kelas</label>
            <select id="sel" className="input" value={sel} onChange={(e) => setSel(e.target.value)}>
              <option value="">Pilih santri aktif yang belum punya kelas</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <button className="btn" disabled={pending || !sel} onClick={() => run(() => enrollStudent(classId, sel))}>Tambahkan</button>
        </div>)}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <div className="card">
        <h2 className="mb-2 font-semibold text-navy-800">Daftar santri ({members.length})</h2>
        {members.length === 0 && <p className="text-sm text-slate-500">Belum ada santri di kelas ini.</p>}
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <span className="text-sm">{m.name} <span className="text-slate-500">· NIS {m.nis}</span></span>
              {canManage && (
                <button className="btn-ghost" disabled={pending}
                  onClick={() => { if (confirm(`Keluarkan ${m.name} dari kelas ini?`)) run(() => unenrollStudent(classId, m.id)); }}>Keluarkan</button>)}
            </li>))}
        </ul>
      </div>
    </div>
  );
}
