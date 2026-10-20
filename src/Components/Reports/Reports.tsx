import { useState } from 'react'
import { ChartBar, CircleNotch } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { reportService, type ReportView } from '../../api/services/reportService'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

const YEAR = new Date().getFullYear()
const YEAR_START = `${YEAR}-01-01`
const YEAR_END = `${YEAR}-12-31`

const VIEWS: { key: ReportView; label: string }[] = [
  { key: 'monthly-release', label: 'Monthly Release' },
  { key: 'line-item', label: 'Line Items' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'aie', label: 'AIE' },
]

const Reports = () => {
  const [view, setView] = useState<ReportView>('monthly-release')
  const [from, setFrom] = useState(YEAR_START)
  const [to, setTo] = useState(YEAR_END)

  const { data: monthlySummaryRows = [] } = useQuery({
    queryKey: ['reports', 'monthly-release', from, to],
    queryFn: () => reportService.getReport({ view: 'monthly-release', from, to }),
    select: (r) => Array.isArray(r.data.data) ? r.data.data as Record<string, unknown>[] : [],
  })

  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: ['reports', view, from, to],
    queryFn: () => reportService.getReport({ view, from, to }),
    select: (r) => r.data.data,
  })

  const reportRows: Record<string, unknown>[] = Array.isArray(reportData)
    ? reportData
    : (reportData?.rows ?? reportData?.data ?? reportData?.items ?? [])
  const rows = view === 'aie'
    ? reportRows.filter((row) => {
        const issueDate = String(row.issueDate ?? '').slice(0, 10)
        return (!from || issueDate >= from) && (!to || issueDate <= to)
      })
    : reportRows

  const columns: { key: string; label: string }[] = {
    'monthly-release': [
      { key: 'month', label: 'Month' },
      { key: 'inflow', label: 'Fund inflow' },
      { key: 'aie', label: 'AIE actuals' },
      { key: 'distributed', label: 'Distributed' },
      { key: 'count', label: 'AIE line items' },
    ],
    'line-item': [
      { key: 'code', label: 'Budget code' },
      { key: 'item', label: 'Expenditure item' },
      { key: 'total', label: 'Total' },
    ],
    distribution: [
      { key: 'name', label: 'Formation' },
      { key: 'state', label: 'State' },
      { key: 'allocation', label: 'Allocation' },
    ],
    aie: [
      { key: 'aieNo', label: 'AIE number' },
      { key: 'issueDate', label: 'Issue date' },
      { key: 'recipientUnit', label: 'Recipient unit' },
      { key: 'totalAmount', label: 'Total amount' },
      { key: 'status', label: 'Status' },
      { key: 'lineItems', label: 'Line items' },
    ],
  }[view]

  const formatCell = (key: string, value: unknown) => {
    if (key === 'lineItems' && Array.isArray(value)) return value.length.toLocaleString()
    if (Array.isArray(value)) return `${value.length} items`
    if (value && typeof value === 'object') return JSON.stringify(value)
    if (value === null || value === undefined || value === '') return '—'
    const numericValue = typeof value === 'number' ? value
      : typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value)
        : null
    if (numericValue !== null && ['inflow', 'aie', 'distributed', 'total', 'allocation', 'totalAmount'].includes(key)) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency', currency: 'NGN', maximumFractionDigits: 2,
      }).format(numericValue)
    }
    return String(value)
  }

  const cardTotals = monthlySummaryRows.reduce<{
    totalAie: number
    totalDistributed: number
    totalFundInflow: number
    aieItemCount: number
  }>((totals, row) => ({
    totalAie: totals.totalAie + Number(row.aie ?? 0),
    totalDistributed: totals.totalDistributed + Number(row.distributed ?? 0),
    totalFundInflow: totals.totalFundInflow + Number(row.inflow ?? 0),
    aieItemCount: totals.aieItemCount + Number(row.count ?? 0),
  }), { totalAie: 0, totalDistributed: 0, totalFundInflow: 0, aieItemCount: 0 })
  const cardItems: { label: string; value: string | number }[] = monthlySummaryRows.length > 0
    ? [
        { label: 'Total expenditure', value: cardTotals.totalAie + cardTotals.totalDistributed },
        { label: 'AIE actuals', value: cardTotals.totalAie },
        { label: 'AIE item count', value: cardTotals.aieItemCount },
        { label: 'Fund inflow', value: cardTotals.totalFundInflow },
      ]
    : []

  return (
    <div>
      <PageHeader title="Reports" subtitle="Financial reports and analytics" />

      {cardItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {cardItems.slice(0, 4).map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 font-medium">{c.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {typeof c.value === 'number' && c.value > 1000 ? `₦${c.value.toLocaleString()}` : c.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {VIEWS.map((v) => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === v.key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}>
              {v.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700" />
        </label>
      </div>

      {view === 'monthly-release' && (
        <p className="mb-4 text-xs text-slate-500">
          Monthly figures include approved releases. A bi-monthly distribution is counted once, in the first month of its period.
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <EmptyState
            title="Could not load report"
            description={error instanceof Error ? error.message : 'The report request failed. Please try again.'}
            icon={<ChartBar size={28} className="text-slate-300" />}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No report data"
            description="No data available for this report view."
            icon={<ChartBar size={28} className="text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {columns.map(({ key, label }) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {columns.map(({ key }) => (
                      <td key={key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {formatCell(key, row[key])}
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

export default Reports
