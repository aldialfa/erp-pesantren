"use client";
import { useState, useTransition } from "react";
import { setUserActive, addRole, removeRole } from "./actions";

export interface UserRow {
  id: string; full_name: string; email: string | null; is_active: boolean; createdLabel: string;
  roles: { id: string; name: string }[];
}
export interface RoleOpt { id: string; name: string; }

export default function UsersTable({ users, roles, canManage, meId }:
  { users: UserRow[]; roles: RoleOpt[]; canManage: boolean; meId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.message }); });

  const shown = users.filter((u) =>
    `${u.full_name} ${u.email ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <input className="input max-w-sm" placeholder="Cari nama atau email" value={q}
        onChange={(e) => setQ(e.target.value)} aria-label="Cari pengguna" />
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      {shown.length === 0 && <p className="card text-sm text-slate-500">Tidak ada pengguna yang cocok.</p>}
      <ul className="space-y-3">
        {shown.map((u) => {
          const free = roles.filter((r) => !u.roles.some((x) => x.id === r.id));
          return (
            <li key={u.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy-800">{u.full_name || "(tanpa nama)"}</p>
                  <p className="text-sm text-slate-500">{u.email} · terdaftar {u.createdLabel}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  u.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {u.is_active ? "Aktif" : "Menunggu aktivasi"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.roles.length === 0 && <span className="text-sm text-slate-400">Belum ada peran</span>}
                {u.roles.map((r) => (
                  <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-navy-800 px-3 py-1 text-xs text-white">
                    {r.name}
                    {canManage && (
                      <button aria-label={`Cabut peran ${r.name}`} disabled={pending}
                        onClick={() => { if (confirm(`Cabut peran ${r.name} dari ${u.full_name}?`)) run(() => removeRole(u.id, r.id)); }}>×</button>
                    )}
                  </span>
                ))}
              </div>
              {canManage && (
                <div className="flex flex-wrap items-center gap-2">
                  <select className="input w-auto" defaultValue="" disabled={pending} aria-label="Tambah peran"
                    onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v) run(() => addRole(u.id, v)); }}>
                    <option value="">+ Tambah peran</option>
                    {free.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  {u.id !== meId && (
                    <button className="btn-ghost" disabled={pending}
                      onClick={() => {
                        if (u.is_active && !confirm(`Nonaktifkan akun ${u.full_name}?`)) return;
                        run(() => setUserActive(u.id, !u.is_active));
                      }}>
                      {u.is_active ? "Nonaktifkan" : "Aktifkan akun"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
