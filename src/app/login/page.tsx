"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg({ type: "error", text: "Email atau kata sandi salah." });
    router.replace("/dashboard");
    router.refresh();
  }

  async function reset() {
    if (!email) return setMsg({ type: "error", text: "Isi email terlebih dahulu." });
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset`,
    });
    setMsg(error
      ? { type: "error", text: "Gagal mengirim tautan pemulihan." }
      : { type: "ok", text: "Jika email terdaftar, tautan pemulihan telah dikirim." });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-navy-900 p-4">
      <form onSubmit={signIn} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-navy-800">SIM-PESANTREN ERP</h1>
          <p className="text-sm text-slate-500">Masuk dengan akun Anda.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Kata sandi</label>
          <input id="pw" type="password" required autoComplete="current-password" className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && (
          <p role="alert" className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
            {msg.text}
          </p>
        )}
        <button className="btn w-full" disabled={busy}>{busy ? "Memproses..." : "Masuk"}</button>
        <button type="button" onClick={reset} className="w-full text-center text-sm text-emerald-800 hover:underline">
          Lupa kata sandi?
        </button>
      </form>
    </main>
  );
}
