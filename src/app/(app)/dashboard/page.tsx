import { getContext, can } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function Dashboard() {
  const { supabase, profile, permissions } = await getContext();

  const [{ data: year }, activeUsers, pendingUsers] = await Promise.all([
    supabase.from("academic_years").select("name, start_date, end_date").eq("is_active", true).maybeSingle(),
    can(permissions, "users.view")
      ? supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_active", true)
      : Promise.resolve({ count: null }),
    can(permissions, "users.view")
      ? supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_active", false)
      : Promise.resolve({ count: null }),
  ]);

  const stats = [
    { label: "Tahun ajaran aktif", value: year?.name ?? "Belum diatur",
      note: year ? `${formatDate(year.start_date)} s.d. ${formatDate(year.end_date)}` : "Atur di Pengaturan Lembaga" },
    ...(activeUsers.count !== null ? [{ label: "Pengguna aktif", value: String(activeUsers.count), note: "" }] : []),
    ...(pendingUsers.count !== null ? [{ label: "Menunggu aktivasi", value: String(pendingUsers.count), note: "Perlu ditinjau admin" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Selamat datang, {profile?.full_name || "Pengguna"}</h1>
        <p className="text-sm text-slate-500">Ringkasan ini dibaca langsung dari database.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card border-t-4 border-t-emerald-700">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-navy-800">{s.value}</p>
            {s.note && <p className="mt-1 text-xs text-slate-500">{s.note}</p>}
          </div>
        ))}
      </div>
      <p className="card text-sm text-slate-600">
        Kartu santri, keuangan, akademik, dan lainnya akan muncul setelah modulnya dibangun pada tahap berikutnya.
      </p>
    </div>
  );
}
