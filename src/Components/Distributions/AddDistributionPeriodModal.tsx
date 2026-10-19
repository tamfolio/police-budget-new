import { useState, useEffect, useRef } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { Modal } from '../Common/Modal'
import { useCreateDistribution, useDistributions } from '../../hooks/useDistributions'
import { distributionService, type DistributionView } from '../../api/services/distributionService'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../utils/errorHandlers'
import DistributionPeriodPicker, { biMonthLabel } from './DistributionPeriodPicker'

// ── types ─────────────────────────────────────────────────────────────────────
type ZoneKey = 'zone1_6' | 'zone7_12' | 'zone13_17'

interface ZoneItem  { sno: string | number; desc: string; code: string; amounts: number[] }
interface ZoneCmd   { name: string; sno: string; provision: number; snos: string[]; provisions: number[]; items: ZoneItem[]; totals: number[] }
interface ZoneGroup { [key: string]: ZoneCmd[] }
interface SimpleItem { sno: string | number; desc: string; code: string; amounts: number[] }
interface SimpleSection { name: string; provisions: number[]; items: SimpleItem[] }

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
  const [sections,   setSections]   = useState<SimpleSection[] | null>(null)
  const [columns,    setColumns]    = useState<string[]>([])
  const [fetching,   setFetching]   = useState(false)
  const templateRequest = useRef(0)

  const { mutate: create, isPending } = useCreateDistribution()
  const { data: existingPeriods = [], isLoading: loadingPeriods } = useDistributions({ view })

  const label    = biMonthLabel(periodId)
  const idValid  = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodId.trim())
  const hasData  = view === 'zone' ? template !== null : sections !== null

  // ── load template ─────────────────────────────────────────────────────────
  const loadTemplate = async (selectedPeriodId: string) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedPeriodId)) return
    const requestId = ++templateRequest.current
    setFetching(true)
    try {
      const res = await distributionService.getTemplate(view)
      const raw = (res.data?.data ?? res.data) as { data?: ZoneGroup; sections?: SimpleSection[]; columns?: string[] }
      const tplCols: string[]  = [biMonthLabel(selectedPeriodId)]

      if (view === 'zone') {
        if (!raw.data) throw new Error('The Zone distribution template is invalid')
        const cloned: ZoneGroup = JSON.parse(JSON.stringify(raw.data))
        for (const zk of Object.keys(cloned)) {
          for (const cmd of cloned[zk] as ZoneCmd[]) {
            cmd.items = (cmd.items ?? []).map(it => ({ ...it, amounts: [0] }))
            cmd.totals = [0]
            cmd.provision = 0
            cmd.provisions = [0]
          }
        }
        if (requestId === templateRequest.current) {
          setTemplate(raw.data)
          setData(cloned)
          setSections(null)
          setColumns(tplCols)
        }
      } else {
        if (!raw.sections) throw new Error(`The ${view} distribution template is invalid`)
        const cloned: SimpleSection[] = JSON.parse(JSON.stringify(raw.sections))
        for (const section of cloned) {
          section.provisions = [0]
          section.items = (section.items ?? []).map(item => ({ ...item, amounts: [0] }))
        }
        if (requestId === templateRequest.current) {
          setTemplate(null)
          setData({})
          setSections(cloned)
          setColumns(tplCols)
        }
      }
    } catch (e) {
      if (requestId === templateRequest.current) toast.error(getErrorMessage(e))
    } finally {
      if (requestId === templateRequest.current) setFetching(false)
    }
  }

  useEffect(() => {
    if (!open || !idValid) {
      setTemplate(null); setData({}); setSections(null); setColumns([])
      return
    }
    void loadTemplate(periodId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, periodId, view])

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

  const setSectionAmount = (sectionIdx: number, itemIdx: number, val: string) => {
    setSections(previous => {
      if (!previous) return previous
      const next: SimpleSection[] = JSON.parse(JSON.stringify(previous))
      next[sectionIdx].items[itemIdx].amounts = [Number(val) || 0]
      return next
    })
  }

  const setSectionProvision = (sectionIdx: number, val: string) => {
    setSections(previous => {
      if (!previous) return previous
      const next: SimpleSection[] = JSON.parse(JSON.stringify(previous))
      next[sectionIdx].provisions = [Number(val) || 0]
      return next
    })
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!idValid)  { toast.error('Period ID must be in YYYY-MM format'); return }
    if (!hasData)  { toast.error('The distribution form is still loading'); return }

    const col = label
    const payload = view === 'zone'
      ? { id: periodId.trim(), columns: [col], data }
      : { id: periodId.trim(), columns: [col], sections: sections ?? [] }
    create(
      { view, payload },
      { onSuccess: handleClose }
    )
  }

  const handleClose = () => {
    setPeriodId('')
    setTemplate(null)
    setData({})
    setSections(null)
    setColumns([])
    setActiveZone('zone1_6')
    onClose()
  }

  // reset when closed externally
  useEffect(() => { if (!open) { setTemplate(null); setData({}); setSections(null); setColumns([]); setPeriodId('') } }, [open])

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
        <div className="max-w-sm">
          <DistributionPeriodPicker
            periods={existingPeriods}
            periodId={periodId}
            onChange={(id) => { setPeriodId(id); setTemplate(null); setData({}); setSections(null); setColumns([]) }}
            disabled={loadingPeriods}
          />
        </div>

        {/* ── Template not loaded yet ── */}
        {!hasData && !fetching && periodId && (
          <div className="border border-dashed border-slate-200 rounded-xl py-10 text-center">
            <p className="text-sm text-slate-400">Preparing the distribution form…</p>
          </div>
        )}

        {fetching && <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-500"><CircleNotch size={18} className="animate-spin" />Preparing the distribution form…</div>}

        {/* ── Zone tabs + amount editor ── */}
        {hasData && view === 'zone' && (
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

        {hasData && view !== 'zone' && sections && (
          <div className="space-y-4">
            {sections.map((section, sectionIdx) => {
              const subtotal = section.items.reduce((sum, item) => sum + (item.amounts[0] ?? 0), 0)
              return (
                <div key={`${section.name}-${sectionIdx}`} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-slate-100">
                    <p className="flex-1 min-w-0 text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{section.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">Provision ₦</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={section.provisions[0] || ''}
                        onChange={(event) => setSectionProvision(sectionIdx, event.target.value)}
                        placeholder="0"
                        className={provInp}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-12">S/No</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 w-28">Code</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Description</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500 w-40">{columns[0]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item, itemIdx) => (
                          <tr key={`${item.code}-${itemIdx}`} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-400">{item.sno}</td>
                            <td className="px-3 py-2 font-mono text-slate-500">{item.code}</td>
                            <td className="px-3 py-2 text-slate-700">{item.desc}</td>
                            <td className="px-3 py-1.5 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.amounts[0] || ''}
                                onChange={(event) => setSectionAmount(sectionIdx, itemIdx, event.target.value)}
                                placeholder="0"
                                className={`w-36 ${inpSm}`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50">
                          <td colSpan={3} className="px-3 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide">Subtotal</td>
                          <td className="px-3 py-2 text-right text-xs font-bold text-slate-700 tabular-nums">{fmt(subtotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AddDistributionPeriodModal
