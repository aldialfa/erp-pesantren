"use client";
import { useFormState, useFormStatus } from "react-dom";
import { saveStudent } from "./actions";

type R = { ok: boolean; message: string } | null;
export interface StudentValues {
  id?: string; nis?: string; full_name?: string; gender?: string; birth_place?: string | null;
  birth_date?: string | null; address?: string | null; phone?: string | null; admission_date?: string | null;
  program?: string | null; dormitory_id?: string | null; status?: string;
}

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>;
}

export default function StudentForm({ v, dorms }: { v: StudentValues; dorms: { id: string; name: string }[] }) {
  const [state, action] = useFormState(saveStudent, null as R);
  return (
    <form action={action} className="card space-y-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="nis">NIS</label>
          <input id="nis" name="nis" required className="input" defaultValue={v.nis ?? ""} /></div>
        <div><label className="label" htmlFor="fn">Nama lengkap</label>
          <input id="fn" name="full_name" required className="input" defaultValue={v.full_name ?? ""} /></div>
        <div><label className="label" htmlFor="g">Jenis kelamin</label>
          <select id="g" name="gender" required className="input" defaultValue={v.gender ?? ""}>
            <option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
        <div><label className="label" htmlFor="st">Status</label>
          <select id="st" name="status" className="input" defaultValue={v.status ?? "aktif"}>
            <option value="aktif">Aktif</option><option value="lulus">Lulus</option>
            <option value="pindah">Pindah</option><option value="nonaktif">Nonaktif</option></select></div>
        <div><label className="label" htmlFor="bp">Tempat lahir</label>
          <input id="bp" name="birth_place" className="input" defaultValue={v.birth_place ?? ""} /></div>
        <div><label className="label" htmlFor="bd">Tanggal lahir</label>
          <input id="bd" name="birth_date" type="date" className="input" defaultValue={v.birth_date ?? ""} /></div>
        <div><label className="label" htmlFor="ad">Tanggal masuk</label>
          <input id="ad" name="admission_date" type="date" className="input" defaultValue={v.admission_date ?? ""} /></div>
        <div><label className="label" htmlFor="pr">Program pendidikan</label>
          <input id="pr" name="program" className="input" defaultValue={v.program ?? ""} /></div>
        <div><label className="label" htmlFor="dm">Asrama</label>
          <select id="dm" name="dormitory_id" className="input" defaultValue={v.dormitory_id ?? ""}>
            <option value="">Tanpa asrama</option>
            {dorms.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="label" htmlFor="ph">Telepon</label>
          <input id="ph" name="phone" className="input" defaultValue={v.phone ?? ""} /></div>
      </div>
      <div><label className="label" htmlFor="al">Alamat</label>
        <textarea id="al" name="address" rows={2} className="input" defaultValue={v.address ?? ""} /></div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
      <Submit />
    </form>
  );
}
