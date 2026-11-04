import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleDot, Keyboard, Lightbulb, Mic, Send, Square } from 'lucide-react'
import AppShell from '../../components/AppShell'
import { BobyMark } from '../../components/Boby'
import { SuccessCheck, Tabs, Thinking } from '../../components/ui'
import { Link } from '../../lib/router'
import { queueTask as demoTask } from '../../lib/data'
import { api, json, startAttempt, type Attempt, type SessionDetail, type TurnResult } from '../../lib/api'
import { bobyRecovery } from '../../lib/api-errors'
import { canSubmitPractice } from '../../lib/assessment-flow'

const MIN = 20
type Msg = { who: 'boby' | 'mhs'; text: string; trap?: boolean; choice?: string; voice?: boolean }
type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechEvent = { results: ArrayLike<SpeechResult> }
type SpeechRecognitionInstance = {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

/** transitions.dev 30-style streaming: each word resolves through a soft cross-blur, 40ms apart. */
function Streamed({ text }: { text: string }) {
  return <>{text.split(' ').map((w, i) => <span key={i} className="t-swap inline-block whitespace-pre" style={{ animationDelay: `${i * 40}ms` }}>{w + ' '}</span>)}</>
}

function CodeEditor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const lines = value.split('\n').length
  const area = useRef<HTMLTextAreaElement>(null)
  const gutter = useRef<HTMLDivElement>(null)
  return (
    <div className="relative flex rounded-lg bg-ink text-[#EDE7F6] overflow-hidden focus-within:ring-2 focus-within:ring-accent">
      <div ref={gutter} aria-hidden="true" className="select-none py-3 pl-4 pr-3 text-right font-mono text-[13px] leading-[1.7] text-[#8E88A3] overflow-hidden">
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <textarea ref={area} aria-label={label} spellCheck={false} value={value} onChange={(e) => onChange(e.target.value)} rows={Math.max(9, lines)}
        onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop }}
        className="flex-1 bg-transparent py-3 pr-4 font-mono text-[13px] leading-[1.7] outline-none resize-none caret-[#CBB6FF] whitespace-pre overflow-x-auto" />
    </div>
  )
}

function Stepper({ stage }: { stage: number }) {
  const names = ['Praktik', 'Reverse-Tutor', 'Penerapan']
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Tahap sesi">
      {names.map((n, i) => (
        <li key={n} aria-current={i === stage ? 'step' : undefined}>
          <div className={`h-1.5 rounded-full transition-colors duration-[400ms] ${i < stage ? 'bg-ink' : i === stage ? 'bg-accent' : 'bg-line'}`} />
          <p className={`mt-2 text-[15px] flex items-center gap-1.5 ${i === stage ? 'font-semibold' : i < stage ? '' : 'text-muted'}`}>
            {i < stage ? <Check size={15} strokeWidth={2.5} aria-label="selesai" /> : <span className="tnum">{i + 1}.</span>} {n}
          </p>
        </li>
      ))}
    </ol>
  )
}

export default function Assessment({ path, id }: { path: string; id: string }) {
  const [stage, setStage] = useState(0)          // 0 praktik · 1 reverse-tutor · 2 penerapan · 3 terkirim
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [code, setCode] = useState('')
  const [explain, setExplain] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const [choice, setChoice] = useState<string | null>(null)
  const [mode, setMode] = useState<'teks' | 'suara'>('teks')
  const [recording, setRecording] = useState(false)
  const [finalizingVoice, setFinalizingVoice] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [fromVoice, setFromVoice] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [apply, setApply] = useState(['', ''])
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState<'retry' | 'reload' | 'none'>('none')
  const [busy, setBusy] = useState(false)
  const [serverMode, setServerMode] = useState<'live'|'scripted'|null>(null)
  const [fallback, setFallback] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const chat = useRef<HTMLDivElement>(null)
  const T = { ...demoTask, ...(session || {}), className: session?.classId || demoTask.className }

  useEffect(() => {
    let active = true
    const init = async () => {
      const detail = await api<SessionDetail>('mahasiswa', `/sessions/${encodeURIComponent(id)}`)
      const listing = await api<{active: {id:string;attempt?: {id:string;state:string}|null}[]}>('mahasiswa', '/me/sessions')
      const existing = listing.active.find(s => s.id === id)?.attempt
      if (existing && existing.state !== 'berlangsung') {
        if (active) { setSession(detail); setAttemptId(existing.id); setReviewed(existing.state === 'selesai'); setStage(3) }
        return
      }
      const started = await startAttempt(id)
      const attempt = await api<Attempt>('mahasiswa', `/attempts/${started.attemptId}`)
      if (!active) return
      setSession(detail); setAttemptId(started.attemptId)
      setApply(detail.penerapan.map((_, i) => attempt.answers?.[i] || ''))
      setCode(attempt.code || '')
      setExplain(attempt.explain || '')
      if (attempt.dialog?.length) {
        setMsgs(attempt.dialog)
        setStage(attempt.dialog.filter(m => m.who === 'mhs').length >= 3 ? 2 : 1)
      }
    }
    init().catch(e => {if (active) { setError(e.message); setRecovery('reload') }})
    return () => {active = false}
  }, [id])

  const answered = msgs.filter((m) => m.who === 'mhs').length
  const onTrap = Boolean(msgs[msgs.length - 1]?.trap)
  const finished = answered >= 3
  const practiceReady = canSubmitPractice(code, explain, MIN)
  const canSendAnswer = draft.trim().length >= MIN && (!onTrap || !!choice) && !typing && !recording && !finalizingVoice
  const canSend = canSendAnswer && !error

  const go = (n: number) => { setDir(n > stage ? 'fwd' : 'back'); setStage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: 'smooth' }) }, [msgs, typing])
  useEffect(() => () => {
    const recognition = recognitionRef.current
    if (recognition) {
      recognition.onresult = null; recognition.onerror = null; recognition.onend = null
      recognition.abort()
    }
  }, [])

  const reportBobyError = (failure: unknown) => {
    const action = bobyRecovery(failure)
    setRecovery(action)
    setError(action === 'retry' ? 'Boby belum bisa merespons. Coba lagi sebentar.'
      : failure instanceof Error ? failure.message : 'Jawaban belum dapat dikirim.')
  }

  const beginBoby = async () => {
    if (busy || !practiceReady) return
    setBusy(true); setError(''); setRecovery('none')
    try {
      await api('mahasiswa', `/attempts/${attemptId}/practice`, json('PUT',{code,explain}))
      const result = await api<TurnResult>('mahasiswa', `/attempts/${attemptId}/boby/turn`,json('POST',{}))
      if (!result.turn) throw new Error('Pertanyaan Boby belum tersedia.')
      setServerMode(result.mode); setFallback(result.usedFallback); setMsgs([result.turn]); go(1)
    } catch (e) { reportBobyError(e) }
    finally { setBusy(false) }
  }
  const send = async (retry = false) => {
    if ((retry ? !canSendAnswer : !canSend) || busy) return
    setBusy(true); setTyping(true); setError(''); setRecovery('none')
    try {
      const answer = { text:draft.trim(), ...(onTrap ? {choice} : {}) }
      const result = await api<TurnResult>('mahasiswa', `/attempts/${attemptId}/boby/turn`, json('POST',answer))
      const next:Msg = {who:'mhs',text:answer.text,...(onTrap ? {choice:choice!} : {}),voice:fromVoice}
      setMsgs(m => [...m,next,...(result.turn ? [result.turn] : [])])
      setServerMode(result.mode); setFallback(result.usedFallback); setDraft(''); setChoice(null); setFromVoice(false)
    } catch (e) { reportBobyError(e) }
    finally { setTyping(false); setBusy(false) }
  }
  const submitAll = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      await api('mahasiswa', `/attempts/${attemptId}/application`, json('PUT',{answers:apply}))
      const result = await api<{analyst:string;mode:'live'|'scripted'}>('mahasiswa', `/attempts/${attemptId}/submit`,json('POST',{}))
      setServerMode(result.mode); setFallback(result.analyst === 'fallback'); go(3)
    } catch (e) { setRecovery('reload'); setError((e instanceof Error ? e.message : 'Jawaban belum dapat dikirim.') + ' Periksa status sesi sebelum mencoba lagi.') }
    finally { setBusy(false) }
  }
  const record = () => {
    if (finalizingVoice) return
    if (recording) {
      setFinalizingVoice(true)
      recognitionRef.current?.stop()
      return
    }
    const browser = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!Constructor) { setVoiceError('Pengenalan suara tidak tersedia di browser ini. Gunakan Chrome atau ketik jawabanmu.'); return }
    const recognition = new Constructor()
    recognition.lang = 'id-ID'
    recognition.continuous = true
    recognition.interimResults = false
    let transcript = ''
    let failed = false
    recognition.onresult = (event) => {
      transcript = Array.from(event.results).filter(result => result.isFinal).map(result => result[0].transcript.trim()).join(' ').trim()
    }
    recognition.onerror = (event) => {
      failed = true
      setVoiceError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Izin mikrofon ditolak. Izinkan mikrofon di Chrome atau ketik jawabanmu.'
        : event.error === 'no-speech' ? 'Suara belum terdengar. Coba rekam lagi.'
        : 'Transkripsi suara gagal. Periksa koneksi internet, lalu coba lagi atau ketik jawabanmu.')
    }
    recognition.onend = () => {
      if (!failed && transcript) {
        setDraft(current => [current.trim(), transcript].filter(Boolean).join(' '))
        setFromVoice(true)
      } else if (!failed) setVoiceError('Tidak ada ucapan yang tertangkap. Coba rekam lagi.')
      recognitionRef.current = null
      setRecording(false)
      setFinalizingVoice(false)
    }
    setVoiceError('')
    try { recognition.start(); recognitionRef.current = recognition; setRecording(true) }
    catch { setVoiceError('Mikrofon belum dapat dimulai. Coba lagi atau ketik jawabanmu.') }
  }

  const focus = session?.indicators.map(f => ({concept:f.name, state:'Menunggu tinjauan'})) ?? []
  const stageState = (i: number) => (stage > i ? 'Selesai' : stage === i ? 'Sedang berlangsung' : 'Belum dimulai')

  if (!session || !attemptId) return <AppShell role="mahasiswa" path={path} crumbs={[{label:'Ruang Mahasiswa',to:'/mahasiswa'},{label:'Ruang Asesmen'}]}><p role={error ? 'alert' : 'status'}>{error || 'Menyiapkan sesi…'}</p>{error && <button className="btn btn-secondary mt-4" onClick={() => window.location.reload()}>Coba lagi</button>}</AppShell>
  return (
    <AppShell role="mahasiswa" path={path} crumbs={[{ label: 'Ruang Mahasiswa', to: '/mahasiswa' }, { label: 'Sesi Belajar', to: '/mahasiswa/sesi' }, { label: 'Ruang Asesmen' }]}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] leading-tight">Ruang Asesmen</h1>
          <p className="text-[15px] text-[#4E4B5E] mt-1">{T.title} · {T.className} · {T.type}</p>
        </div>
        <div className="flex items-center gap-4 text-[15px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-plum" aria-hidden="true" /> Disimpan saat dikirim</span>
          <span className="tnum">Batas {T.due}</span>
        </div>
      </div>
      <div className="mb-6 max-w-[880px]"><Stepper stage={Math.min(stage, 3)} /></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-mist p-3">{error}{' '}{recovery === 'retry' ? <button className="underline text-plum disabled:opacity-50" disabled={busy || (stage === 0 ? !practiceReady : !canSendAnswer)} onClick={() => stage === 0 ? void beginBoby() : void send(true)}>Coba lagi</button> : recovery === 'reload' ? <button className="underline text-plum" onClick={() => window.location.reload()}>Muat ulang</button> : null}</p>}
      {serverMode && <p className="mb-4 text-[13px] text-muted">{serverMode === 'scripted' ? 'Mode skrip · respons contoh' : 'Mode AI langsung'}{fallback ? stage === 3 ? ' · analisis cadangan' : ' · respons contoh' : ''}</p>}

      <div className="grid xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div key={stage} className={dir === 'fwd' ? 't-step-fwd' : 't-step-back'}>
          {stage === 0 && (
            <div className="grid gap-4">
              <section className="card p-6" aria-labelledby="tugas-h">
                <h2 id="tugas-h" className="text-[17px] font-semibold">Tugas praktik</h2>
                <p className="mt-2 text-[15px] leading-relaxed max-w-[72ch]">{T.instruction}</p>
                <p className="mt-4 text-[13px] font-semibold text-muted">Tujuan belajar</p>
                <p className="mt-1 text-[15px]">{T.goal}</p>
              </section>
              <section className="card p-6" aria-labelledby="jawab-h">
                <div className="flex items-center justify-between gap-3 mb-3"><h2 id="jawab-h" className="text-[17px] font-semibold">Jawaban praktik</h2><span className="pill pill-ok">Teks / Kode</span></div>
                <CodeEditor value={code} onChange={setCode} label="Kode Python" />
                <label htmlFor="penjelasan" className="label mt-5">Penjelasan awal dengan kata-katamu sendiri</label>
                <textarea id="penjelasan" className="field" rows={3} value={explain} onChange={(e) => setExplain(e.target.value)} />
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
                  {[['Kode sudah ditulis', code.trim().length > 20], ['Penjelasan sudah ditambahkan', explain.trim().length >= MIN]].map(([l, ok]) => (
                    <li key={l as string} className={`inline-flex items-center gap-1.5 ${ok ? 'text-ink' : 'text-muted'}`}>{ok ? <Check size={15} strokeWidth={2.5} className="text-plum" aria-hidden="true" /> : <CircleDot size={15} aria-hidden="true" />}{l}</li>
                  ))}
                </ul>
                <div className="mt-6 flex justify-end">
                  <button className="btn btn-primary" disabled={busy || !!error || !practiceReady} onClick={() => void beginBoby()}>{busy ? 'Menyiapkan Boby…' : 'Kirim dan lanjut ke Boby'} <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              </section>
            </div>
          )}

          {stage === 1 && (
            <section className="card flex flex-col min-h-[640px]" aria-labelledby="chat-h">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <BobyMark className="w-10 h-10" />
                  <div><h2 id="chat-h" className="text-[17px] font-semibold leading-tight">Boby · murid AI</h2><p className="text-[13px] text-muted">Bantu aku memahami pekerjaanmu</p></div>
                </div>
                <span className="text-[15px] text-muted tnum">Pertanyaan {Math.min(answered + 1, 3)} dari 3</span>
              </div>
              <div ref={chat} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 max-h-[520px]" aria-live="polite">
                {msgs.map((m, i) => m.who === 'boby' ? (
                  <div key={i} className="flex items-start gap-2.5 max-w-[86%]">
                    <BobyMark className="w-8 h-8 shrink-0 mt-0.5" />
                    <div className={`bubble-left bg-lavender px-4 py-3 text-[15px] leading-snug ${m.trap ? 'outline-2 outline-accent -outline-offset-2' : ''}`}>
                      {m.trap && <span className="block text-[13px] font-semibold text-plum mb-1">Pernyataan uji · setuju atau tidak?</span>}
                      {i === msgs.length - 1 ? <Streamed text={m.text} /> : m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end t-reveal">
                    <div className="bubble-right bg-charcoal text-ivory px-4 py-3 text-[15px] leading-snug max-w-[80%]">
                      {(m.choice || m.voice) && <span className="block text-[13px] font-semibold text-[#CBB6FF] mb-1">{[m.choice, m.voice && 'jawaban suara'].filter(Boolean).join(' · ')}</span>}
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex items-center gap-2.5"><BobyMark className="w-8 h-8" /><span className="bubble-left bg-lavender px-4 py-3.5 inline-flex gap-1" aria-label="Boby sedang mengetik">{[0, 1, 2].map((d) => <span key={d} className="typing-dot w-1.5 h-1.5 rounded-full bg-plum" />)}</span></div>
                )}
              </div>

              <div className="border-t border-line px-6 py-5">
                {finished ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[15px] text-[#4E4B5E]">Klarifikasi selesai. Jawaban dan percakapan ini akan ditinjau dosen.</p>
                    <button className="btn btn-primary" onClick={() => go(2)} disabled={typing}>Lanjut ke Penerapan <ArrowRight size={16} aria-hidden="true" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <Tabs label="Cara menjawab" value={mode} onChange={(next) => { if (recording && next !== 'suara') { setFinalizingVoice(true); recognitionRef.current?.stop() } setMode(next) }} tabs={[{ id: 'teks', label: <span className="inline-flex items-center gap-1.5"><Keyboard size={15} aria-hidden="true" />Teks</span> }, ...(id === demoTask.id ? [{ id: 'suara' as const, label: <span className="inline-flex items-center gap-1.5"><Mic size={15} aria-hidden="true" />Suara</span> }] : [])]} />
                      {onTrap && (
                        <div role="radiogroup" aria-label="Pilih sikapmu terhadap pernyataan Boby" className="flex gap-1.5">
                          {['Setuju', 'Tidak setuju'].map((c) => (
                            <button key={c} role="radio" aria-checked={choice === c} onClick={() => setChoice(c)} className={`btn btn-sm ${choice === c ? 'btn-primary' : 'btn-secondary'}`}>{c}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    {mode === 'suara' && id === demoTask.id && (
                      <div className="mb-3 flex items-center gap-4 rounded-lg bg-mist p-3">
                        <button onClick={record} disabled={finalizingVoice || busy} aria-pressed={recording} className={`w-12 h-12 rounded-full grid place-content-center shrink-0 transition-colors duration-[250ms] disabled:opacity-60 ${recording ? 'bg-accent text-white' : 'bg-charcoal text-ivory hover:bg-black'}`} aria-label={finalizingVoice ? 'Memproses transkripsi' : recording ? 'Selesai merekam' : 'Mulai rekam jawaban'}>
                          {recording ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
                        </button>
                        {recording && !finalizingVoice ? (
                          <div className="flex items-center gap-[3px] h-8" aria-hidden="true">
                            {Array.from({ length: 28 }, (_, i) => <span key={i} className="wave w-[3px] rounded-full bg-accent" style={{ animationDelay: `${(i % 7) * 90}ms`, height: `${30 + ((i * 37) % 60)}%` }} />)}
                          </div>
                        ) : <p className="text-[15px] text-[#4E4B5E]">{finalizingVoice ? 'Menyelesaikan transkripsi…' : 'Tekan mikrofon, bicara, lalu tekan lagi untuk melihat transkrip.'}</p>}
                      </div>
                    )}
                    {mode === 'suara' && voiceError && <p role="alert" className="mb-3 text-[13px] text-[#A04242]">{voiceError}</p>}
                    <label htmlFor="jawab-boby" className="sr-only">Jawabanmu untuk Boby</label>
                    <textarea id="jawab-boby" className="field bubble-right" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
                      placeholder={onTrap ? 'Pilih setuju atau tidak, lalu jelaskan alasanmu…' : 'Jelaskan dengan kata-katamu sendiri…'} aria-describedby="jawab-hint" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p id="jawab-hint" className="text-[13px] text-muted tnum">
                        {fromVoice ? 'Transkrip suara: periksa sebelum mengirim. ' : ''}{Math.min(draft.trim().length, MIN)}/{MIN} karakter minimum{onTrap && !choice ? ' · pilih setuju atau tidak' : ''}
                      </p>
                      <div className="flex items-center gap-4">
                        <button className="btn btn-primary btn-sm" disabled={!canSend || busy} onClick={() => void send()}>Kirim <Send size={15} aria-hidden="true" /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {stage === 2 && (
            <section className="card p-6" aria-labelledby="terap-h">
              <h2 id="terap-h" className="text-[17px] font-semibold">Soal penerapan</h2>
              <p className="text-[15px] text-[#4E4B5E] mt-1">Soal ini berbeda dari praktik. Jawab dengan alasanmu sendiri.</p>
              {T.penerapan.map((q, i) => (
                <div key={i} className="mt-6">
                  <label htmlFor={`p${i}`} className="block font-semibold text-[15px] leading-snug max-w-[72ch]"><span className="text-muted tnum mr-1">{i + 1}.</span>{q}</label>
                  <textarea id={`p${i}`} className="field mt-2.5" rows={3} value={apply[i]} onChange={(e) => setApply((a) => a.map((v, k) => (k === i ? e.target.value : v)))} />
                </div>
              ))}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button className="btn btn-ghost btn-sm" onClick={() => go(1)}><ArrowLeft size={15} aria-hidden="true" /> Kembali ke klarifikasi</button>
                <div className="flex items-center gap-4">
                  <button className="btn btn-primary" disabled={busy || !!error || apply.some((a) => a.trim().length < MIN)} onClick={() => void submitAll()}>{busy ? 'Mengirim…' : 'Kirim semua jawaban'} <Send size={16} aria-hidden="true" /></button>
                </div>
              </div>
            </section>
          )}

          {stage === 3 && (
            <section className="card p-10 flex flex-col items-center text-center" aria-labelledby="done-h">
              <SuccessCheck size={64} />
              <h2 id="done-h" className="mt-6 text-[25px] font-bold tracking-[-0.02em]">{reviewed ? 'Sesi sudah ditinjau' : 'Jawabanmu terkirim'}</h2>
              {!reviewed && <p className="mt-3 text-[17px] text-[#4E4B5E]"><Thinking lines={['Menunggu tinjauan dosen']} /></p>}
              <p className="mt-4 text-[15px] text-[#4E4B5E] max-w-[52ch]">{reviewed ? 'Dosen sudah menyelesaikan tinjauan sesi ini.' : 'Dosen akan meninjau praktik, percakapanmu dengan Boby, dan soal penerapan.'}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/mahasiswa" className="btn btn-primary">Ke Dashboard Belajar</Link>
                {reviewed && <Link to={`/mahasiswa/ringkasan/${id}`} className="btn btn-secondary">Lihat hasil</Link>}
              </div>
            </section>
          )}
        </div>

        <aside className="grid gap-4" aria-label="Status sesi">
          <section className="card p-5" aria-labelledby="status-h">
            <h2 id="status-h" className="text-[15px] font-semibold mb-3">Status sesi</h2>
            <ul className="flex flex-col gap-2.5 text-[15px]">
              {['Tugas praktik', 'Klarifikasi dengan Boby', 'Soal penerapan'].map((n, i) => (
                <li key={n} className="flex items-center justify-between gap-3"><span>{n}</span>
                  <span className={`inline-flex items-center gap-1.5 ${stageState(i) === 'Sedang berlangsung' ? 'text-plum font-semibold' : stageState(i) === 'Selesai' ? 'text-ink' : 'text-muted'}`}><span className={`w-1.5 h-1.5 rounded-full ${stageState(i) === 'Sedang berlangsung' ? 'bg-accent' : stageState(i) === 'Selesai' ? 'bg-ink' : 'bg-[#D9D0E4]'}`} aria-hidden="true" />{stageState(i)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5" aria-labelledby="fokus-h">
            <h2 id="fokus-h" className="text-[15px] font-semibold">Fokus klarifikasi</h2>
            <p className="text-[13px] text-muted mt-1 mb-3">Boby bertanya pada konsep yang belum terlihat jelas dari praktikmu.</p>
            <ul className="flex flex-col gap-2 text-[15px]">
              {focus.map((f) => (
                <li key={f.concept} className="flex items-center justify-between gap-3"><span>{f.concept}</span>
                  <span className={`pill ${f.state === 'Sudah jelas' ? 'pill-ok' : f.state === 'Sedang ditinjau' ? 'pill-part' : 'pill-none'}`}>{f.state}</span></li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg bg-mist p-5 text-[15px]" aria-labelledby="cara-h">
            <h2 id="cara-h" className="font-semibold flex items-center gap-1.5"><Lightbulb size={16} aria-hidden="true" /> Cara menjawab</h2>
            <ul className="mt-2 flex flex-col gap-1.5 text-[#4E4B5E]">
              <li>Jelaskan alasan, bukan hanya jawaban akhir.</li>
              <li>Boby kadang sengaja keliru. Kalau tidak setuju, katakan dan jelaskan.</li>
              <li>Skor tidak ditampilkan; dosen meninjau dulu.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}
