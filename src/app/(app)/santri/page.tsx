import Link from "next/link";
import { requireAccess, can } from "@/lib/auth";
import Pager from "@/components/Pager";

const SIZE = 20;
const STATUS_STYLE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-800", lulus: "bg-blue-100 text-blue-800",
  pindah: "bg-amber-100 text-amber-800", nonaktif: "bg-slate-200 text-slate-700",
};

export default async function SantriPage({ searchParams }: { searchParams: { q?: string; status?: string; arsip?: string; page?: string } }) {
  const { supabase, permissions } = await requireAccess("students.view");
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? "").replace(/[%,()*]/g, " ").trim();

  let query = supabase.from("students")
    .select("id, nis, full_name, gender, status, program, dormitories(name)", { count: "exact" })
    .order("full_name").range((page - 1) * SIZE, page * SIZE - 1);
  if (q) query = query.or(`full_name.ilike.%${q}%,nis.ilike.%${q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  query = searchParams.arsip === "1" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data, count } = await query;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-800">Data Santri</h1>
        {can(permissions, "students.create") && (
          <div className="flex gap-2">
            <Link href="/santri/impor" className="btn-ghost">Impor CSV</Link>
            <Link href="/santri/baru" className="btn">Tambah santri</Link>
          </div>)}
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Cari nama atau NIS" className="input max-w-xs" aria-label="Cari" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input w-auto" aria-label="Status">
          <option value="">Semua status</option><option value="aktif">Aktif</option><option value="lulus">Lulus</option>
          <option value="pindah">Pindah</option><option value="nonaktif">Nonaktif</option></select>
        <select name="arsip" defaultValue={searchParams.arsip ?? ""} className="input w-auto" aria-label="Arsip">
          <option value="">Tidak diarsipkan</option><option value="1">Arsip</option></select>
        <button className="btn-ghost">Terapkan</button>
      </form>
      {(data ?? []).length === 0 ? (
        <p className="card text-sm text-slate-500">Tidak ada santri yang cocok. Ubah filter atau tambahkan santri baru.</p>
      ) : (
        <ul className="space-y-2">
          {data!.map((st: any) => (
            <li key={st.id}>
              <Link href={`/santri/${st.id}`} className="card flex items-center justify-between gap-3 hover:border-emerald-600">
                <div>
                  <p className="font-semibold text-navy-800">{st.full_name}</p>
                  <p className="text-sm text-slate-500">NIS {st.nis} · {st.gender === "L" ? "Laki-laki" : "Perempuan"}
                    {st.program ? ` · ${st.program}` : ""}{st.dormitories?.name ? ` · ${st.dormitories.name}` : ""}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[st.status]}`}>{st.status}</span>
              </Link>
            </li>))}
        </ul>
      )}
      <Pager page={page} total={count ?? 0} size={SIZE} base="/santri"
        params={{ q: searchParams.q, status: searchParams.status, arsip: searchParams.arsip }} />
    </div>
  );
}
