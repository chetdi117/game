import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { API_DEFAULTS } from '../../constants/api.ts'

interface ApiClientOptions {
  baseURL?: string
  timeout?: number
}

export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  return axios.create({
    baseURL: options.baseURL?.trim() || API_DEFAULTS.baseURL,
    timeout: options.timeout ?? API_DEFAULTS.timeout,
    headers: { Accept: 'application/json' },
  })
}
