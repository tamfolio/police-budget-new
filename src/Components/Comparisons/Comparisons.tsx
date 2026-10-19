import { useState } from 'react'
import { ArrowsLeftRight, CircleNotch } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { comparisonService } from '../../api/services/comparisonService'
import { useDistributions, useDistributionReference } from '../../hooks/useDistributions'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import type { ZoneComparisonResult, MonthOverMonthResult, BudgetVsActualResult } from '../../types'

const YEAR = new Date().getFullYear()
type CompTab = 'month-over-month' | 'budget-vs-actual' | 'zones'

const fmt = (v: number) =>
  `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const StatCard = ({ label, amount, sub }: { label: string; amount: number; sub: string }) => (
  <div className="border border-slate-100 rounded-xl p-5">
    <p className="text-base font-semibold text-slate-800">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {fmt(amount)}
    </p>
    <p className="text-xs text-slate-400 mt-1">{sub}</p>
  </div>
)

const Comparisons = () => {
  const [tab, setTab] = useState<CompTab>('month-over-month')
  const [fiscalYear, setFiscalYear] = useState(YEAR)

  // Distribution periods (e.g. "2026-01") — shared by Budget vs Actual and Zone Comparison
  const { data: periodsData } = useDistributions({ view: 'summary' })
  const periods = periodsData ?? []

  // ── Month over Month ─────────────────────────────────────────────────────────
  const { data: momData, isFetching: momLoading } = useQuery({
    queryKey: ['comparisons', 'mom', fiscalYear],
    queryFn: () => comparisonService.getMonthOverMonth({ fiscalYear }),
    select: (r) => r.data as MonthOverMonthResult,
    enabled: tab === 'month-over-month',
  })

  // ── Budget vs Actual ─────────────────────────────────────────────────────────
  const [bvaPeriodId, setBvaPeriodId] = useState('')

  const { data: bvaData, isFetching: bvaLoading } = useQuery({
    queryKey: ['comparisons', 'bva', fiscalYear, bvaPeriodId],
    queryFn: () => comparisonService.getBudgetVsActual({ fiscalYear, periodId: bvaPeriodId }),
    select: (r) => r.data as BudgetVsActualResult,
    enabled: tab === 'budget-vs-actual' && Boolean(bvaPeriodId),
  })

  // ── Zone comparison ──────────────────────────────────────────────────────────
  const [zonePeriodId, setZonePeriodId] = useState('')
  const [zoneAId, setZoneAId] = useState('')
  const [zoneBId, setZoneBId] = useState('')

  // Zones aren't exposed by a dedicated endpoint — they live on the distributions reference payload
  const { data: distRef } = useDistributionReference('zone')
  const zones: { id: string; name: string }[] = distRef?.zones ?? []

  const zonesSelected = Boolean(zonePeriodId) && Boolean(zoneAId) && Boolean(zoneBId) && zoneAId !== zoneBId

  const { data: zoneComparison, isFetching: zoneFetching } = useQuery({
    queryKey: ['comparisons', 'zones', zonePeriodId, zoneAId, zoneBId],
    queryFn: () => comparisonService.getZones({ periodId: zonePeriodId, zoneAId, zoneBId }),
    select: (r) => r.data as ZoneComparisonResult,
    enabled: tab === 'zones' && zonesSelected,
  })

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
        {tab !== 'zones' && (
          <select value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ml-auto">
            {[YEAR, YEAR - 1, YEAR - 2].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {tab === 'month-over-month' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          {momLoading ? (
            <div className="flex items-center justify-center h-48">
              <CircleNotch size={28} className="animate-spin text-blue-600" />
            </div>
          ) : momData ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label={momData.current.label} amount={momData.current.totalAmount} sub={`${momData.current.count} entries`} />
                <StatCard label={momData.previous.label} amount={momData.previous.totalAmount} sub={`${momData.previous.count} entries`} />
              </div>
              <div className="mt-4 p-3.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                Change ({momData.current.label} vs {momData.previous.label}):{' '}
                <span className={`font-semibold ${momData.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {momData.change >= 0 ? '+' : ''}{fmt(momData.change)}
                  {momData.percentageChange != null && ` (${momData.percentageChange >= 0 ? '+' : ''}${momData.percentageChange.toFixed(1)}%)`}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No comparison data"
              description="No data available for this fiscal year."
              icon={<ArrowsLeftRight size={28} className="text-slate-300" />}
            />
          )}
        </div>
      )}

      {tab === 'budget-vs-actual' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="mb-5 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Period</label>
            <select value={bvaPeriodId} onChange={(e) => setBvaPeriodId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="">Select period…</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
            </select>
          </div>

          {!bvaPeriodId ? (
            <EmptyState
              title="Select a period"
              description="Choose a distribution period to compare budget against actual spend."
              icon={<ArrowsLeftRight size={28} className="text-slate-300" />}
            />
          ) : bvaLoading ? (
            <div className="flex items-center justify-center h-48">
              <CircleNotch size={28} className="animate-spin text-blue-600" />
            </div>
          ) : bvaData ? (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Budget" amount={bvaData.budget.totalAmount} sub={`${bvaData.budget.count} line items`} />
                <StatCard label="Actual" amount={bvaData.actual.totalAmount} sub={`${bvaData.actual.count} entries`} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                  Variance:{' '}
                  <span className={`font-semibold ${bvaData.variance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {bvaData.variance >= 0 ? '+' : ''}{fmt(bvaData.variance)}
                    {bvaData.variancePercentage != null && ` (${bvaData.variancePercentage >= 0 ? '+' : ''}${bvaData.variancePercentage.toFixed(1)}%)`}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                  Utilization rate: <span className="font-semibold text-slate-800">{bvaData.utilizationRate != null ? `${bvaData.utilizationRate.toFixed(1)}%` : '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No comparison data" description="No data available for this selection." />
          )}
        </div>
      )}

      {tab === 'zones' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Period</label>
              <select value={zonePeriodId} onChange={(e) => setZonePeriodId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="">Select period…</option>
                {periods.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Zone A</label>
              <select value={zoneAId} onChange={(e) => setZoneAId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="">Select zone…</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Zone B</label>
              <select value={zoneBId} onChange={(e) => setZoneBId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="">Select zone…</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>

          {zoneAId && zoneBId && zoneAId === zoneBId && (
            <p className="text-sm text-amber-600 mb-4">Select two different zones to compare.</p>
          )}

          {!zonesSelected ? (
            <EmptyState
              title="Select a period and two zones"
              description="Choose a period, Zone A, and Zone B to compare their distribution totals."
              icon={<ArrowsLeftRight size={28} className="text-slate-300" />}
            />
          ) : zoneFetching ? (
            <div className="flex items-center justify-center h-48">
              <CircleNotch size={28} className="animate-spin text-blue-600" />
            </div>
          ) : zoneComparison ? (
            <div>
              <p className="text-xs text-slate-400 mb-3">{zoneComparison.periodLabel}</p>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label={zoneComparison.zoneA.zoneName} amount={zoneComparison.zoneA.totalAmount} sub={`${zoneComparison.zoneA.itemCount} items`} />
                <StatCard label={zoneComparison.zoneB.zoneName} amount={zoneComparison.zoneB.totalAmount} sub={`${zoneComparison.zoneB.itemCount} items`} />
              </div>
              {(() => {
                const diff = zoneComparison.zoneA.totalAmount - zoneComparison.zoneB.totalAmount
                return (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                    Difference ({zoneComparison.zoneA.zoneName} − {zoneComparison.zoneB.zoneName}):{' '}
                    <span className={`font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{fmt(diff)}
                    </span>
                  </div>
                )
              })()}
            </div>
          ) : (
            <EmptyState title="No comparison data" description="No data available for this selection." />
          )}
        </div>
      )}
    </div>
  )
}

export default Comparisons
