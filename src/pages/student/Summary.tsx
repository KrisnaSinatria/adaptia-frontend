import { useEffect, useState } from 'react'
import AppShell, { TitleRow } from '../../components/AppShell'
import { Link } from '../../lib/router'
import { api, type ApiSession, type Attempt, type ApiStatus } from '../../lib/api'

const labels:Record<ApiStatus,string>={terpenuhi:'Terpenuhi',sebagian:'Sebagian',belum:'Belum',ambigu:'Perlu diperjelas'}

export default function Summary({path}:{path:string}) {
  const id=path.split('/')[3]
  const [attempt,setAttempt]=useState<Attempt|null>(null)
  const [title,setTitle]=useState('')
  const [status,setStatus]=useState('Memuat hasil…')
  const [error,setError]=useState(false)
  useEffect(()=>{
    let active=true
    const load=async()=>{
      const list=await api<{active:ApiSession[];history:ApiSession[]}>('mahasiswa','/me/sessions')
      const session=[...list.active,...list.history].find(s=>s.id===id)
      if(!session) throw new Error('Sesi tidak ditemukan.')
      if(active)setTitle(session.title)
      if(!session.attempt || session.attempt.state!=='selesai') {
        if(active)setStatus('Hasil belum tersedia. Dosen perlu menyelesaikan tinjauan terlebih dahulu.')
        return
      }
      const data=await api<Attempt>('mahasiswa',`/attempts/${session.attempt.id}`)
      if(active){setAttempt(data);setStatus('')}
    }
    load().catch(e=>{if(active){setError(true);setStatus(e instanceof Error?e.message:'Hasil belum dapat dimuat.')}})
    return()=>{active=false}
  },[id])
  return <AppShell role="mahasiswa" path={path} crumbs={[{label:'Ruang Mahasiswa',to:'/mahasiswa'},{label:'Hasil sesi'}]}>
    <TitleRow title="Hasil sesi" finding={title || undefined}/>
    {!attempt && <section className="card p-6"><p role={error?'alert':'status'}>{status}</p><Link to="/mahasiswa/sesi" className="btn btn-secondary mt-4">Kembali ke sesi</Link></section>}
    {attempt && <><section className="card p-6"><p className="text-plum font-semibold">Sudah ditinjau dosen</p><h2 className="text-[24px] font-semibold mt-2">{title}</h2><p className="mt-2 text-muted">Skor akhir: <b className="text-ink">{attempt.score ?? '–'}</b></p>{attempt.note && <p className="mt-4">Catatan dosen: {attempt.note}</p>}</section>
      <section className="card p-6 mt-4"><h2 className="font-semibold text-[18px]">Kriteria pemahaman</h2>
        {attempt.findings.filter(f=>attempt.decisions[f.indicator]!=='reject').map(f=>{const indicator=attempt.indicators.find(i=>i.id===f.indicator);const status=attempt.corrections[f.indicator] || f.status;return <article key={f.indicator} className="border-t border-line py-4 mt-3"><div className="flex justify-between gap-3"><b>{indicator?.name || f.indicator}</b><span className="text-plum">{labels[status]}</span></div>{f.quote && <p className="text-muted mt-2">“{f.quote}”</p>}</article>})}
      </section></>}
  </AppShell>
}
