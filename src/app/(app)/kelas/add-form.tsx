"use client";
import { useFormState, useFormStatus } from "react-dom";
import { addClass } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan..." : "Tambah kelas"}</button>;
}
export default function AddClassForm() {
  const [state, action] = useFormState(addClass, null as { ok: boolean; message: string } | null);
  return (
    <form action={action} className="card space-y-3">
      <h2 className="font-semibold text-navy-800">Tambah kelas</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="lv">Jenjang (mis. MTs, MA)</label><input id="lv" name="level" required className="input" /></div>
        <div><label className="label" htmlFor="nm">Nama kelas (mis. VII-A)</label><input id="nm" name="name" required className="input" /></div>
      </div>
      {state && <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
      <Submit />
    </form>
  );
}
