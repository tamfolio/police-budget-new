import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { budgetCodeService, type CreateBudgetCodePayload } from '../api/services/budgetCodeService'
import { getErrorMessage } from '../utils/errorHandlers'

const QK = 'budget-codes'

export const useBudgetCodes = (search?: string) =>
  useQuery({
    queryKey: [QK, search],
    queryFn: () => budgetCodeService.getAll(search),
    select: (res) => res.data.data,
  })

export const useBudgetReference = (search?: string) =>
  useQuery({
    queryKey: [QK, 'reference', search],
    queryFn: () => budgetCodeService.getReference(search),
    select: (res) => res.data.data,
    staleTime: 10 * 60 * 1000,
  })

export const useCreateBudgetCode = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBudgetCodePayload) => budgetCodeService.create(payload),
    onSuccess: () => { toast.success('Budget code created'); qc.invalidateQueries({ queryKey: [QK] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSeedBudgetCodes = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: budgetCodeService.seedAll,
    onSuccess: () => { toast.success('Budget codes seeded'); qc.invalidateQueries({ queryKey: [QK] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useUpdateFiscalYearStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, status }: { year: number; status: 'open' | 'closed' }) =>
      budgetCodeService.updateFiscalYearStatus(year, status),
    onSuccess: () => { toast.success('Fiscal year status updated'); qc.invalidateQueries({ queryKey: [QK] }) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
