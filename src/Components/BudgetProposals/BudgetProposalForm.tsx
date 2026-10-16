import { useState, useEffect, type FormEvent } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { Modal } from '../Common/Modal'
import { useCreateBudgetProposal } from '../../hooks/useBudgetProposals'
import { useDepartments } from '../../hooks/useDepartments'
import type { Department } from '../../types'

const YEAR = new Date().getFullYear()

interface LineItemRow {
  lineItemId: string
  subItemId: string
  amount: string
}

interface Props {
  open: boolean
  onClose: () => void
}

const BudgetProposalForm = ({ open, onClose }: Props) => {
  const [fiscalYear, setFiscalYear] = useState(YEAR)
  const [departmentId, setDepartmentId] = useState('')
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItemRow[]>([{ lineItemId: '', subItemId: '', amount: '' }])

  const { data: deptRaw } = useDepartments()
  const departments: Department[] = Array.isArray(deptRaw) ? deptRaw : []

  const { mutate: create, isPending } = useCreateBudgetProposal()

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFiscalYear(YEAR)
      setDepartmentId('')
      setJustification('')
      setNotes('')
      setItems([{ lineItemId: '', subItemId: '', amount: '' }])
    }
  }, [open])

  const addItem = () => setItems((prev) => [...prev, { lineItemId: '', subItemId: '', amount: '' }])

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const updateItem = (idx: number, field: keyof LineItemRow, val: string) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((it) => it.lineItemId.trim() && it.subItemId.trim() && it.amount)
    create(
      {
        fiscalYear,
        departmentId,
        justification,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          lineItemId: it.lineItemId.trim(),
          subItemId: it.subItemId.trim(),
          amount: Number(it.amount),
        })),
      },
      { onSuccess: onClose }
    )
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Budget Proposal"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="bp-form" type="submit" disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : 'Create Proposal'}
          </button>
        </>
      }
    >
      <form id="bp-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fiscal Year</label>
            <select value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} className={inputCls}>
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

        <div>
          <label className={labelCls}>Justification *</label>
          <textarea
            required rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Provide the justification for this budget proposal…"
            className={`${inputCls} resize-none`}
          />
        </div>

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

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`${labelCls} mb-0`}>Line Items</label>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              <Plus size={13} weight="bold" /> Add Item
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_160px_36px] bg-slate-50 border-b border-slate-200 px-3 py-2 gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Item ID</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sub-Item ID</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (₦)</span>
              <span />
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_160px_36px] items-center px-3 py-2 gap-3">
                  <input
                    type="text"
                    value={item.lineItemId}
                    onChange={(e) => updateItem(idx, 'lineItemId', e.target.value)}
                    placeholder="AIE line item ID…"
                    className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <input
                    type="text"
                    value={item.subItemId}
                    onChange={(e) => updateItem(idx, 'subItemId', e.target.value)}
                    placeholder="Sub-item ID…"
                    className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-right"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Items missing an ID or with zero amount will be skipped.</p>
        </div>
      </form>
    </Modal>
  )
}

export default BudgetProposalForm
