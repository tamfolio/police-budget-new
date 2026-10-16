import type { AxiosError } from 'axios'

export const getErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError & { apiMessage?: string }

  if (axiosError.apiMessage) return axiosError.apiMessage
  if (axiosError.message) return axiosError.message
  return 'An unexpected error occurred'
}
