import { useQuery } from '@tanstack/react-query'
import { auditService, type GetHttpLogsParams, type GetAuditEntriesParams } from '../api/services/auditService'

export const useAuditHttpLogs = (params?: GetHttpLogsParams) =>
  useQuery({
    queryKey: ['audit', 'http-logs', params],
    queryFn: () => auditService.getHttpLogs(params),
    select: (res) => res.data.data,
  })

export const useAuditEntries = (params?: GetAuditEntriesParams) =>
  useQuery({
    queryKey: ['audit', 'entries', params],
    queryFn: () => auditService.getEntries(params),
    select: (res) => res.data.data,
  })
