export type Role = 'mahasiswa' | 'dosen'
export type ApiStatus = 'terpenuhi' | 'sebagian' | 'belum' | 'ambigu'
export type Turn = { who: 'boby' | 'mhs'; text: string; trap?: boolean; choice?: 'Setuju' | 'Tidak setuju'; time?: string }
export type ApiSession = { id: string; title: string; classId: string; type: string; format: string; due: string; state: string; attempt?: { id: string; state: string; score: number | null } | null }
export type SessionDetail = ApiSession & { instruction: string; goal: string; indicators: {id:string; name:string; concept:string; weight:number}[]; penerapan: string[] }
export type Finding = { indicator:string; status:ApiStatus; aiStatus:ApiStatus; verified:boolean; stage:'praktik'|'reverse_tutor'|'penerapan'; quote:string; reason:string }
export type Attempt = { id:string; state:string; code:string; explain:string; dialog:Turn[]; answers:string[]; findings:Finding[]; decisions:Record<string,'accept'|'correct'|'reject'>; corrections:Record<string,ApiStatus>; note:string; score:number|null; pending:number; student:{id:string;name:string;nim:string}; indicators:SessionDetail['indicators']; transcript:string; reviewedAt:string|null; analyst?:string|null }
export type RosterRow = {id:string; name:string; nim:string; state:'perlu'|'selesai'|'kurang'|'belum'; attemptId:string|null; score:number|null; pending:number; statuses:Record<string,ApiStatus>}
export type Roster = {rows:RosterRow[]; summary:{perlu:number;selesai:number;kurang:number;belum:number;pendingFindings:number;avg:number|null}}
export type TurnResult = {turn:Turn|null; done:boolean; mode:'live'|'scripted'; usedFallback:boolean}

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const tokenKey = (role:Role) => 'adaptia-api-token-' + role
const loginPending:Partial<Record<Role,Promise<string>>> = {}
const startPending:Record<string,Promise<{attemptId:string;resumed:boolean}>> = {}

async function request<T>(path:string, options:RequestInit = {}, token?:string):Promise<T> {
  let response:Response
  try {
    response = await fetch(base + path, { ...options, headers: { 'Content-Type':'application/json', ...(token ? {Authorization:'Bearer '+token} : {}), ...options.headers } })
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan dan coba lagi.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) { sessionStorage.removeItem(tokenKey('mahasiswa')); sessionStorage.removeItem(tokenKey('dosen')) }
    throw new Error(body?.error?.message || `Permintaan gagal (${response.status}).`)
  }
  return body as T
}
export async function login(role:Role):Promise<string> {
  const existing = sessionStorage.getItem(tokenKey(role))
  if (existing) return existing
  if (!loginPending[role]) loginPending[role] = request<{token:string}>('/auth/demo', {method:'POST',body:JSON.stringify({role})})
    .then(data => { sessionStorage.setItem(tokenKey(role),data.token); return data.token })
    .finally(() => { delete loginPending[role] })
  return loginPending[role]!
}
export async function api<T>(role:Role,path:string,options:RequestInit = {}):Promise<T> {
  return request<T>(path,options,await login(role))
}
export function json(method:'POST'|'PUT', body:unknown):RequestInit { return {method,body:JSON.stringify(body)} }
export function startAttempt(id:string) {
  if (!startPending[id]) startPending[id] = api<{attemptId:string;resumed:boolean}>('mahasiswa',`/sessions/${encodeURIComponent(id)}/attempts`,json('POST',{}))
    .finally(() => {delete startPending[id]})
  return startPending[id]
}
export function clearTokens() {sessionStorage.removeItem(tokenKey('mahasiswa'));sessionStorage.removeItem(tokenKey('dosen'))}
