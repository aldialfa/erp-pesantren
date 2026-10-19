import { requireAccess } from "@/lib/auth";
import StudentForm from "../form";

export default async function BaruPage() {
  const { supabase } = await requireAccess("students.create");
  const { data: dorms } = await supabase.from("dormitories").select("id, name").order("name");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-navy-800">Tambah santri</h1>
      <StudentForm v={{}} dorms={dorms ?? []} />
    </div>
  );
}
