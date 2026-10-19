import { redirect } from "next/navigation";
import { getContext, can } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import UsersTable from "./table";

export default async function Pengguna() {
  const { supabase, user, permissions } = await getContext();
  if (!can(permissions, "users.view")) redirect("/dashboard");

  const [{ data: users }, { data: userRoles }, { data: roles }] = await Promise.all([
    supabase.from("app_users").select("id, full_name, email, is_active, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role_id, roles(name)"),
    supabase.from("roles").select("id, name, code").order("name"),
  ]);

  const rows = (users ?? []).map((u) => ({
    id: u.id, full_name: u.full_name, email: u.email, is_active: u.is_active,
    createdLabel: formatDate(u.created_at),
    roles: (userRoles ?? []).filter((r) => r.user_id === u.id)
      .map((r: any) => ({ id: r.role_id as string, name: (r.roles?.name ?? "") as string })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Pengguna & Peran</h1>
        <p className="text-sm text-slate-500">Akun baru harus diaktifkan dan diberi peran sebelum dapat dipakai.</p>
      </div>
      <UsersTable users={rows} roles={(roles ?? []).map((r) => ({ id: r.id, name: r.name }))}
        canManage={can(permissions, "users.manage")} meId={user.id} />
    </div>
  );
}
