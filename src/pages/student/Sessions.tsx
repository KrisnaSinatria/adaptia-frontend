import { useEffect, useState } from 'react'
import AppShell, { TitleRow } from '../../components/AppShell'
import { Link } from '../../lib/router'
import { api, type ApiSession } from '../../lib/api'

export function SessionTable({ headingId }: { headingId: string }) {
  const [data, setData] = useState<{active:ApiSession[]; history:ApiSession[]}|null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api<{active:ApiSession[];history:ApiSession[]}>('mahasiswa','/me/sessions')
      .then(x => {if(active) setData(x)}).catch(e => {if(active) setError(e.message)})
    return () => {active=false}
  }, [])
  return <div className="card p-6"><h2 id={headingId} className="text-[17px] font-semibold">Sesi belajar</h2>
    {error && <p role="alert" className="mt-3">{error}</p>}
    {!data && !error && <p className="mt-3">Memuat sesi…</p>}
    {data && <div className="mt-3">
      {data.active.length === 0 && <p className="text-muted">Belum ada sesi aktif.</p>}
      {data.active.map(s => <div key={s.id} className="border-t border-line py-3 flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-semibold">{s.title}</p><p className="text-muted text-[13px]">{s.type} · {s.format} · Batas {s.due}</p></div>
        {s.attempt?.state === 'perlu' ? <span className="pill pill-part">Menunggu tinjauan</span> : s.attempt?.state === 'selesai' ? <Link to={`/mahasiswa/ringkasan/${s.id}`} className="btn btn-sm btn-secondary">Lihat hasil</Link> :
          <Link to={`/mahasiswa/sesi/${s.id}`} className="btn btn-sm btn-secondary">{s.attempt?.state === 'berlangsung' ? 'Lanjutkan' : 'Mulai'}</Link>}
      </div>)}
      {data.history.length > 0 && <details className="mt-4"><summary className="cursor-pointer font-semibold">Riwayat sesi · {data.history.length}</summary>
        {data.history.map(s => <p className="mt-2 text-muted" key={s.id}>{s.title} · {s.attempt?.state === 'selesai' ? <Link className="text-plum underline" to={`/mahasiswa/ringkasan/${s.id}`}>Lihat hasil yang ditinjau</Link> : s.attempt?.state === 'perlu' ? 'Menunggu tinjauan' : 'Sesi ditutup'}</p>)}
      </details>}
    </div>}
  </div>
}

export default function StudentSessions({path}:{path:string}) {
  return <AppShell role="mahasiswa" path={path} crumbs={[{label:'Ruang Mahasiswa',to:'/mahasiswa'},{label:'Sesi Belajar'}]}>
    <TitleRow title="Sesi Belajar" finding="Umpan balik muncul setelah dosen meninjau bukti." />
    <SessionTable headingId="sesi-list-h" />
  </AppShell>
}
