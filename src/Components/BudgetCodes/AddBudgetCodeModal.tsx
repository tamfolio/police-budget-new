import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../Common/Modal'
import { useCreateBudgetCode } from '../../hooks/useBudgetCodes'
import type { BudgetCategory } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  categories: BudgetCategory[]
}

type CodeType = 'category' | 'subitem'

const AddBudgetCodeModal = ({ open, onClose, categories }: Props) => {
  const [type, setType] = useState<CodeType>('subitem')
  const [categoryCode, setCategoryCode] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [sort, setSort] = useState('')

  const { mutate: create, isPending } = useCreateBudgetCode()

  useEffect(() => {
    if (open) {
      setType('subitem')
      setCategoryCode('')
      setCode('')
      setName('')
      setSort('')
    }
  }, [open])

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

  const canSubmit = code.trim() && name.trim() && (type === 'category' || categoryCode)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    create(
      {
        code: code.trim(),
        name: name.trim(),
        ...(type === 'subitem' ? { categoryCode } : {}),
        ...(sort.trim() ? { sort: Number(sort) } : {}),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Budget Code"
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="add-code-form" type="submit" disabled={isPending || !canSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : 'Create Code'}
          </button>
        </>
      }
    >
      <form id="add-code-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {(['category', 'subitem'] as CodeType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryCode('') }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === t
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'category' ? 'Category' : 'Sub-Item'}
              </button>
            ))}
          </div>
        </div>

        {type === 'subitem' && (
          <div>
            <label className={labelCls}>Category *</label>
            <select required value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} className={inputCls}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No categories exist yet — add a category first.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Code *</label>
            <input
              required value={code} onChange={(e) => setCode(e.target.value)}
              placeholder={type === 'category' ? 'e.g. 22' : 'e.g. 22034'}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Sort Order</label>
            <input
              type="number" value={sort} onChange={(e) => setSort(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Name *</label>
          <input
            required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Local Travel & Transport"
            className={inputCls}
          />
        </div>
      </form>
    </Modal>
  )
}

export default AddBudgetCodeModal
