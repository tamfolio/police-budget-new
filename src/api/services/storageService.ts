import apiClient from '../client'
import { STORAGE } from '../endpoints'

export interface PresignPayload {
  key: string
  mimeType: string
}

export const storageService = {
  presign: (payload: PresignPayload) => apiClient.post(STORAGE.PRESIGN, payload),
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient.post(STORAGE.UPLOAD, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  bulkUpload: (files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    return apiClient.post(STORAGE.BULK_UPLOAD, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  download: (key: string) => apiClient.get(STORAGE.DOWNLOAD(key)),
  getMetadata: (key: string) => apiClient.get(STORAGE.METADATA(key)),
  exists: (key: string) => apiClient.get(STORAGE.EXISTS(key)),
  list: (prefix?: string) => apiClient.get(STORAGE.LIST, { params: prefix ? { prefix } : undefined }),
  deleteObject: (key: string) => apiClient.delete(STORAGE.DELETE(key)),
  bulkDelete: (keys: string[]) => apiClient.delete(STORAGE.BULK_DELETE, { data: { keys } }),
}
