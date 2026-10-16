import { useState } from 'react'
import { ChartBar, CircleNotch } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { reportService, type ReportView } from '../../api/services/reportService'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

const YEAR = new Date().getFullYear()
const MONTH = new Date().getMonth() + 1

const VIEWS: { key: ReportView; label: string }[] = [
  { key: 'monthly-release', label: 'Monthly Release' },
  { key: 'line-item', label: 'Line Items' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'aie', label: 'AIE' },
]

const Reports = () => {
  const [view, setView] = useState<ReportView>('monthly-release')

  const { data: cards } = useQuery({
    queryKey: ['reports', 'cards', MONTH, YEAR],
    queryFn: () => reportService.getCards({ month: MONTH, year: YEAR }),
    select: (r) => r.data.data,
  })

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', view],
    queryFn: () => reportService.getReport({ view }),
    select: (r) => r.data.data,
  })

  const rows: Record<string, unknown>[] = Array.isArray(reportData)
    ? reportData
    : (reportData?.rows ?? reportData?.data ?? reportData?.items ?? [])

  const cardItems: { label: string; value: string | number }[] = cards
    ? Object.entries(cards)
        .filter(([, v]) => typeof v !== 'object')
        .map(([label, value]) => ({ label, value: value as string | number }))
    : []

  return (
    <div>
      <PageHeader title="Reports" subtitle="Financial reports and analytics" />

      {cardItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {cardItems.slice(0, 4).map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 font-medium capitalize">{String(c.label).replace(/_/g, ' ')}</p>
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
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
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
                  {Object.keys(rows[0]).slice(0, 10).map((key) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).slice(0, 10).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {typeof val === 'number' && val > 1000
                          ? `₦${val.toLocaleString()}`
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

export default Reports
