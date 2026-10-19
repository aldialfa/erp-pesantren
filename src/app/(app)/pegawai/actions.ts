"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth";
import { normalizeDate } from "@/lib/csv";
import type { Result } from "@/lib/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const orNull = (v: string) => (v === "" ? null : v);

export async function saveEmployee(_: Result | null, fd: FormData): Promise<Result> {
  const id = s(fd, "id");
  const { supabase, institutionId } = await requireAccess(id ? "employees.update" : "employees.create");
  const nip = s(fd, "nip"), name = s(fd, "full_name"), email = s(fd, "email");
  if (!nip) return { ok: false, message: "Nomor induk pegawai wajib diisi." };
  if (name.length < 3) return { ok: false, message: "Nama minimal 3 karakter." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Format email tidak valid." };
  const start = normalizeDate(s(fd, "start_date"));
  if (start === null) return { ok: false, message: "Format tanggal tidak valid." };
  const status = s(fd, "status") || "aktif";
  if (!["aktif", "cuti", "nonaktif"].includes(status)) return { ok: false, message: "Status tidak valid." };

  const row = {
    nip, full_name: name, status, position: orNull(s(fd, "position")), work_unit: orNull(s(fd, "work_unit")),
    start_date: orNull(start), phone: orNull(s(fd, "phone")), email: orNull(email), address: orNull(s(fd, "address")),
  };
  const { data, error } = id
    ? await supabase.from("employees").update(row).eq("id", id).select("id").single()
    : await supabase.from("employees").insert({ ...row, institution_id: institutionId }).select("id").single();
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Nomor induk pegawai sudah dipakai." };
    return { ok: false, message: "Gagal menyimpan. Anda mungkin tidak berizin." };
  }
  revalidatePath("/pegawai");
  if (!id) redirect(`/pegawai/${data!.id}`);
  return { ok: true, message: "Data pegawai tersimpan." };
}

export async function setEmployeeArchived(id: string, archive: boolean): Promise<Result> {
  const { supabase } = await requireAccess("employees.update");
  const { data, error } = await supabase.from("employees")
    .update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, message: "Gagal memperbarui arsip." };
  revalidatePath("/pegawai");
  return { ok: true, message: archive ? "Pegawai diarsipkan." : "Pegawai dikembalikan dari arsip." };
}
