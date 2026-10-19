import apiClient from '../client'
import { ADMIN, ROLES } from '../endpoints'

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
}

export interface GetRolesParams {
  pageNumber?: number
  pageSize?: number
  search?: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  permissions?: string[]
}

export interface CreatePermissionPayload {
  code: string
  name: string
}

export const adminService = {
  // Users — note: GET /admin/users uses ?page&limit (not pageNumber/pageSize)
  getUsers: (params?: GetUsersParams) => apiClient.get(ADMIN.USERS, { params }),
  getUser: (id: string) => apiClient.get(ADMIN.GET_USER(id)),
  updateUser: (id: string, payload: Record<string, unknown>) => apiClient.patch(ADMIN.UPDATE_USER(id), payload),
  deactivateUser: (id: string) => apiClient.post(ADMIN.DEACTIVATE_USER(id)),
  setUserActiveStatus: (id: string, isActive: boolean) => apiClient.patch(ADMIN.SET_USER_STATUS(id), { isActive }),
  softDeleteUser: (id: string) => apiClient.delete(ADMIN.SOFT_DELETE_USER(id)),

  // Roles
  getRoles: (params?: GetRolesParams) => apiClient.get(ROLES.LIST, { params }),
  getRole: (id: string) => apiClient.get(ROLES.GET(id)),
  createRole: (payload: CreateRolePayload) => apiClient.post(ROLES.CREATE, payload),
  updateRole: (id: string, payload: UpdateRolePayload) => apiClient.patch(ROLES.UPDATE(id), payload),
  deleteRole: (id: string) => apiClient.delete(ROLES.DELETE(id)),
  assignRole: (roleId: string, userId: string) => apiClient.post(ROLES.ASSIGN(roleId), { userId }),

  // Permissions
  getPermissions: (params?: GetRolesParams) => apiClient.get(ROLES.PERMISSIONS, { params }),
  createPermission: (payload: CreatePermissionPayload) => apiClient.post(ROLES.CREATE_PERMISSION, payload),
}
