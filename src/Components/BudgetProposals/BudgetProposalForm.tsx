import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../Common/Modal'
import { useCreateBudgetProposal } from '../../hooks/useBudgetProposals'
import { useAIEs, useAIELineItemsMulti } from '../../hooks/useAIE'
import { useDepartments } from '../../hooks/useDepartments'
import { useBudgetReference } from '../../hooks/useBudgetCodes'
import type { Department, AIE, AIELineItem, BudgetCategory, BudgetReference } from '../../types'

const YEAR = new Date().getFullYear()
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Props {
  open: boolean
  onClose: () => void
}

interface TaggedLineItem extends AIELineItem {
  aieId: string
  aieNo: string
}

interface ProposalRow {
  parentCode: string
  lineItemId: string
  amount: string
}

const fmt = (v: number) =>
  `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const BudgetProposalForm = ({ open, onClose }: Props) => {
  const [fiscalYear, setFiscalYear] = useState(YEAR)
  const [month, setMonth] = useState('')
  const [rows, setRows] = useState<ProposalRow[]>([{ parentCode: '', lineItemId: '', amount: '' }])
  const [departmentId, setDepartmentId] = useState('')
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')

  const { data: deptRaw } = useDepartments()
  const departments: Department[] = deptRaw ?? []
  const { data: budgetReferenceRaw } = useBudgetReference()
  const budgetReference = budgetReferenceRaw as BudgetReference | undefined
  const categories: BudgetCategory[] = budgetReference?.categories ?? []
  const { data: aiesRaw } = useAIEs({ fiscalYear, status: 'approved' })
  const aies: AIE[] = (aiesRaw ?? []).filter((aie) => (aie.status ?? '').toLowerCase() === 'approved')

  const monthAies = aies.filter((aie) => {
    const issueDate = aie.issueDate?.slice(0, 10)
    if (!issueDate) return false
    const [year, monthNumber] = issueDate.split('-').map(Number)
    return year === fiscalYear && String(monthNumber) === month
  })
  const monthAieIds = monthAies.map((aie) => aie.id)
  const lineItemQueries = useAIELineItemsMulti(monthAieIds)
  const lineItemsLoading = lineItemQueries.some((q) => q.isLoading)

  const lineItems: TaggedLineItem[] = monthAieIds.flatMap((id, idx) => {
    const aie = monthAies[idx]
    if (!aie) return []
    const response = lineItemQueries[idx]?.data as { data?: unknown } | undefined
    const detailed = response?.data
    const rawItems = Array.isArray(detailed)
      ? detailed as AIELineItem[]
      : ((detailed as Record<string, unknown>)?.items as AIELineItem[] | undefined) ?? []
    const items = rawItems.length > 0 ? rawItems : aie.lineItems ?? []
    return items.map((item) => ({ ...item, aieId: aie.id, aieNo: aie.aieNo }))
  }).filter((item) => !item.actualAmountId && !item.fulfillingProposal)

  const { mutate: create, isPending } = useCreateBudgetProposal()

  useEffect(() => {
    if (open) {
      setFiscalYear(YEAR)
      setMonth('')
      setRows([{ parentCode: '', lineItemId: '', amount: '' }])
      setDepartmentId('')
      setJustification('')
      setNotes('')
    }
  }, [open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validRows = rows
      .map((row) => ({ row, lineItem: lineItems.find((item) => item.id === row.lineItemId) }))
      .filter((entry): entry is { row: ProposalRow; lineItem: TaggedLineItem } => Boolean(entry.lineItem) && Number(entry.row.amount) > 0)
    if (validRows.length === 0) return
    create(
      {
        fiscalYear,
        departmentId,
        justification,
        notes: notes || undefined,
        items: validRows.map(({ row, lineItem }) => {
          const raw = lineItem as TaggedLineItem & { subItemId?: string }
          return {
            lineItemId: lineItem.id,
            ...(raw.subItemId ? { subItemId: raw.subItemId } : {}),
            amount: Number(row.amount),
          }
        }),
      },
      { onSuccess: onClose }
    )
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'
  const validAmount = rows.some((row) => row.lineItemId && Number(row.amount) > 0)
  const setRow = (index: number, changes: Partial<ProposalRow>) =>
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row))
  const selectedLineItemIds = new Set(rows.map((row) => row.lineItemId).filter(Boolean))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New AIE Proposal"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="bp-form" type="submit"
            disabled={isPending || !departmentId || !selectedLineItem || justification.trim().length < 10 || !validAmount}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : 'Create AIE Proposal'}
          </button>
        </>
      }
    >
      <form id="bp-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fiscal Year</label>
            <select value={fiscalYear} onChange={(e) => { setFiscalYear(Number(e.target.value)); setMonth(''); setRows([{ parentCode: '', lineItemId: '', amount: '' }]) }} className={inputCls}>
              {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Department *</label>
            <select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls}>
              <option value="">Select department…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Month *</label>
          <select required value={month} onChange={(e) => { setMonth(e.target.value); setRows([{ parentCode: '', lineItemId: '', amount: '' }]) }} className={inputCls}>
            <option value="">Select month…</option>
            {MONTHS.map((name, idx) => {
              const value = String(idx + 1)
              const hasApprovedAie = aies.some((aie) => {
                const date = aie.issueDate?.slice(0, 10).split('-').map(Number)
                return date?.[0] === fiscalYear && String(date?.[1]) === value
              })
              return hasApprovedAie ? <option key={value} value={value}>{name}</option> : null
            })}
          </select>
          {aies.length === 0 && <p className="mt-1.5 text-xs text-amber-600">No approved AIE budgets found for FY {fiscalYear}.</p>}
        </div>

        {month && <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className={labelCls}>AIE Budget Codes *</label>
              <p className="text-xs text-slate-500">All rows in this proposal use {MONTHS[Number(month) - 1]} {fiscalYear}.</p>
            </div>
            <button type="button" onClick={() => setRows((current) => [...current, { parentCode: '', lineItemId: '', amount: '' }])}
              disabled={lineItemsLoading || lineItems.length === 0}
              className="px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50">Add budget code</button>
          </div>
          {lineItemsLoading ? (
            <p className="text-sm text-slate-400 py-3 text-center border border-slate-200 rounded-lg">Loading budget codes…</p>
          ) : lineItems.length === 0 ? (
            <p className="text-sm text-amber-600 py-3 text-center border border-slate-200 rounded-lg">No available budget codes for {MONTHS[Number(month) - 1]} {fiscalYear}.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => {
                const parentOptions = categories.filter((category) => lineItems.some((item) => item.subItemCodeId && category.subItems?.some((sub) => sub.code === item.subItemCodeId)))
                const childOptions = lineItems.filter((item) => {
                  if (!row.parentCode) return false
                  const category = categories.find((entry) => entry.code === row.parentCode)
                  return category?.subItems?.some((sub) => sub.code === item.subItemCodeId)
                })
                const selectedLineItem = lineItems.find((item) => item.id === row.lineItemId)
                return <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Proposal item {index + 1}</p>
                    {rows.length > 1 && <button type="button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="text-xs text-red-600 hover:text-red-700">Remove</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Parent budget code *</label>
                      <select required value={row.parentCode} onChange={(e) => setRow(index, { parentCode: e.target.value, lineItemId: '', amount: '' })} className={inputCls}>
                        <option value="">Select parent code…</option>
                        {parentOptions.map((category) => <option key={category.id} value={category.code}>{category.code} — {category.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Sub-item code *</label>
                      <select required disabled={!row.parentCode} value={row.lineItemId} onChange={(e) => setRow(index, { lineItemId: e.target.value, amount: '' })} className={inputCls}>
                        <option value="">{row.parentCode ? 'Select sub-item…' : 'Select parent code first…'}</option>
                        {childOptions.map((item) => <option key={`${item.aieId}:${item.id}`} value={item.id} disabled={selectedLineItemIds.has(item.id) && item.id !== row.lineItemId}>
                          {item.subItemCodeId} — {item.subItemLabel}{monthAies.length > 1 ? ` (${item.aieNo})` : ''}
                        </option>)}
                      </select>
                    </div>
                  </div>
                  {selectedLineItem && <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3">
                    <div><p className="text-xs text-slate-500">Uploaded budget amount</p><p className="mt-1 text-sm font-semibold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(selectedLineItem.budgetAmount ?? 0)}</p></div>
                    <div><label className={labelCls}>Proposed actual amount (₦) *</label><input required type="number" min="0.01" step="0.01" value={row.amount} onChange={(e) => setRow(index, { amount: e.target.value })} placeholder="Enter proposal amount" className={inputCls} style={{ fontVariantNumeric: 'tabular-nums' }} /></div>
                    <p className="col-span-2 text-xs text-slate-500">This becomes the actual against the selected AIE budget code after approval.</p>
                  </div>}
                </div>
              })}
            </div>
          )}
        </div>}

        <div>
          <label className={labelCls}>Justification *<span className="ml-2 text-xs font-normal text-slate-400">Minimum 10 characters</span></label>
          <textarea required rows={3} minLength={10} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Provide the justification for this AIE proposal…" className={`${inputCls} resize-none`} />
          {justification.trim().length > 0 && justification.trim().length < 10 && <p className="mt-1 text-xs text-amber-600">{10 - justification.trim().length} more character{10 - justification.trim().length !== 1 ? 's' : ''} needed</p>}
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes…" className={`${inputCls} resize-none`} />
        </div>
      </form>
    </Modal>
  )
}

export default BudgetProposalForm
