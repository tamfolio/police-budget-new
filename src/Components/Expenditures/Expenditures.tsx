import { useState } from 'react'
import { Receipt, CircleNotch, CaretDown, CaretRight } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { expenditureService, type ExpenditureView, type ExpenditureDistributionView } from '../../api/services/expenditureService'
import { normalizeList } from '../../utils/normalizeList'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'

interface AieLineItemShape {
  id: string
  itemCodeId: string
  subItemCodeId: string
  subItemLabel: string
  budgetAmount: number
  fulfillingProposal: { amount: number; status: string } | null
}

interface AieRecordShape {
  id: string
  aieNo: string
  issueDate: string
  expiresOn: string
  totalAmount: number
  status: string
  lineItems: AieLineItemShape[]
}

interface DistributionItem {
  sno: number | string | null
  code: string
  desc: string
  amounts: number[]
}

interface DistributionUnit {
  sno: string | null
  name: string
  snos: string[]
  items: DistributionItem[]
}

interface DistributionSection {
  name: string
  items: DistributionItem[]
  provisions: (number | null)[]
}

const VIEWS: { key: ExpenditureView; label: string }[] = [
  { key: 'sub-item', label: 'By Sub-item' },
  { key: 'distribution', label: 'By Distribution' },
  { key: 'aie', label: 'By AIE' },
]

const DIST_VIEWS: { key: ExpenditureDistributionView; label: string }[] = [
  { key: 'zone', label: 'Zone' },
  { key: 'formations', label: 'Formations' },
  { key: 'schools', label: 'Schools' },
  { key: 'summary', label: 'Summary' },
]

const fmtCurrency = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── Shared items table used by both distribution shapes ───────────────────────
const ItemsTable = ({ items, provision }: { items: DistributionItem[]; provision?: number | null }) => (
  <div className="overflow-x-auto">
    <table className="w-full" style={{ fontSize: 12 }}>
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          <th className="text-left px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5, width: 70 }}>S/No</th>
          <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Code</th>
          <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wide" style={{ fontSize: 10.5 }}>Description</th>
          <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Amount (₦)</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, ii) => {
          const total = (item.amounts ?? []).reduce((s: number, a: number | null) => s + (a ?? 0), 0)
          const hasAmount = (item.amounts ?? []).some((a) => a != null)
          return (
            <tr
              key={ii}
              className={`border-t border-slate-50 hover:bg-blue-50 transition-colors ${ii % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              <td className="px-5 py-1.5 text-slate-400">{item.sno ?? ''}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500 whitespace-nowrap">{item.code}</td>
              <td className="px-3 py-1.5 text-slate-700">{item.desc}</td>
              <td className="px-5 py-1.5 text-right text-slate-800 font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {hasAmount ? fmtCurrency(total) : '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
      {provision != null && (
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={3} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Provision</td>
            <td className="px-5 py-2 text-right text-sm font-bold text-slate-900 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtCurrency(provision)}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
)

// ── Distribution renderer — handles two shapes:
//   Zone:       period.data  → { [groupKey]: DistributionUnit[] }
//   Formations: period.sections → DistributionSection[]
const DistributionTable = ({ rows }: { rows: Record<string, unknown>[] }) => (
  <div>
    {rows.map((period) => {
      const periodId = String(period.id ?? '')
      const periodLabel = period.label ? String(period.label) : periodId

      const sections = period.sections as DistributionSection[] | undefined
      const groupData = period.data as Record<string, DistributionUnit[]> | undefined

      return (
        <div key={periodId}>
          <div className="px-5 py-2.5 flex items-center gap-3" style={{ background: '#0d2137' }}>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Period</span>
            <span className="text-sm font-semibold text-white">{periodLabel}</span>
          </div>

          {Array.isArray(period.rows) ? (
            // Summary shape: flat rows with name / fromDist / allocation
            (() => {
              const summaryRows = period.rows as { name: string; fromDist: number; allocation: number }[]
              const totalFromDist = summaryRows.reduce((s, r) => s + (r.fromDist ?? 0), 0)
              const totalAllocation = summaryRows.reduce((s, r) => s + (r.allocation ?? 0), 0)
              return (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: 12 }}>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide" style={{ fontSize: 10.5 }}>#</th>
                        <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wide" style={{ fontSize: 10.5 }}>Name</th>
                        <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>From Distribution (₦)</th>
                        <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Allocation (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map((row, ri) => (
                        <tr key={ri} className={`border-t border-slate-50 hover:bg-blue-50 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="px-5 py-1.5 text-slate-400 tabular-nums">{ri + 1}</td>
                          <td className="px-3 py-1.5 text-slate-700">{row.name}</td>
                          <td className="px-5 py-1.5 text-right text-slate-800 font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(row.fromDist ?? 0)}</td>
                          <td className="px-5 py-1.5 text-right text-slate-800 font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(row.allocation ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={2} className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Grand Total</td>
                        <td className="px-5 py-2 text-right text-sm font-bold text-slate-900 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(totalFromDist)}</td>
                        <td className="px-5 py-2 text-right text-sm font-bold text-slate-900 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(totalAllocation)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })()
          ) : sections ? (
            // Formations / Schools shape: flat sections array
            sections.map((section, si) => (
              <div key={si} className="border-b border-slate-100">
                <div className="px-5 py-2.5 bg-slate-100 border-y border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                    {section.name}
                  </p>
                </div>
                {section.items && section.items.length > 0 && (
                  <ItemsTable
                    items={section.items}
                    provision={
                      section.provisions
                        ? section.provisions.reduce<number>((s, a) => s + (a ?? 0), 0)
                        : null
                    }
                  />
                )}
              </div>
            ))
          ) : groupData ? (
            // Zone shape: grouped by key → units → items
            Object.entries(groupData).map(([groupKey, units]) => (
              <div key={groupKey}>
                <div className="px-5 py-2 bg-slate-100 border-y border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {groupKey.replace(/_/g, ' ')}
                  </p>
                </div>
                {Array.isArray(units) && units.map((unit, ui) => (
                  <div key={ui} className="border-b border-slate-100">
                    <div className="px-5 py-2.5 bg-white flex items-baseline gap-3 border-b border-slate-50">
                      {unit.sno && (
                        <span className="text-xs text-slate-400 font-mono shrink-0">{unit.sno}</span>
                      )}
                      <span className="text-sm font-semibold text-slate-800">{unit.name}</span>
                    </div>
                    {unit.items && unit.items.length > 0 && (
                      <ItemsTable items={unit.items} />
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : null}
        </div>
      )
    })}
  </div>
)

// ── AIE renderer ─────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const AieTable = ({ rows }: { rows: Record<string, unknown>[] }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setCollapsed((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  return (
    <div>
      {rows.map((record) => {
        const aie = record as unknown as AieRecordShape
        const items: AieLineItemShape[] = Array.isArray(aie.lineItems) ? aie.lineItems : []
        const isOpen = !collapsed.has(aie.id)
        const statusColor =
          aie.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
          aie.status === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-500'

        return (
          <div key={aie.id} className="border-b border-slate-100">
            <button
              onClick={() => toggle(aie.id)}
              className="w-full px-5 py-3 flex items-center gap-3 text-left hover:brightness-110 transition-all"
              style={{ background: '#0d2137' }}
            >
              {isOpen
                ? <CaretDown size={14} className="text-slate-400 shrink-0" />
                : <CaretRight size={14} className="text-slate-400 shrink-0" />
              }
              <span className="text-sm font-bold text-white">{aie.aieNo}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{aie.status}</span>
              <span className="text-xs text-slate-400 flex-1 text-right">
                {fmtDate(aie.issueDate)} – {fmtDate(aie.expiresOn)}
              </span>
              <span className="text-xs font-semibold text-white whitespace-nowrap ml-4" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {items.length} items · {fmtCurrency(aie.totalAmount)}
              </span>
            </button>

            {isOpen && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 12 }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Code</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Sub-Item Code</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold uppercase tracking-wide" style={{ fontSize: 10.5 }}>Description</th>
                      <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Budget (₦)</th>
                      <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Actual (₦)</th>
                      <th className="text-right px-5 py-2 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap" style={{ fontSize: 10.5 }}>Variance (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, ii) => {
                      const actual = item.fulfillingProposal?.amount ?? null
                      const variance = actual != null ? actual - item.budgetAmount : null
                      return (
                        <tr
                          key={item.id ?? ii}
                          className={`border-t border-slate-50 hover:bg-blue-50 transition-colors ${ii % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          <td className="px-5 py-1.5 font-mono text-slate-500 whitespace-nowrap">{item.itemCodeId}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-500 whitespace-nowrap">{item.subItemCodeId}</td>
                          <td className="px-3 py-1.5 text-slate-700">{item.subItemLabel}</td>
                          <td className="px-5 py-1.5 text-right text-slate-800 font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {fmtCurrency(item.budgetAmount)}
                          </td>
                          <td className="px-5 py-1.5 text-right text-slate-700 font-medium whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {actual != null ? fmtCurrency(actual) : '—'}
                          </td>
                          <td
                            className="px-5 py-1.5 text-right font-semibold whitespace-nowrap"
                            style={{ fontVariantNumeric: 'tabular-nums', color: variance == null ? '#94a3b8' : variance >= 0 ? '#16a34a' : '#dc2626' }}
                          >
                            {variance != null ? `${variance >= 0 ? '+' : ''}${fmtCurrency(variance)}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
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
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === v.key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'distribution' && (
          <div className="flex gap-1 ml-3 pl-3 border-l border-slate-200">
            {DIST_VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setDistView(v.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  distView === v.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
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
        ) : view === 'distribution' ? (
          <DistributionTable rows={rows} />
        ) : view === 'aie' ? (
          <AieTable rows={rows} />
        ) : (
          <FlatTable rows={rows} />
        )}
      </div>
    </div>
  )
}

export default Expenditures
