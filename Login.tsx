import { FormEvent, useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('Email atau kata sandi salah. Periksa lagi lalu coba kembali.')
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="logo">ERP</div>
        <h1>ERP Pesantren</h1>
        <p>Administrasi, keuangan, santri, dan akademik dalam satu tempat.</p>
      </div>
      <form className="card login-card" onSubmit={submit}>
        <h2>Masuk</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Kata sandi
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Memproses...' : 'Masuk'}</button>
        <p className="muted small">Belum punya akun? Hubungi pengurus pesantren.</p>
      </form>
    </div>
  )
}
