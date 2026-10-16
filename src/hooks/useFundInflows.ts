import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fundInflowService } from '../api/services/fundInflowService'
import { getErrorMessage } from '../utils/errorHandlers'
import { normalizeList } from '../utils/normalizeList'
import type { GetFundInflowsParams, CreateFundInflowPayload, UpdateFundInflowPayload, RejectPayload, FundInflow } from '../types'

const QK = 'fund-inflows'

export const useFundInflows = (params?: GetFundInflowsParams) =>
  useQuery({
    queryKey: [QK, params],
    queryFn: () => fundInflowService.getAll(params),
    select: (res) => normalizeList<FundInflow>(res.data),
  })

export const useFundInflow = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => fundInflowService.getById(id),
    select: (res) => {
      const d = res.data
      return (d?.data ?? d) as import('../types').FundInflow
    },
    enabled: Boolean(id),
  })

// API returns a plain number: GET /fund-inflows/totals/2026 → 18996849919.36
export const useFundInflowTotals = (fiscalYear: number) =>
  useQuery({
    queryKey: [QK, 'totals', fiscalYear],
    queryFn: () => fundInflowService.getTotals(fiscalYear),
    select: (res) => {
      const d = res.data
      if (typeof d === 'number') return d
      if (typeof d?.data === 'number') return d.data as number
      return (d?.data?.total ?? d?.total ?? null) as number | null
    },
  })

export const useFundInflowReviewQueue = () =>
  useQuery({
    queryKey: [QK, 'queue', 'review'],
    queryFn: fundInflowService.getReviewQueue,
    select: (res) => res.data.data,
  })

export const useFundInflowApprovalQueue = () =>
  useQuery({
    queryKey: [QK, 'queue', 'approval'],
    queryFn: fundInflowService.getApprovalQueue,
    select: (res) => res.data.data,
  })

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: [QK] })

export const useCreateFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFundInflowPayload) => fundInflowService.create(payload),
    onSuccess: () => { toast.success('Fund inflow created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useUpdateFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFundInflowPayload }) =>
      fundInflowService.update(id, payload),
    onSuccess: () => { toast.success('Fund inflow updated'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeleteFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fundInflowService.delete(id),
    onSuccess: () => { toast.success('Fund inflow deleted'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSubmitFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fundInflowService.submit(id),
    onSuccess: () => { toast.success('Submitted for review'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useReviewFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => fundInflowService.review(id, { notes }),
    onSuccess: () => { toast.success('Fund inflow reviewed'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useApproveFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fundInflowService.approve(id),
    onSuccess: () => { toast.success('Fund inflow approved'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useRejectFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPayload }) =>
      fundInflowService.reject(id, payload),
    onSuccess: () => { toast.success('Fund inflow rejected'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useReopenFundInflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fundInflowService.reopen(id),
    onSuccess: () => { toast.success('Fund inflow reopened'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
