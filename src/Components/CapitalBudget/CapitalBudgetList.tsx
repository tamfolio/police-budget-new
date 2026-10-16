import { useState, useRef } from 'react'
import {
  Plus, UploadSimple, MagnifyingGlass, FunnelSimple,
  Trash, CheckCircle, XCircle, Warning, FileArrowUp,
} from '@phosphor-icons/react'
import {
  useCapitalBudgetItems,
  useCreateCapitalBudgetItem,
  useDeleteCapitalBudgetItem,
  useImportPreview,
  useImportCommit,
} from '../../hooks/useCapitalBudget'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import type { CapitalBudgetItem, CapitalBudgetItemType, CapitalBudgetImportPreview } from '../../types'

const YEAR = new Date().getFullYear()
const YEARS = [YEAR, YEAR - 1, YEAR - 2, YEAR + 1]

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TypeBadge = ({ type }: { type?: CapitalBudgetItemType }) => {
  if (!type) return <span style={{ color: '#d1d5db' }}>—</span>
  const isOngoing = type === 'ONGOING'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: isOngoing ? '#eff6ff' : '#f0fdf4',
      color: isOngoing ? '#1d4ed8' : '#15803d',
    }}>
      {type}
    </span>
  )
}

// ── Add Row Manually form ─────────────────────────────────────────────────────
const AddRowForm = ({ onClose }: { onClose: () => void }) => {
  const { mutate: create, isPending } = useCreateCapitalBudgetItem()
  const [form, setForm] = useState({
    title: '', entity: '', ergCode: '', description: '',
    fiscalYear: YEAR, type: '' as '' | CapitalBudgetItemType,
    amountNgn: '', page: '', currency: 'NGN',
  })

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const valid = form.title.trim() && form.entity.trim() && form.ergCode.trim() && form.description.trim()

  const handleSubmit = () => {
    create({
      title: form.title.trim(),
      entity: form.entity.trim(),
      ergCode: form.ergCode.trim(),
      description: form.description.trim(),
      fiscalYear: form.fiscalYear,
      ...(form.type ? { type: form.type as CapitalBudgetItemType } : {}),
      ...(form.amountNgn !== '' ? { amountNgn: Number(form.amountNgn) } : {}),
      ...(form.page !== '' ? { page: Number(form.page) } : {}),
      currency: form.currency || 'NGN',
    }, { onSuccess: onClose })
  }

  const inp = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
  const lbl = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={lbl}>Title <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Construction of Police Barracks" className={inp} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Entity / MDA <span className="text-red-500">*</span></label>
          <input value={form.entity} onChange={(e) => set('entity', e.target.value)} placeholder="e.g. NPF Headquarters" className={inp} />
        </div>
        <div>
          <label className={lbl}>ERG Code <span className="text-red-500">*</span></label>
          <input value={form.ergCode} onChange={(e) => set('ergCode', e.target.value)} placeholder="e.g. 2301" className={inp} />
        </div>
        <div>
          <label className={lbl}>Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inp}>
            <option value="">— Select —</option>
            <option value="ONGOING">Ongoing</option>
            <option value="NEW">New</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Description <span className="text-red-500">*</span></label>
          <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Brief description of the capital project" className={`${inp} resize-none`} />
        </div>
        <div>
          <label className={lbl}>Amount (NGN)</label>
          <input type="number" min={0} value={form.amountNgn} onChange={(e) => set('amountNgn', e.target.value)} placeholder="0.00" className={inp} />
        </div>
        <div>
          <label className={lbl}>Fiscal Year</label>
          <select value={form.fiscalYear} onChange={(e) => set('fiscalYear', Number(e.target.value))} className={inp}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Source Page</label>
          <input type="number" min={1} value={form.page} onChange={(e) => set('page', e.target.value)} placeholder="Page in budget document" className={inp} />
        </div>
        <div>
          <label className={lbl}>Currency</label>
          <input value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="NGN" className={inp} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!valid || isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50">
          {isPending ? 'Creating…' : 'Create Item'}
        </button>
      </div>
    </div>
  )
}

// ── CSV import flow ───────────────────────────────────────────────────────────
type ImportStep = 'upload' | 'preview' | 'done'

const ImportFlow = ({ onClose }: { onClose: () => void }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [entity, setEntity] = useState('')
  const [fiscalYear, setFiscalYear] = useState(YEAR)
  const [preview, setPreview] = useState<CapitalBudgetImportPreview | null>(null)

  const { mutate: doPreview, isPending: previewing } = useImportPreview()
  const { mutate: doCommit, isPending: committing } = useImportCommit()

  const inp = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
  const lbl = 'block text-sm font-medium text-slate-700 mb-1.5'

  const handlePreview = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title.trim())
    fd.append('entity', entity.trim())
    fd.append('fiscalYear', String(fiscalYear))
    doPreview(fd, {
      onSuccess: (res) => {
        const d = res.data?.data ?? res.data
        setPreview(d)
        setStep('preview')
      },
    })
  }

  const handleCommit = () => {
    if (!preview) return
    doCommit(
      { rows: preview.valid.map((r) => r.data), fileName: file?.name },
      { onSuccess: () => setStep('done') }
    )
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} weight="fill" className="text-green-500 mx-auto mb-3" />
        <p className="text-slate-800 font-semibold text-base mb-1">Import complete</p>
        <p className="text-slate-500 text-sm mb-6">
          {preview?.validCount ?? 0} rows have been saved to Capital Budget.
        </p>
        <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800">
          Done
        </button>
      </div>
    )
  }

  if (step === 'preview' && preview) {
    const { valid, invalid, totalRows, validCount, invalidCount } = preview
    return (
      <div className="space-y-4">
        {/* Summary chips */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total rows', value: totalRows, color: '#374151', bg: '#f1f5f9' },
            { label: 'Valid', value: validCount, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Invalid', value: invalidCount, color: '#b91c1c', bg: '#fef2f2' },
          ].map((c) => (
            <div key={c.label} style={{ padding: '8px 16px', borderRadius: 8, background: c.bg }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Invalid rows */}
        {invalid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
              <XCircle size={13} weight="fill" /> Rows with errors (will be skipped)
            </p>
            <div className="border border-red-100 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {invalid.map((r) => (
                <div key={r.rowNumber} className="px-3 py-2 border-b border-red-50 last:border-0">
                  <span className="text-xs font-mono text-red-700">Row {r.rowNumber}</span>
                  {r.errors?.map((err, i) => (
                    <span key={i} className="ml-2 text-xs text-red-600">{err}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Valid rows preview */}
        {valid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
              <CheckCircle size={13} weight="fill" /> Valid rows to be imported
            </p>
            <div className="border border-green-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    {['Row', 'ERG Code', 'Description', 'Type', 'Amount'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-green-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {valid.map((r) => (
                    <tr key={r.rowNumber} className="border-b border-green-50 last:border-0">
                      <td className="px-3 py-1.5 font-mono text-slate-400">{r.rowNumber}</td>
                      <td className="px-3 py-1.5 font-mono">{String(r.data.erg_code ?? '—')}</td>
                      <td className="px-3 py-1.5 text-slate-600 max-w-[200px] truncate">{String(r.data.description ?? '—')}</td>
                      <td className="px-3 py-1.5">{String(r.data.type ?? '—')}</td>
                      <td className="px-3 py-1.5 text-right">{r.data.amount_ngn != null ? fmt(Number(r.data.amount_ngn)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {validCount === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
            <Warning size={16} weight="fill" /> No valid rows found. Fix the errors above and re-upload.
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2 border-t border-slate-100">
          <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            ← Back
          </button>
          <button
            onClick={handleCommit}
            disabled={validCount === 0 || committing}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            {committing ? 'Importing…' : `Import ${validCount} row${validCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    )
  }

  // Upload step
  const canPreview = file && title.trim() && entity.trim()
  return (
    <div className="space-y-4">
      {/* File drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #cbd5e1',
          borderRadius: 10,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: file ? '#f0fdf4' : '#fafafa',
          transition: 'all 0.15s',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <FileArrowUp size={32} className="mx-auto mb-2 text-slate-300" style={{ color: file ? '#16a34a' : undefined }} />
        {file ? (
          <p className="text-sm font-semibold text-green-700">{file.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600">Click to select CSV file</p>
            <p className="text-xs text-slate-400 mt-1">Columns: <span className="font-mono">erg_code, description, type, amount_ngn, page</span></p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={lbl}>Batch Title <span className="text-red-500">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2026 Capital Projects" className={inp} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Entity / MDA <span className="text-red-500">*</span></label>
          <input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="e.g. NPF Headquarters" className={inp} />
        </div>
        <div>
          <label className={lbl}>Fiscal Year</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} className={inp}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handlePreview}
          disabled={!canPreview || previewing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
        >
          <UploadSimple size={15} /> {previewing ? 'Validating…' : 'Validate & Preview'}
        </button>
      </div>
    </div>
  )
}

// ── CapitalBudgetList ─────────────────────────────────────────────────────────
const CapitalBudgetList = () => {
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<number | ''>('')
  const [typeFilter, setTypeFilter] = useState<'' | CapitalBudgetItemType>('')
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useCapitalBudgetItems({
    ...(yearFilter ? { fiscalYear: yearFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(search ? { search } : {}),
  })
  const { mutate: deleteItem, isPending: deleting } = useDeleteCapitalBudgetItem()

  const items: CapitalBudgetItem[] = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Capital Budget"
        subtitle="Capital budget appropriation line items"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors"
            >
              <UploadSimple size={15} weight="bold" /> Import CSV
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Plus size={16} weight="bold" /> Add Row Manually
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, entity, ERG code…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelSimple size={15} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | CapitalBudgetItemType)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All types</option>
            <option value="ONGOING">Ongoing</option>
            <option value="NEW">New</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : '')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <EmptyState
            title="No capital budget items"
            description='Add items manually or import from a CSV file.'
            action={
              <div className="flex gap-2 justify-center">
                <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <UploadSimple size={15} /> Import CSV
                </button>
                <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800">
                  <Plus size={15} /> Add Row
                </button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Title', 'Entity', 'ERG Code', 'Type', 'Amount (NGN)', 'Year', ''].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Amount (NGN)' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[220px]">
                      <span className="line-clamp-2">{item.title}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[160px]">
                      <span className="truncate block">{item.entity}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.ergCode}</td>
                    <td className="px-4 py-3"><TypeBadge type={item.type} /></td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(item.amountNgn)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.fiscalYear ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(item.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Row modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Capital Budget Item" size="md">
        <AddRowForm onClose={() => setAddOpen(false)} />
      </Modal>

      {/* Import CSV modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false) }}
        title="Import Capital Budget CSV"
        size="lg"
      >
        <ImportFlow onClose={() => setImportOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteItem(deleteId!, { onSuccess: () => setDeleteId(null) }) }}
        title="Delete Item"
        message="Delete this capital budget item? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default CapitalBudgetList
