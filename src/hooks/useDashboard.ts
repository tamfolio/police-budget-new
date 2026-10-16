import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../api/services/dashboardService'

const extractData = (res: { data: unknown }) => {
  const d = res.data as Record<string, unknown>
  const inner = (d?.data ?? d) as Record<string, unknown>
  if (import.meta.env.DEV) console.log('[Dashboard raw response]', inner)
  return inner
}

export const useDashboardCards = (month?: number) =>
  useQuery({
    queryKey: ['dashboard', 'cards', month],
    queryFn: () => dashboardService.getCards(month),
    select: extractData,
    staleTime: 30_000,
  })

export const useInflowVsExpenditureChart = (year?: number) =>
  useQuery({
    queryKey: ['dashboard', 'chart', year],
    queryFn: () => dashboardService.getInflowVsExpenditureChart(year),
    select: extractData,
    staleTime: 30_000,
  })
