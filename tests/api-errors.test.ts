import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiRequestError, bobyRecovery } from '../src/lib/api-errors.ts'

test('confirmed Boby service failure may retry the same answer', () => {
  const error = new ApiRequestError(503, 'boby_unavailable', 'Boby belum bisa merespons.')
  assert.equal(bobyRecovery(error), 'retry')
  assert.equal(error.status, 503)
  assert.equal(error.code, 'boby_unavailable')
})

test('lost network response requires reloading server state before resending', () => {
  assert.equal(bobyRecovery(new Error('Tidak dapat terhubung')), 'reload')
})

test('missing lecturer trap is a configuration problem, not a retry', () => {
  assert.equal(bobyRecovery(new ApiRequestError(409, 'trap_missing', 'Pernyataan uji belum tersedia.')), 'none')
})
