import { notFound } from "next/navigation";
import { requireAccess, can } from "@/lib/auth";
import StudentForm from "../form";
import Guardians, { type Link } from "./guardians";
import ArchiveButton from "./archive";

export default async function SantriDetail({ params }: { params: { id: string } }) {
  const { supabase, permissions } = await requireAccess("students.view");
  const { data: st } = await supabase.from("students").select("*").eq("id", params.id).maybeSingle();
  if (!st) notFound();

  const [{ data: dorms }, { data: links }, { data: enr }] = await Promise.all([
    supabase.from("dormitories").select("id, name").order("name"),
    supabase.from("student_guardians")
      .select("guardian_id, relation, status, guardians(full_name, phone, user_id)").eq("student_id", params.id),
    supabase.from("class_enrollments").select("classes(name, level), academic_years(name)").eq("student_id", params.id),
  ]);

  const canEdit = can(permissions, "students.update");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-navy-800">{st.full_name}</h1>
        {canEdit && <ArchiveButton id={st.id} archived={!!st.archived_at} />}
      </div>
      {st.archived_at && <p className="card text-sm text-amber-800">Santri ini diarsipkan.</p>}
      {canEdit
        ? <StudentForm v={st} dorms={dorms ?? []} />
        : <p className="card text-sm text-slate-600">Anda hanya dapat melihat data ini.</p>}

      <div className="card space-y-2">
        <h2 className="font-semibold text-navy-800">Riwayat kelas</h2>
        {(enr ?? []).length === 0 && <p className="text-sm text-slate-500">Belum terdaftar di kelas mana pun.</p>}
        {(enr ?? []).map((e: any, i) => (
          <p key={i} className="text-sm">{e.academic_years?.name}: {e.classes?.level} — {e.classes?.name}</p>))}
      </div>

      <Guardians studentId={st.id} links={(links ?? []) as unknown as Link[]}
        canAdd={can(permissions, "guardians.create")} canApprove={can(permissions, "guardians.approve")}
        canRemove={can(permissions, "guardians.update")} />
    </div>
  );
}
