"use server";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import type { Result } from "@/lib/types";

export async function addClass(_: Result | null, fd: FormData): Promise<Result> {
  const { supabase, institutionId } = await requireAccess("academic.manage");
  const level = String(fd.get("level") ?? "").trim(), name = String(fd.get("name") ?? "").trim();
  if (!level || !name) return { ok: false, message: "Jenjang dan nama kelas wajib diisi." };
  const { data: year } = await supabase.from("academic_years").select("id").eq("is_active", true).maybeSingle();
  if (!year) return { ok: false, message: "Belum ada tahun ajaran aktif." };
  const { error } = await supabase.from("classes")
    .insert({ institution_id: institutionId, academic_year_id: year.id, level, name });
  if (error) return { ok: false, message: error.code === "23505" ? "Nama kelas sudah ada di tahun ajaran ini." : "Gagal menyimpan." };
  revalidatePath("/kelas");
  return { ok: true, message: "Kelas ditambahkan." };
}

export async function enrollStudent(classId: string, studentId: string): Promise<Result> {
  const { supabase, institutionId } = await requireAccess("academic.manage");
  if (!studentId) return { ok: false, message: "Pilih santri terlebih dahulu." };
  const { data: cls } = await supabase.from("classes").select("academic_year_id").eq("id", classId).single();
  if (!cls) return { ok: false, message: "Kelas tidak ditemukan." };
  const { error } = await supabase.from("class_enrollments")
    .insert({ institution_id: institutionId, student_id: studentId, class_id: classId, academic_year_id: cls.academic_year_id });
  if (error) return { ok: false, message: error.code === "23505" ? "Santri sudah terdaftar di kelas lain pada tahun ajaran ini." : "Gagal mendaftarkan santri." };
  revalidatePath(`/kelas/${classId}`);
  return { ok: true, message: "Santri didaftarkan ke kelas." };
}

export async function unenrollStudent(classId: string, enrollmentId: string): Promise<Result> {
  const { supabase } = await requireAccess("academic.manage");
  const { error } = await supabase.from("class_enrollments").delete().eq("id", enrollmentId);
  if (error) return { ok: false, message: "Gagal mengeluarkan santri dari kelas." };
  revalidatePath(`/kelas/${classId}`);
  return { ok: true, message: "Santri dikeluarkan dari kelas." };
}
