"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Users, Menu, X, LogOut, GraduationCap, UserCheck, Briefcase, School } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ICONS = { dashboard: LayoutDashboard, settings: Settings, users: Users, students: GraduationCap, guardians: UserCheck, employees: Briefcase, classes: School };

export interface NavItem { href: string; label: string; icon: keyof typeof ICONS; }

export default function Sidebar({ items, name, instName }: { items: NavItem[]; name: string; instName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs text-gold-400">SIM-PESANTREN ERP</p>
        <p className="mt-1 font-bold leading-tight text-white">{instName}</p>
      </div>
      <ul className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const Icon = ICONS[it.icon];
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-emerald-700 text-white" : "text-slate-300 hover:bg-white/10"}`}>
                <Icon size={18} /> {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm text-slate-200">{name}</p>
        <button onClick={logout} className="mt-2 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-3 text-white lg:hidden">
        <span className="font-bold">{instName}</span>
        <button aria-label={open ? "Tutup menu" : "Buka menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-navy-900 transition-transform lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"} lg:static lg:block`}>
        {nav}
      </aside>
    </>
  );
}
