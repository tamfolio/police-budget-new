import apiClient from '../client'
import { COMPARISONS } from '../endpoints'

export interface ZoneComparisonParams {
  periodId: string
  zoneAId: string
  zoneBId: string
}

export interface MonthOverMonthParams {
  fiscalYear: number
  month?: number
}

export interface BudgetVsActualParams {
  fiscalYear?: number
  periodId?: string
}

export const comparisonService = {
  // GET /comparisons/zones?periodId&zoneAId&zoneBId
  getZones: (params: ZoneComparisonParams) => apiClient.get(COMPARISONS.ZONES, { params }),
  // GET /comparisons/month-over-month?fiscalYear&month
  getMonthOverMonth: (params: MonthOverMonthParams) => apiClient.get(COMPARISONS.MONTH_OVER_MONTH, { params }),
  // GET /comparisons/budget-vs-actual?fiscalYear&periodId
  getBudgetVsActual: (params?: BudgetVsActualParams) => apiClient.get(COMPARISONS.BUDGET_VS_ACTUAL, { params }),
}
