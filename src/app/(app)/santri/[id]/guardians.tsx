"use client";
import { useState, useTransition } from "react";
import { addGuardian, setLinkStatus, removeLink } from "../../wali/actions";

export interface Link {
  guardian_id: string; relation: string; status: string;
  guardians: { full_name: string; phone: string | null; user_id: string | null } | null;
}
const BADGE: Record<string, string> = {
  disetujui: "bg-emerald-100 text-emerald-800", menunggu: "bg-amber-100 text-amber-800", ditolak: "bg-red-100 text-red-800" };

export default function Guardians({ studentId, links, canAdd, canApprove, canRemove }:
  { studentId: string; links: Link[]; canAdd: boolean; canApprove: boolean; canRemove: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.message }); });

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-navy-800">Wali santri</h2>
      {links.length === 0 && <p className="text-sm text-slate-500">Belum ada wali terhubung.</p>}
      <ul className="divide-y divide-slate-100">
        {links.map((l) => (
          <li key={l.guardian_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div>
              <p className="text-sm font-medium">{l.guardians?.full_name} <span className="text-slate-500">({l.relation})</span></p>
              <p className="text-xs text-slate-500">{l.guardians?.phone ?? "tanpa telepon"} · {l.guardians?.user_id ? "punya akun portal" : "belum punya akun portal"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs ${BADGE[l.status]}`}>{l.status}</span>
              {canApprove && l.status !== "disetujui" && (
                <button className="btn-ghost" disabled={pending} onClick={() => run(() => setLinkStatus(studentId, l.guardian_id, "disetujui"))}>Setujui</button>)}
              {canApprove && l.status === "menunggu" && (
                <button className="btn-ghost" disabled={pending} onClick={() => run(() => setLinkStatus(studentId, l.guardian_id, "ditolak"))}>Tolak</button>)}
              {canRemove && (
                <button className="btn-ghost" disabled={pending} onClick={() => { if (confirm("Hapus hubungan wali ini?")) run(() => removeLink(studentId, l.guardian_id)); }}>Hapus</button>)}
            </div>
          </li>))}
      </ul>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      {canAdd && (
        <form className="space-y-3 border-t border-slate-100 pt-4"
          action={(fd) => run(() => addGuardian(studentId, fd))}>
          <p className="text-sm font-medium">Tambah wali</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="gn">Nama wali</label><input id="gn" name="name" className="input" /></div>
            <div><label className="label" htmlFor="gr">Hubungan</label>
              <select id="gr" name="relation" className="input" defaultValue="ayah">
                <option value="ayah">Ayah</option><option value="ibu">Ibu</option><option value="wali">Wali</option></select></div>
            <div><label className="label" htmlFor="gp">Telepon</label><input id="gp" name="phone" className="input" /></div>
            <div><label className="label" htmlFor="ge">Email akun portal (opsional)</label><input id="ge" name="email" type="email" className="input" /></div>
          </div>
          <p className="text-xs text-slate-500">Jika email sudah terdaftar sebagai wali anak lain, data wali dipakai ulang. Hubungan baru perlu disetujui sebelum wali dapat melihat data anak.</p>
          <button className="btn" disabled={pending}>Tambah wali</button>
        </form>)}
    </div>
  );
}
