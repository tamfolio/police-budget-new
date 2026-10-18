import apiClient from '../client'
import { DISTRIBUTIONS } from '../endpoints'

export type DistributionView = 'zone' | 'formations' | 'schools' | 'summary'

export interface GetDistributionsParams {
  view: DistributionView
  periodId?: string
}

export interface ReturnDistributionPayload {
  remarks: string
}

export const distributionService = {
  getAll: (params: GetDistributionsParams) => apiClient.get(DISTRIBUTIONS.LIST, { params }),
  getTemplate: (view: DistributionView, periodId?: string) =>
    apiClient.get(DISTRIBUTIONS.TEMPLATE, { params: { view, ...(periodId ? { periodId } : {}) } }),
  getCsvTemplate: (view: DistributionView, periodId: string) =>
    apiClient.get(DISTRIBUTIONS.TEMPLATE_CSV, { params: { view, periodId }, responseType: 'blob' }),
  importCsv: (view: DistributionView, formData: FormData) =>
    apiClient.post(DISTRIBUTIONS.IMPORT_CSV, formData, {
      params: { view },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // reference endpoint does NOT take a view param
  getReference: () => apiClient.get(DISTRIBUTIONS.REFERENCE),
  create: (view: DistributionView, payload: Record<string, unknown>) =>
    apiClient.post(DISTRIBUTIONS.CREATE, payload, { params: { view } }),
  update: (periodId: string, view: DistributionView, payload: Record<string, unknown>) =>
    apiClient.patch(DISTRIBUTIONS.UPDATE(periodId), payload, { params: { view } }),
  delete: (periodId: string, view: DistributionView) =>
    apiClient.delete(DISTRIBUTIONS.DELETE(periodId), { params: { view } }),
  submit: (periodId: string) => apiClient.post(DISTRIBUTIONS.SUBMIT(periodId)),
  review: (periodId: string) => apiClient.post(DISTRIBUTIONS.REVIEW(periodId)),
  approve: (periodId: string) => apiClient.post(DISTRIBUTIONS.APPROVE(periodId)),
  return: (periodId: string, payload: ReturnDistributionPayload) =>
    apiClient.post(DISTRIBUTIONS.RETURN(periodId), payload),
  getAuditTrail: (periodId: string) => apiClient.get(DISTRIBUTIONS.AUDIT_TRAIL(periodId)),
  seedAll: () => apiClient.post(DISTRIBUTIONS.SEED),
}
