import Link from "next/link";

export default function Pager({ page, total, size, params, base }:
  { page: number; total: number; size: number; params: Record<string, string | undefined>; base: string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("page", String(p));
    return `${base}?${sp.toString()}`;
  };
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{total} data · halaman {page} dari {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link className="btn-ghost" href={href(page - 1)}>Sebelumnya</Link>}
        {page < pages && <Link className="btn-ghost" href={href(page + 1)}>Berikutnya</Link>}
      </div>
    </div>
  );
}
