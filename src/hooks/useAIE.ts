import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aieService, type GetAIEsParams, type CreateAIEPayload } from '../api/services/aieService'
import { getErrorMessage } from '../utils/errorHandlers'
import { normalizeList } from '../utils/normalizeList'
import type { RejectPayload, AIE } from '../types'

const QK = 'aies'

export const useAIEs = (params?: GetAIEsParams) =>
  useQuery({
    queryKey: [QK, params],
    queryFn: () => aieService.getAll(params),
    select: (res) => normalizeList<AIE>(res.data),
  })

export const useAIE = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => aieService.getById(id),
    select: (res) => res.data.data,
    enabled: Boolean(id),
  })

export const useAIELineItems = (id: string) =>
  useQuery({
    queryKey: [QK, id, 'line-items'],
    queryFn: () => aieService.getLineItems(id),
    select: (res) => res.data.data,
    enabled: Boolean(id),
  })

export const useAIEReviewQueue = () =>
  useQuery({
    queryKey: [QK, 'queue', 'review'],
    queryFn: aieService.getReviewQueue,
    select: (res) => res.data.data,
  })

export const useAIEApprovalQueue = () =>
  useQuery({
    queryKey: [QK, 'queue', 'approval'],
    queryFn: aieService.getApprovalQueue,
    select: (res) => res.data.data,
  })

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: [QK] })

export const useCreateAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAIEPayload) => aieService.create(payload),
    onSuccess: () => { toast.success('AIE created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeleteAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aieService.delete(id),
    onSuccess: () => { toast.success('AIE deleted'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSubmitAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aieService.submit(id),
    onSuccess: () => { toast.success('Submitted for review'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useApproveAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aieService.approve(id),
    onSuccess: () => { toast.success('AIE approved'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useRejectAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPayload }) => aieService.reject(id, payload),
    onSuccess: () => { toast.success('AIE rejected'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useReopenAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aieService.reopen(id),
    onSuccess: () => { toast.success('AIE reopened'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useAIETotals = (fiscalYear: number) =>
  useQuery({
    queryKey: [QK, 'totals', fiscalYear],
    queryFn: () => aieService.getTotals(fiscalYear),
    select: (res) => {
      const d = res.data as Record<string, unknown>
      return ((d?.data ?? d) as Record<string, unknown>) ?? {}
    },
  })

export const useAIEReport = (params?: { fiscalYear?: number; budgetCode?: string }) =>
  useQuery({
    queryKey: [QK, 'report', params],
    queryFn: () => aieService.getReport(params),
    select: (res) => {
      const d = res.data as Record<string, unknown>
      const inner = d?.data ?? d
      return (Array.isArray(inner) ? inner : []) as Record<string, unknown>[]
    },
    enabled: Boolean(params?.fiscalYear),
  })

export const useImportAIE = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fd: FormData) => aieService.importAIE(fd),
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
    onSuccess: () => invalidate(qc),
  })
}

export const useApproveAIEImport = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (importId: string) => aieService.approveImport(importId),
    onSuccess: () => { toast.success('Import approved — AIEs loaded'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
