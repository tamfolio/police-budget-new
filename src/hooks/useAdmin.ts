import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService, type GetUsersParams, type GetRolesParams, type CreateRolePayload, type UpdateRolePayload, type CreatePermissionPayload } from '../api/services/adminService'
import { getErrorMessage } from '../utils/errorHandlers'
import type { Permission } from '../types'

export const useUsers = (params?: GetUsersParams) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
    // API returns { data: { users: [...], pagination: {...} } }
    select: (res) => res.data?.data as { users: import('../types').User[]; pagination: Record<string, unknown> } | undefined,
  })

export const useAdminUsers = useUsers

export const useUpdateUserRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUser(userId, { role }),
    onSuccess: () => { toast.success('User role updated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeactivateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateUser(id),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSetUserActiveStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.setUserActiveStatus(userId, isActive),
    onSuccess: (_data, variables) => {
      toast.success(variables.isActive ? 'User activated' : 'User deactivated')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSoftDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminService.softDeleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted; historical records were retained')
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useRoles = (params?: GetUsersParams) =>
  useQuery({
    queryKey: ['roles', params],
    queryFn: () => adminService.getRoles(params),
    // API returns { data: { roles: [...], pagination: {...} } }
    select: (res) => res.data?.data as { roles: import('../types').Role[]; pagination: Record<string, unknown> } | undefined,
  })

export const useRole = (id: string) =>
  useQuery({
    queryKey: ['roles', id],
    queryFn: () => adminService.getRole(id),
    select: (res) => res.data.data,
    enabled: Boolean(id),
  })

export const usePermissions = () =>
  useQuery({
    queryKey: ['permissions'],
    queryFn: () => adminService.getPermissions({ pageSize: 200, pageNumber: 1 } as GetRolesParams),
    select: (res) => {
      const d = res.data as Record<string, unknown>
      const inner = (d?.data ?? d) as Record<string, unknown>
      return (Array.isArray(inner) ? inner : (inner?.permissions ?? [])) as Permission[]
    },
    staleTime: 5 * 60 * 1000,
  })

export const useCreateRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => adminService.createRole(payload),
    onSuccess: () => { toast.success('Role created'); qc.invalidateQueries({ queryKey: ['roles'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useUpdateRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      adminService.updateRole(id, payload),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['roles'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeleteRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteRole(id),
    onSuccess: () => { toast.success('Role deleted'); qc.invalidateQueries({ queryKey: ['roles'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useAssignRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      adminService.assignRole(roleId, userId),
    onSuccess: () => { toast.success('Role assigned'); qc.invalidateQueries({ queryKey: ['admin'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useCreatePermission = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => adminService.createPermission(payload),
    onSuccess: () => { toast.success('Permission created'); qc.invalidateQueries({ queryKey: ['permissions'] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
