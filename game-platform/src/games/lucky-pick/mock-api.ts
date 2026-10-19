import { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import { randomIndex } from '../../utils/random.ts'
import { selectWeightedItem } from '../../utils/weighted-random.ts'
import { DEMO_PICK } from './config.ts'
import type { PickConfig, PickResult } from './contracts.ts'
import { validatePickConfig } from './rules.ts'

export function createPickMockAdapter(config: PickConfig = DEMO_PICK, roll = () => randomIndex(1000000) / 10000): AxiosAdapter {
  validatePickConfig(config)
  let remainingTurns = config.initialTurns
  let totalPoints = 0
  const history = new Map<string, PickResult>()
  return async request => {
    const response = (data: unknown, status = 200) => ({
      data: structuredClone(data), status, statusText: String(status), headers: {}, config: request,
    })
    const fail = (message: string, status: number): never => {
      throw new AxiosError(message, 'ERR_BAD_REQUEST', request, undefined, response({ message }, status))
    }
    if (request.method === 'get' && request.url === '/games/lucky-pick') return response(config)
    if (request.method !== 'post' || request.url !== '/games/lucky-pick/plays') return fail('Unknown endpoint.', 404)
    const body = typeof request.data === 'string' ? JSON.parse(request.data) : request.data
    const requestId: unknown = body?.requestId
    const cardIndex = body?.cardIndex
    if (typeof requestId !== 'string' || !requestId.trim()
      || !Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= config.display.cardCount) {
      return fail('Invalid requestId or cardIndex.', 400)
    }
    const previous = history.get(requestId)
    if (previous) {
      if (previous.cardIndex !== cardIndex) return fail('Request ID already used for a different card.', 409)
      return response(previous)
    }
    if (remainingTurns === 0) return fail('No demo turns remaining.', 409)
    const reward = selectWeightedItem(config.rewards, roll())
    const pointsAdded = reward.type === 'POINT' ? reward.value : 0
    totalPoints += pointsAdded
    remainingTurns--
    const result: PickResult = { playId: requestId, cardIndex, reward, pointsAdded, totalPoints, remainingTurns }
    history.set(requestId, result)
    return response(result, 201)
  }
}
