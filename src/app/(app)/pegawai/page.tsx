import Link from "next/link";
import { requireAccess, can } from "@/lib/auth";
import Pager from "@/components/Pager";

const SIZE = 20;

export default async function PegawaiPage({ searchParams }: { searchParams: { q?: string; status?: string; arsip?: string; page?: string } }) {
  const { supabase, permissions } = await requireAccess("employees.view");
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? "").replace(/[%,()*]/g, " ").trim();

  let query = supabase.from("employees").select("id, nip, full_name, position, work_unit, status", { count: "exact" })
    .order("full_name").range((page - 1) * SIZE, page * SIZE - 1);
  if (q) query = query.or(`full_name.ilike.%${q}%,nip.ilike.%${q}%,work_unit.ilike.%${q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  query = searchParams.arsip === "1" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data, count } = await query;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-800">Data Pegawai</h1>
        {can(permissions, "employees.create") && <Link href="/pegawai/baru" className="btn">Tambah pegawai</Link>}
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Cari nama, NIP, atau unit" className="input max-w-xs" aria-label="Cari" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input w-auto" aria-label="Status">
          <option value="">Semua status</option><option value="aktif">Aktif</option><option value="cuti">Cuti</option><option value="nonaktif">Nonaktif</option></select>
        <select name="arsip" defaultValue={searchParams.arsip ?? ""} className="input w-auto" aria-label="Arsip">
          <option value="">Tidak diarsipkan</option><option value="1">Arsip</option></select>
        <button className="btn-ghost">Terapkan</button>
      </form>
      {(data ?? []).length === 0 ? (
        <p className="card text-sm text-slate-500">Tidak ada pegawai yang cocok.</p>
      ) : (
        <ul className="space-y-2">
          {data!.map((e) => (
            <li key={e.id}>
              <Link href={`/pegawai/${e.id}`} className="card flex items-center justify-between gap-3 hover:border-emerald-600">
                <div>
                  <p className="font-semibold text-navy-800">{e.full_name}</p>
                  <p className="text-sm text-slate-500">NIP {e.nip}{e.position ? ` · ${e.position}` : ""}{e.work_unit ? ` · ${e.work_unit}` : ""}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{e.status}</span>
              </Link>
            </li>))}
        </ul>)}
      <Pager page={page} total={count ?? 0} size={SIZE} base="/pegawai"
        params={{ q: searchParams.q, status: searchParams.status, arsip: searchParams.arsip }} />
    </div>
  );
}
