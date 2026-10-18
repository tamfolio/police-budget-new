import { useEffect, useRef, useState } from 'react'
import { CheckCircle, DownloadSimple, UploadSimple, WarningCircle } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { Modal } from '../Common/Modal'
import { distributionService, type DistributionView } from '../../api/services/distributionService'
import { useImportDistributionCsv } from '../../hooks/useDistributions'
import { useDistributions } from '../../hooks/useDistributions'
import { getErrorMessage } from '../../utils/errorHandlers'
import DistributionPeriodPicker, { distributionSelectStyle } from './DistributionPeriodPicker'

const HEADERS = ['unit_name', 'item_code', 'item_description', 'provision', 'amount']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], value = '', quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1 }
      else if (char === '"') quoted = false
      else value += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(value.trim()); value = '' }
    else if (char === '\n') { row.push(value.trim()); rows.push(row); row = []; value = '' }
    else if (char !== '\r') value += char
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted value')
  if (value || row.length) { row.push(value.trim()); rows.push(row) }
  return rows.filter((cells) => cells.some(Boolean))
}

interface PreviewRow {
  line: number
  values: Record<string, string>
  errors: string[]
}

function validateCsv(text: string, templateText?: string): { rows: PreviewRow[]; errors: string[] } {
  let parsed: string[][]
  try { parsed = parseCsv(text.replace(/^\uFEFF/, '')) } catch (error) {
    return { rows: [], errors: [error instanceof Error ? error.message : 'Invalid CSV'] }
  }
  if (parsed.length < 2) return { rows: [], errors: ['CSV must contain the template header and data rows'] }
  if (parsed[0].length !== HEADERS.length || parsed[0].some((header, i) => header !== HEADERS[i])) {
    return { rows: [], errors: [`Headers must exactly match: ${HEADERS.join(', ')}`] }
  }
  const errors: string[] = []
  const expectedRows = templateText ? parseCsv(templateText.replace(/^\uFEFF/, '')).slice(1) : []
  if (expectedRows.length && parsed.length - 1 !== expectedRows.length) {
    errors.push(`Expected ${expectedRows.length} template rows but received ${parsed.length - 1}`)
  }
  const money = /^\d+(?:\.\d{1,2})?$/
  const rows = parsed.slice(1).map((cells, index): PreviewRow => {
    const line = index + 2
    const rowErrors: string[] = []
    if (cells.length !== HEADERS.length) {
      rowErrors.push(`Expected ${HEADERS.length} columns`)
      return { line, values: Object.fromEntries(HEADERS.map((header, i) => [header, cells[i] ?? ''])), errors: rowErrors }
    }
    const [unitName, itemCode, itemDescription, provision, amount] = cells
    const type = itemCode || itemDescription ? 'item' : 'unit'
    const expected = expectedRows[index]
    if (expected) {
      HEADERS.slice(0, 3).forEach((field, fieldIndex) => {
        if (cells[fieldIndex] !== expected[fieldIndex]) rowErrors.push(`${field} was changed from the official template`)
      })
    }
    if (!unitName) rowErrors.push('Unit name is required')
    if (type === 'unit') {
      if (provision && !money.test(provision)) rowErrors.push('Provision must be a non-negative number with at most 2 decimals')
      if (amount) rowErrors.push('Amount must be blank on provision rows')
    }
    if (type === 'item') {
      if (!itemCode || !itemDescription) rowErrors.push('Item code and description are required')
      if (amount && !money.test(amount)) rowErrors.push('Amount must be a non-negative number with at most 2 decimals')
      if (provision) rowErrors.push('Provision must be blank on line-item rows')
    }
    return { line, values: Object.fromEntries(HEADERS.map((header, i) => [header, cells[i] ?? ''])), errors: rowErrors }
  })
  return { rows, errors }
}

interface Props { open: boolean; onClose: () => void; initialView: DistributionView }

const ImportDistributionCsvModal = ({ open, onClose, initialView }: Props) => {
  const [view, setView] = useState<Exclude<DistributionView, 'summary'>>(initialView === 'summary' ? 'zone' : initialView)
  const [periodId, setPeriodId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [tab, setTab] = useState<'all' | 'valid' | 'invalid'>('all')
  const [downloading, setDownloading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [templateCsv, setTemplateCsv] = useState<{ blob: Blob; text: string } | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: importCsv, isPending } = useImportDistributionCsv()
  const { data: existingPeriods = [], isLoading: loadingPeriods } = useDistributions({ view })
  const periodValid = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodId)

  useEffect(() => {
    if (open) setView(initialView === 'summary' ? 'zone' : initialView)
  }, [open, initialView])

  useEffect(() => {
    let current = true
    setTemplateCsv(null)
    setLoadingTemplate(false)
    if (!open || !periodValid) return () => { current = false }
    setLoadingTemplate(true)
    void distributionService.getCsvTemplate(view, periodId)
      .then(async (response) => {
        const blob = response.data as Blob
        const text = await blob.text()
        if (current) setTemplateCsv({ blob, text })
      })
      .catch((error) => { if (current) toast.error(getErrorMessage(error)) })
      .finally(() => { if (current) setLoadingTemplate(false) })
    return () => { current = false }
  }, [open, periodId, periodValid, view])

  const reset = () => { setFile(null); setErrors([]); setPreviewRows([]); setTemplateCsv(null); setStep('select'); setTab('all'); setPeriodId(''); onClose() }
  const download = async () => {
    if (!periodValid) { toast.error('Enter a valid period ID in YYYY-MM format'); return }
    setDownloading(true)
    try {
      const blob = templateCsv?.blob ?? (await distributionService.getCsvTemplate(view, periodId)).data as Blob
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `distribution-${view}-${periodId}.csv`; anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) { toast.error(getErrorMessage(error)) } finally { setDownloading(false) }
  }
  const chooseFile = async (next: File | null) => {
    setFile(next); setErrors([]); setPreviewRows([]); setStep('select')
    if (!next) return
    if (!next.name.toLowerCase().endsWith('.csv')) { setErrors(['Only .csv files are accepted']); return }
    if (next.size > MAX_FILE_SIZE) { setErrors(['CSV must not exceed 10 MB']); return }
    if (!periodValid) { setErrors(['Enter a valid period ID before selecting the CSV']); return }
    setValidating(true)
    try {
      const text = await next.text()
      const templateText = templateCsv?.text ?? await ((await distributionService.getCsvTemplate(view, periodId)).data as Blob).text()
      const result = validateCsv(text, templateText)
      setErrors(result.errors); setPreviewRows(result.rows)
    } catch (error) {
      setErrors([getErrorMessage(error)])
    } finally {
      setValidating(false)
    }
  }
  const submit = () => {
    if (!file || !periodValid || errors.length || previewRows.some((row) => row.errors.length)) return
    const formData = new FormData()
    formData.append('file', file); formData.append('periodId', periodId)
    importCsv({ view, formData }, {
      onSuccess: reset,
      onError: (error: unknown) => {
        const response = (error as { response?: { data?: { error?: { details?: { errors?: Array<{ row: number; field: string; message: string }> } } } } }).response
        const serverErrors = response?.data?.error?.details?.errors
        if (serverErrors?.length) {
          setPreviewRows((rows) => rows.map((row) => ({
            ...row,
            errors: [...row.errors, ...serverErrors.filter((item) => item.row === row.line).map((item) => `${item.field}: ${item.message}`)],
          })))
          setStep('preview'); setTab('invalid')
        }
      },
    })
  }

  const invalidCount = previewRows.filter((row) => row.errors.length > 0).length
  const validCount = previewRows.length - invalidCount
  const visibleRows = previewRows.filter((row) => tab === 'all' || (tab === 'valid' ? row.errors.length === 0 : row.errors.length > 0))
  const canReview = Boolean(file && periodValid && !validating && previewRows.length > 0)
  const canUpload = canReview && errors.length === 0 && invalidCount === 0

  return (
    <Modal open={open} onClose={reset} title={step === 'select' ? 'Import Distribution CSV' : 'Review Distribution Import'} size="xl" footer={<>
      {step === 'select' ? <>
        <button onClick={reset} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg">Cancel</button>
        <button onClick={() => setStep('preview')} disabled={!canReview} className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg disabled:opacity-50">Review CSV</button>
      </> : <>
        <button onClick={() => setStep('select')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg">Back</button>
        <button onClick={submit} disabled={!canUpload || isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg disabled:opacity-50">
          {isPending ? 'Uploading…' : invalidCount ? `Resolve ${invalidCount} invalid row${invalidCount === 1 ? '' : 's'}` : 'Upload now'}
        </button>
      </>}
    </>}>
      {step === 'select' ? <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Distribution View</label>
            <select value={view} onChange={(e) => { setView(e.target.value as typeof view); setFile(null); setErrors([]); setPreviewRows([]) }} style={distributionSelectStyle}>
              <option value="zone">Zone</option><option value="formations">Formations</option><option value="schools">Schools</option>
            </select>
          </div>
          <DistributionPeriodPicker key={view} periods={existingPeriods} periodId={periodId} disabled={loadingPeriods} onChange={(id) => { setPeriodId(id); setFile(null); setErrors([]); setPreviewRows([]) }} />
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-slate-800">Start with the official template</p><p className="text-xs text-slate-500 mt-1">Do not alter the first three columns. Fill Provision where Item Code is blank, and Amount on line-item rows.</p></div>
          <button onClick={download} disabled={!periodValid || downloading || loadingTemplate} className="shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg disabled:opacity-50"><DownloadSimple size={16} />{downloading || loadingTemplate ? 'Preparing…' : 'Download sample'}</button>
        </div>
        <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-lg p-7 text-center cursor-pointer hover:border-blue-400">
          <UploadSimple size={26} className="mx-auto text-slate-300 mb-2" /><p className="text-sm font-medium text-slate-700">{validating ? 'Validating against template…' : file?.name ?? 'Select completed CSV'}</p><p className="text-xs text-slate-400 mt-1">CSV only · maximum 10 MB</p>
        </div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void chooseFile(e.target.files?.[0] ?? null)} />
        {file && errors.length === 0 && previewRows.length > 0 && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3"><CheckCircle size={18} weight="fill" />CSV read successfully. Click Review CSV to inspect {previewRows.length} rows before uploading.</div>}
        {errors.length > 0 && <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3"><div className="font-semibold flex items-center gap-2 mb-2"><WarningCircle size={18} weight="fill" />Unable to preview this file</div>{errors.map((error, i) => <p key={i}>{error}</p>)}</div>}
      </div> : <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-slate-800">{file?.name}</p><p className="text-xs text-slate-500">Blank Provision and Amount cells will be imported as ₦0.00.</p></div>
          <div className="flex gap-2 text-xs"><span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{previewRows.length} total</span><span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700">{validCount} valid</span><span className={`px-2.5 py-1 rounded-full ${invalidCount ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{invalidCount} invalid</span></div>
        </div>
        {errors.length > 0 && <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3"><WarningCircle size={18} weight="fill" className="shrink-0" /><div>{errors.map((error, i) => <p key={i}>{error}</p>)}</div></div>}
        <div className="flex gap-1 border-b border-slate-200">
          {(['all', 'valid', 'invalid'] as const).map((key) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === key ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500'}`}>{key} ({key === 'all' ? previewRows.length : key === 'valid' ? validCount : invalidCount})</button>)}
        </div>
        <div className="border border-slate-200 rounded-lg overflow-auto max-h-[55vh]">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10"><tr><th className="p-2 text-left">Row</th><th className="p-2 text-left">Unit</th><th className="p-2 text-left">Item Code</th><th className="p-2 text-left">Description</th><th className="p-2 text-right">Provision</th><th className="p-2 text-right">Amount</th><th className="p-2 text-left">Status</th></tr></thead>
            <tbody>{visibleRows.map((row) => <tr key={row.line} className={row.errors.length ? 'bg-red-50 border-t border-red-100' : 'border-t border-slate-100'}>
              <td className="p-2 text-slate-400">{row.line}</td><td className="p-2 font-medium text-slate-700">{row.values.unit_name}</td><td className="p-2 font-mono text-slate-600">{row.values.item_code || '—'}</td><td className="p-2 text-slate-600">{row.values.item_description || <span className="text-slate-400">Provision row</span>}</td><td className="p-2 text-right tabular-nums">{row.values.provision || '0.00'}</td><td className="p-2 text-right tabular-nums">{row.values.amount || '0.00'}</td>
              <td className="p-2">{row.errors.length ? <div className="text-red-700 space-y-1">{row.errors.map((error, i) => <div key={i} className="flex gap-1"><WarningCircle size={14} className="shrink-0 mt-0.5" />{error}</div>)}</div> : <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle size={14} weight="fill" />Valid</span>}</td>
            </tr>)}</tbody>
          </table>
          {visibleRows.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No rows in this tab.</div>}
        </div>
        {invalidCount > 0 && <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3"><WarningCircle size={18} weight="fill" className="shrink-0" />Fix the highlighted rows in the CSV and select the corrected file. Upload is disabled while errors remain.</div>}
      </div>}
    </Modal>
  )
}

export default ImportDistributionCsvModal
