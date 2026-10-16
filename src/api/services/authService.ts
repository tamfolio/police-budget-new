import apiClient from '../client'
import { AUTH } from '../endpoints'

export interface LoginPayload {
  email: string
  password: string
}

// API expects { email, fullName, roleId } not { email, firstName, lastName }
export interface InviteUsersPayload {
  email: string
  fullName: string
  roleId?: string
}

export const authService = {
  login: (payload: LoginPayload) => apiClient.post(AUTH.LOGIN, payload),
  logout: () => apiClient.post(AUTH.LOGOUT),
  refresh: (refreshToken: string) => apiClient.post(AUTH.REFRESH, { refreshToken }),
  getMe: () => apiClient.get(AUTH.ME),
  updatePassword: (password: string) => apiClient.post(AUTH.UPDATE_PASSWORD, { password }),
  invite: (users: InviteUsersPayload[]) => apiClient.post(AUTH.INVITE, users),
}
