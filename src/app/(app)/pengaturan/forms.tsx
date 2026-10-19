"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { saveInstitution, addAcademicYear, activateAcademicYear } from "./actions";

type Result = { ok: boolean; message: string } | null;

function Msg({ r }: { r: Result }) {
  if (!r) return null;
  return <p role="status" className={`text-sm ${r.ok ? "text-emerald-700" : "text-red-600"}`}>{r.message}</p>;
}
function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan..." : children}</button>;
}

export interface Inst { id: string; name: string; address: string | null; phone: string | null; email: string | null; report_header: string | null; }
export interface Year { id: string; name: string; start_date: string; end_date: string; is_active: boolean; startLabel: string; endLabel: string; }

export function InstitutionForm({ inst }: { inst: Inst }) {
  const [state, action] = useFormState(saveInstitution, null as Result);
  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-semibold text-navy-800">Identitas lembaga</h2>
      <input type="hidden" name="id" value={inst.id} />
      <div><label className="label" htmlFor="name">Nama pesantren</label>
        <input id="name" name="name" required className="input" defaultValue={inst.name} /></div>
      <div><label className="label" htmlFor="address">Alamat</label>
        <textarea id="address" name="address" rows={2} className="input" defaultValue={inst.address ?? ""} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="phone">Nomor kontak</label>
          <input id="phone" name="phone" className="input" defaultValue={inst.phone ?? ""} /></div>
        <div><label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" defaultValue={inst.email ?? ""} /></div>
      </div>
      <div><label className="label" htmlFor="rh">Kop laporan</label>
        <textarea id="rh" name="report_header" rows={2} className="input" defaultValue={inst.report_header ?? ""} /></div>
      <Msg r={state} />
      <Submit>Simpan perubahan</Submit>
    </form>
  );
}

export function YearsPanel({ years, canManage }: { years: Year[]; canManage: boolean }) {
  const [state, action] = useFormState(addAcademicYear, null as Result);
  const [res, setRes] = useState<Result>(null);
  const [pending, start] = useTransition();

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-navy-800">Tahun ajaran</h2>
      {years.length === 0 && <p className="text-sm text-slate-500">Belum ada tahun ajaran. Tambahkan yang pertama di bawah.</p>}
      <ul className="divide-y divide-slate-100">
        {years.map((y) => (
          <li key={y.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{y.name}
                {y.is_active && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Aktif</span>}</p>
              <p className="text-xs text-slate-500">{y.startLabel} s.d. {y.endLabel}</p>
            </div>
            {canManage && !y.is_active && (
              <button className="btn-ghost" disabled={pending}
                onClick={() => start(async () => setRes(await activateAcademicYear(y.id)))}>Jadikan aktif</button>
            )}
          </li>
        ))}
      </ul>
      <Msg r={res} />
      {canManage && (
        <form action={action} className="space-y-3 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label className="label" htmlFor="yn">Nama (mis. 2026/2027)</label>
              <input id="yn" name="name" required className="input" /></div>
            <div><label className="label" htmlFor="ys">Mulai</label>
              <input id="ys" name="start_date" type="date" required className="input" /></div>
            <div><label className="label" htmlFor="ye">Selesai</label>
              <input id="ye" name="end_date" type="date" required className="input" /></div>
          </div>
          <Msg r={state} />
          <Submit>Tambah tahun ajaran</Submit>
        </form>
      )}
    </div>
  );
}
