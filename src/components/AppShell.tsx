import { useEffect, useState, type ReactNode } from 'react'
import { BarChart3, BookOpenCheck, ClipboardList, Grid3X3, Home, LifeBuoy, Library, LogOut, Repeat, Sprout, Users } from 'lucide-react'
import { Link } from '../lib/router'
import { BobyMark } from './Boby'
import { Avatar, ToastHost } from './ui'
import Tour from './Tour'
import { routeKey, tourFor } from './tour-steps'
import { lecturer, me } from '../lib/data'

type Role = 'dosen' | 'mahasiswa'

/** The mark shows once per screen per visit, the way a first-time user meets it. Reloading starts over. */
const greeted = new Set<string>()
const NAV: Record<Role, { to: string; label: string; short: string; icon: typeof Home; match: (p: string) => boolean }[]> = {
  dosen: [
    { to: '/dosen', label: 'Dashboard Kelas', short: 'Kelas', icon: Home, match: (p) => p === '/dosen' },
    { to: '/dosen/sesi', label: 'Sesi Asesmen', short: 'Sesi', icon: ClipboardList, match: (p) => p.startsWith('/dosen/sesi') || p.startsWith('/dosen/tinjauan') },
    { to: '/dosen/pendampingan', label: 'Pendampingan', short: 'Dampingi', icon: Users, match: (p) => p.startsWith('/dosen/pendampingan') },
    { to: '/dosen/perkembangan', label: 'Perkembangan', short: 'Kembang', icon: BarChart3, match: (p) => p.startsWith('/dosen/perkembangan') },
    { to: '/dosen/peta-kelas', label: 'Peta Kelas', short: 'Peta', icon: Grid3X3, match: (p) => p.startsWith('/dosen/peta-kelas') },
    { to: '/dosen/bank-kegiatan', label: 'Bank Kegiatan', short: 'Bank', icon: Library, match: (p) => p.startsWith('/dosen/bank-kegiatan') },
  ],
  mahasiswa: [
    { to: '/mahasiswa', label: 'Dashboard Belajar', short: 'Belajar', icon: Home, match: (p) => p === '/mahasiswa' },
    { to: '/mahasiswa/sesi', label: 'Sesi Belajar', short: 'Sesi', icon: BookOpenCheck, match: (p) => p.startsWith('/mahasiswa/sesi') || p.startsWith('/mahasiswa/ringkasan') },
    { to: '/mahasiswa/penguatan', label: 'Kegiatan Penguatan', short: 'Penguatan', icon: Sprout, match: (p) => p.startsWith('/mahasiswa/penguatan') },
  ],
}

export default function AppShell({ role, path, crumbs, children }: { role: Role; path: string; crumbs: { label: string; to?: string }[]; children: ReactNode }) {
  const user = role === 'dosen' ? { name: lecturer.name, sub: lecturer.role, seed: 3 } : { name: me.name, sub: `Mahasiswa · ${me.nim}`, seed: 0 }
  const other = role === 'dosen' ? { to: '/mahasiswa', label: 'Lihat sebagai mahasiswa' } : { to: '/dosen', label: 'Lihat sebagai dosen' }
  const backendPage = role === 'mahasiswa'
    ? (path === '/mahasiswa' || path === '/mahasiswa/sesi' || path.startsWith('/mahasiswa/sesi/') || path.startsWith('/mahasiswa/ringkasan/'))
    : (path === '/dosen' || path === '/dosen/sesi' || path.startsWith('/dosen/tinjauan/'))
  const [guide, setGuide] = useState(false)
  // A first-time visitor gets a mark on the button rather than a sheet thrown over the screen; the
  // walkthrough opens when they ask for it. The mark goes once they have opened it.
  const key = routeKey(path)
  const [isNew, setNew] = useState(() => !greeted.has(key))
  useEffect(() => { setNew(!greeted.has(key)) }, [key])
  useEffect(() => { if (guide) { greeted.add(key); setNew(false) } }, [guide, key])
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_1fr] bg-ivory">
      <aside className="hidden lg:flex flex-col sticky top-0 h-svh border-r border-line px-3 py-5">
        <Link to="/" className="flex items-center gap-2.5 px-2.5 mb-1 group" aria-label="ADAPTIA, ke beranda">
          <BobyMark className="w-7 h-7 transition-transform duration-[250ms] group-hover:-rotate-6" />
          <span className="font-bold tracking-[-0.02em] text-[20px]">ADAPTIA</span>
        </Link>
        <p className="px-2.5 text-[13px] text-muted mb-6">{role === 'dosen' ? 'Ruang Dosen' : 'Ruang Mahasiswa'}</p>
        <nav aria-label="Navigasi utama" data-tour="nav" className="flex flex-col gap-0.5">
          {NAV[role].map((n) => {
            const active = n.match(path)
            return (
              <Link key={n.to} to={n.to} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 h-10 px-2.5 rounded-lg text-[15px] transition-colors duration-150 ${active ? 'bg-[#EFE8F4] text-ink font-semibold' : 'text-[#4E4B5E] hover:bg-[#F6F0F8] hover:text-ink'}`}>
                <n.icon size={17} strokeWidth={1.75} aria-hidden="true" />
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <Link to={other.to} className="flex items-center gap-2.5 h-10 px-2.5 rounded-lg text-[15px] text-[#4E4B5E] hover:bg-[#F6F0F8] hover:text-ink transition-colors duration-150">
            <Repeat size={16} strokeWidth={1.75} aria-hidden="true" /> {other.label}
          </Link>
          <div className="flex items-center gap-2.5 px-2.5 pt-3 mt-2 border-t border-line">
            <Avatar name={user.name.replace('Dr. ', '')} seed={user.seed} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold truncate">{user.name}</p>
              <p className="text-[13px] text-muted truncate">{user.sub}</p>
            </div>
            <Link to="/" aria-label="Keluar ke beranda" className="p-2 rounded-md text-muted hover:text-ink hover:bg-[#F6F0F8] transition-colors"><LogOut size={16} strokeWidth={1.75} /></Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="h-14 flex items-center gap-3 px-4 sm:px-6 lg:px-8 border-b border-line">
          <Link to="/" className="lg:hidden" aria-label="ADAPTIA, ke beranda"><BobyMark className="w-6 h-6" /></Link>
          <nav aria-label="Lokasi" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[15px] text-muted min-w-0">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <span aria-hidden="true" className="text-[#C9C2D6]">/</span>}
                  {c.to ? <Link to={c.to} className="hover:text-ink truncate transition-colors">{c.label}</Link> : <span className="text-ink font-medium truncate" aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
          <span className="hidden md:inline text-[13px] text-muted">{backendPage ? 'Mode demo · data server' : 'Contoh lokal · belum tersambung'}</span>
          <button data-tour="bantuan" onClick={() => setGuide(true)}
            className="relative flex items-center gap-1.5 h-9 px-3 rounded-[11px_3px_11px_11px] text-[15px] font-semibold text-plum hover:bg-mist transition-colors duration-150">
            <LifeBuoy size={16} strokeWidth={1.9} aria-hidden="true" /> Panduan
            {isNew && <span aria-hidden="true" className="nudge absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent" />}
          </button>
        </header>
        <main id="konten" className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1320px]">{children}</main>
      </div>
      <Tour key={key} steps={tourFor(path)} open={guide} onClose={() => setGuide(false)} />

      {/* phone: the sidebar folds into a bottom bar */}
      <nav aria-label="Navigasi utama" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ivory border-t border-line grid" style={{ gridTemplateColumns: `repeat(${NAV[role].length}, 1fr)` }}>
        {NAV[role].map((n) => {
          const active = n.match(path)
          return (
            <Link key={n.to} to={n.to} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center gap-1 pt-2.5 pb-3 text-[13px] leading-tight ${active ? 'text-ink font-semibold' : 'text-muted'}`}>
              <n.icon size={19} strokeWidth={1.75} aria-hidden="true" />
              <span className="text-center px-1">{n.short}</span>
            </Link>
          )
        })}
      </nav>
      <ToastHost />
    </div>
  )
}

/** The title row every app screen shares: noun title, one line of finding, the main action. */
export function TitleRow({ title, finding, actions }: { title: string; finding?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-[28px] sm:text-[28px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
        {finding && <p className="text-[15px] text-[#4E4B5E] mt-1.5 max-w-[68ch]">{finding}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
