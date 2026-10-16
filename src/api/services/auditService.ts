import apiClient from '../client'
import { AUDIT } from '../endpoints'

export interface GetHttpLogsParams {
  userId?: string
  method?: string
  endpoint?: string
  statusCode?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface GetAuditEntriesParams {
  entityType?: string
  entityId?: string
  action?: string
  performedById?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const auditService = {
  getHttpLogs: (params?: GetHttpLogsParams) => apiClient.get(AUDIT.HTTP_LOGS, { params }),
  getEntries: (params?: GetAuditEntriesParams) => apiClient.get(AUDIT.ENTRIES, { params }),
}
