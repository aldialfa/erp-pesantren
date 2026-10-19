const TZ = "Asia/Jakarta";

/** DD-MM-YYYY, zona waktu Asia/Jakarta */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
}

export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}
