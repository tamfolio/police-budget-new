import { useState } from 'react'
import { Receipt, CircleNotch } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { expenditureService, type ExpenditureView, type ExpenditureDistributionView } from '../../api/services/expenditureService'
import { normalizeList } from '../../utils/normalizeList'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

const VIEWS: { key: ExpenditureView; label: string }[] = [
  { key: 'sub-item', label: 'By Sub-item' },
  { key: 'distribution', label: 'By Distribution' },
  { key: 'aie', label: 'By AIE' },
]

const DIST_VIEWS: { key: ExpenditureDistributionView; label: string }[] = [
  { key: 'zone', label: 'Zone' },
  { key: 'formation', label: 'Formation' },
  { key: 'school', label: 'School' },
  { key: 'summary', label: 'Summary' },
]

const Expenditures = () => {
  const [view, setView] = useState<ExpenditureView>('sub-item')
  const [distView, setDistView] = useState<ExpenditureDistributionView>('zone')

  const { data, isLoading } = useQuery({
    queryKey: ['expenditures', view, view === 'distribution' ? distView : null],
    queryFn: () => expenditureService.getAll({
      view,
      ...(view === 'distribution' ? { distributionView: distView } : {}),
    }),
    select: (r) => normalizeList<Record<string, unknown>>(r.data),
  })

  const rows: Record<string, unknown>[] = data ?? []

  return (
    <div>
      <PageHeader title="Expenditures" subtitle="View expenditure data across zones and formations" />

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

        {view === 'distribution' && (
          <div className="flex gap-1 ml-3 pl-3 border-l border-slate-200">
            {DIST_VIEWS.map((v) => (
              <button key={v.key} onClick={() => setDistView(v.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  distView === v.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}>
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No expenditure data"
            description="No records found for the selected view."
            icon={<Receipt size={28} className="text-slate-300" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {Object.keys(rows[0]).slice(0, 8).map((key) => (
                    <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).slice(0, 8).map((val, j) => (
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

export default Expenditures
