import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { api, json, type ApiStatus, type Attempt, type Roster, type SessionDetail } from '../../lib/api'

const statusLabel:Record<ApiStatus,string> = {terpenuhi:'Terpenuhi',sebagian:'Sebagian',belum:'Belum',ambigu:'Ambigu'}
const errorText = (e:unknown) => e instanceof Error ? e.message : 'Permintaan tidak berhasil.'

export default function Review({path}:{path:string}) {
  const sessionId = path.split('/')[3] || 'operasi-stack'
  const [session,setSession] = useState<SessionDetail|null>(null)
  const [roster,setRoster] = useState<Roster|null>(null)
  const [selected,setSelected] = useState<string|null>(null)
  const [attempt,setAttempt] = useState<Attempt|null>(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [correcting,setCorrecting] = useState<string|null>(null)
  const [note,setNote] = useState('')
  const [filter,setFilter] = useState<'perlu'|'semua'>('perlu')
  const loadRoster = async () => {
    const r = await api<Roster>('dosen',`/sessions/${encodeURIComponent(sessionId)}/roster`)
    setRoster(r)
    return r
  }
  useEffect(() => {
    let live=true
    Promise.all([
      api<SessionDetail>('dosen',`/sessions/${encodeURIComponent(sessionId)}`),
      api<Roster>('dosen',`/sessions/${encodeURIComponent(sessionId)}/roster`),
    ]).then(([s,r])=>{if(!live)return;setSession(s);setRoster(r);setSelected(r.rows.find(x=>x.state==='perlu' && x.attemptId)?.attemptId || r.rows.find(x=>x.attemptId)?.attemptId || null)})
      .catch(e=>{if(live)setError(errorText(e))})
    return ()=>{live=false}
  },[sessionId])
  useEffect(()=>{
    let live=true
    setAttempt(null);setCorrecting(null)
    if(selected) api<Attempt>('dosen',`/attempts/${selected}`).then(a=>{if(live){setAttempt(a);setNote(a.note || '')}}).catch(e=>{if(live)setError(errorText(e))})
    return ()=>{live=false}
  },[selected])
  const decide = async (indicator:string, decision:'accept'|'correct'|'reject', status?:ApiStatus) => {
    if(!attempt || busy) return
    setBusy(true);setError('')
    try {
      await api('dosen',`/attempts/${attempt.id}/decisions`,json('POST',{indicator,decision,...(status ? {status} : {})}))
      setAttempt(await api<Attempt>('dosen',`/attempts/${attempt.id}`));setCorrecting(null)
      await loadRoster()
    } catch(e) {setError(errorText(e))}
    finally {setBusy(false)}
  }
  const finalize = async () => {
    if(!attempt || busy) return
    setBusy(true);setError('')
    try {
      await api('dosen',`/attempts/${attempt.id}/finalize`,json('POST',{note}))
      setAttempt(await api<Attempt>('dosen',`/attempts/${attempt.id}`));await loadRoster()
    } catch(e) {setError(errorText(e))}
    finally {setBusy(false)}
  }
  const visible = roster?.rows.filter(r => r.attemptId && (filter === 'semua' || r.state === 'perlu')) || []
  return <AppShell role="dosen" path={path} crumbs={[{label:'Ruang Dosen',to:'/dosen'},{label:'Tinjauan Hasil'}]}>
    <h1 className="text-[28px] font-bold">Tinjauan Hasil Asesmen</h1>
    <p className="text-muted mt-1 mb-5">{session?.title || 'Memuat sesi…'} · {roster?.summary.perlu ?? '–'} mahasiswa perlu ditinjau</p>
    {error && <p role="alert" className="card p-4 mb-4">{error} <button className="text-plum underline ml-2" onClick={()=>window.location.reload()}>Muat ulang</button></p>}
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_380px] items-start">
      <section className="card p-4"><h2 className="font-semibold">Mahasiswa</h2>
        <div className="flex gap-2 mt-3"><button className={`btn btn-sm ${filter==='perlu'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('perlu')}>Perlu</button><button className={`btn btn-sm ${filter==='semua'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('semua')}>Semua</button></div>
        {!roster && !error && <p className="mt-3">Memuat…</p>}
        {roster && visible.length===0 && <p className="text-muted mt-3">Tidak ada mahasiswa pada daftar ini.</p>}
        <ul className="mt-3 max-h-[65vh] overflow-auto">{visible.map(row=><li key={row.id}><button className={`w-full p-3 rounded-md text-left ${selected===row.attemptId?'bg-mist':''}`} onClick={()=>setSelected(row.attemptId)}><b>{row.name}</b><span className="block text-muted text-[13px]">{row.nim} · {row.state === 'perlu' ? 'Perlu ditinjau' : row.state === 'selesai' ? 'Sudah ditinjau' : 'Bukti kurang'}</span></button></li>)}</ul>
      </section>
      {selected && !attempt && !error && <p role="status">Memuat bukti…</p>}
      {attempt && <><section className="card p-6 min-w-0"><h2 className="text-[20px] font-semibold">{attempt.student.name}</h2><p className="text-muted text-[13px]">{attempt.student.nim}</p>
        <h3 className="mt-6 font-semibold">1 · Praktik</h3><p className="text-muted mt-2">{session?.instruction}</p><pre className="mt-3 bg-ink text-white p-4 rounded-lg whitespace-pre-wrap overflow-auto text-[13px]">{attempt.code || 'Tidak ada kode.'}</pre><p className="mt-3">{attempt.explain || 'Tidak ada penjelasan.'}</p>
        <h3 className="mt-6 font-semibold">2 · Klarifikasi dengan Boby</h3><ol className="mt-3 grid gap-3">{attempt.dialog.map((m,i)=><li className="rounded-lg bg-mist p-3 text-[15px]" key={i}><b>{m.who === 'boby' ? 'Boby' : attempt.student.name}{m.choice ? ` · ${m.choice}` : ''}</b><p className="mt-1">{m.text}</p></li>)}</ol>
        <h3 className="mt-6 font-semibold">3 · Penerapan</h3>{attempt.answers.map((a,i)=><div className="mt-3" key={i}><p className="text-muted">{session?.penerapan[i]}</p><p className="mt-1">{a}</p></div>)}
      </section>
      <section className="card p-6"><h2 className="font-semibold">Ringkasan temuan</h2><p className="text-muted text-[13px] mt-1">Skor {attempt.score ?? '–'} · {attempt.reviewedAt ? 'final' : 'sementara'} · {attempt.pending} belum diputuskan{attempt.analyst === 'fallback' ? ' · analis cadangan' : ''}</p>
        {attempt.findings.length===0 && <p className="mt-4 text-muted">Tidak ada temuan yang tersedia.</p>}
        {attempt.findings.map(f=>{const ind=attempt.indicators.find(i=>i.id===f.indicator);const decision=attempt.decisions[f.indicator];const status=attempt.corrections[f.indicator] || f.status;return <article key={f.indicator} className="border border-line rounded-lg p-4 mt-3">
          <h3 className="font-semibold">{ind?.name || f.indicator}</h3><p className="text-plum text-[13px] mt-1">{statusLabel[status]}{decision==='reject'?' · ditolak':''}</p>
          <p className="mt-2 text-[15px]">“{f.quote || 'Tidak ada kutipan'}”</p><p className="text-[13px] text-muted mt-1">{f.verified ? 'Kutipan ditemukan di transkrip' : 'Kutipan perlu diperiksa'} · {f.reason}</p>
          {!attempt.reviewedAt && <><div className="grid grid-cols-3 gap-1 mt-3">
            <button disabled={busy} className={`btn btn-sm ${decision==='accept'?'btn-primary':'btn-secondary'}`} onClick={()=>void decide(f.indicator,'accept')}>Terima</button>
            <button disabled={busy} className={`btn btn-sm ${decision==='correct'?'btn-primary':'btn-secondary'}`} onClick={()=>setCorrecting(f.indicator)}>Koreksi</button>
            <button disabled={busy} className={`btn btn-sm ${decision==='reject'?'btn-primary':'btn-secondary'}`} onClick={()=>void decide(f.indicator,'reject')}>Tolak</button>
          </div>{correcting===f.indicator && <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Ubah status menjadi">{(['terpenuhi','sebagian','belum','ambigu'] as ApiStatus[]).map(s=><button key={s} disabled={busy} className="pill pill-amb" onClick={()=>void decide(f.indicator,'correct',s)}>{statusLabel[s]}</button>)}</div>}</>}
        </article>})}
        {!attempt.reviewedAt && attempt.findings.length>0 && <><label htmlFor="catatan" className="label mt-5">Catatan dosen</label><textarea id="catatan" className="field" rows={3} value={note} onChange={e=>setNote(e.target.value)} /><button className="btn btn-primary w-full mt-4" disabled={busy || attempt.pending>0} onClick={()=>void finalize()}>{busy?'Menyimpan…':'Simpan tinjauan'}</button>{attempt.pending>0 && <p className="text-muted text-[13px] mt-2">Putuskan semua temuan sebelum menyimpan.</p>}</>}
        {attempt.reviewedAt && <p className="mt-4 text-plum">Tinjauan sudah disimpan.</p>}
      </section></>}
      {!selected && roster && <p className="text-muted">Belum ada bukti yang dapat dibuka.</p>}
    </div>
  </AppShell>
}
