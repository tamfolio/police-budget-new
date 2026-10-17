import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG } from '../config/api.config'

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface QueueItem {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
})

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

const redirectToLogin = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenExpiresAt')
  localStorage.removeItem('userData')

  if (window.location.pathname !== '/login') {
    const currentPath = window.location.pathname + window.location.search
    window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`
  }
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (import.meta.env.MODE === 'development') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
      })
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      })
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest

    if (import.meta.env.MODE === 'development') {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: (error.response?.data as Record<string, unknown>)?.message ?? error.message,
      })
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, { refreshToken })

        const payload = response.data?.data ?? response.data ?? {}
        const newToken: string = payload.token ?? payload.accessToken ?? payload.access_token ?? ''

        if (newToken) {
          const expiresAt = payload.expiresAt ?? payload.expires_at
          localStorage.setItem('authToken', newToken)
          if (expiresAt) localStorage.setItem('tokenExpiresAt', expiresAt)

          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }

        throw new Error('Token refresh failed')
      } catch (refreshError) {
        processQueue(refreshError, null)
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Attach API error message for easy access in catch blocks
    const responseData = error.response?.data as Record<string, unknown> | undefined
    const apiMessage =
      responseData?.message ??
      (responseData?.error as Record<string, unknown> | undefined)?.message ??
      error.message

    ;(error as AxiosError & { apiMessage: unknown }).apiMessage = apiMessage
    if ((error.response?.data as Record<string, unknown>)?.message) {
      error.message = String((error.response!.data as Record<string, unknown>).message)
    }

    return Promise.reject(error)
  },
)

export default apiClient
