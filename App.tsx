import { useAuth } from './AuthContext'
import { isConfigured } from './supabase'
import Login from './pages/Login'
import Layout from './pages/Layout'

export default function App() {
  const { session, profile, loading, profileError, signOut } = useAuth()

  if (!isConfigured) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h1>Pengaturan belum lengkap</h1>
          <p>
            Aplikasi belum terhubung ke Supabase. Isi <b>VITE_SUPABASE_URL</b> dan{' '}
            <b>VITE_SUPABASE_PUBLISHABLE_KEY</b> di Netlify (Site configuration, lalu Environment
            variables), kemudian jalankan deploy ulang.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="center-screen">
        <p className="muted">Memuat...</p>
      </div>
    )
  }

  if (!session) return <Login />

  if (profileError || !profile || !profile.role || !profile.is_active) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h1>Akun belum bisa dipakai</h1>
          <p>
            {profileError
              ? profileError
              : !profile
              ? 'Profil akun Anda belum ada.'
              : !profile.is_active
              ? 'Akun Anda dinonaktifkan.'
              : 'Akun Anda belum diberi peran.'}{' '}
            Hubungi Super Admin pesantren.
          </p>
          <button className="btn" onClick={signOut}>Keluar</button>
        </div>
      </div>
    )
  }

  return <Layout />
}
