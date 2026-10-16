import { useState, useEffect } from 'react'
import { MapTrifold, CircleNotch, CaretDown } from '@phosphor-icons/react'
import { useDistributions } from '../../hooks/useDistributions'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import type { DistributionView } from '../../api/services/distributionService'
import type {
  DistributionPeriod,
  DistributionCommand,
  DistributionSection,
  DistributionSummaryRow,
} from '../../types'

const IS_DEV = import.meta.env.DEV

const fmt = (v: number | null | undefined): string => {
  if (v == null) return '—'
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const sumAmounts = (amounts: (number | null)[]): number =>
  amounts.reduce<number>((acc, v) => acc + (v ?? 0), 0)

const periodHasData = (p: DistributionPeriod): boolean => {
  if (p.data)
    return Object.values(p.data).some((cmds) =>
      cmds.some((cmd) => cmd.items.some((i) => i.amounts.some((a) => a != null && a !== 0)))
    )
  if (p.sections)
    return p.sections.some((s) => s.items.some((i) => i.amounts.some((a) => a != null && a !== 0)))
  if (p.rows)
    return p.rows.some((r) => r.fromDist !== 0 || r.allocation !== 0)
  return false
}

const VIEWS: { key: DistributionView; label: string }[] = [
  { key: 'zone', label: 'Zone' },
  { key: 'formations', label: 'Formation' },
  { key: 'schools', label: 'School' },
  { key: 'summary', label: 'Summary' },
]

const ZONE_LABELS: Record<string, string> = {
  zone1_6: 'Zones 1 – 6',
  zone7_12: 'Zones 7 – 12',
  zone13_17: 'Zones 13 – 17',
}

const groupLabel = (key: string) =>
  ZONE_LABELS[key] ?? key.replace(/_/g, ' – ').replace(/\b\w/g, (c) => c.toUpperCase())

// ── Shared styles ─────────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: '8px 12px',
  fontWeight: 700,
  fontSize: 10.5,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  background: '#f5f7fa',
  borderBottom: '2px solid #e5e7eb',
}

const TD: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
}

// ── Collapsible group header (shared by zone sections and formation sections) ─
const GroupHeader = ({
  label,
  count,
  isOpen,
  onToggle,
  summaryChips,
}: {
  label: string
  count?: string
  isOpen: boolean
  onToggle: () => void
  summaryChips?: { label: string; value: string }[]
}) => (
  <button
    onClick={onToggle}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0d2137',
      color: '#fff',
      padding: '10px 16px',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      gap: 12,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <CaretDown
        size={14}
        weight="bold"
        style={{
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      />
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {count && (
        <span style={{ fontSize: 11, color: '#93c5fd', flexShrink: 0 }}>{count}</span>
      )}
    </div>

    {!isOpen && summaryChips && summaryChips.length > 0 && (
      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
        {summaryChips.map((chip) => (
          <span key={chip.label} style={{ fontSize: 11, color: '#93c5fd' }}>
            {chip.label}&nbsp;<span style={{ color: '#fff', fontWeight: 600 }}>{chip.value}</span>
          </span>
        ))}
      </div>
    )}
  </button>
)

// ── Zone section (zone view) ──────────────────────────────────────────────────
const ZoneSection = ({
  zoneKey,
  commands,
  columns,
  isOpen,
  onToggle,
}: {
  zoneKey: string
  commands: DistributionCommand[]
  columns: string[]
  isOpen: boolean
  onToggle: () => void
}) => {
  const nCols = columns.length
  const grandColTotals = columns.map((_, ci) =>
    commands.reduce((sum, cmd) => sum + (cmd.totals[ci] ?? 0), 0)
  )
  const grandTotal = sumAmounts(grandColTotals)
  const grandProvision = commands.reduce((sum, cmd) => sum + (cmd.provision ?? 0), 0)

  return (
    <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <GroupHeader
        label={groupLabel(zoneKey)}
        count={`${commands.length} ${commands.length === 1 ? 'command' : 'commands'}`}
        isOpen={isOpen}
        onToggle={onToggle}
        summaryChips={[
          { label: 'Total', value: fmt(grandTotal) },
          { label: 'Provision', value: fmt(grandProvision) },
        ]}
      />

      {isOpen && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'center', width: 54 }}>S/No</th>
                <th style={{ ...TH, textAlign: 'left', width: 80 }}>Code</th>
                <th style={{ ...TH, textAlign: 'left', minWidth: 180 }}>Description</th>
                {columns.map((col) => <th key={col} style={TH}>{col}</th>)}
                {nCols > 1 && <th style={{ ...TH, color: '#0d2137' }}>Total</th>}
                <th style={{ ...TH, color: '#0d2137' }}>Provision</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd, ci) => {
                const cmdPeriodTotals = cmd.totals.slice(0, nCols)
                const cmdTotal = sumAmounts(cmdPeriodTotals)
                return (
                  <>
                    <tr key={`hdr-${ci}`} style={{ background: '#f8fafc' }}>
                      <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>{cmd.sno}</td>
                      <td style={{ ...TD, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }} />
                      <td colSpan={nCols + (nCols > 1 ? 1 : 0)} style={{ ...TD, textAlign: 'left', fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>
                        {cmd.name}
                      </td>
                      <td style={{ ...TD, fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>{fmt(cmd.provision)}</td>
                    </tr>

                    {cmd.items.map((item, ii) => {
                      const snoStr = item.sno === null || item.sno === ' ' || item.sno === '' ? '' : String(item.sno)
                      const rowTotal = sumAmounts(item.amounts)
                      return (
                        <tr key={`item-${ci}-${ii}`} style={{ background: ii % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ ...TD, textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>{snoStr}</td>
                          <td style={{ ...TD, textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{item.code}</td>
                          <td style={{ ...TD, textAlign: 'left' }}>{item.desc}</td>
                          {item.amounts.map((amt, ai) => <td key={ai} style={TD}>{fmt(amt)}</td>)}
                          {Array.from({ length: nCols - item.amounts.length }).map((_, pi) => (
                            <td key={`pad-${pi}`} style={{ ...TD, color: '#d1d5db' }}>—</td>
                          ))}
                          {nCols > 1 && <td style={{ ...TD, fontWeight: 600 }}>{fmt(rowTotal)}</td>}
                          <td style={{ ...TD, color: '#9ca3af' }} />
                        </tr>
                      )
                    })}

                    <tr key={`sub-${ci}`} style={{ background: '#f0f4f8' }}>
                      <td style={{ ...TD, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }} />
                      <td style={{ ...TD, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }} />
                      <td style={{ ...TD, textAlign: 'left', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1f2937', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }}>
                        Sub-Total
                      </td>
                      {cmdPeriodTotals.map((t, ti) => (
                        <td key={ti} style={{ ...TD, fontWeight: 700, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }}>{fmt(t)}</td>
                      ))}
                      {Array.from({ length: nCols - cmdPeriodTotals.length }).map((_, pi) => (
                        <td key={`tpad-${pi}`} style={{ ...TD, color: '#d1d5db', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }}>—</td>
                      ))}
                      {nCols > 1 && <td style={{ ...TD, fontWeight: 700, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }}>{fmt(cmdTotal)}</td>}
                      <td style={{ ...TD, fontWeight: 700, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }}>{fmt(cmd.provision)}</td>
                    </tr>
                  </>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0d2137' }}>
                <td colSpan={3} style={{ ...TD, textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', borderBottom: 'none' }}>
                  Grand Total — {groupLabel(zoneKey)}
                </td>
                {grandColTotals.map((t, ti) => (
                  <td key={ti} style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(t)}</td>
                ))}
                {nCols > 1 && <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(grandTotal)}</td>}
                <td style={{ ...TD, fontWeight: 700, color: '#93c5fd', borderBottom: 'none' }}>{fmt(grandProvision)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Section panel (formations / schools view) ─────────────────────────────────
const SectionPanel = ({
  section,
  columns,
  isOpen,
  onToggle,
}: {
  section: DistributionSection
  columns: string[]
  isOpen: boolean
  onToggle: () => void
}) => {
  const nCols = columns.length
  const colTotals = columns.map((_, ci) =>
    section.items.reduce((sum, item) => sum + (item.amounts[ci] ?? 0), 0)
  )
  const sectionTotal = sumAmounts(colTotals)

  return (
    <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <GroupHeader
        label={section.name}
        count={`${section.items.length} items`}
        isOpen={isOpen}
        onToggle={onToggle}
        summaryChips={[{ label: 'Total', value: fmt(sectionTotal) }]}
      />

      {isOpen && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'center', width: 54 }}>S/No</th>
                <th style={{ ...TH, textAlign: 'left', width: 100 }}>Code</th>
                <th style={{ ...TH, textAlign: 'left', minWidth: 220 }}>Description</th>
                {columns.map((col) => <th key={col} style={TH}>{col}</th>)}
                {nCols > 1 && <th style={{ ...TH, color: '#0d2137' }}>Total</th>}
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, ii) => {
                const snoStr = item.sno === null || item.sno === ' ' || item.sno === '' ? '' : String(item.sno)
                const rowTotal = sumAmounts(item.amounts)
                const isHeader = String(item.sno).match(/^\d+$/)
                return (
                  <tr key={ii} style={{ background: isHeader ? '#f8fafc' : ii % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ ...TD, textAlign: 'center', color: isHeader ? '#0d2137' : '#9ca3af', fontWeight: isHeader ? 700 : 400, fontSize: 11 }}>{snoStr}</td>
                    <td style={{ ...TD, textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{item.code}</td>
                    <td style={{ ...TD, textAlign: 'left', fontWeight: isHeader ? 600 : 400, color: isHeader ? '#1f2937' : '#374151' }}>{item.desc}</td>
                    {item.amounts.map((amt, ai) => <td key={ai} style={{ ...TD, fontWeight: isHeader ? 600 : 400 }}>{fmt(amt)}</td>)}
                    {Array.from({ length: nCols - item.amounts.length }).map((_, pi) => (
                      <td key={`pad-${pi}`} style={{ ...TD, color: '#d1d5db' }}>—</td>
                    ))}
                    {nCols > 1 && <td style={{ ...TD, fontWeight: 600 }}>{fmt(rowTotal)}</td>}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0d2137' }}>
                <td colSpan={3} style={{ ...TD, textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', borderBottom: 'none' }}>
                  Section Total
                </td>
                {colTotals.map((t, ti) => (
                  <td key={ti} style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(t)}</td>
                ))}
                {nCols > 1 && <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(sectionTotal)}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Summary view ──────────────────────────────────────────────────────────────
const SummaryView = ({ rows }: { rows: DistributionSummaryRow[] }) => {
  const totalFromDist = rows.reduce((sum, r) => sum + (r.fromDist ?? 0), 0)
  const totalAlloc = rows.reduce((sum, r) => sum + (r.allocation ?? 0), 0)

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#0d2137', color: '#fff', padding: '10px 16px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Allocation Summary · {rows.length} units
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 260 }}>Formation / Unit</th>
              <th style={TH}>From Distribution (₦)</th>
              <th style={TH}>Allocation (₦)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ ...TD, textAlign: 'left' }}>{row.name}</td>
                <td style={TD}>{fmt(row.fromDist)}</td>
                <td style={TD}>{fmt(row.allocation)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#0d2137' }}>
              <td style={{ ...TD, textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', borderBottom: 'none' }}>
                Grand Total
              </td>
              <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(totalFromDist)}</td>
              <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(totalAlloc)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── DistributionList ──────────────────────────────────────────────────────────
const DistributionList = () => {
  const [view, setView] = useState<DistributionView>('zone')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({})

  const { data: rawData, isLoading } = useDistributions({ view })

  const periods: DistributionPeriod[] = Array.isArray(rawData) ? rawData : []
  const activePeriodId = selectedPeriodId ?? periods[0]?.id ?? null
  const activePeriod = periods.find((p) => p.id === activePeriodId) ?? null

  // Normalise groups for zone + sections views into a common shape for collapse tracking
  const groupKeys: string[] = activePeriod?.data
    ? Object.keys(activePeriod.data).filter((k) => (activePeriod.data![k]?.length ?? 0) > 0)
    : activePeriod?.sections
    ? activePeriod.sections.map((_, i) => String(i))
    : []

  useEffect(() => { setGroupsOpen({}) }, [activePeriodId, view])

  const isGroupOpen = (key: string) => groupsOpen[key] ?? true
  const toggleGroup = (key: string) => setGroupsOpen((p) => ({ ...p, [key]: !isGroupOpen(key) }))
  const allOpen = groupKeys.every((k) => isGroupOpen(k))
  const toggleAll = () => {
    const next = !allOpen
    setGroupsOpen(Object.fromEntries(groupKeys.map((k) => [k, next])))
  }

  return (
    <div>
      <PageHeader
        title="Distributions"
        subtitle="Budget distributions across zones and formations"
      />

      {/* View tabs */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-2 items-center">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => { setView(v.key); setSelectedPeriodId(null) }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              view === v.key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <CircleNotch size={28} className="animate-spin text-blue-600" />
          </div>
        ) : periods.length === 0 ? (
          <EmptyState
            title={`No ${view} distributions`}
            description="No distribution periods found for this view."
            icon={<MapTrifold size={28} className="text-slate-300" />}
          />
        ) : (
          <div>
            {/* Period tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', padding: '0 16px' }}>
              {periods.map((p) => {
                const active = activePeriodId === p.id
                const hasData = periodHasData(p)
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriodId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#0d2137' : '#6b7280',
                      borderBottom: active ? '2px solid #0d2137' : '2px solid transparent',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                  >
                    {p.label ?? p.id}
                    {hasData && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {activePeriod && (
              <div style={{ padding: '20px 16px' }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {activePeriod.columns?.join(' · ')}
                    {groupKeys.length > 0 && ` · ${groupKeys.length} ${groupKeys.length === 1 ? 'section' : 'sections'}`}
                  </p>
                  {groupKeys.length > 1 && !activePeriod.rows && (
                    <button
                      onClick={toggleAll}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#0d2137',
                        background: '#f5f7fa',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        padding: '5px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {allOpen ? 'Collapse All' : 'Expand All'}
                    </button>
                  )}
                </div>

                {IS_DEV && (
                  <details style={{ marginBottom: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                    <summary style={{ cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>
                      Dev — period: {activePeriod.id} · shape: {activePeriod.data ? 'zone' : activePeriod.sections ? 'sections' : activePeriod.rows ? 'summary' : 'unknown'}
                    </summary>
                  </details>
                )}

                {/* Zone view */}
                {activePeriod.data && (
                  groupKeys.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No zone data for this period.</div>
                  ) : (
                    groupKeys.map((zoneKey) => (
                      <ZoneSection
                        key={`${activePeriodId}-${zoneKey}`}
                        zoneKey={zoneKey}
                        commands={activePeriod.data![zoneKey]}
                        columns={activePeriod.columns ?? []}
                        isOpen={isGroupOpen(zoneKey)}
                        onToggle={() => toggleGroup(zoneKey)}
                      />
                    ))
                  )
                )}

                {/* Formations / Schools view */}
                {activePeriod.sections && (
                  activePeriod.sections.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No sections for this period.</div>
                  ) : (
                    activePeriod.sections.map((section, idx) => (
                      <SectionPanel
                        key={`${activePeriodId}-${idx}`}
                        section={section}
                        columns={activePeriod.columns ?? []}
                        isOpen={isGroupOpen(String(idx))}
                        onToggle={() => toggleGroup(String(idx))}
                      />
                    ))
                  )
                )}

                {/* Summary view */}
                {activePeriod.rows && (
                  activePeriod.rows.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No summary rows for this period.</div>
                  ) : (
                    <SummaryView rows={activePeriod.rows} />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DistributionList
