import apiClient from '../client'
import { EXPENDITURES } from '../endpoints'

export type ExpenditureView = 'sub-item' | 'distribution' | 'aie'
export type ExpenditureDistributionView = 'zone' | 'formations' | 'schools' | 'summary'

export interface GetExpendituresParams {
  view: ExpenditureView
  distributionView?: ExpenditureDistributionView
  status?: string
  fiscalYear?: number
}

export interface CreateExpenditurePayload {
  fiscalYear: number
  expenseDate: string
  voucherNo: string
  payee: string
  subItemCode: string
  aieId?: string
  grossAmount: number
  whtAmount?: number
  description?: string
}

export const expenditureService = {
  getAll: (params: GetExpendituresParams) => apiClient.get(EXPENDITURES.LIST, { params }),
  getOne: (id: string) => apiClient.get(EXPENDITURES.GET(id)),
  create: (payload: CreateExpenditurePayload) => apiClient.post(EXPENDITURES.CREATE, payload),
  update: (id: string, payload: Partial<CreateExpenditurePayload>) => apiClient.patch(EXPENDITURES.UPDATE(id), payload),
  delete: (id: string) => apiClient.delete(EXPENDITURES.DELETE(id)),
  submit: (id: string) => apiClient.post(EXPENDITURES.SUBMIT(id)),
  review: (id: string) => apiClient.post(EXPENDITURES.REVIEW(id)),
  approve: (id: string) => apiClient.post(EXPENDITURES.APPROVE(id)),
  return: (id: string, remarks: string) => apiClient.post(EXPENDITURES.RETURN(id), { remarks }),
  getAuditTrail: (id: string) => apiClient.get(EXPENDITURES.AUDIT_TRAIL(id)),
}
