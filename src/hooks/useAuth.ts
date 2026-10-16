import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../api/services/authService'
import { setAuthData, logout as clearAuth } from '../utils/auth'
import { queryClient } from '../config/queryClient.config'
import { getErrorMessage } from '../utils/errorHandlers'

export const useLogin = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      // API may nest under .data or return flat — handle both
      const payload = response.data?.data ?? response.data ?? {}
      const token: string = payload.token ?? payload.accessToken ?? payload.access_token ?? ''
      const refreshToken: string = payload.refreshToken ?? payload.refresh_token ?? ''
      const expiresAt: string | undefined = payload.expiresAt ?? payload.expires_at ?? payload.expiredAt
      const user = payload.user ?? payload.userData ?? payload.profile ?? {}

      if (!token) {
        toast.error('Login failed: no token received')
        console.error('Login response payload:', payload)
        return
      }

      setAuthData(token, refreshToken, user, expiresAt)
      toast.success('Login successful')
      navigate('/dashboard')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export const useLogout = () => {
  const navigate = useNavigate()

  return () => {
    authService.logout().catch(() => {})
    clearAuth()
    queryClient.clear()
    navigate('/login')
  }
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getMe(),
    select: (res) => res.data.data,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (password: string) => authService.updatePassword(password),
    onSuccess: () => toast.success('Password updated successfully'),
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export const useInviteUsers = () => {
  return useMutation({
    mutationFn: authService.invite,
    onSuccess: () => toast.success('Invitations sent'),
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}
