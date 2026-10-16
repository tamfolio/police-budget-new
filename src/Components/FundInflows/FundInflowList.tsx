import { useState } from 'react'
import { Plus, FunnelSimple, MagnifyingGlass, ArrowsClockwise } from '@phosphor-icons/react'
import { useFundInflows, useFundInflowTotals, useDeleteFundInflow, useSubmitFundInflow, useApproveFundInflow, useRejectFundInflow } from '../../hooks/useFundInflows'
import { PageHeader } from '../Common/PageHeader'
import { StatusBadge } from '../Common/StatusBadge'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import FundInflowForm from './FundInflowForm'
import type { FundInflow, FundInflowStatus } from '../../types'

const YEAR = new Date().getFullYear()

const fmt = (v: number) => `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const FundInflowList = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FundInflowStatus | ''>('')
  const [yearFilter, setYearFilter] = useState(YEAR)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<FundInflow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)

  const { data, isLoading } = useFundInflows({ fiscalYear: yearFilter, status: statusFilter || undefined })
  const { data: totalAmount } = useFundInflowTotals(yearFilter)
  const { mutate: deleteFI, isPending: deleting } = useDeleteFundInflow()
  const { mutate: submitFI, isPending: submitting } = useSubmitFundInflow()
  const { mutate: approveFI } = useApproveFundInflow()
  const { mutate: rejectFI, isPending: rejecting } = useRejectFundInflow()

  const items: FundInflow[] = Array.isArray(data) ? data : []

  const filtered = items.filter((fi) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      fi.source?.toLowerCase().includes(q) ||
      fi.referenceNo?.toLowerCase().includes(q) ||
      String(fi.fiscalYear).includes(q)
    )
  })

  return (
    <div>
      <PageHeader
        title="Fund Inflows"
        subtitle="Manage and track all fund inflow records"
        actions={
          <button
            onClick={() => { setEditItem(null); setFormOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={16} weight="bold" /> New Inflow
          </button>
        }
      />

      {/* Total banner */}
      {totalAmount != null && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Total Inflows · {yearFilter}</p>
            <p className="text-2xl font-bold" style={{ color: '#0d2137' }}>{fmt(totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Records</p>
            <p className="text-2xl font-bold text-slate-700">{items.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by source, reference…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelSimple size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FundInflowStatus | '')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {[YEAR, YEAR - 1, YEAR - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No fund inflows found"
            description="Create a new fund inflow record to get started."
            action={
              <button
                onClick={() => { setEditItem(null); setFormOpen(true) }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
              >
                <Plus size={15} /> New Inflow
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Date', 'Source', 'Reference No.', 'Amount', 'Fiscal Year', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((fi) => (
                  <tr key={fi.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {new Date(fi.inflowDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{fi.source}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{fi.referenceNo ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold whitespace-nowrap">{fmt(fi.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{fi.fiscalYear}</td>
                    <td className="px-4 py-3"><StatusBadge status={fi.status} /></td>
                    <td className="px-4 py-3">
                      {(() => {
                        const s = (fi.status ?? '').toLowerCase()
                        return (
                          <div className="flex items-center gap-2">
                            {s === 'draft' && (
                              <>
                                <button
                                  onClick={() => { setEditItem(fi); setFormOpen(true) }}
                                  className="text-xs text-blue-700 hover:underline font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setSubmitId(fi.id)}
                                  className="text-xs text-amber-700 hover:underline font-medium"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={() => setDeleteId(fi.id)}
                                  className="text-xs text-red-500 hover:underline font-medium"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {s === 'under_review' && (
                              <button
                                onClick={() => approveFI(fi.id)}
                                className="text-xs text-green-700 hover:underline font-medium"
                              >
                                Approve
                              </button>
                            )}
                            {s === 'rejected' && (
                              <button className="text-xs text-slate-500 hover:underline font-medium">
                                Reopen
                              </button>
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

      {/* Modals */}
      <FundInflowForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        existing={editItem}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteFI(deleteId!); setDeleteId(null) }}
        title="Delete fund inflow"
        message="This fund inflow will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />

      <ConfirmDialog
        open={Boolean(submitId)}
        onClose={() => setSubmitId(null)}
        onConfirm={() => { submitFI(submitId!); setSubmitId(null) }}
        title="Submit for review"
        message="This fund inflow will be submitted for officer review. You won't be able to edit it after submission."
        confirmLabel="Submit"
        variant="primary"
        loading={submitting}
      />
    </div>
  )
}

export default FundInflowList
