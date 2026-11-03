import { useEffect, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import AppShell, { TitleRow } from '../../components/AppShell'
import { Link } from '../../lib/router'
import { api, type ApiSession, type Roster } from '../../lib/api'
import { SessionRows } from './SessionList'

export default function LecturerDashboard({path}:{path:string}) {
  const [sessions,setSessions] = useState<ApiSession[]|null>(null)
  const [summary,setSummary] = useState<Roster['summary']|null>(null)
  const [reviewId,setReviewId] = useState('')
  const [reviewTitle,setReviewTitle] = useState('')
  const [error,setError] = useState('')
  useEffect(()=>{
    let live=true
    api<{active:ApiSession[];history:ApiSession[]}>('dosen','/me/sessions').then(async data=>{
      const rows=[...data.active,...data.history]
      const review=rows.find(s=>s.id==='operasi-stack') || rows[0]
      const roster=review ? await api<Roster>('dosen',`/sessions/${review.id}/roster`) : null
      if(live){setSessions(rows);setSummary(roster?.summary || null);setReviewId(review?.id || '');setReviewTitle(review?.title || '')}
    }).catch(e=>{if(live)setError(e.message)})
    return ()=>{live=false}
  },[])
  return <AppShell role="dosen" path={path} crumbs={[{label:'Ruang Dosen'},{label:'Dashboard Kelas'}]}>
    <TitleRow title="Dashboard Kelas" finding={error || (summary ? `${summary.perlu} mahasiswa menunggu tinjauan pada ${reviewTitle}.` : 'Memuat data dari server…')}
      actions={<><Link to="/dosen/sesi/baru" className="btn btn-secondary btn-sm"><Plus size={15}/> Buat sesi asesmen</Link>{reviewId && <Link to={`/dosen/tinjauan/${reviewId}`} className="btn btn-primary btn-sm">Tinjau bukti <ArrowRight size={15}/></Link>}</>} />
    {error && <p role="alert" className="card p-4">{error}</p>}
    {summary && <section className="card p-5 grid grid-cols-3 gap-4"><div>Perlu ditinjau<p className="text-[28px] font-semibold">{summary.perlu}</p></div><div>Temuan menunggu<p className="text-[28px] font-semibold">{summary.pendingFindings}</p></div><div>Rata-rata sementara<p className="text-[28px] font-semibold">{summary.avg ?? '–'}</p></div></section>}
    <section className="card p-5 mt-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Sesi asesmen</h2><Link className="text-plum" to="/dosen/sesi">Lihat semua</Link></div>{sessions ? <SessionRows rows={sessions.slice(0,5)}/> : !error && <p className="mt-3">Memuat sesi…</p>}</section>
    <p className="text-muted text-[13px] mt-4">Mode demo: sesi dan ringkasan bersumber dari backend. Pengaturan sesi dan sebagian fitur lain masih contoh lokal.</p>
  </AppShell>
}
