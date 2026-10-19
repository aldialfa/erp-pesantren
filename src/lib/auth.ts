import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  institution_id: string | null;
  full_name: string;
  email: string | null;
  is_active: boolean;
}

/** Konteks pengguna aktif: profil + daftar izin (diambil dari database). */
export const getContext = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_users")
    .select("id, institution_id, full_name, email, is_active")
    .eq("id", user.id)
    .single<Profile>();

  const { data: perms } = await supabase.rpc("my_permissions");
  const permissions = new Set<string>((perms as string[] | null) ?? []);

  return { supabase, user, profile, permissions };
});

export function can(permissions: Set<string>, code: string) {
  return permissions.has(code);
}

/** Untuk halaman & aksi yang membutuhkan akun aktif dan (opsional) izin tertentu. */
export async function requireAccess(perm?: string | string[]) {
  const ctx = await getContext();
  if (!ctx.profile?.is_active || !ctx.profile.institution_id) redirect("/dashboard");
  if (perm) {
    const list = Array.isArray(perm) ? perm : [perm];
    if (!list.some((p) => ctx.permissions.has(p))) redirect("/dashboard");
  }
  return { ...ctx, institutionId: ctx.profile.institution_id as string };
}
