import { redirect } from "next/navigation";
import { getContext, can } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { InstitutionForm, YearsPanel } from "./forms";

export default async function Pengaturan() {
  const { supabase, profile, permissions } = await getContext();
  const canSettings = can(permissions, "settings.manage");
  const canYears = can(permissions, "academic.manage");
  if (!canSettings && !canYears) redirect("/dashboard");

  const { data: inst } = await supabase.from("institutions")
    .select("id, name, address, phone, email, report_header").eq("id", profile!.institution_id!).single();
  const { data: years } = await supabase.from("academic_years")
    .select("id, name, start_date, end_date, is_active").order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">Pengaturan Lembaga</h1>
      {canSettings && inst && <InstitutionForm inst={inst} />}
      <YearsPanel canManage={canYears}
        years={(years ?? []).map((y) => ({ ...y, startLabel: formatDate(y.start_date), endLabel: formatDate(y.end_date) }))} />
    </div>
  );
}
