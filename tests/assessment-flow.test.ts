import test from 'node:test'
import assert from 'node:assert/strict'
import { canSubmitPractice } from '../src/lib/assessment-flow.ts'

test('practice retry cannot overwrite saved work with an incomplete answer', () => {
  assert.equal(canSubmitPractice('', 'Penjelasan cukup panjang untuk dikirim.'), false)
  assert.equal(canSubmitPractice('q.append("Ani")', 'Penjelasan cukup panjang untuk dikirim.'), false)
  assert.equal(canSubmitPractice('q.append("Ani"); q.popleft()', 'terlalu singkat'), false)
  assert.equal(canSubmitPractice('q.append("Ani"); q.popleft()', 'Ani dilayani sebelum peserta lain.'), true)
})
