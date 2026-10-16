import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { repositoryService } from '../api/services/repositoryService'
import { getErrorMessage } from '../utils/errorHandlers'

export const useRepositoryStats = () =>
  useQuery({
    queryKey: ['repository', 'stats'],
    queryFn: repositoryService.getStats,
    select: (res) => res.data.data,
  })

export const useRepositoryTables = () =>
  useQuery({
    queryKey: ['repository', 'tables'],
    queryFn: repositoryService.getTables,
    select: (res) => res.data.data,
  })

export const useRepositorySync = () =>
  useMutation({
    mutationFn: repositoryService.sync,
    onSuccess: () => toast.success('Repository synced successfully'),
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  })
