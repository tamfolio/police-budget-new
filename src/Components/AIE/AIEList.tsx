import { useState, useRef } from 'react'
import {
  Plus, Trash, UploadSimple, ChartBar, Check,
} from '@phosphor-icons/react'
import {
  useCreateAIE, useImportAIE, useReplaceAIE,
} from '../../hooks/useAIE'
import { useCurrentUser } from '../../hooks/useAuth'
import { PageHeader } from '../Common/PageHeader'
import { Modal } from '../Common/Modal'
import AIEReport from './AIEReport'
import AIEWorkbookImportQueue from './AIEWorkbookImportQueue'

const YEAR = new Date().getFullYear()

// ── Create form line item row type ────────────────────────────────────────────
interface LineRow { itemCode: string; subItemCode: string; amount: string }
const blankRow = (): LineRow => ({ itemCode: '', subItemCode: '', amount: '' })

// ── AIEList ───────────────────────────────────────────────────────────────────
const AIEList = () => {
  // Manual AIE creation remains available alongside the workbook report.
  const [yearFilter, setYearFilter] = useState(YEAR)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createYear, setCreateYear] = useState(YEAR)
  const [issueDate, setIssueDate] = useState('')
  const [recipientUnit, setRecipientUnit] = useState('')
  const [lineRows, setLineRows] = useState<LineRow[]>([blankRow()])
  const [createNotes, setCreateNotes] = useState('')

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
  const { data: currentUser } = useCurrentUser()
  const { mutate: createAIE, isPending: creating } = useCreateAIE()
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

  const resetForm = () => {
    setIssueDate('')
    setRecipientUnit(''); setLineRows([blankRow()]); setCreateNotes('')
    setCreateYear(YEAR)
  }

  const updateRow = (i: number, field: keyof LineRow, val: string) =>
    setLineRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const addRow = () => setLineRows((rows) => [...rows, blankRow()])
  const removeRow = (i: number) =>
    setLineRows((rows) => rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows)

  const formValid =
    issueDate && recipientUnit.trim() &&
    lineRows.some((r) => r.itemCode.trim() && r.subItemCode.trim() && Number(r.amount) > 0)

  const handleCreate = () => {
    const validItems = lineRows.filter(
      (r) => r.itemCode.trim() && r.subItemCode.trim() && Number(r.amount) > 0
    )
    createAIE(
      {
        fiscalYear: createYear, issueDate,
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

      {/* The AIE page now opens directly to its budget report. */}
      <div className="mb-5 w-fit rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white">
          <ChartBar size={15} /> Budget Report
        </span>
      </div>

      <AIEWorkbookImportQueue enabled={canReviewWorkbook} />

      <AIEReport fiscalYear={yearFilter} onYearChange={setYearFilter} />
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
              <label className={lbl}>Fiscal Year</label>
              <select value={createYear} onChange={(e) => setCreateYear(Number(e.target.value))} className={inp}>
                {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Issue Date <span className="text-red-500">*</span></label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inp} />
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
                : 'The import has been applied. Check the Budget Report to confirm monthly budgets and accumulated actuals.'}
            </p>
          </div>
        )}
      </Modal>

    </div>
  )
}

export default AIEList
