import apiClient from '../client'
import { BUDGET_PROPOSALS } from '../endpoints'

export interface BudgetProposalLineItem {
  lineItemId: string
  subItemId: string
  amount: number
}

export interface CreateBudgetProposalPayload {
  fiscalYear: number
  departmentId: string
  justification: string
  items: BudgetProposalLineItem[]
  notes?: string
}

export interface UpdateBudgetProposalPayload {
  justification?: string
  items?: BudgetProposalLineItem[]
  notes?: string
}

export interface GetBudgetProposalsParams {
  fiscalYear?: number
  status?: string
  page?: number
  limit?: number
}

export interface WorkbookReconciliationPayload {
  actualAmount: number
  notes?: string
}

export const budgetProposalService = {
  getAll: (params?: GetBudgetProposalsParams) => apiClient.get(BUDGET_PROPOSALS.LIST, { params }),
  getById: (id: string) => apiClient.get(BUDGET_PROPOSALS.GET(id)),
  create: (payload: CreateBudgetProposalPayload) => apiClient.post(BUDGET_PROPOSALS.CREATE, payload),
  update: (id: string, payload: UpdateBudgetProposalPayload) =>
    apiClient.patch(BUDGET_PROPOSALS.UPDATE(id), payload),
  delete: (id: string) => apiClient.delete(BUDGET_PROPOSALS.DELETE(id)),
  submit: (id: string) => apiClient.post(BUDGET_PROPOSALS.SUBMIT(id)),
  review: (id: string) => apiClient.post(BUDGET_PROPOSALS.REVIEW(id)),
  approve: (id: string) => apiClient.post(BUDGET_PROPOSALS.APPROVE(id)),
  reject: (id: string, reason: string) => apiClient.post(BUDGET_PROPOSALS.REJECT(id), { reason }),
  getWorkbookReconciliations: (id: string) => apiClient.get(BUDGET_PROPOSALS.WORKBOOK_RECONCILIATIONS(id)),
  createWorkbookReconciliation: (id: string, payload: WorkbookReconciliationPayload) =>
    apiClient.post(BUDGET_PROPOSALS.WORKBOOK_RECONCILIATIONS(id), payload),
}
