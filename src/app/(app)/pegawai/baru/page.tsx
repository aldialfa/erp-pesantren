import { requireAccess } from "@/lib/auth";
import { EmployeeForm } from "../form";

export default async function BaruPegawai() {
  await requireAccess("employees.create");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-navy-800">Tambah pegawai</h1>
      <EmployeeForm v={{}} />
    </div>
  );
}
