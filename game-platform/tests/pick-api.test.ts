import test from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { createPickMockAdapter } from '../src/games/lucky-pick/mock-api.ts'
import { DEMO_PICK } from '../src/games/lucky-pick/config.ts'
import { selectWeightedItem } from '../src/utils/weighted-random.ts'

test('pick config controls displayed card count and weighted outcomes', async () => {
  const config = { ...DEMO_PICK, display: { cardCount: 9 } }
  const client = axios.create({ adapter: createPickMockAdapter(config) })
  assert.deepEqual((await client.get('/games/lucky-pick')).data, config)
  for (const [roll, id] of [[0,201],[24.99,201],[25,202],[35,203],[41,204],[44,205],[99.875,216],[99.99,216]]) {
    assert.equal(selectWeightedItem(config.rewards, roll).id, id)
  }
  for (const cardCount of [0, -1, 1.5, 13]) {
    assert.throws(() => createPickMockAdapter({ ...config, display: { cardCount } }), RangeError)
  }
})

test('pick POST awards once, keeps selected card and enforces remaining turns', async () => {
  const client = axios.create({ adapter: createPickMockAdapter(DEMO_PICK, () => 25) })
  for (let i = 0; i < 3; i++) {
    const body = { requestId: String(i), cardIndex: i }
    const result = (await client.post('/games/lucky-pick/plays', body)).data
    assert.equal(result.reward.id, 202)
    assert.equal(result.cardIndex, i)
    assert.equal(result.pointsAdded, 50)
    assert.equal(result.totalPoints, (i + 1) * 50)
    assert.equal(result.remainingTurns, 2 - i)
    assert.deepEqual((await client.post('/games/lucky-pick/plays', body)).data, result)
  }
  await assert.rejects(client.post('/games/lucky-pick/plays', { requestId: 'extra', cardIndex: 0 }),
    error => axios.isAxiosError(error) && error.response?.status === 409)
  await assert.rejects(client.post('/games/lucky-pick/plays', { requestId: '0', cardIndex: 1 }),
    error => axios.isAxiosError(error) && error.response?.status === 409)
})

test('voucher and nothing do not add points', async () => {
  for (const roll of [41, 44]) {
    const client = axios.create({ adapter: createPickMockAdapter(DEMO_PICK, () => roll) })
    const result = (await client.post('/games/lucky-pick/plays', { requestId: 'test', cardIndex: 0 })).data
    assert.equal(result.pointsAdded, 0)
    assert.equal(result.totalPoints, 0)
  }
})

test('invalid card indices never consume a turn; one-card config works', async () => {
  const client = axios.create({ adapter: createPickMockAdapter({ ...DEMO_PICK, display: { cardCount: 1 } }, () => 0) })
  for (const cardIndex of [-1, 1, 0.5, null]) {
    await assert.rejects(client.post('/games/lucky-pick/plays', { requestId: 'bad', cardIndex }),
      error => axios.isAxiosError(error) && error.response?.status === 400)
  }
  const result = (await client.post('/games/lucky-pick/plays', { requestId: 'ok', cardIndex: 0 })).data
  assert.equal(result.remainingTurns, 2)
  assert.equal(result.reward.id, 201)
})

test('canceled pick does not consume a turn', async () => {
  const client = axios.create({ adapter: createPickMockAdapter(DEMO_PICK) })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(client.post('/games/lucky-pick/plays', { requestId: 'cancel', cardIndex: 0 }, { signal: controller.signal }), axios.isCancel)
  const result = (await client.post('/games/lucky-pick/plays', { requestId: 'ok', cardIndex: 0 })).data
  assert.equal(result.remainingTurns, 2)
})

test('eight displayed cards can reveal any of the sixteen configured outcomes by weight', async () => {
  assert.equal(DEMO_PICK.rewards.length, 16)
  assert.equal(DEMO_PICK.display.cardCount, 8)
  assert.equal(DEMO_PICK.rewards.reduce((sum, reward) => sum + reward.probability, 0), 100)
  let cumulative = 0
  for (const reward of DEMO_PICK.rewards) {
    const roll = cumulative + reward.probability / 2
    cumulative += reward.probability
    const client = axios.create({ adapter: createPickMockAdapter(DEMO_PICK, () => roll) })
    const result = (await client.post('/games/lucky-pick/plays', { requestId: 'reveal', cardIndex: 5 })).data
    assert.equal(result.reward.id, reward.id)
  }
})

test('common outcomes total fifty percent and highest points are extremely rare', () => {
  const tenPoints = DEMO_PICK.rewards.find(reward => reward.id === 201)!
  const nothing = DEMO_PICK.rewards.find(reward => reward.type === 'NOTHING')!
  const points = DEMO_PICK.rewards.filter(reward => reward.type === 'POINT')
  const highest = points.reduce((best, reward) => reward.value > best.value ? reward : best)
  assert.equal(tenPoints.probability, 25)
  assert.equal(nothing.probability, 25)
  assert.equal(highest.value, 500)
  assert.equal(highest.probability, 0.125)
  assert.ok(points.every(reward => reward.probability >= highest.probability))
})
