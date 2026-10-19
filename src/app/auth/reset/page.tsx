"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("Kata sandi minimal 8 karakter.");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setMsg("Gagal mengubah kata sandi. Minta tautan baru.");
    router.replace("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-navy-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-navy-800">Buat kata sandi baru</h1>
        <div>
          <label className="label" htmlFor="pw">Kata sandi baru</label>
          <input id="pw" type="password" className="input" autoComplete="new-password"
            value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        {msg && <p role="alert" className="text-sm text-red-600">{msg}</p>}
        <button className="btn w-full">Simpan kata sandi</button>
      </form>
    </main>
  );
}
