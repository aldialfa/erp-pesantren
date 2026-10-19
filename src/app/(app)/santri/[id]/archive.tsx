"use client";
import { useState, useTransition } from "react";
import { setStudentArchived } from "../actions";

export default function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex items-center gap-2">
      {msg && <span role="status" className="text-sm text-slate-600">{msg}</span>}
      <button className="btn-ghost" disabled={pending} onClick={() => {
        if (!archived && !confirm("Arsipkan santri ini? Data tetap tersimpan.")) return;
        start(async () => setMsg((await setStudentArchived(id, !archived)).message));
      }}>{archived ? "Kembalikan dari arsip" : "Arsipkan"}</button>
    </div>
  );
}
