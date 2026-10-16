import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { departmentService } from '../api/services/departmentService'
import { getErrorMessage } from '../utils/errorHandlers'
import type { CreateDepartmentPayload } from '../types'

const QK = 'departments'

export const useDepartments = () =>
  useQuery({
    queryKey: [QK],
    queryFn: departmentService.getAll,
    select: (res) => res.data.data,
  })

export const useDepartment = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => departmentService.getById(id),
    select: (res) => res.data.data,
    enabled: Boolean(id),
  })

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: [QK] })

export const useCreateDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentService.create(payload),
    onSuccess: () => { toast.success('Department created'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useUpdateDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateDepartmentPayload> }) =>
      departmentService.update(id, payload),
    onSuccess: () => { toast.success('Department updated'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}

export const useDeactivateDepartment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => departmentService.deactivate(id),
    onSuccess: () => { toast.success('Department deactivated'); invalidate(qc) },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
}
