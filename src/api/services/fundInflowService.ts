import apiClient from '../client'
import { FUND_INFLOWS } from '../endpoints'
import type { CreateFundInflowPayload, UpdateFundInflowPayload, GetFundInflowsParams, ReviewPayload, RejectPayload } from '../../types'

export const fundInflowService = {
  getAll: (params?: GetFundInflowsParams) => apiClient.get(FUND_INFLOWS.LIST, { params }),
  getById: (id: string) => apiClient.get(FUND_INFLOWS.GET(id)),
  getTotals: (fiscalYear: number) => apiClient.get(FUND_INFLOWS.TOTALS(fiscalYear)),
  getReviewQueue: () => apiClient.get(FUND_INFLOWS.QUEUE_REVIEW),
  getApprovalQueue: () => apiClient.get(FUND_INFLOWS.QUEUE_APPROVAL),
  create: (payload: CreateFundInflowPayload) => apiClient.post(FUND_INFLOWS.CREATE, payload),
  update: (id: string, payload: UpdateFundInflowPayload) => apiClient.patch(FUND_INFLOWS.UPDATE(id), payload),
  delete: (id: string) => apiClient.delete(FUND_INFLOWS.DELETE(id)),
  submit: (id: string) => apiClient.patch(FUND_INFLOWS.SUBMIT(id)),
  review: (id: string, payload?: ReviewPayload) => apiClient.patch(FUND_INFLOWS.REVIEW(id), payload),
  approve: (id: string) => apiClient.patch(FUND_INFLOWS.APPROVE(id)),
  reject: (id: string, payload: RejectPayload) => apiClient.patch(FUND_INFLOWS.REJECT(id), payload),
  reopen: (id: string) => apiClient.patch(FUND_INFLOWS.REOPEN(id)),
}
