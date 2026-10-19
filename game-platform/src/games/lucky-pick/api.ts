import { apiClient } from '../../common/api/client.ts'
import type { PickConfig, PickResult } from './contracts.ts'
import { createPickMockAdapter } from './mock-api.ts'

export function createPickApi() {
  const adapter = createPickMockAdapter()
  return {
    async getConfig(signal: AbortSignal): Promise<PickConfig> {
      const { data } = await apiClient.get<PickConfig>('/games/lucky-pick', { signal, adapter })
      return data
    },
    async play(requestId: string, cardIndex: number, signal: AbortSignal): Promise<PickResult> {
      const { data } = await apiClient.post<PickResult>(
        '/games/lucky-pick/plays', { requestId, cardIndex }, { signal, adapter },
      )
      return data
    },
  }
}
