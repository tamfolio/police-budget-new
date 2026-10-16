import apiClient from '../client'
import { AIE } from '../endpoints'
import type { ReviewPayload, RejectPayload } from '../../types'

export interface CreateAIEPayload {
  fiscalYear: number
  notes?: string
}

export interface UpdateAIEPayload {
  notes?: string
}

export interface GetAIEsParams {
  fiscalYear?: number
  status?: string
}

export interface AIEReportParams {
  fiscalYear?: number
  budgetCode?: string
}

export const aieService = {
  getAll: (params?: GetAIEsParams) => apiClient.get(AIE.LIST, { params }),
  getById: (id: string) => apiClient.get(AIE.GET(id)),
  getTotals: (fiscalYear: number) => apiClient.get(AIE.TOTALS(fiscalYear)),
  getReviewQueue: () => apiClient.get(AIE.QUEUE_REVIEW),
  getApprovalQueue: () => apiClient.get(AIE.QUEUE_APPROVAL),
  getLineItems: (id: string) => apiClient.get(AIE.LINE_ITEMS(id)),
  getReport: (params?: AIEReportParams) => apiClient.get(AIE.REPORT, { params }),
  create: (payload: CreateAIEPayload) => apiClient.post(AIE.CREATE, payload),
  update: (id: string, payload: UpdateAIEPayload) => apiClient.patch(AIE.UPDATE(id), payload),
  delete: (id: string) => apiClient.delete(AIE.DELETE(id)),
  submit: (id: string) => apiClient.patch(AIE.SUBMIT(id)),
  review: (id: string, payload?: ReviewPayload) => apiClient.patch(AIE.REVIEW(id), payload),
  approve: (id: string) => apiClient.patch(AIE.APPROVE(id)),
  reject: (id: string, payload: RejectPayload) => apiClient.patch(AIE.REJECT(id), payload),
  reopen: (id: string) => apiClient.patch(AIE.REOPEN(id)),
  seed: () => apiClient.post(AIE.SEED),
  importAIE: (formData: FormData) =>
    apiClient.post(AIE.IMPORTS, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  replaceAIE: (formData: FormData) =>
    apiClient.post(AIE.IMPORTS_REPLACE, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getImport: (importId: string) => apiClient.get(AIE.GET_IMPORT(importId)),
  approveImport: (importId: string) => apiClient.post(AIE.APPROVE_IMPORT(importId)),
}
