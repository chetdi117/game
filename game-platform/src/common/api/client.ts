import { createApiClient } from './create-api-client.ts'

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})
