import { QueryClient } from '@tanstack/react-query'
import API_CONFIG from './api.config'
import type { AxiosError } from 'axios'

const defaultQueryOptions = {
  staleTime: API_CONFIG.STALE_TIME,
  gcTime: API_CONFIG.CACHE_TIME,
  retry: (failureCount: number, error: unknown) => {
    const axiosError = error as AxiosError
    if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
      return false
    }
    return failureCount < API_CONFIG.MAX_RETRIES
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
}

const defaultMutationOptions = {
  retry: (failureCount: number, error: unknown) => {
    const axiosError = error as AxiosError
    if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
      return false
    }
    return failureCount < 1
  },
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
    mutations: defaultMutationOptions,
  },
})

export const QUERY_PATTERNS = {
  invalidateUser: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  invalidateAuth: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  clearAll: () => queryClient.clear(),
  removeQueries: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
}

export default queryClient
