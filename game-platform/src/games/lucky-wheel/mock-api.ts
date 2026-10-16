import { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import { randomIndex } from '../../utils/random.ts'
import { DEMO_WHEEL } from './config.ts'
import type { WheelBlock, SpinResult } from './contracts.ts'

export function selectReward(blocks: readonly WheelBlock[], roll: number): WheelBlock {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 100
    || blocks.some(block => !Number.isFinite(block.probability) || block.probability < 0)
    || blocks.reduce((sum, block) => sum + block.probability, 0) !== 100) {
    throw new RangeError('Invalid reward probabilities or roll.')
  }
  let cumulative = 0
  for (const block of blocks) {
    cumulative += block.probability
    if (roll < cumulative) return block
  }
  throw new RangeError('No reward found.')
}

// Fake transport: each mounted game has its own demo balance and spin history.
export function createWheelMockAdapter(): AxiosAdapter {
  let totalPoints = 0
  let remainingSpins = 3
  const history = new Map<string, SpinResult>()
  const adapter: AxiosAdapter = async config => {
    const response = (data: unknown, status = 200) => ({
      data: structuredClone(data), status, statusText: String(status), headers: {}, config,
    })
    const fail = (message: string, status: number): never => {
      throw new AxiosError(message, 'ERR_BAD_REQUEST', config, undefined, response({ message }, status))
    }
    if (config.method === 'get' && config.url === '/games/lucky-wheel') return response(DEMO_WHEEL)
    if (config.method !== 'post' || config.url !== '/games/lucky-wheel/spins') return fail('Unknown endpoint', 404)
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    const requestId: unknown = body?.requestId
    if (typeof requestId !== 'string' || !requestId.trim()) return fail('requestId is required', 400)
    const previous = history.get(requestId)
    if (previous) return response(previous)
    if (remainingSpins === 0) return fail('No demo spins remaining.', 409)
    const reward = selectReward(DEMO_WHEEL.blocks, randomIndex(10000) / 100)
    const pointsAdded = reward.type === 'POINT' ? reward.value : 0
    totalPoints += pointsAdded
    remainingSpins--
    const result: SpinResult = { spinId: requestId, reward, pointsAdded, totalPoints, remainingSpins }
    history.set(requestId, result)
    return response(result, 201)
  }
  return adapter
}
