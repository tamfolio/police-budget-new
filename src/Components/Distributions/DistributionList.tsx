import { useState, useEffect } from 'react'
import { MapTrifold, CircleNotch, CaretDown, Plus, PencilSimple, Trash, UploadSimple } from '@phosphor-icons/react'
import { useDistributions, useUpdateDistribution, useDeleteDistribution } from '../../hooks/useDistributions'
import AddDistributionPeriodModal from './AddDistributionPeriodModal'
import ImportDistributionCsvModal from './ImportDistributionCsvModal'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import type { DistributionView } from '../../api/services/distributionService'
import type {
  DistributionPeriod,
  DistributionCommand,
  DistributionSection,
  DistributionSummaryRow,
} from '../../types'


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
  { key: 'formations', label: 'Formations' },
  { key: 'schools', label: 'Schools' },
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

const MoneyInput = ({ value, onChange }: { value: number | null | undefined; onChange: (value: number) => void }) => (
  <input
    type="number"
    min="0"
    step="0.01"
    value={value ?? ''}
    onChange={(event) => onChange(Number(event.target.value) || 0)}
    style={{
      width: 130,
      padding: '5px 8px',
      fontSize: 12,
      textAlign: 'right',
      border: '1px solid #bfdbfe',
      borderRadius: 6,
      background: '#fff',
      outline: 'none',
      fontVariantNumeric: 'tabular-nums',
    }}
  />
)

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
  editing = false,
  onAmountChange,
  onProvisionChange,
}: {
  zoneKey: string
  commands: DistributionCommand[]
  columns: string[]
  isOpen: boolean
  onToggle: () => void
  editing?: boolean
  onAmountChange?: (commandIndex: number, itemIndex: number, amountIndex: number, value: number) => void
  onProvisionChange?: (commandIndex: number, value: number) => void
}) => {
  const nCols = columns.length
  const grandColTotals = columns.map((_, ci) =>
    commands.reduce((sum, cmd) => sum + cmd.items.reduce((itemSum, item) => itemSum + (item.amounts[ci] ?? 0), 0), 0)
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
                const cmdPeriodTotals = columns.map((_, columnIndex) =>
                  cmd.items.reduce((sum, item) => sum + (item.amounts[columnIndex] ?? 0), 0)
                )
                const cmdTotal = sumAmounts(cmdPeriodTotals)
                return (
                  <>
                    <tr key={`hdr-${ci}`} style={{ background: '#f8fafc' }}>
                      <td style={{ ...TD, textAlign: 'center', fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>{cmd.sno}</td>
                      <td style={{ ...TD, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }} />
                      <td style={{ ...TD, textAlign: 'left', fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>
                        {cmd.name}
                      </td>
                      {columns.map((column) => (
                        <td key={`header-period-${column}`} style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />
                      ))}
                      {nCols > 1 && (
                        <td style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />
                      )}
                      <td style={{ ...TD, fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>
                        {editing ? <MoneyInput value={cmd.provision} onChange={(value) => onProvisionChange?.(ci, value)} /> : fmt(cmd.provision)}
                      </td>
                    </tr>

                    {cmd.items.map((item, ii) => {
                      const snoStr = item.sno === null || item.sno === ' ' || item.sno === '' ? '' : String(item.sno)
                      const rowTotal = sumAmounts(item.amounts)
                      return (
                        <tr key={`item-${ci}-${ii}`} style={{ background: ii % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ ...TD, textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>{snoStr}</td>
                          <td style={{ ...TD, textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{item.code}</td>
                          <td style={{ ...TD, textAlign: 'left' }}>{item.desc}</td>
                          {item.amounts.map((amt, ai) => <td key={ai} style={TD}>{editing ? <MoneyInput value={amt} onChange={(value) => onAmountChange?.(ci, ii, ai, value)} /> : fmt(amt)}</td>)}
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
                      <td style={{ ...TD, borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e5e7eb' }} />
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
  editing = false,
  onAmountChange,
  onProvisionChange,
}: {
  section: DistributionSection
  columns: string[]
  isOpen: boolean
  onToggle: () => void
  editing?: boolean
  onAmountChange?: (itemIndex: number, amountIndex: number, value: number) => void
  onProvisionChange?: (value: number) => void
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
                <th style={{ ...TH, color: '#0d2137' }}>Provision</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />
                <td style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />
                <td style={{ ...TD, textAlign: 'left', fontWeight: 700, color: '#0d2137', borderBottom: '1px solid #e5e7eb' }}>{section.name}</td>
                {columns.map((column) => <td key={`section-${column}`} style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />)}
                {nCols > 1 && <td style={{ ...TD, borderBottom: '1px solid #e5e7eb' }} />}
                <td style={{ ...TD, fontWeight: 700, borderBottom: '1px solid #e5e7eb' }}>
                  {editing ? <MoneyInput value={section.provisions?.[0]} onChange={(value) => onProvisionChange?.(value)} /> : fmt(section.provisions?.[0] ?? 0)}
                </td>
              </tr>
              {section.items.map((item, ii) => {
                const snoStr = item.sno === null || item.sno === ' ' || item.sno === '' ? '' : String(item.sno)
                const rowTotal = sumAmounts(item.amounts)
                const isHeader = String(item.sno).match(/^\d+$/)
                return (
                  <tr key={ii} style={{ background: isHeader ? '#f8fafc' : ii % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ ...TD, textAlign: 'center', color: isHeader ? '#0d2137' : '#9ca3af', fontWeight: isHeader ? 700 : 400, fontSize: 11 }}>{snoStr}</td>
                    <td style={{ ...TD, textAlign: 'left', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{item.code}</td>
                    <td style={{ ...TD, textAlign: 'left', fontWeight: isHeader ? 600 : 400, color: isHeader ? '#1f2937' : '#374151' }}>{item.desc}</td>
                    {item.amounts.map((amt, ai) => <td key={ai} style={{ ...TD, fontWeight: isHeader ? 600 : 400 }}>{editing ? <MoneyInput value={amt} onChange={(value) => onAmountChange?.(ii, ai, value)} /> : fmt(amt)}</td>)}
                    {Array.from({ length: nCols - item.amounts.length }).map((_, pi) => (
                      <td key={`pad-${pi}`} style={{ ...TD, color: '#d1d5db' }}>—</td>
                    ))}
                    {nCols > 1 && <td style={{ ...TD, fontWeight: 600 }}>{fmt(rowTotal)}</td>}
                    <td style={{ ...TD, color: '#9ca3af' }} />
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
                <td style={{ ...TD, fontWeight: 700, color: '#93c5fd', borderBottom: 'none' }}>{fmt(section.provisions?.[0] ?? 0)}</td>
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
  const totalDifference = rows.reduce(
    (sum, r) => sum + (r.difference ?? (r.allocation ?? 0) - (r.fromDist ?? 0)),
    0
  )

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
              <th style={TH}>Allocation (₦)</th>
              <th style={TH}>From Distribution (₦)</th>
              <th style={TH}>Difference (₦)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ ...TD, textAlign: 'left' }}>{row.name}</td>
                <td style={TD}>{fmt(row.allocation)}</td>
                <td style={TD}>{fmt(row.fromDist)}</td>
                <td style={TD}>{fmt(row.difference ?? row.allocation - row.fromDist)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#0d2137' }}>
              <td style={{ ...TD, textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', borderBottom: 'none' }}>
                Grand Total
              </td>
              <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(totalAlloc)}</td>
              <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(totalFromDist)}</td>
              <td style={{ ...TD, fontWeight: 700, color: '#fff', borderBottom: 'none' }}>{fmt(totalDifference)}</td>
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

  // period CRUD state
  const [addOpen,     setAddOpen]     = useState(false)
  const [importOpen,  setImportOpen]  = useState(false)
  const [editDraft,   setEditDraft]   = useState<DistributionPeriod | null>(null)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)

  const { data: rawData, isLoading } = useDistributions({ view })
  const { mutate: updatePeriod, isPending: updating } = useUpdateDistribution()
  const { mutate: deletePeriod, isPending: deleting } = useDeleteDistribution()

  const periods: DistributionPeriod[] = Array.isArray(rawData)
    ? [...rawData].sort((a, b) => {
        const [aYear = 0, aMonth = 0] = a.id.split('-').map(Number)
        const [bYear = 0, bMonth = 0] = b.id.split('-').map(Number)
        return bYear - aYear || aMonth - bMonth
      })
    : []
  const activePeriodId = selectedPeriodId ?? periods[0]?.id ?? null
  const activePeriod = periods.find((p) => p.id === activePeriodId) ?? null
  const displayedPeriod = editDraft ?? activePeriod

  // Normalise groups for zone + sections views into a common shape for collapse tracking
  const groupKeys: string[] = displayedPeriod?.data
    ? Object.keys(displayedPeriod.data).filter((k) => (displayedPeriod.data![k]?.length ?? 0) > 0)
    : displayedPeriod?.sections
    ? displayedPeriod.sections.map((_, i) => String(i))
    : []

  useEffect(() => { setGroupsOpen({}); setEditDraft(null) }, [activePeriodId, view])

  const isGroupOpen = (key: string) => groupsOpen[key] ?? true
  const toggleGroup = (key: string) => setGroupsOpen((p) => ({ ...p, [key]: !isGroupOpen(key) }))
  const allOpen = groupKeys.every((k) => isGroupOpen(k))
  const toggleAll = () => {
    const next = !allOpen
    setGroupsOpen(Object.fromEntries(groupKeys.map((k) => [k, next])))
  }

  const openEdit = () => {
    if (!activePeriod) return
    setEditDraft(JSON.parse(JSON.stringify(activePeriod)) as DistributionPeriod)
  }
  const handleEdit = () => {
    if (!activePeriod || !editDraft) return
    const payload = editDraft.data
      ? { id: editDraft.id, label: editDraft.label, columns: editDraft.columns, data: editDraft.data }
      : { id: editDraft.id, label: editDraft.label, columns: editDraft.columns, sections: editDraft.sections }
    updatePeriod(
      { periodId: activePeriod.id, view, payload },
      { onSuccess: () => setEditDraft(null) }
    )
  }

  const updateZoneAmount = (zoneKey: string, commandIndex: number, itemIndex: number, amountIndex: number, value: number) => {
    setEditDraft(previous => {
      if (!previous?.data) return previous
      const next = JSON.parse(JSON.stringify(previous)) as DistributionPeriod
      const command = next.data![zoneKey][commandIndex]
      command.items[itemIndex].amounts[amountIndex] = value
      command.totals = (next.columns ?? []).map((_, columnIndex) =>
        command.items.reduce((sum, item) => sum + (item.amounts[columnIndex] ?? 0), 0)
      )
      return next
    })
  }

  const updateZoneProvision = (zoneKey: string, commandIndex: number, value: number) => {
    setEditDraft(previous => {
      if (!previous?.data) return previous
      const next = JSON.parse(JSON.stringify(previous)) as DistributionPeriod
      const command = next.data![zoneKey][commandIndex]
      command.provision = value
      command.provisions = [value]
      return next
    })
  }

  const updateSectionAmount = (sectionIndex: number, itemIndex: number, amountIndex: number, value: number) => {
    setEditDraft(previous => {
      if (!previous?.sections) return previous
      const next = JSON.parse(JSON.stringify(previous)) as DistributionPeriod
      next.sections![sectionIndex].items[itemIndex].amounts[amountIndex] = value
      return next
    })
  }

  const updateSectionProvision = (sectionIndex: number, value: number) => {
    setEditDraft(previous => {
      if (!previous?.sections) return previous
      const next = JSON.parse(JSON.stringify(previous)) as DistributionPeriod
      next.sections![sectionIndex].provisions = [value]
      return next
    })
  }
  const handleDelete = () => {
    if (!deleteId) return
    deletePeriod(
      { periodId: deleteId, view },
      { onSuccess: () => { setDeleteId(null); setSelectedPeriodId(null) } }
    )
  }

  return (
    <div>
      <PageHeader
        title="Distributions"
        subtitle="Budget distributions across zones and formations"
        actions={view !== 'summary' ? <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-200 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            <UploadSimple size={16} weight="bold" /> Import CSV
          </button>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
            <Plus size={16} weight="bold" /> Add Period
          </button>
        </div> : undefined}
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
            {/* Period selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9', padding: '10px 16px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Period
              </label>
              <select
                value={activePeriodId ?? ''}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                disabled={Boolean(editDraft)}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0d2137',
                  background: '#f5f7fa',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '6px 32px 6px 12px',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  minWidth: 200,
                  outline: 'none',
                }}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {periodHasData(p) ? '● ' : ''}{p.label ?? p.id}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{periods.length} period{periods.length !== 1 ? 's' : ''}</span>
            </div>

            {displayedPeriod && (
              <div style={{ padding: '20px 16px' }}>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {displayedPeriod.columns?.join(' · ')}
                    {groupKeys.length > 0 && ` · ${groupKeys.length} ${groupKeys.length === 1 ? 'section' : 'sections'}`}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {groupKeys.length > 1 && !displayedPeriod.rows && (
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
                    {view !== 'summary' && !editDraft && <button
                      onClick={openEdit}
                      title="Edit period"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#374151',
                        background: '#f5f7fa',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        padding: '5px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      <PencilSimple size={13} /> Edit
                    </button>}
                    {view !== 'summary' && !editDraft && <button
                      onClick={() => setDeleteId(displayedPeriod.id)}
                      title="Delete period"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#dc2626',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        padding: '5px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash size={13} /> Delete
                    </button>}
                    {editDraft && <>
                      <button
                        onClick={() => setEditDraft(null)}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEdit}
                        disabled={updating}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 border border-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50"
                      >
                        {updating ? 'Updating…' : 'Update'}
                      </button>
                    </>}
                  </div>
                </div>

                {/* Zone view */}
                {displayedPeriod.data && (
                  groupKeys.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No zone data for this period.</div>
                  ) : (
                    groupKeys.map((zoneKey) => (
                      <ZoneSection
                        key={`${activePeriodId}-${zoneKey}`}
                        zoneKey={zoneKey}
                        commands={displayedPeriod.data![zoneKey]}
                        columns={displayedPeriod.columns ?? []}
                        isOpen={isGroupOpen(zoneKey)}
                        onToggle={() => toggleGroup(zoneKey)}
                        editing={Boolean(editDraft)}
                        onAmountChange={(commandIndex, itemIndex, amountIndex, value) => updateZoneAmount(zoneKey, commandIndex, itemIndex, amountIndex, value)}
                        onProvisionChange={(commandIndex, value) => updateZoneProvision(zoneKey, commandIndex, value)}
                      />
                    ))
                  )
                )}

                {/* Formations / Schools view */}
                {displayedPeriod.sections && (
                  displayedPeriod.sections.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No sections for this period.</div>
                  ) : (
                    displayedPeriod.sections.map((section, idx) => (
                      <SectionPanel
                        key={`${activePeriodId}-${idx}`}
                        section={section}
                        columns={displayedPeriod.columns ?? []}
                        isOpen={isGroupOpen(String(idx))}
                        onToggle={() => toggleGroup(String(idx))}
                        editing={Boolean(editDraft)}
                        onAmountChange={(itemIndex, amountIndex, value) => updateSectionAmount(idx, itemIndex, amountIndex, value)}
                        onProvisionChange={(value) => updateSectionProvision(idx, value)}
                      />
                    ))
                  )
                )}

                {/* Summary view */}
                {displayedPeriod.rows && (
                  displayedPeriod.rows.length === 0 ? (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No summary rows for this period.</div>
                  ) : (
                    <SummaryView rows={displayedPeriod.rows} />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AddDistributionPeriodModal open={addOpen} onClose={() => setAddOpen(false)} view={view} />
      <ImportDistributionCsvModal open={importOpen} onClose={() => setImportOpen(false)} initialView={view} />

      {/* Delete Period confirm */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Period"
        message="Are you sure you want to delete this distribution period? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default DistributionList
