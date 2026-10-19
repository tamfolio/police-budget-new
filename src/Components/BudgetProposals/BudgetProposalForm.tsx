import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../Common/Modal'
import { useCreateBudgetProposal } from '../../hooks/useBudgetProposals'
import { useAIEs, useAIELineItems } from '../../hooks/useAIE'
import { useDepartments } from '../../hooks/useDepartments'
import type { Department, AIE, AIELineItem } from '../../types'

const YEAR = new Date().getFullYear()

interface Props {
  open: boolean
  onClose: () => void
}

const fmt = (v: number) =>
  `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const BudgetProposalForm = ({ open, onClose }: Props) => {
  const [fiscalYear, setFiscalYear] = useState(YEAR)
  const [departmentId, setDepartmentId] = useState('')
  const [selectedAieId, setSelectedAieId] = useState('')
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')
  // lineItemId → proposed amount string; blank = skip on submit
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const { data: deptRaw } = useDepartments()
  const departments: Department[] = deptRaw ?? []

  const { data: aiesRaw } = useAIEs({ fiscalYear })
  const aies: AIE[] = aiesRaw ?? []

  // Fetch full line items for the selected AIE — the detailed endpoint includes subItemId UUID
  const { data: detailedLineItems, isLoading: lineItemsLoading } = useAIELineItems(selectedAieId)
  const rawLineItems = Array.isArray(detailedLineItems)
    ? (detailedLineItems as AIELineItem[])
    : ((detailedLineItems as Record<string, unknown>)?.items as AIELineItem[] | undefined) ?? []

  const selectedAie = aies.find((a) => a.id === selectedAieId) ?? null
  // Prefer the dedicated endpoint data (richer); fall back to embedded list
  const lineItems: AIELineItem[] = rawLineItems.length > 0
    ? rawLineItems
    : (selectedAie?.lineItems ?? [])

  const { mutate: create, isPending } = useCreateBudgetProposal()

  useEffect(() => {
    if (open) {
      setFiscalYear(YEAR)
      setDepartmentId('')
      setSelectedAieId('')
      setJustification('')
      setNotes('')
      setAmounts({})
    }
  }, [open])

  // Reset amounts when AIE changes
  useEffect(() => {
    setAmounts({})
  }, [selectedAieId])

  const setAmount = (lineItemId: string, val: string) =>
    setAmounts((prev) => ({ ...prev, [lineItemId]: val }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validItems = lineItems
      .filter((li) => {
        const v = amounts[li.id]
        return v && Number(v) > 0
      })
      .map((li) => {
        // The detailed line items endpoint may return a subItemId UUID directly
        const raw = li as AIELineItem & { subItemId?: string }
        return {
          lineItemId: li.id,
          ...(raw.subItemId ? { subItemId: raw.subItemId } : {}),
          amount: Number(amounts[li.id]),
        }
      })

    if (validItems.length === 0) return

    create(
      { fiscalYear, departmentId, justification, notes: notes || undefined, items: validItems },
      { onSuccess: onClose }
    )
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  const validItemCount = lineItems.filter((li) => {
    const v = amounts[li.id]
    return v && Number(v) > 0
  }).length

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
            disabled={isPending || !departmentId || !selectedAieId || !justification.trim() || validItemCount === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : `Create AIE Proposal${validItemCount > 0 ? ` (${validItemCount} item${validItemCount !== 1 ? 's' : ''})` : ''}`}
          </button>
        </>
      }
    >
      <form id="bp-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Fiscal Year + Department */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fiscal Year</label>
            <select value={fiscalYear} onChange={(e) => { setFiscalYear(Number(e.target.value)); setSelectedAieId('') }} className={inputCls}>
              {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Department *</label>
            <select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls}>
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AIE selector */}
        <div>
          <label className={labelCls}>AIE *</label>
          <select value={selectedAieId} onChange={(e) => setSelectedAieId(e.target.value)} className={inputCls}>
            <option value="">Select an AIE…</option>
            {aies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.aieNo} — {a.recipientUnit ?? 'No unit'} ({(a.lineItems ?? []).length} line items)
              </option>
            ))}
          </select>
          {aies.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">No AIEs found for FY {fiscalYear}.</p>
          )}
        </div>

        {/* Line items from selected AIE */}
        {selectedAie && (
          <div>
            <label className={labelCls}>
              Line Items
              <span className="ml-2 text-xs font-normal text-slate-400">
                Enter a proposed amount for each item you want to include
              </span>
            </label>
            {lineItemsLoading ? (
              <p className="text-sm text-slate-400 py-3 text-center border border-slate-200 rounded-lg">
                Loading line items…
              </p>
            ) : lineItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-3 text-center border border-slate-200 rounded-lg">
                This AIE has no line items.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_150px] bg-slate-50 border-b border-slate-200 px-3 py-2 gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sub-Item</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Budget Amt</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Proposed Amt (₦)</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {lineItems.map((li) => (
                    <div key={li.id} className="grid grid-cols-[1fr_140px_150px] items-center px-3 py-2.5 gap-3 hover:bg-slate-50">
                      <div>
                        <p className="text-sm text-slate-700 font-medium">{li.subItemLabel || li.subItemCodeId}</p>
                        {li.fulfillingProposal && (
                          <p className="text-xs text-amber-600 mt-0.5">Already has an AIE proposal</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(li.budgetAmount ?? 0)}
                      </p>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amounts[li.id] ?? ''}
                        onChange={(e) => setAmount(li.id, e.target.value)}
                        placeholder="0.00"
                        className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-right"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-400">Items with no amount or zero amount will be excluded.</p>
          </div>
        )}

        {/* Justification */}
        <div>
          <label className={labelCls}>Justification *</label>
          <textarea
            required rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Provide the justification for this AIE proposal…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes…"
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  )
}

export default BudgetProposalForm
