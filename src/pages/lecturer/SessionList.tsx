import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import AppShell, { TitleRow } from '../../components/AppShell'
import { Link } from '../../lib/router'
import { api, type ApiSession } from '../../lib/api'

export function SessionRows({rows}:{rows:ApiSession[]}) {
  return <div className="overflow-x-auto"><table className="w-full text-[15px] sm:min-w-[620px]"><thead><tr className="text-left text-muted"><th className="py-3">Sesi</th><th>Kelas</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
    {rows.map(s=><tr className="border-t border-line" key={s.id}><td className="py-3"><b>{s.title}</b><p className="text-muted text-[13px]">{s.type} · {s.format}</p></td><td>{s.classId}</td><td>{s.state === 'berlangsung' ? 'Berlangsung' : s.state === 'perlu' ? 'Perlu ditinjau' : 'Selesai'}</td><td><Link className="btn btn-sm btn-secondary" to={`/dosen/tinjauan/${s.id}`}>Lihat bukti</Link></td></tr>)}
  </tbody></table>{rows.length===0 && <p className="mt-3 text-muted">Belum ada sesi.</p>}</div>
}
export default function SessionList({path}:{path:string}) {
  const [rows,setRows]=useState<ApiSession[]|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{let live=true;api<{active:ApiSession[];history:ApiSession[]}>('dosen','/me/sessions').then(x=>{if(live)setRows([...x.active,...x.history])}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[])
  return <AppShell role="dosen" path={path} crumbs={[{label:'Ruang Dosen',to:'/dosen'},{label:'Sesi Asesmen'}]}><TitleRow title="Sesi Asesmen" finding="Sesi dari backend." actions={<Link to="/dosen/sesi/baru" className="btn btn-primary btn-sm"><Plus size={15}/> Buat sesi asesmen</Link>}/><section className="card p-5">{error ? <p role="alert">{error}</p> : rows ? <SessionRows rows={rows}/> : <p>Memuat sesi…</p>}</section></AppShell>
}
