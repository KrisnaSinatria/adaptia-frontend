export class ApiRequestError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

export function bobyRecovery(error: unknown): 'retry' | 'reload' | 'none' {
  if (error instanceof ApiRequestError && error.status === 503 && error.code === 'boby_unavailable') return 'retry'
  if (error instanceof ApiRequestError && error.code === 'trap_missing') return 'none'
  return 'reload'
}
