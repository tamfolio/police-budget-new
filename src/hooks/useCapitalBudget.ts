import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { capitalBudgetService } from '../api/services/capitalBudgetService'
import { getErrorMessage } from '../utils/errorHandlers'
import type { CreateCapitalBudgetItemPayload, GetCapitalBudgetItemsParams } from '../types'

const QK = 'capital-budget'

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: [QK] })

export const useCapitalBudgetItems = (params?: GetCapitalBudgetItemsParams) =>
  useQuery({
    queryKey: [QK, params],
    queryFn: () => capitalBudgetService.getAll(params),
    select: (res) => {
      const d = res.data
      if (Array.isArray(d)) return { items: d as import('../types').CapitalBudgetItem[], total: d.length }
      if (Array.isArray(d?.data)) return { items: d.data as import('../types').CapitalBudgetItem[], total: d.meta?.total ?? d.data.length }
      if (Array.isArray(d?.items)) return { items: d.items as import('../types').CapitalBudgetItem[], total: d.total ?? d.items.length }
      return { items: [] as import('../types').CapitalBudgetItem[], total: 0 }
    },
  })

export const useCreateCapitalBudgetItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCapitalBudgetItemPayload) =>
      capitalBudgetService.create(payload),
    onSuccess: () => { toast.success('Item created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeleteCapitalBudgetItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => capitalBudgetService.delete(id),
    onSuccess: () => { toast.success('Item deleted'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useImportPreview = () =>
  useMutation({
    mutationFn: (formData: FormData) => capitalBudgetService.importPreview(formData),
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })

export const useImportCommit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rows, fileName }: { rows: unknown[]; fileName?: string }) =>
      capitalBudgetService.importCommit(rows, fileName),
    onSuccess: () => { toast.success('Import successful'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
