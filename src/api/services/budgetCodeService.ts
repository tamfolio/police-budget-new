import apiClient from '../client'
import { BUDGET_CODES } from '../endpoints'

export interface CreateBudgetCodePayload {
  code: string
  name: string
  categoryCode?: string
  sort?: number
}

export const budgetCodeService = {
  getAll: (search?: string) => apiClient.get(BUDGET_CODES.LIST, { params: search ? { search } : undefined }),
  getReference: (search?: string) =>
    apiClient.get(BUDGET_CODES.REFERENCE, { params: search ? { search } : undefined }),
  create: (payload: CreateBudgetCodePayload) => apiClient.post(BUDGET_CODES.CREATE, payload),
  seedAll: () => apiClient.post(BUDGET_CODES.SEED),
  updateFiscalYearStatus: (year: number, status: 'open' | 'closed') =>
    apiClient.patch(BUDGET_CODES.FISCAL_YEAR_STATUS(year), { status }),
}
