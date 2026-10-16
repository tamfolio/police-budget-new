import apiClient from '../client'
import { DASHBOARD } from '../endpoints'

export const dashboardService = {
  // API expects ?month (1-12), not fiscalYear
  getCards: (month?: number) =>
    apiClient.get(DASHBOARD.CARDS, { params: month ? { month } : undefined }),
  // API expects ?year, not fiscalYear
  getInflowVsExpenditureChart: (year?: number) =>
    apiClient.get(DASHBOARD.INFLOW_VS_EXPENDITURE, { params: year ? { year } : undefined }),
}
