import { useMemo } from 'react'
import { FunnelSimple } from '@phosphor-icons/react'
import { useAIEReport } from '../../hooks/useAIE'
import { PageLoader } from '../Common/LoadingSpinner'
import { EmptyState } from '../Common/EmptyState'

const YEAR = new Date().getFullYear()

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const MONTH_LABELS: Record<string, string> = {
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
  may: 'May', june: 'Jun', july: 'Jul', august: 'Aug',
  september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
}

const fmt = (v: unknown) => {
  const n = Number(v)
  if (!n && n !== 0) return '—'
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const fmtPct = (v: unknown) => {
  const n = Number(v)
  if (isNaN(n)) return '—'
  return `${n.toFixed(1)}%`
}

// Extract budget/actual from a row for a given month.
// The API may return nested { january: { budget, actual } } or flat { januaryBudget, januaryActual }.
const getBudget = (row: Record<string, unknown>, month: string): unknown => {
  const nested = row[month]
  if (nested && typeof nested === 'object') return (nested as Record<string, unknown>).budget
  return row[`${month}Budget`] ?? row[`${month}_budget`]
}

const getActual = (row: Record<string, unknown>, month: string): unknown => {
  const nested = row[month]
  if (nested && typeof nested === 'object') return (nested as Record<string, unknown>).actual
  return row[`${month}Actual`] ?? row[`${month}_actual`]
}

interface Props {
  fiscalYear: number
  onYearChange: (year: number) => void
}

const AIEReport = ({ fiscalYear, onYearChange }: Props) => {
  const { data: rows = [], isLoading } = useAIEReport({ fiscalYear })

  // Determine which months actually have data
  const activeMonths = useMemo(() => {
    if (rows.length === 0) return []
    const first = rows[0]
    return MONTHS.filter((m) => {
      const b = getBudget(first, m)
      const a = getActual(first, m)
      return b != null || a != null
    })
  }, [rows])

  // Grand totals row
  const totals = useMemo(() => {
    const t: Record<string, { budget: number; actual: number }> = {}
    let totalAppropriation = 0
    for (const row of rows) {
      totalAppropriation += Number(row.annualAppropriation ?? row.totalAmount ?? 0)
      for (const m of activeMonths) {
        if (!t[m]) t[m] = { budget: 0, actual: 0 }
        t[m].budget += Number(getBudget(row, m) ?? 0)
        t[m].actual += Number(getActual(row, m) ?? 0)
      }
    }
    return { months: t, annualAppropriation: totalAppropriation }
  }, [rows, activeMonths])

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex items-center gap-3">
        <FunnelSimple size={15} className="text-slate-400" />
        <select
          value={fiscalYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-slate-400">Showing budget vs actual by month for FY {fiscalYear}</span>
      </div>

      {/* Report table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No report data"
            description="There is no AIE report data for this fiscal year."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* Month group header */}
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap" rowSpan={2}>Sub-Item Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide" rowSpan={2} style={{ minWidth: 160 }}>Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide whitespace-nowrap" rowSpan={2}>Annual Appropriation</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide whitespace-nowrap" rowSpan={2}>% Allocated</th>
                  {activeMonths.map((m) => (
                    <th key={m} colSpan={2} className="px-3 py-2.5 text-center text-xs font-semibold tracking-wide border-l border-slate-600">
                      {MONTH_LABELS[m] ?? m}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-700 text-slate-200">
                  {activeMonths.map((m) => (
                    <>
                      <th key={`${m}-budget`} className="px-3 py-2 text-right text-xs font-medium tracking-wide border-l border-slate-600 whitespace-nowrap">Budget</th>
                      <th key={`${m}-actual`} className="px-3 py-2 text-right text-xs font-medium tracking-wide whitespace-nowrap">Actual</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const code = String(row.subItemCode ?? row.subItemCodeId ?? row.code ?? i)
                  const label = String(row.subItemLabel ?? row.description ?? row.label ?? '')
                  const appropriation = row.annualAppropriation ?? row.totalAmount ?? row.appropriation
                  const pctAllocated = row.percentAllocated ?? row.pctAllocated ?? row.allocated

                  return (
                    <tr key={code} className={`border-t border-slate-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{code}</td>
                      <td className="px-4 py-2.5 text-slate-700 text-xs" style={{ maxWidth: 200 }}>{label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(appropriation)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                        <span className={`font-medium ${Number(pctAllocated) > 100 ? 'text-red-600' : Number(pctAllocated) >= 80 ? 'text-green-700' : 'text-slate-600'}`}>
                          {fmtPct(pctAllocated)}
                        </span>
                      </td>
                      {activeMonths.map((m) => {
                        const budget = getBudget(row, m)
                        const actual = getActual(row, m)
                        const variance = Number(actual ?? 0) - Number(budget ?? 0)
                        return (
                          <>
                            <td key={`${code}-${m}-b`} className="px-3 py-2.5 text-right text-xs text-slate-600 border-l border-slate-100 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {budget != null ? fmt(budget) : <span className="text-slate-300">—</span>}
                            </td>
                            <td key={`${code}-${m}-a`} className="px-3 py-2.5 text-right text-xs whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {actual != null ? (
                                <span className={variance < 0 ? 'text-red-600 font-medium' : 'text-slate-800'}>
                                  {fmt(actual)}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                  <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-800 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(totals.annualAppropriation)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">—</td>
                  {activeMonths.map((m) => (
                    <>
                      <td key={`tot-${m}-b`} className="px-3 py-3 text-right text-xs text-slate-800 border-l border-slate-200 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(totals.months[m]?.budget)}
                      </td>
                      <td key={`tot-${m}-a`} className="px-3 py-3 text-right text-xs text-slate-800 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(totals.months[m]?.actual)}
                      </td>
                    </>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIEReport
