import apiClient from '../client'
import { REPORTS } from '../endpoints'

export type ReportView = 'monthly-release' | 'line-item' | 'distribution' | 'aie'

export interface GetReportParams {
  view: ReportView
  state?: string
  formation?: string
  budgetCode?: string
  from?: string
  to?: string
}

export interface GetReportCardsParams {
  month?: number
  year?: number
}

export const reportService = {
  getCards: (params?: GetReportCardsParams) => apiClient.get(REPORTS.CARDS, { params }),
  getReport: (params: GetReportParams) => apiClient.get(REPORTS.LIST, { params }),
}
