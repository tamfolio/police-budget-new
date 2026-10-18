import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../Common/Modal'
import { useCreateBudgetProposal } from '../../hooks/useBudgetProposals'
import { useAIEs, useAIELineItemsMulti } from '../../hooks/useAIE'
import { useDepartments } from '../../hooks/useDepartments'
import type { Department, AIE, AIELineItem } from '../../types'

const YEAR = new Date().getFullYear()

interface Props {
  open: boolean
  onClose: () => void
}

// A line item tagged with the AIE it came from, so items from different
// AIEs can be merged into one list without id collisions.
interface TaggedLineItem extends AIELineItem {
  aieId: string
  aieNo: string
}

const fmt = (v: number) =>
  `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const BudgetProposalForm = ({ open, onClose }: Props) => {
  const [fiscalYear, setFiscalYear] = useState(YEAR)
  const [departmentId, setDepartmentId] = useState('')
  const [selectedAieIds, setSelectedAieIds] = useState<string[]>([])
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')
  // "aieId:lineItemId" → proposed amount string; blank = skip on submit
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const { data: deptRaw } = useDepartments()
  const departments: Department[] = deptRaw ?? []

  const { data: aiesRaw } = useAIEs({ fiscalYear })
  const aies: AIE[] = aiesRaw ?? []

  const selectedAies = aies.filter((a) => selectedAieIds.includes(a.id))
  const aieById = new Map(aies.map((a) => [a.id, a]))

  // Fetch full line items for each selected AIE — the detailed endpoint includes subItemId UUID.
  // Query order follows selectedAieIds, so results must be matched up by that same order
  // (not by `selectedAies`, whose order follows the full `aies` list instead).
  const lineItemQueries = useAIELineItemsMulti(selectedAieIds)
  const lineItemsLoading = lineItemQueries.some((q) => q.isLoading)

  const lineItems: TaggedLineItem[] = selectedAieIds.flatMap((id, idx) => {
    const aie = aieById.get(id)
    if (!aie) return []
    const response = lineItemQueries[idx]?.data as { data?: unknown } | undefined
    const detailed = response?.data
    const rawLineItems = Array.isArray(detailed)
      ? (detailed as AIELineItem[])
      : ((detailed as Record<string, unknown>)?.items as AIELineItem[] | undefined) ?? []
    const items = rawLineItems.length > 0 ? rawLineItems : (aie.lineItems ?? [])
    return items.map((li) => ({ ...li, aieId: aie.id, aieNo: aie.aieNo }))
  })

  const { mutate: create, isPending } = useCreateBudgetProposal()

  useEffect(() => {
    if (open) {
      setFiscalYear(YEAR)
      setDepartmentId('')
      setSelectedAieIds([])
      setJustification('')
      setNotes('')
      setAmounts({})
    }
  }, [open])

  // Reset amounts when the AIE selection changes
  useEffect(() => {
    setAmounts({})
  }, [selectedAieIds.join(',')])

  const toggleAie = (id: string) =>
    setSelectedAieIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const key = (li: TaggedLineItem) => `${li.aieId}:${li.id}`
  const setAmount = (k: string, val: string) =>
    setAmounts((prev) => ({ ...prev, [k]: val }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validItems = lineItems
      .filter((li) => {
        const v = amounts[key(li)]
        return v && Number(v) > 0
      })
      .map((li) => {
        // The detailed line items endpoint may return a subItemId UUID directly
        const raw = li as TaggedLineItem & { subItemId?: string }
        return {
          lineItemId: li.id,
          ...(raw.subItemId ? { subItemId: raw.subItemId } : {}),
          amount: Number(amounts[key(li)]),
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
    const v = amounts[key(li)]
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
            disabled={isPending || !departmentId || selectedAieIds.length === 0 || justification.trim().length < 10 || validItemCount === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : `Create Proposal${validItemCount > 0 ? ` (${validItemCount} item${validItemCount !== 1 ? 's' : ''})` : ''}`}
          </button>
        </>
      }
    >
      <form id="bp-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Fiscal Year + Department */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fiscal Year</label>
            <select value={fiscalYear} onChange={(e) => { setFiscalYear(Number(e.target.value)); setSelectedAieIds([]) }} className={inputCls}>
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

        {/* AIE selector — supports selecting one or several AIEs */}
        <div>
          <label className={labelCls}>
            AIE *
            <span className="ml-2 text-xs font-normal text-slate-400">Select one or more</span>
          </label>
          {aies.length === 0 ? (
            <p className="text-sm text-amber-600 py-3 text-center border border-slate-200 rounded-lg">
              No AIEs found for FY {fiscalYear}.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
              {aies.map((a) => {
                const checked = selectedAieIds.includes(a.id)
                return (
                  <label
                    key={a.id}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${checked ? 'bg-blue-50/60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAie(a.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-slate-700">
                      {a.aieNo} — {a.recipientUnit ?? 'No unit'}
                      <span className="text-slate-400"> ({(a.lineItems ?? []).length} line items)</span>
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Line items from selected AIE(s) */}
        {selectedAies.length > 0 && (
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
                Selected AIE(s) have no line items.
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
                    <div key={key(li)} className="grid grid-cols-[1fr_140px_150px] items-center px-3 py-2.5 gap-3 hover:bg-slate-50">
                      <div>
                        <p className="text-sm text-slate-700 font-medium">
                          <span className="font-mono text-xs text-slate-400 mr-1.5">{li.subItemCodeId}</span>
                          {li.subItemLabel}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {selectedAies.length > 1 && (
                            <p className="text-xs text-slate-400">{li.aieNo}</p>
                          )}
                          {li.fulfillingProposal && (
                            <p className="text-xs text-amber-600">Already has a proposal</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(li.budgetAmount ?? 0)}
                      </p>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amounts[key(li)] ?? ''}
                        onChange={(e) => setAmount(key(li), e.target.value)}
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
          <label className={labelCls}>
            Justification *
            <span className="ml-2 text-xs font-normal text-slate-400">Minimum 10 characters</span>
          </label>
          <textarea
            required rows={3} minLength={10}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Provide the justification for this budget proposal…"
            className={`${inputCls} resize-none`}
          />
          {justification.trim().length > 0 && justification.trim().length < 10 && (
            <p className="mt-1 text-xs text-amber-600">
              {10 - justification.trim().length} more character{10 - justification.trim().length !== 1 ? 's' : ''} needed
            </p>
          )}
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
