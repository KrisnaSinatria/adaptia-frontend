import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRight, Eye, EyeOff, GraduationCap, Presentation } from 'lucide-react'
import Boby, { BobyMark } from '../components/Boby'
import { Link, go } from '../lib/router'
import { login, type Role } from '../lib/api'
import './login.css'

/**
 * The way in is a demonstration of the product: before signing in, Boby states something wrong and
 * waits. Disagreeing with him is exactly what ADAPTIA asks students to do, so the login screen
 * teaches the idea rather than describing it.
 */
type Claim = { topic: string; text: string; wrongBecause: string }

const CLAIMS: Claim[] = [
  { topic: 'Peluang', text: 'Koin sudah lima kali muncul angka. Berarti lemparan berikutnya pasti gambar.', wrongBecause: 'Setiap lemparan berdiri sendiri. Peluang gambar tetap satu per dua.' },
  { topic: 'Stack & Queue', text: 'Stack itu seperti antrean kantin: yang datang duluan, dilayani duluan.', wrongBecause: 'Pada stack, yang terakhir masuk justru keluar lebih dahulu.' },
  { topic: 'Stack & Queue', text: 'Fitur Undo paling cocok memakai queue.', wrongBecause: 'Undo membatalkan perubahan terakhir lebih dulu, jadi yang cocok stack.' },
  { topic: 'Peluang', text: 'Dua hal berkorelasi. Berarti yang satu menyebabkan yang lain.', wrongBecause: 'Korelasi belum membuktikan sebab-akibat; bisa ada faktor lain.' },
]

type Phase = 'mengetik' | 'bertanya' | 'dijawab'

export default function Login() {
  const root = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<Phase>('mengetik')
  const [answer, setAnswer] = useState<'Setuju' | 'Tidak setuju' | null>(null)
  const [show, setShow] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [daftar, setDaftar] = useState(false)
  const [peran, setPeran] = useState<'mahasiswa' | 'dosen'>('mahasiswa')
  const [demoBusy, setDemoBusy] = useState(false)
  const openDemo = async (role: Role) => {
    setDemoBusy(true); setNote(null)
    try { await login(role); go('/' + role) }
    catch (error) { setNote(error instanceof Error ? error.message : 'Tidak dapat masuk ke mode demo.') }
    finally { setDemoBusy(false) }
  }
  const claim = CLAIMS[i]
  const calm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // Boby thinks, then speaks. Each claim arrives the way a classmate would say it: a pause, then the sentence.
  useEffect(() => {
    if (phase !== 'mengetik') return
    const t = setTimeout(() => setPhase('bertanya'), calm ? 220 : 1150)
    return () => clearTimeout(t)
  }, [phase, i, calm])

  // The claim swaps in; Boby leans on every change so the right-hand field is never still.
  useGSAP(() => {
    if (calm) return
    if (phase === 'bertanya') gsap.from('[data-say]', { yPercent: 34, autoAlpha: 0, duration: 0.65, ease: 'power3.out' })
    if (phase === 'dijawab') {
      const right = answer === 'Tidak setuju'
      gsap.to('[data-mood]', { rotation: right ? -9 : 7, y: right ? -14 : 10, scale: right ? 1.04 : 0.97, duration: 0.7, ease: 'back.out(2)' })
      gsap.from('[data-verdict]', { y: 18, autoAlpha: 0, duration: 0.5 })
    }
    if (phase === 'mengetik') gsap.to('[data-mood]', { rotation: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' })
  }, { scope: root, dependencies: [phase, answer], revertOnUpdate: true })

  // The way in, built once: the form rises, then Boby's field.
  useGSAP(() => {
    if (calm) return
    gsap.from('[data-in]', { y: 26, autoAlpha: 0, duration: 0.85, stagger: 0.07, ease: 'power3.out' })
    gsap.from('[data-stage]', { scale: 0.92, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, )
  }, { scope: root })

  const respond = (c: 'Setuju' | 'Tidak setuju') => {
    setAnswer(c)
    setPhase('dijawab')
  }
  const next = () => {
    setAnswer(null)
    setI((n) => (n + 1) % CLAIMS.length)
    setPhase('mengetik')
  }

  return (
    <div ref={root} className="lg-page">
      <section className="lg-form" aria-labelledby="lg-h">
        <Link to="/" className="lg-logo" aria-label="ADAPTIA, ke beranda">
          <BobyMark className="lg-mark" />ADAPTIA<span className="lg-dot">.</span>
        </Link>

        <div className="lg-form-body">
          <h1 id="lg-h" data-in>{daftar ? <>Daftar untuk<br />mulai mengajar.</> : <>Masuk untuk<br />mulai mengajar.</>}</h1>
          <p className="lg-lede" data-in>Mahasiswa menjelaskan konsep kepada Boby. Dosen meninjau alasan di balik jawabannya.</p>

          <div className="lg-switch" role="group" aria-label="Pilih masuk atau daftar" data-in>
            {([['masuk', 'Masuk'], ['daftar', 'Daftar']] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={daftar === (k === 'daftar')}
                className={daftar === (k === 'daftar') ? 'on' : ''}
                onClick={() => { setDaftar(k === 'daftar'); setNote(null) }}>{l}</button>
            ))}
          </div>

          <form
            data-in
            className="lg-fields"
            onSubmit={(e) => {
              e.preventDefault()
              setNote(daftar
                ? 'Purwarupa: pendaftaran belum terhubung ke data kampus. Gunakan salah satu akun demo di bawah.'
                : 'Purwarupa: akun kampus belum terhubung. Gunakan salah satu akun demo di bawah.')
            }}
          >
            {daftar && <>
              <label htmlFor="lg-nama">Nama lengkap</label>
              <input id="lg-nama" name="name" autoComplete="name" placeholder="Nadia Rahmawati" required />

              <label htmlFor="lg-peran">Saya mendaftar sebagai</label>
              <select id="lg-peran" name="role" value={peran} onChange={(e) => setPeran(e.target.value as 'mahasiswa' | 'dosen')}>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
              </select>
            </>}

            <label htmlFor="lg-email">Email kampus</label>
            <input id="lg-email" type="email" name="email" autoComplete={daftar ? 'email' : 'username'} placeholder="nama@kampus.ac.id" required />

            <label htmlFor="lg-pass">Kata sandi</label>
            <div className="lg-pass">
              <input id="lg-pass" type={show ? 'text' : 'password'} name="password" autoComplete={daftar ? 'new-password' : 'current-password'} placeholder={daftar ? 'Minimal 8 karakter' : 'Kata sandi Anda'} minLength={daftar ? 8 : undefined} required />
              <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {daftar && <>
              <label htmlFor="lg-pass2">Ulangi kata sandi</label>
              <input id="lg-pass2" type={show ? 'text' : 'password'} name="confirm" autoComplete="new-password" placeholder="Ketik ulang kata sandi" minLength={8} required />
            </>}

            <button className="lg-primary" type="submit">{daftar ? 'Daftar' : 'Masuk'}<ArrowRight size={18} /></button>
            {note && <p className="lg-note" role="status">{note}</p>}
          </form>

          <p className="lg-swap" data-in>
            {daftar ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button type="button" onClick={() => { setDaftar(!daftar); setNote(null) }}>{daftar ? 'Masuk di sini' : 'Daftar di sini'}</button>
          </p>

          <div className="lg-or" data-in><span>atau coba tanpa akun</span></div>

          <div className="lg-demos" data-in>
            <button className="lg-demo" disabled={demoBusy} onClick={() => void openDemo('mahasiswa')}>
              <GraduationCap size={21} strokeWidth={1.75} aria-hidden="true" />
              <span><strong>Demo sebagai mahasiswa</strong>Kerjakan sesi dan ajari Boby</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="lg-demo" disabled={demoBusy} onClick={() => void openDemo('dosen')}>
              <Presentation size={21} strokeWidth={1.75} aria-hidden="true" />
              <span><strong>Demo sebagai dosen</strong>Tinjau bukti dan tentukan pendampingan</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <p className="lg-foot" data-in>Purwarupa dengan data contoh. Seluruh nama dan hasil adalah data contoh.</p>
        </div>
      </section>

      <section className="lg-stage" aria-label="Boby, murid AI yang sengaja keliru">
        <div className="lg-stage-in" data-stage>
          <p className="lg-stage-label">Boby sudah menunggu</p>

          <div className="lg-bubble">
            <span className="lg-topic">{claim.topic}</span>
            {phase === 'mengetik'
              ? <p className="lg-typing" aria-label="Boby sedang menyusun kalimat"><i /><i /><i /></p>
              : <p className="lg-say" data-say>“{claim.text}”</p>}
          </div>

          <div className="lg-boby">
            <div data-mood><div className="lg-float"><Boby look={!calm} /></div></div>
          </div>

          {phase === 'bertanya' && (
            <div className="lg-answers">
              {(['Setuju', 'Tidak setuju'] as const).map((c) => (
                <button key={c} onClick={() => respond(c)}>{c}</button>
              ))}
            </div>
          )}

          {phase === 'dijawab' && (
            <div className="lg-verdict" data-verdict role="status">
              <strong>{answer === 'Tidak setuju' ? 'Itu yang dicari ADAPTIA.' : 'Boby senang disetujui.'}</strong>
              <p>{answer === 'Tidak setuju' ? claim.wrongBecause + ' Alasan seperti inilah yang dibaca dosen.' : 'Pernyataan tadi keliru: ' + claim.wrongBecause}</p>
              <button onClick={next}>Pernyataan berikutnya <ArrowRight size={16} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
