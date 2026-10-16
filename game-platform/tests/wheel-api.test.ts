import test from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { createWheelMockAdapter, selectReward } from '../src/games/lucky-wheel/mock-api.ts'
import { DEMO_WHEEL } from '../src/games/lucky-wheel/config.ts'

test('weighted boundaries match all five rewards', () => {
  for (const [roll, id] of [[0,101],[39.99,101],[40,102],[64.99,102],[65,103],[75,104],[80,105],[99.99,105]]) {
    assert.equal(selectReward(DEMO_WHEEL.blocks, roll).id, id)
  }
  assert.throws(() => selectReward(DEMO_WHEEL.blocks, 100), RangeError)
  assert.throws(() => selectReward([], 0), RangeError)
})

test('fake API returns config, updates balance once per request and limits spins', async () => {
  const client = axios.create({ adapter: createWheelMockAdapter() })
  assert.deepEqual((await client.get('/games/lucky-wheel')).data, DEMO_WHEEL)
  let expectedPoints = 0
  for (let i = 0; i < 3; i++) {
    const result = (await client.post('/games/lucky-wheel/spins', { requestId: String(i) })).data
    expectedPoints += result.reward.type === 'POINT' ? result.reward.value : 0
    assert.equal(result.totalPoints, expectedPoints)
    assert.equal(result.remainingSpins, 2 - i)
    assert.deepEqual((await client.post('/games/lucky-wheel/spins', { requestId: String(i) })).data, result)
  }
  await assert.rejects(client.post('/games/lucky-wheel/spins', { requestId: 'extra' }), error => axios.isAxiosError(error) && error.response?.status === 409)
})
