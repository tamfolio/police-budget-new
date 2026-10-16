import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { budgetProposalService, type CreateBudgetProposalPayload, type GetBudgetProposalsParams } from '../api/services/budgetProposalService'
import { getErrorMessage } from '../utils/errorHandlers'
import type { RejectPayload } from '../types'

const QK = 'budget-proposals'

export const useBudgetProposals = (params?: GetBudgetProposalsParams) =>
  useQuery({
    queryKey: [QK, params],
    queryFn: () => budgetProposalService.getAll(params),
    select: (res) => {
      const d = res.data
      if (Array.isArray(d)) return d
      if (Array.isArray(d?.items)) return d.items
      if (Array.isArray(d?.data)) return d.data
      return []
    },
  })

export const useBudgetProposal = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => budgetProposalService.getById(id),
    select: (res) => res.data.data,
    enabled: Boolean(id),
  })

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: [QK] })

export const useCreateBudgetProposal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBudgetProposalPayload) => budgetProposalService.create(payload),
    onSuccess: () => { toast.success('Budget proposal created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useSubmitBudgetProposal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetProposalService.submit(id),
    onSuccess: () => { toast.success('Submitted for review'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useApproveBudgetProposal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetProposalService.approve(id),
    onSuccess: () => { toast.success('Proposal approved'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useRejectBudgetProposal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPayload }) =>
      budgetProposalService.reject(id, payload.reason),
    onSuccess: () => { toast.success('Proposal rejected'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
