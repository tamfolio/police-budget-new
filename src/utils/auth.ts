export const getAuthToken = (): string | null => localStorage.getItem('authToken')

export const getUserData = <T = unknown>(): T | null => {
  const raw = localStorage.getItem('userData')
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  const token = getAuthToken()
  const userData = localStorage.getItem('userData')
  return Boolean(token && userData)
}

export const logout = (): void => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenExpiresAt')
  localStorage.removeItem('userData')
}

export const setAuthData = (token: string, refreshToken: string, userData: unknown, expiresAt?: string): void => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('userData', JSON.stringify(userData))
  if (expiresAt) localStorage.setItem('tokenExpiresAt', expiresAt)
}
