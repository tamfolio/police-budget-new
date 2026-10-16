import apiClient from '../client'
import { SCHOOLS, ZONES, FORMATIONS, EXPENDITURE_ITEMS } from '../endpoints'

export const schoolService = {
  getAll: () => apiClient.get(SCHOOLS.LIST),
  create: (payload: { name: string; zoneId?: string }) => apiClient.post(SCHOOLS.CREATE, payload),
}

export const zoneService = {
  getAll: () => apiClient.get(ZONES.LIST),
  create: (payload: { name: string; code?: string }) => apiClient.post(ZONES.CREATE, payload),
}

export const formationService = {
  getAll: () => apiClient.get(FORMATIONS.LIST),
  create: (payload: { name: string; zoneId?: string }) => apiClient.post(FORMATIONS.CREATE, payload),
}

export const expenditureItemService = {
  getAll: () => apiClient.get(EXPENDITURE_ITEMS.LIST),
  create: (payload: { name: string; code: string }) => apiClient.post(EXPENDITURE_ITEMS.CREATE, payload),
}
