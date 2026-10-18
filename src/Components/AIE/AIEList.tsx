import { useState, useRef } from 'react'
import {
  Plus, MagnifyingGlass, FunnelSimple, CaretDown, Trash,
  UploadSimple, ChartBar, ListBullets, Check, X as XIcon,
  ArrowCounterClockwise, PaperPlaneTilt,
} from '@phosphor-icons/react'
import {
  useAIEs, useCreateAIE, useDeleteAIE, useSubmitAIE, useApproveAIE,
  useRejectAIE, useReopenAIE, useAIETotals, useImportAIE, useReplaceAIE,
} from '../../hooks/useAIE'
import { useCurrentUser } from '../../hooks/useAuth'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import { StatusBadge } from '../Common/StatusBadge'
import AIEReport from './AIEReport'
import AIEWorkbookImportQueue from './AIEWorkbookImportQueue'
import type { AIE, AIELineItem } from '../../types'

const YEAR = new Date().getFullYear()

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('en-GB') : '—'

// ── Proposal status chip ──────────────────────────────────────────────────────
const ProposalChip = ({ status }: { status: string }) => {
  const s = (status ?? '').toLowerCase()
  const cfg =
    s === 'approved' ? { color: '#16a34a', bg: '#f0fdf4', label: 'Approved' } :
    s === 'rejected' ? { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' } :
    { color: '#d97706', bg: '#fffbeb', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
      {cfg.label}
    </span>
  )
}

// ── Expanded line items panel ─────────────────────────────────────────────────
const LineItemsPanel = ({ items }: { items: AIELineItem[] }) => (
  <tr>
    <td colSpan={8} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {[
                { label: 'Code', right: false },
                { label: 'Sub-Item Code', right: false },
                { label: 'Description', right: false },
                { label: 'Budget', right: true },
                { label: 'Actual', right: true },
                { label: 'Variance', right: true },
                { label: 'Status', right: false },
              ].map(({ label, right }) => (
                <th key={label} style={{ padding: '6px 16px', textAlign: right ? 'right' : 'left', fontWeight: 600, fontSize: 10.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const actual = item.fulfillingProposal?.amount ?? null
              const variance = actual != null ? actual - item.budgetAmount : null
              return (
                <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ padding: '7px 16px', fontFamily: 'monospace', color: '#9ca3af', fontSize: 11 }}>{item.itemCodeId}</td>
                  <td style={{ padding: '7px 16px', fontFamily: 'monospace', color: '#6b7280', fontSize: 11 }}>{item.subItemCodeId}</td>
                  <td style={{ padding: '7px 16px', color: '#374151' }}>{item.subItemLabel}</td>
                  <td style={{ padding: '7px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1f2937', fontWeight: 500 }}>{fmt(item.budgetAmount)}</td>
                  <td style={{ padding: '7px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1f2937' }}>
                    {actual != null ? fmt(actual) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '7px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {variance != null ? (
                      <span style={{ color: variance < 0 ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                        {variance >= 0 ? '+' : ''}{fmt(variance)}
                      </span>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '7px 16px' }}>
                    {item.fulfillingProposal
                      ? <ProposalChip status={item.fulfillingProposal.status} />
                      : <span style={{ color: '#d1d5db', fontSize: 11 }}>No proposal</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
)

// ── Create form line item row type ────────────────────────────────────────────
interface LineRow { itemCode: string; subItemCode: string; amount: string }
const blankRow = (): LineRow => ({ itemCode: '', subItemCode: '', amount: '' })

// ── Row action buttons ────────────────────────────────────────────────────────
interface RowActionsProps {
  aie: AIE
  onSubmit: () => void
  onApprove: () => void
  onReject: () => void
  onReopen: () => void
  onDelete: () => void
}

const RowActions = ({ aie, onSubmit, onApprove, onReject, onReopen, onDelete }: RowActionsProps) => {
  const s = (aie.status ?? 'draft').toLowerCase()
  const btnBase = 'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors'

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {s === 'draft' && (
        <>
          <button onClick={onSubmit} className={`${btnBase} bg-blue-50 text-blue-700 hover:bg-blue-100`} title="Submit for review">
            <PaperPlaneTilt size={12} /> Submit
          </button>
          <button onClick={onDelete} className={`${btnBase} bg-red-50 text-red-600 hover:bg-red-100`} title="Delete">
            <Trash size={12} />
          </button>
        </>
      )}
      {(s === 'submitted' || s === 'under_review') && (
        <>
          <button onClick={onApprove} className={`${btnBase} bg-green-50 text-green-700 hover:bg-green-100`} title="Approve">
            <Check size={12} /> Approve
          </button>
          <button onClick={onReject} className={`${btnBase} bg-red-50 text-red-600 hover:bg-red-100`} title="Reject">
            <XIcon size={12} /> Reject
          </button>
          {s === 'under_review' && (
            <button onClick={onReopen} className={`${btnBase} bg-slate-50 text-slate-600 hover:bg-slate-100`} title="Reopen to draft">
              <ArrowCounterClockwise size={12} />
            </button>
          )}
        </>
      )}
      {s === 'rejected' && (
        <>
          <button onClick={onReopen} className={`${btnBase} bg-slate-50 text-slate-600 hover:bg-slate-100`} title="Reopen to draft">
            <ArrowCounterClockwise size={12} /> Reopen
          </button>
          <button onClick={onDelete} className={`${btnBase} bg-red-50 text-red-600 hover:bg-red-100`} title="Delete">
            <Trash size={12} />
          </button>
        </>
      )}
    </div>
  )
}

// ── AIEList ───────────────────────────────────────────────────────────────────
const AIEList = () => {
  const [view, setView] = useState<'list' | 'report'>('list')

  // List filters
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(YEAR)
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createYear, setCreateYear] = useState(YEAR)
  const [aieNo, setAieNo] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiresOn, setExpiresOn] = useState('')
  const [recipientUnit, setRecipientUnit] = useState('')
  const [lineRows, setLineRows] = useState<LineRow[]>([blankRow()])
  const [createNotes, setCreateNotes] = useState('')

  // Workflow action state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)
  const [reopenId, setReopenId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Import modal
  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<1 | 2>(1)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importYear, setImportYear] = useState(YEAR)
  const [importAction, setImportAction] = useState<'append' | 'correction' | 'replace'>('append')
  const [importResultId, setImportResultId] = useState<string | null>(null)
  const [importResultStatus, setImportResultStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data hooks
  const { data, isLoading } = useAIEs({ fiscalYear: yearFilter, status: statusFilter || undefined })
  const { data: totals } = useAIETotals(yearFilter)
  const { data: currentUser } = useCurrentUser()
  const { mutate: createAIE, isPending: creating } = useCreateAIE()
  const { mutate: deleteAIE, isPending: deleting } = useDeleteAIE()
  const { mutate: submitAIE, isPending: submitting } = useSubmitAIE()
  const { mutate: approveAIE, isPending: approving } = useApproveAIE()
  const { mutate: rejectAIE, isPending: rejecting } = useRejectAIE()
  const { mutate: reopenAIE, isPending: reopening } = useReopenAIE()
  const { mutate: importAIE, isPending: importing } = useImportAIE()
  const { mutate: replaceAIE, isPending: replacing } = useReplaceAIE()
  const rawRole = typeof currentUser?.role === 'string' ? currentUser.role : currentUser?.role?.code
  const normalizedRole = String(rawRole ?? '').toUpperCase().replace(/[\s-]+/g, '_')
  const roleCode = normalizedRole === 'SYSTEM_ADMIN' || normalizedRole === 'SYSTEM_ADMINISTRATOR'
    ? 'SYSADMIN'
    : normalizedRole === 'BUDGET_DIRECTOR' ? 'BUDGET_DIR'
      : normalizedRole === 'BUDGET_OFFICER' ? 'BUDGET_OFF' : normalizedRole
  const canUploadWorkbook = ['SYSADMIN', 'BUDGET_DIR', 'BUDGET_OFF'].includes(roleCode ?? '')
  const canReplaceWorkbook = ['SYSADMIN', 'BUDGET_DIR'].includes(roleCode ?? '')
  const canReviewWorkbook = canReplaceWorkbook

  const items: AIE[] = Array.isArray(data) ? data : []

  const filtered = items.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.aieNo?.toLowerCase().includes(q) ||
      String(a.fiscalYear).includes(q) ||
      a.recipientUnit?.toLowerCase().includes(q) ||
      a.lineItems?.some((li) => li.subItemLabel?.toLowerCase().includes(q))
    )
  })

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const resetForm = () => {
    setAieNo(''); setIssueDate(''); setExpiresOn('')
    setRecipientUnit(''); setLineRows([blankRow()]); setCreateNotes('')
    setCreateYear(YEAR)
  }

  const updateRow = (i: number, field: keyof LineRow, val: string) =>
    setLineRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const addRow = () => setLineRows((rows) => [...rows, blankRow()])
  const removeRow = (i: number) =>
    setLineRows((rows) => rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows)

  const formValid =
    aieNo.trim() && issueDate && recipientUnit.trim() &&
    lineRows.some((r) => r.itemCode.trim() && r.subItemCode.trim() && Number(r.amount) > 0)

  const handleCreate = () => {
    const validItems = lineRows.filter(
      (r) => r.itemCode.trim() && r.subItemCode.trim() && Number(r.amount) > 0
    )
    createAIE(
      {
        fiscalYear: createYear, aieNo: aieNo.trim(), issueDate,
        ...(expiresOn ? { expiresOn } : {}),
        recipientUnit: recipientUnit.trim(),
        lineItems: validItems.map((r) => ({
          itemCode: r.itemCode.trim(), subItemCode: r.subItemCode.trim(), amount: Number(r.amount),
        })),
        ...(createNotes.trim() ? { notes: createNotes.trim() } : {}),
      },
      { onSuccess: () => { setCreateOpen(false); resetForm() } }
    )
  }

  const handleImportSubmit = () => {
    if (!importFile) return
    const fd = new FormData()
    fd.append('file', importFile)
    fd.append('fiscalYear', String(importYear))
    const showResult = (res: { data: unknown }) => {
      const d = res.data as Record<string, unknown>
      const inner = (d?.data ?? d) as Record<string, unknown>
      setImportResultId(String(inner?.id ?? '') || null)
      setImportResultStatus(String(inner?.status ?? 'SUBMITTED'))
      setImportStep(2)
    }
    if (importAction === 'replace') {
      if (!canReplaceWorkbook) return
      const confirmed = window.confirm(`Replace all imported AIE budgets and actual details for FY ${importYear}? This cannot be undone from this screen.`)
      if (!confirmed) return
      fd.append('confirmReplacement', 'true')
      replaceAIE(fd, { onSuccess: showResult })
      return
    }
    fd.append('action', roleCode === 'BUDGET_OFF' ? 'correction' : importAction)
    importAIE(fd, { onSuccess: showResult })
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportStep(1)
    setImportFile(null)
    setImportResultId(null)
    setImportResultStatus(null)
  }

  // Totals
  const totalAmount = totals?.totalAmount as number | undefined
  const totalAllocated = totals?.totalAllocated as number | undefined
  const mainTotal = totalAmount ?? totalAllocated

  const inp = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
  const lbl = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <div>
      <PageHeader
        title="AIE"
        subtitle="Authority to Incur Expenditure records"
        actions={
          <div className="flex items-center gap-2">
            {canUploadWorkbook && <button
              onClick={() => { setImportOpen(true); setImportStep(1) }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <UploadSimple size={15} /> Import AIE File
            </button>}
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Plus size={16} weight="bold" /> New AIE
            </button>
          </div>
        }
      />

      {/* View tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
        <button
          onClick={() => setView('list')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <ListBullets size={15} /> AIE Records
        </button>
        <button
          onClick={() => setView('report')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'report' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-800'}`}
        >
          <ChartBar size={15} /> Budget Report
        </button>
      </div>

      <AIEWorkbookImportQueue enabled={canReviewWorkbook} />

      {view === 'report' ? (
        <AIEReport fiscalYear={yearFilter} onYearChange={setYearFilter} />
      ) : (
        <>
          {/* Totals banner */}
          {mainTotal != null && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Total Allocated · {yearFilter}</p>
                <p className="text-2xl font-bold" style={{ color: '#0d2137' }}>{fmt(mainTotal)}</p>
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
                placeholder="Search by AIE number, unit, or line item…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelSimple size={15} className="text-slate-400" />
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <PageLoader />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No AIE records found"
                description="Create a new AIE or import from XLSX."
                action={
                  <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">
                    <Plus size={15} /> New AIE
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-8 px-4 py-3" />
                      {['AIE No.', 'Recipient Unit', 'Total Amount', 'Issue Date', 'Status', 'Items', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((aie) => {
                      const isOpen = expanded[aie.id] ?? false
                      const lineItems = aie.lineItems ?? []
                      const fulfilledCount = lineItems.filter((li) => li.fulfillingProposal != null).length

                      return (
                        <>
                          <tr
                            key={aie.id}
                            onClick={() => lineItems.length > 0 && toggleExpand(aie.id)}
                            className="hover:bg-slate-50 transition-colors border-b border-slate-50"
                            style={{ cursor: lineItems.length > 0 ? 'pointer' : 'default' }}
                          >
                            <td className="px-4 py-3">
                              {lineItems.length > 0 && (
                                <CaretDown
                                  size={14}
                                  weight="bold"
                                  className="text-slate-400"
                                  style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 whitespace-nowrap">{aie.aieNo}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px] truncate" title={aie.recipientUnit ?? ''}>{aie.recipientUnit ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(aie.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(aie.issueDate)}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={aie.status ?? 'draft'} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                              {lineItems.length > 0 && fulfilledCount > 0 && (
                                <span className="ml-1.5 text-green-700 font-medium">· {fulfilledCount} fulfilled</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <RowActions
                                aie={aie}
                                onSubmit={() => setSubmitId(aie.id)}
                                onApprove={() => setApproveId(aie.id)}
                                onReject={() => { setRejectId(aie.id); setRejectReason('') }}
                                onReopen={() => setReopenId(aie.id)}
                                onDelete={() => setDeleteId(aie.id)}
                              />
                            </td>
                          </tr>
                          {isOpen && lineItems.length > 0 && (
                            <LineItemsPanel key={`${aie.id}-items`} items={lineItems} />
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Create modal ───────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); resetForm() }}
        title="New AIE"
        size="lg"
        footer={
          <>
            <button onClick={() => { setCreateOpen(false); resetForm() }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!formValid || creating}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create AIE'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>AIE Number <span className="text-red-500">*</span></label>
              <input value={aieNo} onChange={(e) => setAieNo(e.target.value)} placeholder="e.g. AIE/2026/001" className={inp} />
            </div>
            <div>
              <label className={lbl}>Fiscal Year</label>
              <select value={createYear} onChange={(e) => setCreateYear(Number(e.target.value))} className={inp}>
                {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Issue Date <span className="text-red-500">*</span></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Expires On <span className="text-slate-400 font-normal">(defaults +90 days)</span></label>
              <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Recipient Unit <span className="text-red-500">*</span></label>
            <input value={recipientUnit} onChange={(e) => setRecipientUnit(e.target.value)} placeholder="e.g. Force Headquarters, Abuja" className={inp} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Line Items <span className="text-red-500">*</span>
              </label>
              <button onClick={addRow} className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1">
                <Plus size={11} weight="bold" /> Add Item
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_120px_32px] bg-slate-50 border-b border-slate-200 px-3 py-2">
                {['Item Code', 'Sub-Item Code', 'Amount (₦)', ''].map((h) => (
                  <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-slate-100">
                {lineRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_120px_32px] gap-2 items-center px-3 py-2">
                    <input value={row.itemCode} onChange={(e) => updateRow(i, 'itemCode', e.target.value)} placeholder="e.g. 2301" className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input value={row.subItemCode} onChange={(e) => updateRow(i, 'subItemCode', e.target.value)} placeholder="e.g. 23010112" className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input type="number" min={0} value={row.amount} onChange={(e) => updateRow(i, 'amount', e.target.value)} placeholder="0.00" className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <button onClick={() => removeRow(i)} disabled={lineRows.length === 1} className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-colors">
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <textarea rows={2} value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} placeholder="Optional notes…" className={`${inp} resize-none`} />
          </div>
        </div>
      </Modal>

      {/* ── Import AIE file modal ──────────────────────────────── */}
      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Import AIE file"
        size="sm"
        footer={
          importStep === 1 ? (
            <>
              <button onClick={closeImport} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleImportSubmit} disabled={!importFile || importing || replacing}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50">
                {importing || replacing ? 'Uploading…' : 'Upload'}
              </button>
            </>
          ) : (
            <>
              <button onClick={closeImport} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </>
          )
        }
      >
        {importStep === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">XLSX or CSV File <span className="text-red-500">*</span></label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {importFile ? (
                  <p className="text-sm font-medium text-slate-700">{importFile.name}</p>
                ) : (
                  <>
                    <UploadSimple size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">Click to select an XLSX or CSV file</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fiscal Year</label>
                <select value={importYear} onChange={(e) => setImportYear(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Import Mode</label>
                <select value={roleCode === 'BUDGET_OFF' ? 'correction' : importAction} onChange={(e) => setImportAction(e.target.value as 'append' | 'correction' | 'replace')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                  {roleCode !== 'BUDGET_OFF' && <option value="append">Append</option>}
                  <option value="correction">Correction</option>
                  {canReplaceWorkbook && <option value="replace">Replace fiscal year</option>}
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Append adds new code/month budget rows and release references. Correction updates matching existing rows and may require director review. Replace overwrites imported AIE data for the fiscal year.
            </p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
              <p className="font-semibold">CSV columns</p>
              <p>RecordType, BudgetCode, Month, Amount, ReleaseRef, ReleaseDate, Description, Remark, SourceTab, FiscalYear</p>
              <p>Use BUDGET rows for monthly budgets and ACTUAL rows for releases. Actual rows require a month and release reference.</p>
              <a href="/AIE_Upload_Template.xlsx" download className="inline-block pt-1 font-semibold text-blue-700 hover:underline">Download the XLSX template</a>
              <span className="px-2 text-slate-300">|</span>
              <a href="/AIE_Upload_Template.csv" download className="font-semibold text-blue-700 hover:underline">Download the CSV template</a>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-green-600" weight="bold" />
            </div>
            <p className="font-semibold text-slate-800 mb-1">{importResultStatus === 'PENDING_APPROVAL' ? 'Submitted for director review' : 'AIE file processed'}</p>
            {importResultId && (
              <p className="text-xs text-slate-400 font-mono mb-3">Import ID: {importResultId}</p>
            )}
            <p className="text-sm text-slate-500">
              {importResultStatus === 'PENDING_APPROVAL'
                ? 'The import is waiting in the AIE workbook review queue. An authorized director or system admin must approve or reject it.'
                : 'The import has been applied. Check the AIE Budget Report to confirm monthly budgets and accumulated actuals.'}
            </p>
          </div>
        )}
      </Modal>

      {/* ── Reject modal ───────────────────────────────────────── */}
      <Modal
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject AIE"
        size="sm"
        footer={
          <>
            <button onClick={() => setRejectId(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button
              onClick={() => rejectAIE(
                { id: rejectId!, payload: { reason: rejectReason } },
                { onSuccess: () => { setRejectId(null); setRejectReason('') } }
              )}
              disabled={rejecting || !rejectReason.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {rejecting ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for rejection <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide a reason…"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
      </Modal>

      {/* ── Confirm dialogs ────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteAIE(deleteId!); setDeleteId(null) }}
        title="Delete AIE"
        message="This AIE and all its line items will be permanently deleted."
        confirmLabel="Delete"
        loading={deleting}
      />
      <ConfirmDialog
        open={Boolean(submitId)}
        onClose={() => setSubmitId(null)}
        onConfirm={() => { submitAIE(submitId!, { onSuccess: () => setSubmitId(null) }) }}
        title="Submit AIE for Review"
        message="This AIE will be submitted for review. You won't be able to edit it while it's under review."
        confirmLabel="Submit"
        loading={submitting}
      />
      <ConfirmDialog
        open={Boolean(approveId)}
        onClose={() => setApproveId(null)}
        onConfirm={() => { approveAIE(approveId!, { onSuccess: () => setApproveId(null) }) }}
        title="Approve AIE"
        message="This AIE will be approved and its budget allocations will become active."
        confirmLabel="Approve"
        loading={approving}
      />
      <ConfirmDialog
        open={Boolean(reopenId)}
        onClose={() => setReopenId(null)}
        onConfirm={() => { reopenAIE(reopenId!, { onSuccess: () => setReopenId(null) }) }}
        title="Reopen AIE"
        message="This AIE will be moved back to draft status for editing."
        confirmLabel="Reopen"
        loading={reopening}
      />
    </div>
  )
}

export default AIEList
