import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { distributionService, type DistributionView, type GetDistributionsParams } from '../api/services/distributionService'
import { getErrorMessage } from '../utils/errorHandlers'

const QK = 'distributions'

export const useDistributions = (params: GetDistributionsParams) =>
  useQuery({
    queryKey: [QK, params],
    queryFn: () => distributionService.getAll(params),
    select: (res) => res.data.data,
  })

export const useDistributionReference = (view: DistributionView) =>
  useQuery({
    queryKey: [QK, 'reference', view],
    queryFn: () => distributionService.getReference(),
    select: (res) => res.data.data,
    staleTime: 10 * 60 * 1000,
  })

export const useDistributionAuditTrail = (periodId: string) =>
  useQuery({
    queryKey: [QK, periodId, 'audit-trail'],
    queryFn: () => distributionService.getAuditTrail(periodId),
    select: (res) => res.data.data,
    enabled: Boolean(periodId),
  })

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: [QK] })

export const useCreateDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ view, payload }: { view: DistributionView; payload: Record<string, unknown> }) =>
      distributionService.create(view, payload),
    onSuccess: () => { toast.success('Distribution period created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSubmitDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => distributionService.submit(periodId),
    onSuccess: () => { toast.success('Submitted for review'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useApproveDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => distributionService.approve(periodId),
    onSuccess: () => { toast.success('Distribution approved'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useUpdateDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, view, payload }: { periodId: string; view: DistributionView; payload: Record<string, unknown> }) =>
      distributionService.update(periodId, view, payload),
    onSuccess: () => { toast.success('Distribution period updated'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeleteDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, view }: { periodId: string; view: DistributionView }) =>
      distributionService.delete(periodId, view),
    onSuccess: () => { toast.success('Distribution period deleted'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useReturnDistribution = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, remarks }: { periodId: string; remarks: string }) =>
      distributionService.return(periodId, { remarks }),
    onSuccess: () => { toast.success('Returned for correction'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
