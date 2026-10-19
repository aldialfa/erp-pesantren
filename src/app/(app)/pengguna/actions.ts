"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

async function myInstitution() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("app_users").select("institution_id").eq("id", user!.id).single();
  return { supabase, userId: user!.id, institutionId: me!.institution_id as string };
}

export async function setUserActive(targetId: string, active: boolean): Promise<Result> {
  const { supabase, userId, institutionId } = await myInstitution();
  if (targetId === userId && !active) return { ok: false, message: "Anda tidak dapat menonaktifkan akun sendiri." };
  const { data, error } = await supabase.from("app_users")
    .update({ is_active: active, institution_id: institutionId }).eq("id", targetId).select("id");
  if (error || !data?.length) return { ok: false, message: "Gagal memperbarui. Anda mungkin tidak berizin." };
  revalidatePath("/pengguna");
  return { ok: true, message: active ? "Akun diaktifkan." : "Akun dinonaktifkan." };
}

export async function addRole(targetId: string, roleId: string): Promise<Result> {
  const { supabase, userId, institutionId } = await myInstitution();
  const { error } = await supabase.from("user_roles")
    .insert({ user_id: targetId, role_id: roleId, institution_id: institutionId, granted_by: userId });
  if (error) return { ok: false, message: error.code === "23505" ? "Peran sudah dimiliki." : "Gagal menambah peran." };
  revalidatePath("/pengguna");
  return { ok: true, message: "Peran ditambahkan." };
}

export async function removeRole(targetId: string, roleId: string): Promise<Result> {
  const { supabase } = await myInstitution();
  const { error } = await supabase.from("user_roles").delete().eq("user_id", targetId).eq("role_id", roleId);
  if (error) return { ok: false, message: "Gagal mencabut peran." };
  revalidatePath("/pengguna");
  return { ok: true, message: "Peran dicabut." };
}
