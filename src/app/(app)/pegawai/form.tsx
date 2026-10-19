"use client";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveEmployee, setEmployeeArchived } from "./actions";

type R = { ok: boolean; message: string } | null;
export interface EmployeeValues {
  id?: string; nip?: string; full_name?: string; position?: string | null; work_unit?: string | null;
  start_date?: string | null; status?: string; phone?: string | null; email?: string | null; address?: string | null;
}
function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>;
}

export function EmployeeForm({ v }: { v: EmployeeValues }) {
  const [state, action] = useFormState(saveEmployee, null as R);
  return (
    <form action={action} className="card space-y-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="nip">Nomor induk pegawai</label>
          <input id="nip" name="nip" required className="input" defaultValue={v.nip ?? ""} /></div>
        <div><label className="label" htmlFor="fn">Nama lengkap</label>
          <input id="fn" name="full_name" required className="input" defaultValue={v.full_name ?? ""} /></div>
        <div><label className="label" htmlFor="po">Jabatan</label>
          <input id="po" name="position" className="input" defaultValue={v.position ?? ""} /></div>
        <div><label className="label" htmlFor="wu">Unit kerja</label>
          <input id="wu" name="work_unit" className="input" defaultValue={v.work_unit ?? ""} /></div>
        <div><label className="label" htmlFor="sd">Tanggal mulai bekerja</label>
          <input id="sd" name="start_date" type="date" className="input" defaultValue={v.start_date ?? ""} /></div>
        <div><label className="label" htmlFor="st">Status kerja</label>
          <select id="st" name="status" className="input" defaultValue={v.status ?? "aktif"}>
            <option value="aktif">Aktif</option><option value="cuti">Cuti</option><option value="nonaktif">Nonaktif</option></select></div>
        <div><label className="label" htmlFor="ph">Telepon</label>
          <input id="ph" name="phone" className="input" defaultValue={v.phone ?? ""} /></div>
        <div><label className="label" htmlFor="em">Email</label>
          <input id="em" name="email" type="email" className="input" defaultValue={v.email ?? ""} /></div>
      </div>
      <div><label className="label" htmlFor="al">Alamat</label>
        <textarea id="al" name="address" rows={2} className="input" defaultValue={v.address ?? ""} /></div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
      <Submit />
    </form>
  );
}

export function EmployeeArchive({ id, archived }: { id: string; archived: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex items-center gap-2">
      {msg && <span role="status" className="text-sm text-slate-600">{msg}</span>}
      <button className="btn-ghost" disabled={pending} onClick={() => {
        if (!archived && !confirm("Arsipkan pegawai ini? Data tetap tersimpan.")) return;
        start(async () => setMsg((await setEmployeeArchived(id, !archived)).message));
      }}>{archived ? "Kembalikan dari arsip" : "Arsipkan"}</button>
    </div>
  );
}
