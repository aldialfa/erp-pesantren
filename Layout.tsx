import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { menuItems, roleLabels } from '../roles'
import Dashboard from './Dashboard'
import Profile from './Profile'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(false)

  const role = profile!.role!
  const items = menuItems.filter((m) => !m.roles || m.roles.includes(role))
  const current = items.find((m) => m.key === page) ?? items[0]

  function go(key: string) {
    setPage(key)
    setOpen(false)
  }

  let content
  if (current.key === 'dashboard') content = <Dashboard />
  else if (current.key === 'profil') content = <Profile />
  else
    content = (
      <div className="card">
        <h2>{current.label}</h2>
        <p className="muted">Modul ini akan dibuat pada tahap berikutnya.</p>
      </div>
    )

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Buka menu">☰</button>
        <strong>ERP Pesantren</strong>
      </header>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="side-head">
          <div className="logo small-logo">ERP</div>
          <div>
            <strong>ERP Pesantren</strong>
            <div className="side-role">{roleLabels[role]}</div>
          </div>
        </div>
        <nav>
          {items.map((m) => (
            <button key={m.key} className={'nav-item' + (m.key === current.key ? ' active' : '')} onClick={() => go(m.key)}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </nav>
        <button className="nav-item logout" onClick={signOut}>🚪 Keluar</button>
      </aside>

      <main className="main">{content}</main>
    </div>
  )
}
