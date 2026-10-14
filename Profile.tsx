import { FormEvent, useState } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import { roleLabels } from '../roles'

export default function Profile() {
  const { profile, session, refreshProfile } = useAuth()
  const [name, setName] = useState(profile!.full_name)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    const { error } = await supabase.rpc('update_my_profile', { p_name: name.trim() })
    if (error) setMsg({ type: 'error', text: 'Gagal menyimpan: ' + error.message })
    else {
      await refreshProfile()
      setMsg({ type: 'ok', text: 'Nama berhasil disimpan.' })
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pw1.length < 8) return setPwMsg({ type: 'error', text: 'Kata sandi minimal 8 karakter.' })
    if (pw1 !== pw2) return setPwMsg({ type: 'error', text: 'Kedua kata sandi tidak sama.' })
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) setPwMsg({ type: 'error', text: 'Gagal mengganti kata sandi: ' + error.message })
    else {
      setPw1('')
      setPw2('')
      setPwMsg({ type: 'ok', text: 'Kata sandi berhasil diganti.' })
    }
  }

  return (
    <div>
      <h1>Profil Saya</h1>

      <form className="card form" onSubmit={saveName}>
        <h2>Data akun</h2>
        <label>Email<input value={session?.user.email ?? ''} disabled /></label>
        <label>Peran<input value={roleLabels[profile!.role!]} disabled /></label>
        <label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        {msg && <div className={'alert ' + msg.type}>{msg.text}</div>}
        <button className="btn">Simpan nama</button>
      </form>

      <form className="card form" onSubmit={savePassword}>
        <h2>Ganti kata sandi</h2>
        <label>Kata sandi baru<input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" /></label>
        <label>Ulangi kata sandi baru<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></label>
        {pwMsg && <div className={'alert ' + pwMsg.type}>{pwMsg.text}</div>}
        <button className="btn">Ganti kata sandi</button>
      </form>
    </div>
  )
}
