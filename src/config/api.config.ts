export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL as string,

  REQUEST_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 120000,

  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  STALE_TIME: 5 * 60 * 1000,
  CACHE_TIME: 10 * 60 * 1000,

  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  MAX_FILE_SIZE: 10 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],

  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  REFRESH_INTERVALS: {
    DASHBOARD: 30000,
    NOTIFICATIONS: 60000,
  },
}

export default API_CONFIG
