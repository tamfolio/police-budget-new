import apiClient from '../client'
import { DEPARTMENTS } from '../endpoints'
import type { CreateDepartmentPayload } from '../../types'

export const departmentService = {
  getAll: () => apiClient.get(DEPARTMENTS.LIST),
  getById: (id: string) => apiClient.get(DEPARTMENTS.GET(id)),
  create: (payload: CreateDepartmentPayload) => apiClient.post(DEPARTMENTS.CREATE, payload),
  update: (id: string, payload: Partial<CreateDepartmentPayload>) =>
    apiClient.patch(DEPARTMENTS.UPDATE(id), payload),
  deactivate: (id: string) => apiClient.patch(DEPARTMENTS.DEACTIVATE(id)),
}
