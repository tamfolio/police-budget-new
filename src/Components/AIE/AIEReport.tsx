import { useMemo, useState } from 'react'
import { FunnelSimple } from '@phosphor-icons/react'
import { useAIECodeActuals, useAIEReport } from '../../hooks/useAIE'
import { PageLoader } from '../Common/LoadingSpinner'
import { EmptyState } from '../Common/EmptyState'
import { Modal } from '../Common/Modal'

const YEAR = new Date().getFullYear()
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_LABELS: Record<string, string> = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
  jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
}

const fmt = (value: unknown) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const monthLabel = (key: string) => {
  const [month, year] = key.split(' ')
  return `${MONTH_LABELS[month?.toLowerCase()] ?? month ?? key} ${year ?? ''}`.trim()
}

const monthOrder = (key: string) => {
  const [month, year] = key.toLowerCase().split(' ')
  return (Number(year) || 0) * 12 + MONTHS.indexOf(month)
}

interface Props {
  fiscalYear: number
  onYearChange: (year: number) => void
}

const AIEReport = ({ fiscalYear, onYearChange }: Props) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const { data: rows = [], isLoading } = useAIEReport({ fiscalYear })
  const { data: actualData, isLoading: actualsLoading } = useAIECodeActuals(selectedCode, fiscalYear)

  const activeMonths = useMemo(() => {
    const keys = new Set<string>()
    rows.forEach((row) => {
      const months = row.months
      if (months && typeof months === 'object') {
        Object.keys(months as Record<string, unknown>).forEach((key) => keys.add(key))
      }
    })
    return [...keys].sort((a, b) => monthOrder(a) - monthOrder(b))
  }, [rows])

  const totals = useMemo(() => ({
    annualAppropriation: rows.reduce((sum, row) => sum + Number(row.annualAppropriation ?? 0), 0),
    totalBudget: rows.reduce((sum, row) => sum + Number(row.totalBudget ?? 0), 0),
    totalActual: rows.reduce((sum, row) => sum + Number(row.totalActual ?? 0), 0),
    monthlyBudgets: activeMonths.reduce<Record<string, number>>((acc, key) => {
      acc[key] = rows.reduce((sum, row) => {
        const months = row.months as Record<string, { budget?: number }> | undefined
        return sum + Number(months?.[key]?.budget ?? 0)
      }, 0)
      return acc
    }, {}),
  }), [rows, activeMonths])

  const actualDetails = Array.isArray(actualData?.details) ? actualData.details as Record<string, unknown>[] : []
  const proposalActuals = Array.isArray(actualData?.proposalActuals) ? actualData.proposalActuals as Record<string, unknown>[] : []

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex items-center gap-3">
        <FunnelSimple size={15} className="text-slate-400" />
        <select
          value={fiscalYear}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {[YEAR, YEAR - 1, YEAR - 2].map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <span className="text-sm text-slate-400">Monthly budget and accumulated AIE actuals for FY {fiscalYear}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <PageLoader /> : rows.length === 0 ? (
          <EmptyState title="No report data" description="There is no AIE report data for this fiscal year." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">Budget Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ minWidth: 180 }}>Expenditure Item</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap">Annual Appropriation</th>
                  {activeMonths.map((month) => (
                    <th key={month} className="px-3 py-3 text-right text-xs font-semibold border-l border-slate-600 whitespace-nowrap">
                      {monthLabel(month)} Budget
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold border-l border-slate-600 whitespace-nowrap">Total AIE Actuals</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const code = String(row.code ?? '')
                  const months = (row.months ?? {}) as Record<string, { budget?: number }>
                  return (
                    <tr key={code || index} className={`border-t border-slate-100 hover:bg-blue-50 ${index % 2 ? 'bg-slate-50/40' : 'bg-white'}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{code}</td>
                      <td className="px-4 py-2.5 text-slate-700 text-xs">{String(row.expenditureItem ?? '')}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-700 whitespace-nowrap">{fmt(row.annualAppropriation)}</td>
                      {activeMonths.map((month) => (
                        <td key={`${code}-${month}`} className="px-3 py-2.5 text-right text-xs text-slate-600 border-l border-slate-100 whitespace-nowrap">
                          {fmt(months[month]?.budget ?? 0)}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right text-xs border-l border-slate-100 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCode(code)}
                          aria-label={`Show AIE actual details for ${code}`}
                          className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          {fmt(row.totalActual)}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                  <td className="px-4 py-3 text-xs text-slate-700" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-800 whitespace-nowrap">{fmt(totals.annualAppropriation)}</td>
                  {activeMonths.map((month) => (
                    <td key={`total-${month}`} className="px-3 py-3 text-right text-xs text-slate-800 border-l border-slate-200 whitespace-nowrap">
                      {fmt(totals.monthlyBudgets[month])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-xs text-slate-800 border-l border-slate-200 whitespace-nowrap">{fmt(totals.totalActual)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(selectedCode)} onClose={() => setSelectedCode(null)} title={`AIE actual details · ${selectedCode ?? ''}`} size="xl">
        {actualsLoading ? <PageLoader /> : (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Workbook release details</h3>
              {actualDetails.length === 0 ? <p className="text-sm text-slate-500">No workbook release rows for this code.</p> : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500"><tr>
                      {['Month', 'Release reference', 'Date', 'Source tab', 'Description', 'Remark', 'Amount'].map((label) => <th key={label} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{label}</th>)}
                    </tr></thead>
                    <tbody>{actualDetails.map((detail, index) => {
                      const release = (detail.release ?? {}) as Record<string, unknown>
                      return <tr key={String(detail.id ?? index)} className="border-t border-slate-100">
                        <td className="px-3 py-2 whitespace-nowrap">{release.month ? monthLabel(`${MONTHS[Number(release.month) - 1]} ${fiscalYear}`) : '—'}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">{String(release.releaseRef ?? '—')}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{String(release.releaseDate ?? '—')}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{String(detail.sourceSheetName ?? '—')}</td>
                        <td className="px-3 py-2">{String(detail.expenditureDetail ?? '—')}</td>
                        <td className="px-3 py-2">{String(detail.remark ?? '—')}</td>
                        <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{fmt(detail.amount)}</td>
                      </tr>
                    })}</tbody>
                  </table>
                </div>
              )}
            </section>
            {proposalActuals.length > 0 && <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Approved proposal actuals</h3>
              <div className="space-y-2">{proposalActuals.map((proposal, index) => <div key={String(proposal.proposalId ?? index)} className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-600">{MONTH_LABELS[MONTHS[Number(proposal.month) - 1]] ?? 'Month'} · {String(proposal.proposalId)}</span>
                <span className="font-medium text-slate-800">{fmt(proposal.amount)}</span>
              </div>)}</div>
            </section>}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AIEReport
