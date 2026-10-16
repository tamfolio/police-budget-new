import apiClient from '../client'
import { CAPITAL_BUDGET } from '../endpoints'
import type { CreateCapitalBudgetItemPayload, GetCapitalBudgetItemsParams } from '../../types'

export const capitalBudgetService = {
  getAll: (params?: GetCapitalBudgetItemsParams) =>
    apiClient.get(CAPITAL_BUDGET.LIST, { params }),

  getById: (id: string) =>
    apiClient.get(CAPITAL_BUDGET.GET(id)),

  create: (payload: CreateCapitalBudgetItemPayload) =>
    apiClient.post(CAPITAL_BUDGET.CREATE, payload),

  update: (id: string, payload: Partial<CreateCapitalBudgetItemPayload>) =>
    apiClient.patch(CAPITAL_BUDGET.UPDATE(id), payload),

  delete: (id: string) =>
    apiClient.delete(CAPITAL_BUDGET.DELETE(id)),

  importPreview: (formData: FormData) =>
    apiClient.post(CAPITAL_BUDGET.IMPORT_PREVIEW, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  importCommit: (rows: unknown[], fileName?: string) =>
    apiClient.post(CAPITAL_BUDGET.IMPORT_COMMIT, { rows, ...(fileName ? { fileName } : {}) }),
}
