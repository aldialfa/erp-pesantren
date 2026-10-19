import { requireAccess } from "@/lib/auth";
import PendingList, { type Pending } from "./pending";

export default async function WaliPage() {
  const { supabase } = await requireAccess("guardians.approve");
  const { data } = await supabase.from("student_guardians")
    .select("student_id, guardian_id, relation, students(full_name, nis), guardians(full_name, phone, user_id)")
    .eq("status", "menunggu").order("created_at");
  const items: Pending[] = (data ?? []).map((r: any) => ({
    student_id: r.student_id, guardian_id: r.guardian_id, relation: r.relation,
    studentName: r.students?.full_name ?? "", nis: r.students?.nis ?? "",
    guardianName: r.guardians?.full_name ?? "", phone: r.guardians?.phone ?? null, hasAccount: !!r.guardians?.user_id,
  }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Persetujuan Wali</h1>
        <p className="text-sm text-slate-500">Wali baru dapat melihat data anak setelah hubungan disetujui dan akunnya terhubung.</p>
      </div>
      <PendingList items={items} />
    </div>
  );
}
