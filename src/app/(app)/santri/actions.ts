"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { normalizeDate } from "@/lib/csv";
import type { Result } from "@/lib/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const orNull = (v: string) => (v === "" ? null : v);

export async function saveStudent(_: Result | null, fd: FormData): Promise<Result> {
  const id = s(fd, "id");
  const { supabase, user, institutionId } = await requireAccess(id ? "students.update" : "students.create");

  const nis = s(fd, "nis"), name = s(fd, "full_name"), gender = s(fd, "gender");
  if (!nis) return { ok: false, message: "NIS wajib diisi." };
  if (name.length < 3) return { ok: false, message: "Nama lengkap minimal 3 karakter." };
  if (!["L", "P"].includes(gender)) return { ok: false, message: "Pilih jenis kelamin." };
  const birth = normalizeDate(s(fd, "birth_date")), adm = normalizeDate(s(fd, "admission_date"));
  if (birth === null || adm === null) return { ok: false, message: "Format tanggal tidak valid." };
  const status = s(fd, "status") || "aktif";
  if (!["aktif", "lulus", "pindah", "nonaktif"].includes(status)) return { ok: false, message: "Status tidak valid." };

  const row = {
    nis, full_name: name, gender, status,
    birth_place: orNull(s(fd, "birth_place")), birth_date: orNull(birth),
    address: orNull(s(fd, "address")), phone: orNull(s(fd, "phone")),
    admission_date: orNull(adm), program: orNull(s(fd, "program")),
    dormitory_id: orNull(s(fd, "dormitory_id")),
  };

  const q = id
    ? supabase.from("students").update(row).eq("id", id).select("id").single()
    : supabase.from("students").insert({ ...row, institution_id: institutionId, created_by: user.id }).select("id").single();
  const { data, error } = await q;

  if (error) {
    if (error.message.includes("students_dup_identity"))
      return { ok: false, message: "Santri dengan nama dan tanggal lahir yang sama sudah ada. Buka data tersebut untuk memperbarui." };
    if (error.code === "23505") return { ok: false, message: "NIS sudah dipakai santri lain." };
    return { ok: false, message: "Gagal menyimpan. Anda mungkin tidak berizin." };
  }
  revalidatePath("/santri");
  if (!id) redirect(`/santri/${data!.id}`);
  return { ok: true, message: "Data santri tersimpan." };
}

export async function setStudentArchived(id: string, archive: boolean): Promise<Result> {
  const { supabase } = await requireAccess("students.update");
  const { data, error } = await supabase.from("students")
    .update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, message: "Gagal memperbarui arsip." };
  revalidatePath("/santri");
  return { ok: true, message: archive ? "Santri diarsipkan." : "Santri dikembalikan dari arsip." };
}

export interface ImportReport { inserted: number; errors: { line: number; message: string }[]; }

export async function importStudents(rows: Record<string, string>[]): Promise<ImportReport> {
  const { supabase, user, institutionId } = await requireAccess("students.create");
  const errors: ImportReport["errors"] = [];
  if (rows.length === 0) return { inserted: 0, errors: [{ line: 0, message: "File kosong atau header tidak terbaca." }] };
  if (rows.length > 500) return { inserted: 0, errors: [{ line: 0, message: "Maksimal 500 baris per impor." }] };

  const { data: existing } = await supabase.from("students")
    .select("nis, full_name, birth_date").eq("institution_id", institutionId).limit(20000);
  const nisSet = new Set((existing ?? []).map((e) => e.nis));
  const idSet = new Set((existing ?? []).filter((e) => e.birth_date)
    .map((e) => `${e.full_name.toLowerCase()}|${e.birth_date}`));

  const valid: Record<string, unknown>[] = [];
  rows.forEach((r, i) => {
    const line = i + 2; // baris 1 = header
    const nis = r["nis"] ?? "", name = r["nama_lengkap"] ?? "";
    const gender = (r["jenis_kelamin"] ?? "").toUpperCase().charAt(0);
    const birth = normalizeDate(r["tanggal_lahir"] ?? ""), adm = normalizeDate(r["tanggal_masuk"] ?? "");
    const fail = (m: string) => errors.push({ line, message: m });
    if (!nis) return fail("NIS kosong.");
    if (name.length < 3) return fail("Nama lengkap kosong atau terlalu pendek.");
    if (!["L", "P"].includes(gender)) return fail("jenis_kelamin harus L atau P.");
    if (birth === null || adm === null) return fail("Format tanggal tidak valid (gunakan DD-MM-YYYY atau YYYY-MM-DD).");
    if (nisSet.has(nis)) return fail(`NIS ${nis} sudah ada (data ganda).`);
    const key = `${name.toLowerCase()}|${birth}`;
    if (birth && idSet.has(key)) return fail("Nama dan tanggal lahir sama dengan data yang sudah ada.");
    nisSet.add(nis); if (birth) idSet.add(key);
    valid.push({
      institution_id: institutionId, created_by: user.id, nis, full_name: name, gender,
      birth_place: orNull(r["tempat_lahir"] ?? ""), birth_date: orNull(birth), admission_date: orNull(adm),
      address: orNull(r["alamat"] ?? ""), phone: orNull(r["telepon"] ?? ""), program: orNull(r["program"] ?? ""),
    });
  });

  if (valid.length === 0) return { inserted: 0, errors };
  const { error } = await supabase.from("students").insert(valid);
  if (error) return { inserted: 0, errors: [...errors, { line: 0, message: "Penyimpanan gagal; tidak ada data yang masuk. Periksa izin atau data ganda." }] };
  revalidatePath("/santri");
  return { inserted: valid.length, errors };
}
