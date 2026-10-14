export type Role =
  | 'super_admin'
  | 'bendahara'
  | 'admin_akademik'
  | 'ustadz'
  | 'wali_kelas'
  | 'petugas_kantin'
  | 'wali_santri'

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin / Pimpinan',
  bendahara: 'Bendahara',
  admin_akademik: 'Admin Santri & Akademik',
  ustadz: 'Ustadz/Ustadzah',
  wali_kelas: 'Wali Kelas',
  petugas_kantin: 'Petugas Kantin',
  wali_santri: 'Wali Santri',
}

export interface MenuItem {
  key: string
  label: string
  icon: string
  roles?: Role[] // kosong = semua peran
  ready: boolean // sudah dibuat atau belum
}

const staf: Role[] = ['super_admin', 'bendahara', 'admin_akademik', 'ustadz', 'wali_kelas']

export const menuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '🏠', ready: true },
  { key: 'santri', label: 'Data Santri', icon: '🎓', roles: ['super_admin', 'admin_akademik', 'bendahara', 'ustadz', 'wali_kelas'], ready: false },
  { key: 'keuangan', label: 'Keuangan', icon: '💰', roles: ['super_admin', 'bendahara'], ready: false },
  { key: 'spp', label: 'Pembayaran SPP', icon: '🧾', roles: ['super_admin', 'bendahara'], ready: false },
  { key: 'akademik', label: 'Akademik', icon: '📚', roles: ['super_admin', 'admin_akademik', 'ustadz', 'wali_kelas'], ready: false },
  { key: 'hafalan', label: 'Hafalan Al-Qur\'an', icon: '📖', roles: staf, ready: false },
  { key: 'pembinaan', label: 'Akhlak & Pembinaan', icon: '🤝', roles: staf, ready: false },
  { key: 'penggajian', label: 'Penggajian', icon: '👥', roles: ['super_admin', 'bendahara'], ready: false },
  { key: 'kantin', label: 'Kantin', icon: '🛒', roles: ['super_admin', 'petugas_kantin'], ready: false },
  { key: 'portal', label: 'Portal Wali', icon: '👨‍👧', roles: ['wali_santri'], ready: false },
  { key: 'profil', label: 'Profil Saya', icon: '⚙️', ready: true },
]
