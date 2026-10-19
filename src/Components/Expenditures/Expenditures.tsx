import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Receipt, CircleNotch, ArrowRight } from '@phosphor-icons/react'
import { expenditureService } from '../../api/services/expenditureService'
import { normalizeList } from '../../utils/normalizeList'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

const fmtCurrency = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── Summary cards ─────────────────────────────────────────────────────────────
interface ExpenditureSummary {
  distributionSummary?: {
    summary?: { name: string; allocation: number }[]
    grandTotal?: number
  }
  aieSummary?: number
}

const SummaryCard = ({ title, value, children }: { title: string; value: number; children?: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(value)}</p>
    {children}
  </div>
)

const CardLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-700 hover:text-blue-800">
    {label} <ArrowRight size={14} />
  </Link>
)

const SummaryCards = ({ summary }: { summary: ExpenditureSummary }) => {
  const distributionTotal = Number(summary.distributionSummary?.grandTotal ?? 0)
  const aieTotal = Number(summary.aieSummary ?? 0)
  const breakdown = summary.distributionSummary?.summary ?? []

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <SummaryCard title="Distribution Expenditure" value={distributionTotal}>
        {breakdown.length > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {breakdown.map((b) => `${b.name} ${fmtCurrency(Number(b.allocation))}`).join(' · ')}
          </p>
        )}
        <CardLink to="/dashboard/distributions" label="View distribution summary" />
      </SummaryCard>
      <SummaryCard title="AIE Expenditure" value={aieTotal}>
        <CardLink to="/dashboard/aie" label="View AIE records" />
      </SummaryCard>
      <SummaryCard title="Total Expenditure" value={distributionTotal + aieTotal}>
        <p className="text-xs text-slate-400 mt-1">AIE + Distribution</p>
      </SummaryCard>
    </div>
  )
}

// ── Flat table for sub-item view ──────────────────────────────────────────────
const isAmtKey = (key: string) => /amount|budget|actual|total|gross|wht/i.test(key)

const FlatTable = ({ rows }: { rows: Record<string, unknown>[] }) => {
  if (rows.length === 0) return null
  const cols = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {cols.map((key) => (
              <th
                key={key}
                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${isAmtKey(key) ? 'text-right' : 'text-left'}`}
              >
                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\bId\b/gi, 'ID').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              {cols.map((key) => {
                const val = row[key]
                const numVal = typeof val === 'number' ? val : Number(val)
                const display = isAmtKey(key) && !isNaN(numVal)
                  ? fmtCurrency(numVal)
                  : String(val ?? '—')
                return (
                  <td
                    key={key}
                    className={`px-4 py-3 text-slate-700 whitespace-nowrap ${isAmtKey(key) ? 'text-right font-medium' : ''}`}
                    style={isAmtKey(key) ? { fontVariantNumeric: 'tabular-nums' } : {}}
                  >
                    {display}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const Expenditures = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['expenditures', 'sub-item'],
    queryFn: () => expenditureService.getAll({ view: 'sub-item' }),
    select: (r) => ({
      rows: normalizeList<Record<string, unknown>>(r.data),
      summary: (r.data?.data?.summary ?? r.data?.summary) as ExpenditureSummary | undefined,
    }),
  })

  const rows: Record<string, unknown>[] = data?.rows ?? []

  return (
    <div>
      <PageHeader title="Expenditures" subtitle="View expenditure data across zones and formations" />

      {data?.summary && <SummaryCards summary={data.summary} />}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No expenditure data"
            description="No records found."
            icon={<Receipt size={28} className="text-slate-300" />}
          />
        ) : (
          <FlatTable rows={rows} />
        )}
      </div>
    </div>
  )
}

export default Expenditures
