"use server";
import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth";
import type { Result } from "@/lib/types";

export async function addGuardian(studentId: string, fd: FormData): Promise<Result> {
  const { supabase } = await requireAccess("guardians.create");
  const { error } = await supabase.rpc("add_guardian_link", {
    p_student: studentId,
    p_name: String(fd.get("name") ?? ""),
    p_relation: String(fd.get("relation") ?? "ayah"),
    p_phone: String(fd.get("phone") ?? ""),
    p_address: "",
    p_email: String(fd.get("email") ?? ""),
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Wali ini sudah terhubung dengan santri tersebut." };
    return { ok: false, message: error.message || "Gagal menambah wali." };
  }
  revalidatePath(`/santri/${studentId}`);
  revalidatePath("/wali");
  return { ok: true, message: "Wali ditambahkan, menunggu persetujuan." };
}

export async function setLinkStatus(studentId: string, guardianId: string, status: "disetujui" | "ditolak"): Promise<Result> {
  const { supabase } = await requireAccess("guardians.approve");
  const { data, error } = await supabase.from("student_guardians").update({ status })
    .eq("student_id", studentId).eq("guardian_id", guardianId).select("id");
  if (error || !data?.length) return { ok: false, message: "Gagal memperbarui status." };
  revalidatePath(`/santri/${studentId}`);
  revalidatePath("/wali");
  return { ok: true, message: status === "disetujui" ? "Hubungan wali disetujui." : "Hubungan wali ditolak." };
}

export async function removeLink(studentId: string, guardianId: string): Promise<Result> {
  const { supabase } = await requireAccess("guardians.update");
  const { error } = await supabase.from("student_guardians").delete()
    .eq("student_id", studentId).eq("guardian_id", guardianId);
  if (error) return { ok: false, message: "Gagal menghapus hubungan." };
  revalidatePath(`/santri/${studentId}`);
  return { ok: true, message: "Hubungan wali dihapus." };
}
