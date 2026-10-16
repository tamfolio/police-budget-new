import { useState } from 'react'
import { Plus, MagnifyingGlass, FunnelSimple, CaretDown, CheckCircle, Clock, XCircle, Trash } from '@phosphor-icons/react'
import { useAIEs, useCreateAIE } from '../../hooks/useAIE'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import type { AIE, AIELineItem } from '../../types'

const YEAR = new Date().getFullYear()

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('en-GB') : '—'

// ── Proposal status chip ──────────────────────────────────────────────────────
const ProposalChip = ({ status }: { status: string }) => {
  const s = status.toLowerCase()
  const cfg =
    s === 'approved' ? { icon: <CheckCircle size={12} weight="fill" />, color: '#16a34a', bg: '#f0fdf4', label: 'Approved' } :
    s === 'rejected' ? { icon: <XCircle size={12} weight="fill" />, color: '#dc2626', bg: '#fef2f2', label: 'Rejected' } :
    { icon: <Clock size={12} weight="fill" />, color: '#d97706', bg: '#fffbeb', label: status }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Expanded line items panel ─────────────────────────────────────────────────
const LineItemsPanel = ({ items }: { items: AIELineItem[] }) => (
  <tr>
    <td colSpan={7} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Sub-Item Code', 'Description', 'Budget Amount', 'Proposal Amount', 'Status'].map((h) => (
                <th key={h} style={{ padding: '6px 16px', textAlign: h === 'Budget Amount' || h === 'Proposal Amount' ? 'right' : 'left', fontWeight: 600, fontSize: 10.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ padding: '7px 16px', fontFamily: 'monospace', color: '#6b7280', fontSize: 11 }}>{item.subItemCodeId}</td>
                <td style={{ padding: '7px 16px', color: '#374151' }}>{item.subItemLabel}</td>
                <td style={{ padding: '7px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1f2937', fontWeight: 500 }}>{fmt(item.budgetAmount)}</td>
                <td style={{ padding: '7px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1f2937' }}>
                  {item.fulfillingProposal ? fmt(item.fulfillingProposal.amount) : <span style={{ color: '#d1d5db' }}>—</span>}
                </td>
                <td style={{ padding: '7px 16px' }}>
                  {item.fulfillingProposal
                    ? <ProposalChip status={item.fulfillingProposal.status} />
                    : <span style={{ color: '#d1d5db', fontSize: 11 }}>No proposal</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </td>
  </tr>
)

// ── Create form line item row type ────────────────────────────────────────────
interface LineRow { itemCode: string; subItemCode: string; amount: string }
const blankRow = (): LineRow => ({ itemCode: '', subItemCode: '', amount: '' })

// ── AIEList ───────────────────────────────────────────────────────────────────
const AIEList = () => {
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(YEAR)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [createOpen, setCreateOpen] = useState(false)

  // create form fields
  const [createYear, setCreateYear] = useState(YEAR)
  const [aieNo, setAieNo] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiresOn, setExpiresOn] = useState('')
  const [recipientUnit, setRecipientUnit] = useState('')
  const [lineRows, setLineRows] = useState<LineRow[]>([blankRow()])
  const [createNotes, setCreateNotes] = useState('')

  const { data, isLoading } = useAIEs({ fiscalYear: yearFilter })
  const { mutate: createAIE, isPending: creating } = useCreateAIE()

  const items: AIE[] = Array.isArray(data) ? data : []

  const filtered = items.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.aieNo?.toLowerCase().includes(q) ||
      String(a.fiscalYear).includes(q) ||
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
        fiscalYear: createYear,
        aieNo: aieNo.trim(),
        issueDate,
        ...(expiresOn ? { expiresOn } : {}),
        recipientUnit: recipientUnit.trim(),
        lineItems: validItems.map((r) => ({
          itemCode: r.itemCode.trim(),
          subItemCode: r.subItemCode.trim(),
          amount: Number(r.amount),
        })),
        ...(createNotes.trim() ? { notes: createNotes.trim() } : {}),
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          resetForm()
        },
      }
    )
  }

  const inp = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
  const lbl = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <div>
      <PageHeader
        title="AIE (Budget Allocations)"
        subtitle="Authority to Incur Expenditure records"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={16} weight="bold" /> New AIE
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by AIE number or line item…"
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No AIE records found"
            description="Create a new AIE to allocate budget for this fiscal year."
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
                  {['AIE No.', 'Fiscal Year', 'Total Amount', 'Issue Date', 'Expires On', 'Line Items'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
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
                        className="hover:bg-slate-50 transition-colors"
                        style={{ cursor: lineItems.length > 0 ? 'pointer' : 'default', borderBottom: isOpen ? 'none' : undefined }}
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
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800">{aie.aieNo}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{aie.fiscalYear}</td>
                        <td className="px-4 py-3 text-slate-800 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(aie.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(aie.issueDate)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(aie.expiresOn)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">
                            {lineItems.length} items
                            {lineItems.length > 0 && (
                              <span className="ml-1.5 text-green-700 font-medium">· {fulfilledCount} fulfilled</span>
                            )}
                          </span>
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

      {/* Create modal */}
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
            <button
              onClick={handleCreate}
              disabled={!formValid || creating}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create AIE'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Row 1: AIE No + Fiscal Year */}
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

          {/* Row 2: Issue Date + Expires On */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Issue Date <span className="text-red-500">*</span></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Expires On <span className="text-slate-400 font-normal">(defaults to +90 days)</span></label>
              <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className={inp} />
            </div>
          </div>

          {/* Recipient Unit */}
          <div>
            <label className={lbl}>Recipient Unit <span className="text-red-500">*</span></label>
            <input value={recipientUnit} onChange={(e) => setRecipientUnit(e.target.value)} placeholder="e.g. Force Headquarters, Abuja" className={inp} />
          </div>

          {/* Line Items */}
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
              <div className="grid grid-cols-[1fr_1fr_120px_32px] gap-0 bg-slate-50 border-b border-slate-200 px-3 py-2">
                {['Item Code', 'Sub-Item Code', 'Amount (₦)', ''].map((h) => (
                  <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-slate-100">
                {lineRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_120px_32px] gap-2 items-center px-3 py-2">
                    <input
                      value={row.itemCode}
                      onChange={(e) => updateRow(i, 'itemCode', e.target.value)}
                      placeholder="e.g. 2301"
                      className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      value={row.subItemCode}
                      onChange={(e) => updateRow(i, 'subItemCode', e.target.value)}
                      placeholder="e.g. 23010112"
                      className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min={0}
                      value={row.amount}
                      onChange={(e) => updateRow(i, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeRow(i)}
                      disabled={lineRows.length === 1}
                      className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-0 transition-colors"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Notes</label>
            <textarea
              rows={2}
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              placeholder="Optional notes…"
              className={`${inp} resize-none`}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AIEList
