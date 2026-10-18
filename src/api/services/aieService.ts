import apiClient from '../client'
import { AIE } from '../endpoints'
import type { ReviewPayload, RejectPayload } from '../../types'

export interface AieCreateLineItem {
  itemCode: string
  subItemCode: string
  amount: number
}

export interface CreateAIEPayload {
  fiscalYear: number
  aieNo: string
  issueDate: string
  expiresOn?: string
  recipientUnit: string
  lineItems: AieCreateLineItem[]
  notes?: string
}

export interface UpdateAIEPayload {
  fiscalYear?: number
  aieNo?: string
  issueDate?: string
  expiresOn?: string
  recipientUnit?: string
  lineItems?: AieCreateLineItem[]
  notes?: string
}

export interface GetAIEsParams {
  fiscalYear?: number
  status?: string
  createdById?: string
  expiringBefore?: string
}

export interface AIEReportParams {
  fiscalYear?: number
  budgetCode?: string
}

export interface AIEImportPayload {
  file: File;
  fiscalYear: number;
  action: 'append' | 'correction' | 'replace';
  confirmReplacement?: boolean;
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
    apiClient.post(AIE.IMPORTS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  replaceAIE: (formData: FormData) =>
    apiClient.post(AIE.IMPORTS_REPLACE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getImport: (importId: string) => apiClient.get(AIE.GET_IMPORT(importId)),
  getImports: (status?: string) => apiClient.get(AIE.IMPORTS_LIST, { params: status ? { status } : undefined }),
  approveImport: (importId: string) => apiClient.post(AIE.APPROVE_IMPORT(importId)),
  rejectImport: (importId: string, reason: string) => apiClient.post(AIE.REJECT_IMPORT(importId), { reason }),
  getCodeActuals: (code: string, fiscalYear: number) =>
    apiClient.get(AIE.BUDGET_CODE_ACTUALS(encodeURIComponent(code)), { params: { fiscalYear } }),
}
