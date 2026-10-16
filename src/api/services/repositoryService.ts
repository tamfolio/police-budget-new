import apiClient from '../client'
import { REPOSITORY } from '../endpoints'

export const repositoryService = {
  getStats: () => apiClient.get(REPOSITORY.STATS),
  getTables: () => apiClient.get(REPOSITORY.TABLES),
  exportTable: (table: string) =>
    apiClient.get(REPOSITORY.EXPORT_TABLE(table), { responseType: 'blob' }),
  backup: () => apiClient.get(REPOSITORY.BACKUP, { responseType: 'blob' }),
  sync: () => apiClient.post(REPOSITORY.SYNC),
}
