import Link from "next/link";
import { requireAccess, can } from "@/lib/auth";
import AddClassForm from "./add-form";

export default async function KelasPage() {
  const { supabase, permissions } = await requireAccess(["academic.view", "students.view"]);
  const { data: year } = await supabase.from("academic_years").select("id, name").eq("is_active", true).maybeSingle();
  const { data: classes } = year
    ? await supabase.from("classes").select("id, level, name, class_enrollments(count)").eq("academic_year_id", year.id).order("level").order("name")
    : { data: [] as any[] };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Kelas</h1>
        <p className="text-sm text-slate-500">{year ? `Tahun ajaran ${year.name}` : "Belum ada tahun ajaran aktif. Atur di Pengaturan Lembaga."}</p>
      </div>
      {year && (classes ?? []).length === 0 && <p className="card text-sm text-slate-500">Belum ada kelas pada tahun ajaran ini.</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(classes ?? []).map((c: any) => (
          <li key={c.id}>
            <Link href={`/kelas/${c.id}`} className="card block border-t-4 border-t-emerald-700 hover:border-emerald-600">
              <p className="text-sm text-slate-500">{c.level}</p>
              <p className="text-lg font-bold text-navy-800">{c.name}</p>
              <p className="mt-1 text-sm text-slate-600">{c.class_enrollments?.[0]?.count ?? 0} santri</p>
            </Link>
          </li>))}
      </ul>
      {year && can(permissions, "academic.manage") && <AddClassForm />}
    </div>
  );
}
