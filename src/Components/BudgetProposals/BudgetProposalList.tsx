import { useState } from 'react'
import { Plus, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import { useBudgetProposals, useSubmitBudgetProposal, useApproveBudgetProposal } from '../../hooks/useBudgetProposals'
import { PageHeader } from '../Common/PageHeader'
import { StatusBadge } from '../Common/StatusBadge'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import BudgetProposalForm from './BudgetProposalForm'
import type { BudgetProposal } from '../../types'

const YEAR = new Date().getFullYear()

const BudgetProposalList = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(YEAR)
  const [formOpen, setFormOpen] = useState(false)
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)

  const { data, isLoading } = useBudgetProposals({ fiscalYear: yearFilter, status: statusFilter || undefined })
  const { mutate: submitProposal, isPending: submitting } = useSubmitBudgetProposal()
  const { mutate: approveProposal, isPending: approving } = useApproveBudgetProposal()

  const items: BudgetProposal[] = data ?? []

  const filtered = items.filter((p) => {
    if (!search) return true
    return p.id.toLowerCase().includes(search.toLowerCase()) || String(p.fiscalYear).includes(search)
  })

  return (
    <div>
      <PageHeader
        title="AIE Proposal"
        subtitle="Manage proposals for AIE line items"
        actions={
          <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
            <Plus size={16} weight="bold" /> New AIE Proposal
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search AIE proposals…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <FunnelSimple size={15} className="text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600">
            {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState title="No AIE proposals found" description="Create a proposal from approved AIE line items." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['ID', 'Fiscal Year', 'Items', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{p.fiscalYear}</td>
                    <td className="px-4 py-3 text-slate-600">{p.items?.length ?? 0} items</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const s = (p.status ?? '').toLowerCase()
                        return (
                          <div className="flex items-center gap-2">
                            {s === 'draft' && (
                              <button onClick={() => setSubmitId(p.id)} className="text-xs text-amber-700 hover:underline font-medium">Submit</button>
                            )}
                            {s === 'pending_review' && (
                              <button onClick={() => setApproveId(p.id)} className="text-xs text-green-700 hover:underline font-medium">Approve</button>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BudgetProposalForm open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog open={Boolean(submitId)} onClose={() => setSubmitId(null)}
        onConfirm={() => { submitProposal(submitId!); setSubmitId(null) }}
        title="Submit AIE Proposal" message="Submit this AIE proposal for review?" confirmLabel="Submit" variant="primary" loading={submitting} />

      <ConfirmDialog open={Boolean(approveId)} onClose={() => setApproveId(null)}
        onConfirm={() => { approveProposal(approveId!); setApproveId(null) }}
        title="Approve AIE Proposal" message="Approve this AIE proposal?" confirmLabel="Approve" variant="primary" loading={approving} />
    </div>
  )
}

export default BudgetProposalList
