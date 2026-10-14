import { useAuth } from '../AuthContext'
import { roleLabels } from '../roles'

export default function Dashboard() {
  const { profile } = useAuth()
  const name = profile!.full_name || 'Pengguna'
  return (
    <div>
      <h1>Assalamualaikum, {name}</h1>
      <p className="muted">Anda masuk sebagai {roleLabels[profile!.role!]}.</p>
      <div className="card">
        <h2>Aplikasi sudah terhubung</h2>
        <p>
          Login dan hak akses berjalan. Ringkasan santri, keuangan, dan modul lain akan tampil di
          halaman ini pada tahap berikutnya.
        </p>
      </div>
    </div>
  )
}
