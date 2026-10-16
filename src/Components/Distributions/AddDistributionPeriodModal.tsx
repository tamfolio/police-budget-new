import { useState, useEffect } from 'react'
import { CircleNotch, Plus } from '@phosphor-icons/react'
import { Modal } from '../Common/Modal'
import { useCreateDistribution } from '../../hooks/useDistributions'
import { distributionService, type DistributionView } from '../../api/services/distributionService'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../utils/errorHandlers'

// ── bi-monthly label helper ────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function biMonthLabel(id: string): string {
  const m = id.match(/^(\d{4})-(\d{2})$/)
  if (!m) return id || 'Period'
  const year  = m[1]
  const month = parseInt(m[2], 10)
  if (month < 1 || month > 12) return id
  // snap to odd-start of bi-monthly pair
  const start = month % 2 === 1 ? month : month - 1
  return `${MONTHS[start - 1]}-${MONTHS[start]} ${year}`
}

// ── types ─────────────────────────────────────────────────────────────────────
type ZoneKey = 'zone1_6' | 'zone7_12' | 'zone13_17'

interface ZoneItem  { sno: string | number; desc: string; code: string; amounts: number[] }
interface ZoneCmd   { name: string; sno: string; provision: number; snos: string[]; provisions: number[]; items: ZoneItem[]; totals: number[] }
interface ZoneGroup { [key: string]: ZoneCmd[] }

const ZONES: { key: ZoneKey; label: string }[] = [
  { key: 'zone1_6',   label: 'Zone 1 – 6' },
  { key: 'zone7_12',  label: 'Zone 7 – 12' },
  { key: 'zone13_17', label: 'Zone 13 – 17' },
]

const fmt = (v: number) =>
  `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface Props {
  open: boolean
  onClose: () => void
  view: DistributionView
}

const AddDistributionPeriodModal = ({ open, onClose, view }: Props) => {
  const [periodId,   setPeriodId]   = useState('')
  const [activeZone, setActiveZone] = useState<ZoneKey>('zone1_6')
  const [template,   setTemplate]   = useState<ZoneGroup | null>(null)
  const [data,       setData]       = useState<ZoneGroup>({})
  const [columns,    setColumns]    = useState<string[]>([])
  const [fetching,   setFetching]   = useState(false)

  const { mutate: create, isPending } = useCreateDistribution()

  const label    = biMonthLabel(periodId)
  const idValid  = /^\d{4}-\d{2}$/.test(periodId.trim())
  const hasData  = template !== null

  // ── load template ─────────────────────────────────────────────────────────
  const loadTemplate = async () => {
    if (!idValid) { toast.error('Enter a valid Period ID first (e.g. 2026-03)'); return }
    setFetching(true)
    try {
      const res = await distributionService.getTemplate(view)
      const raw = (res.data?.data ?? res.data) as { data?: ZoneGroup; columns?: string[] }
      const tplData: ZoneGroup = raw?.data ?? (raw as ZoneGroup)
      const tplCols: string[]  = raw?.columns ?? [label]

      // deep-clone so edits don't mutate the original
      const cloned: ZoneGroup = JSON.parse(JSON.stringify(tplData))

      // set all amounts to 0 for a fresh period
      for (const zk of Object.keys(cloned)) {
        for (const cmd of cloned[zk] as ZoneCmd[]) {
          cmd.items = cmd.items.map(it => ({
            ...it,
            amounts: tplCols.map(() => 0),
          }))
          cmd.totals     = tplCols.map(() => 0)
          cmd.provision  = 0
          cmd.provisions = tplCols.map(() => 0)
        }
      }

      setTemplate(tplData)
      setData(cloned)
      setColumns(tplCols)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setFetching(false)
    }
  }

  // ── amount change → recalculate totals ────────────────────────────────────
  const setAmount = (zk: ZoneKey, cmdIdx: number, itemIdx: number, colIdx: number, val: string) => {
    setData(prev => {
      const next: ZoneGroup = JSON.parse(JSON.stringify(prev))
      const cmd  = (next[zk] as ZoneCmd[])[cmdIdx]
      cmd.items[itemIdx].amounts[colIdx] = Number(val) || 0
      cmd.totals = columns.map((_, ci) =>
        cmd.items.reduce((sum, it) => sum + (it.amounts[ci] ?? 0), 0)
      )
      return next
    })
  }

  const setProvision = (zk: ZoneKey, cmdIdx: number, val: string) => {
    setData(prev => {
      const next: ZoneGroup = JSON.parse(JSON.stringify(prev))
      const cmd = (next[zk] as ZoneCmd[])[cmdIdx]
      cmd.provision  = Number(val) || 0
      cmd.provisions = columns.map(() => Number(val) || 0)
      return next
    })
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!idValid)  { toast.error('Period ID must be in YYYY-MM format'); return }
    if (!hasData)  { toast.error('Load the template first'); return }

    const col = label
    create(
      { view, payload: { id: periodId.trim(), columns: [col], data } },
      { onSuccess: handleClose }
    )
  }

  const handleClose = () => {
    setPeriodId('')
    setTemplate(null)
    setData({})
    setColumns([])
    setActiveZone('zone1_6')
    onClose()
  }

  // reset when closed externally
  useEffect(() => { if (!open) { setTemplate(null); setData({}); setColumns([]); setPeriodId('') } }, [open])

  const inpSm = 'px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-right'
  const provInp = 'px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-right w-44'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Distribution Period"
      size="xl"
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !hasData || !idValid}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Period'}
          </button>
        </>
      }
    >
      <div className="space-y-5">

        {/* ── Period ID ── */}
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Period ID *
            </label>
            <input
              value={periodId}
              onChange={e => { setPeriodId(e.target.value); setTemplate(null); setData({}) }}
              placeholder="e.g. 2026-03"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
            {periodId && (
              <p className="text-xs text-slate-400 mt-1">
                Label: <span className="font-medium text-slate-600">{label}</span>
              </p>
            )}
          </div>
          <button
            onClick={loadTemplate}
            disabled={fetching || !idValid}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {fetching
              ? <><CircleNotch size={14} className="animate-spin" /> Loading…</>
              : <><Plus size={14} /> Load Template</>}
          </button>
        </div>

        {/* ── Template not loaded yet ── */}
        {!hasData && !fetching && (
          <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center">
            <p className="text-sm text-slate-400">
              Enter a period ID and click <span className="font-medium">Load Template</span> to populate the zone structure.
            </p>
          </div>
        )}

        {/* ── Zone tabs + amount editor ── */}
        {hasData && (
          <div>
            <div className="flex gap-0.5 mb-5 border-b border-slate-100">
              {ZONES.map(z => (
                <button
                  key={z.key}
                  onClick={() => setActiveZone(z.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px rounded-t-md ${
                    activeZone === z.key
                      ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {((data[activeZone] ?? []) as ZoneCmd[]).map((cmd, cmdIdx) => (
                <div key={cmdIdx} className="border border-slate-200 rounded-xl overflow-hidden">

                  {/* Command header */}
                  <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                        {cmd.sno && <span className="text-slate-400 mr-1">{cmd.sno}.</span>}
                        {cmd.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">Provision ₦</span>
                      <input
                        type="number"
                        value={cmd.provision || ''}
                        onChange={e => setProvision(activeZone, cmdIdx, e.target.value)}
                        placeholder="0"
                        className={provInp}
                      />
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-12">S/No</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-28">Code</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Description</th>
                          {columns.map((col, ci) => (
                            <th key={ci} className="text-right px-3 py-2 font-semibold text-slate-500 w-40">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cmd.items.map((item, itemIdx) => (
                          <tr key={itemIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-400">{item.sno}</td>
                            <td className="px-3 py-2 font-mono text-slate-500">{item.code}</td>
                            <td className="px-3 py-2 text-slate-700">{item.desc}</td>
                            {columns.map((_, ci) => (
                              <td key={ci} className="px-3 py-1.5">
                                <input
                                  type="number"
                                  value={item.amounts[ci] || ''}
                                  onChange={e => setAmount(activeZone, cmdIdx, itemIdx, ci, e.target.value)}
                                  placeholder="0"
                                  className={`w-36 ${inpSm}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      {/* Row totals */}
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50">
                          <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Subtotal
                          </td>
                          {cmd.totals.map((t, ci) => (
                            <td key={ci} className="px-3 py-2 text-right text-xs font-bold text-slate-700 tabular-nums">
                              {fmt(t)}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AddDistributionPeriodModal
