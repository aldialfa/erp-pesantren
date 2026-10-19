import { requireAccess } from "@/lib/auth";
import ImportClient from "./client";

export default async function ImporPage() {
  await requireAccess("students.create");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-navy-800">Impor santri dari CSV</h1>
      <ImportClient />
    </div>
  );
}
