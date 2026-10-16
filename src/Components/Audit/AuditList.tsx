import { useState } from 'react'
import { ClockCounterClockwise, MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { auditService } from '../../api/services/auditService'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import type { AuditEntry } from '../../types'

const ACTION_DOT: Record<string, string> = {
  CREATE: '#16a34a',
  UPDATE: '#2563eb',
  DELETE: '#dc2626',
  APPROVE: '#7c3aed',
  SUBMIT: '#d97706',
  OFFICER_REVIEW: '#ea580c',
  IMPORT: '#0891b2',
  USER_INVITE: '#0d9488',
  ROLE_ASSIGN: '#6d28d9',
}

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_DOT[action.toUpperCase()] ?? '#6b7280'
  const label = action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
    </span>
  )
}

function PerformedBy({ by }: { by: AuditEntry['performedBy'] }) {
  if (!by) return <span className="text-slate-400">System</span>
  const hasName = by.fullName && by.fullName.trim()
  const primary = hasName ? by.fullName : by.email
  return (
    <span>
      <span className="text-slate-700">{primary}</span>
      {hasName && <span className="block text-xs text-slate-400">{by.email}</span>}
    </span>
  )
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 40)
  return String(v).slice(0, 40)
}

function Details({ entry }: { entry: AuditEntry }) {
  if (entry.action === 'IMPORT' && entry.metadata) {
    const meta = entry.metadata as { fileName?: string; totalRows?: number }
    const parts: string[] = []
    if (meta.fileName) parts.push(String(meta.fileName))
    if (meta.totalRows != null) parts.push(`${meta.totalRows} rows`)
    return <span className="text-slate-500 text-xs">{parts.join(' · ') || 'Import'}</span>
  }

  if (entry.changes && Object.keys(entry.changes).length > 0) {
    const fields = Object.entries(entry.changes).slice(0, 2)
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {fields.map(([field, diff]) => (
          <span key={field} className="text-xs">
            <span style={{ color: '#6b7280' }}>{field}: </span>
            <span style={{ color: '#b91c1c', textDecoration: 'line-through' }}>{formatVal(diff.old)}</span>
            <span style={{ color: '#9ca3af' }}> → </span>
            <span style={{ color: '#15803d' }}>{formatVal(diff.new)}</span>
          </span>
        ))}
        {Object.keys(entry.changes).length > 2 && (
          <span className="text-xs" style={{ color: '#9ca3af' }}>+{Object.keys(entry.changes).length - 2} more fields</span>
        )}
      </span>
    )
  }

  return <span className="text-slate-400 text-xs">—</span>
}

const AuditList = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', 'entries', page],
    queryFn: () => auditService.getEntries({ page, limit: 50 }),
    select: (r) =>
      r.data?.data as
        | { entries: AuditEntry[]; pagination: { total: number; perPage: number; totalPages: number; page: number } }
        | undefined,
  })

  const entries: AuditEntry[] = data?.entries ?? []
  const totalPages: number = data?.pagination?.totalPages ?? 1
  const totalCount: number = data?.pagination?.total ?? 0

  const filtered = entries.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.entityType ?? '').toLowerCase().includes(q) ||
      (e.action ?? '').toLowerCase().includes(q) ||
      (e.performedBy?.email ?? '').toLowerCase().includes(q) ||
      (e.performedBy?.fullName ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <PageHeader title="Audit Trail" subtitle="Complete log of system activity and entity changes" />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entity, action, or user…"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Funnel size={14} /> Filter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No audit records"
            description="Activity will appear here as users interact with the system."
            icon={<ClockCounterClockwise size={28} className="text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Entity Type', 'Action', 'Performed By', 'Details', 'Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-slate-700">{entry.entityType ?? '—'}</span>
                      {entry.entityId && (
                        <span className="block text-xs text-slate-400 font-mono truncate max-w-[140px]">{entry.entityId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ActionBadge action={entry.action ?? '—'} />
                    </td>
                    <td className="px-4 py-3">
                      <PerformedBy by={entry.performedBy} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Details entry={entry} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString('en-NG', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(totalPages > 1 || totalCount > 0) && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {totalCount.toLocaleString()} total entries · page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditList
