import { useState } from 'react'
import { ArrowsLeftRight, CircleNotch } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { comparisonService } from '../../api/services/comparisonService'
import { normalizeList } from '../../utils/normalizeList'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

const YEAR = new Date().getFullYear()
type CompTab = 'month-over-month' | 'budget-vs-actual' | 'zones'

const Comparisons = () => {
  const [tab, setTab] = useState<CompTab>('month-over-month')
  const [fiscalYear, setFiscalYear] = useState(YEAR)

  const { data: momData, isLoading: momLoading } = useQuery({
    queryKey: ['comparisons', 'mom', fiscalYear],
    queryFn: () => comparisonService.getMonthOverMonth({ fiscalYear }),
    select: (r) => normalizeList<Record<string, unknown>>(r.data),
    enabled: tab === 'month-over-month',
  })

  const { data: bvaData, isLoading: bvaLoading } = useQuery({
    queryKey: ['comparisons', 'bva', fiscalYear],
    queryFn: () => comparisonService.getBudgetVsActual({ fiscalYear }),
    select: (r) => normalizeList<Record<string, unknown>>(r.data),
    enabled: tab === 'budget-vs-actual',
  })

  const isLoading = tab === 'month-over-month' ? momLoading : bvaLoading
  const rows: Record<string, unknown>[] =
    tab === 'month-over-month' ? (momData ?? []) :
    tab === 'budget-vs-actual' ? (bvaData ?? []) :
    []

  return (
    <div>
      <PageHeader title="Comparisons" subtitle="Compare inflows, expenditures, and budgets across periods" />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {([
            { key: 'month-over-month', label: 'Month over Month' },
            { key: 'budget-vs-actual', label: 'Budget vs Actual' },
            { key: 'zones', label: 'Zone Comparison' },
          ] as { key: CompTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ml-auto">
          {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {tab === 'zones' ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Select two zones to compare using the zone comparison tool.
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No comparison data"
            description="No data available for this period."
            icon={<ArrowsLeftRight size={28} className="text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.entries(row).map(([k, val]) => (
                      <td key={k} className={`px-4 py-3 ${k.includes('change') || k.includes('variance') ? (Number(val) >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium') : 'text-slate-700'}`}>
                        {typeof val === 'number'
                          ? val > 10000 ? `₦${val.toLocaleString()}` : val.toLocaleString()
                          : String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Comparisons
