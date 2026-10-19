"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message: string };

export async function saveInstitution(_: Result | null, fd: FormData): Promise<Result> {
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 3) return { ok: false, message: "Nama pesantren minimal 3 karakter." };
  const email = String(fd.get("email") ?? "").trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Format email tidak valid." };

  const supabase = createClient();
  const id = String(fd.get("id"));
  const { data, error } = await supabase.from("institutions").update({
    name,
    address: String(fd.get("address") ?? "").trim() || null,
    phone: String(fd.get("phone") ?? "").trim() || null,
    email: email || null,
    report_header: String(fd.get("report_header") ?? "").trim() || null,
  }).eq("id", id).select("id");

  if (error || !data?.length) return { ok: false, message: "Gagal menyimpan. Anda mungkin tidak berizin." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Identitas lembaga tersimpan." };
}

export async function addAcademicYear(_: Result | null, fd: FormData): Promise<Result> {
  const name = String(fd.get("name") ?? "").trim();
  const start = String(fd.get("start_date") ?? "");
  const end = String(fd.get("end_date") ?? "");
  if (!name || !start || !end) return { ok: false, message: "Semua kolom wajib diisi." };
  if (end <= start) return { ok: false, message: "Tanggal selesai harus setelah tanggal mulai." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("app_users").select("institution_id").eq("id", user!.id).single();
  const { error } = await supabase.from("academic_years")
    .insert({ institution_id: me!.institution_id, name, start_date: start, end_date: end });
  if (error) return { ok: false, message: error.code === "23505" ? "Nama tahun ajaran sudah ada." : "Gagal menyimpan." };
  revalidatePath("/pengaturan");
  return { ok: true, message: "Tahun ajaran ditambahkan." };
}

export async function activateAcademicYear(id: string): Promise<Result> {
  const { error } = await createClient().rpc("set_active_academic_year", { p_id: id });
  if (error) return { ok: false, message: "Gagal mengaktifkan tahun ajaran." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Tahun ajaran diaktifkan." };
}
