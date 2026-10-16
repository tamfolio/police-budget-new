import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../Common/Modal'
import { useCreateFundInflow, useUpdateFundInflow } from '../../hooks/useFundInflows'
import type { FundInflow } from '../../types'

const YEAR = new Date().getFullYear()
const SOURCES = ['Federal Government Grant', 'State Government Subvention', 'IGR', 'Donor Funding', 'Other']

interface Props {
  open: boolean
  onClose: () => void
  existing?: FundInflow | null
}

const FundInflowForm = ({ open, onClose, existing }: Props) => {
  const [form, setForm] = useState({
    fiscalYear: YEAR,
    inflowDate: '',
    source: '',
    referenceNo: '',
    amount: '',
    notes: '',
  })

  useEffect(() => {
    if (existing) {
      setForm({
        fiscalYear: existing.fiscalYear,
        inflowDate: existing.inflowDate.slice(0, 10),
        source: existing.source,
        referenceNo: existing.referenceNo ?? '',
        amount: String(existing.amount),
        notes: existing.notes ?? '',
      })
    } else {
      setForm({ fiscalYear: YEAR, inflowDate: '', source: '', referenceNo: '', amount: '', notes: '' })
    }
  }, [existing, open])

  const { mutate: create, isPending: creating } = useCreateFundInflow()
  const { mutate: update, isPending: updating } = useUpdateFundInflow()
  const isPending = creating || updating

  const set = (key: string, val: string | number) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      fiscalYear: Number(form.fiscalYear),
      inflowDate: form.inflowDate,
      source: form.source,
      referenceNo: form.referenceNo || undefined,
      amount: Number(form.amount),
      notes: form.notes || undefined,
    }
    if (existing) {
      update({ id: existing.id, payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit Fund Inflow' : 'New Fund Inflow'}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="fi-form" type="submit" disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Saving…' : existing ? 'Update' : 'Create'}
          </button>
        </>
      }
    >
      <form id="fi-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fiscal Year</label>
            <select value={form.fiscalYear} onChange={(e) => set('fiscalYear', e.target.value)} className={inputCls}>
              {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Inflow Date *</label>
            <input type="date" required value={form.inflowDate} onChange={(e) => set('inflowDate', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Source *</label>
          <select required value={form.source} onChange={(e) => set('source', e.target.value)} className={inputCls}>
            <option value="">Select source…</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Amount (₦) *</label>
            <input
              type="number" required min="0.01" step="0.01"
              value={form.amount} onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00" className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Reference No.</label>
            <input
              type="text" value={form.referenceNo}
              onChange={(e) => set('referenceNo', e.target.value.toUpperCase())}
              placeholder="e.g. FMF/2024/001" className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Additional notes or comments…"
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  )
}

export default FundInflowForm
