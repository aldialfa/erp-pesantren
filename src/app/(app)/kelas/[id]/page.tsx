import { notFound } from "next/navigation";
import { requireAccess, can } from "@/lib/auth";
import Roster from "./roster";

export default async function KelasDetail({ params }: { params: { id: string } }) {
  const { supabase, permissions } = await requireAccess(["academic.view", "students.view"]);
  const { data: cls } = await supabase.from("classes").select("id, level, name, academic_year_id, academic_years(name)")
    .eq("id", params.id).maybeSingle();
  if (!cls) notFound();

  const { data: enr } = await supabase.from("class_enrollments")
    .select("id, student_id, students(full_name, nis)").eq("class_id", params.id);
  const { data: inYear } = await supabase.from("class_enrollments").select("student_id").eq("academic_year_id", cls.academic_year_id);
  const taken = new Set((inYear ?? []).map((r) => r.student_id));
  const { data: candidates } = await supabase.from("students").select("id, full_name, nis")
    .eq("status", "aktif").is("archived_at", null).order("full_name").limit(500);

  const members = (enr ?? []).map((e: any) => ({ id: e.id, name: e.students?.full_name ?? "", nis: e.students?.nis ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const options = (candidates ?? []).filter((s) => !taken.has(s.id)).map((s) => ({ id: s.id, label: `${s.full_name} (${s.nis})` }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">{(cls as any).academic_years?.name} · {cls.level}</p>
        <h1 className="text-2xl font-bold text-navy-800">Kelas {cls.name}</h1>
      </div>
      <Roster classId={cls.id} members={members} options={options} canManage={can(permissions, "academic.manage")} />
    </div>
  );
}
