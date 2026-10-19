import { notFound } from "next/navigation";
import { requireAccess, can } from "@/lib/auth";
import { EmployeeForm, EmployeeArchive } from "../form";

export default async function PegawaiDetail({ params }: { params: { id: string } }) {
  const { supabase, permissions } = await requireAccess("employees.view");
  const { data: e } = await supabase.from("employees").select("*").eq("id", params.id).maybeSingle();
  if (!e) notFound();
  const canEdit = can(permissions, "employees.update");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-navy-800">{e.full_name}</h1>
        {canEdit && <EmployeeArchive id={e.id} archived={!!e.archived_at} />}
      </div>
      {e.archived_at && <p className="card text-sm text-amber-800">Pegawai ini diarsipkan.</p>}
      {canEdit ? <EmployeeForm v={e} /> : <p className="card text-sm text-slate-600">Anda hanya dapat melihat data ini.</p>}
      <p className="card text-sm text-slate-500">Rekening dan slip gaji dikelola di modul Penggajian (Tahap 5) dengan izin terpisah.</p>
    </div>
  );
}
