import { getContext, can } from "@/lib/auth";
import Sidebar, { type NavItem } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile, permissions } = await getContext();

  if (!profile?.is_active || !profile.institution_id) {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <div className="card max-w-md text-center">
          <h1 className="text-lg font-bold text-navy-800">Akun menunggu aktivasi</h1>
          <p className="mt-2 text-sm text-slate-600">
            Akun Anda sudah terdaftar, tetapi belum diaktifkan. Hubungi Super Admin pesantren.
          </p>
        </div>
      </main>
    );
  }

  const { data: inst } = await supabase
    .from("institutions").select("name").eq("id", profile.institution_id).single();

  const items: NavItem[] = [{ href: "/dashboard", label: "Dasbor", icon: "dashboard" }];
  if (can(permissions, "students.view")) items.push({ href: "/santri", label: "Data Santri", icon: "students" });
  if (can(permissions, "guardians.approve")) items.push({ href: "/wali", label: "Persetujuan Wali", icon: "guardians" });
  if (can(permissions, "employees.view")) items.push({ href: "/pegawai", label: "Data Pegawai", icon: "employees" });
  if (can(permissions, "academic.view") || can(permissions, "students.view"))
    items.push({ href: "/kelas", label: "Kelas", icon: "classes" });
  if (can(permissions, "users.view")) items.push({ href: "/pengguna", label: "Pengguna & Peran", icon: "users" });
  if (can(permissions, "settings.manage") || can(permissions, "academic.manage"))
    items.push({ href: "/pengaturan", label: "Pengaturan Lembaga", icon: "settings" });

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar items={items} name={profile.full_name || profile.email || "Pengguna"} instName={inst?.name ?? "Pesantren"} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
