import { CircleNotch } from '@phosphor-icons/react'
import { useDashboardCards, useInflowVsExpenditureChart } from '../../hooks/useDashboard'
import { getUserData } from '../../utils/auth'
import { getUserDisplayName, type User } from '../../types'

const YEAR = new Date().getFullYear()
const IS_DEV = import.meta.env.DEV

const fmt = (val: number) =>
  `₦${val.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// ── Card shell ────────────────────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #f0f2f5',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    ...style,
  }}>
    {children}
  </div>
)

// ── Area chart ────────────────────────────────────────────────────────────────
const AreaChart = ({ months, inflows, expenditures }: { months: string[]; inflows: number[]; expenditures: number[] }) => {
  if (months.length < 2) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
      No chart data yet
    </div>
  )

  const W = 700, H = 160
  const PAD = { top: 12, right: 12, bottom: 24, left: 44 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom
  const max = Math.max(...inflows, ...expenditures, 1)
  const n = months.length
  const px = (i: number) => PAD.left + (i / (n - 1)) * iW
  const py = (v: number) => PAD.top + iH * (1 - v / max)
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ')
  const area = (vals: number[]) => `${line(vals)} L${px(n - 1)},${PAD.top + iH} L${PAD.left},${PAD.top + iH} Z`
  const ticks = [0, 0.5, 1].map(f => ({ y: py(f * max), label: f === 0 ? '0' : f * max >= 1e9 ? `${((f * max) / 1e9).toFixed(1)}B` : `${((f * max) / 1e6).toFixed(0)}M` }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2137" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#0d2137" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b7280" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map(({ y }) => (
        <line key={y} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f0f2f5" strokeWidth="1" />
      ))}
      {ticks.map(({ y, label }) => (
        <text key={label} x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9.5" fill="#9ca3af" fontFamily="Aeonik,Arial,sans-serif">{label}</text>
      ))}

      <path d={area(inflows)} fill="url(#gI)" />
      <path d={area(expenditures)} fill="url(#gE)" />
      <path d={line(inflows)} fill="none" stroke="#0d2137" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(expenditures)} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />

      <circle cx={px(n - 1)} cy={py(inflows[n - 1])} r="3.5" fill="#0d2137" stroke="#fff" strokeWidth="1.5" />
      <circle cx={px(n - 1)} cy={py(expenditures[n - 1])} r="3.5" fill="#9ca3af" stroke="#fff" strokeWidth="1.5" />

      {months.map((m, i) => (
        <text key={i} x={px(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9.5" fill="#9ca3af" fontFamily="Aeonik,Arial,sans-serif">
          {m.slice(0, 3)}
        </text>
      ))}
    </svg>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
const Overview = () => {
  const { data: cardsRaw, isLoading, error: cardsError } = useDashboardCards()
  const { data: chartRaw, isLoading: chartLoading, error: chartError } = useInflowVsExpenditureChart(YEAR)

  // Cards response: { success, data: { totalFundInflow, aieTotal, totalExpenditure, utilization, ... } }
  const cards = cardsRaw as {
    totalFundInflow?: number
    fundInflowCount?: number
    aieCount?: number
    aieTotal?: number
    aieActualTotal?: number
    totalExpenditure?: number
    aieCarryOver?: number
    utilization?: number
  } | undefined

  // Chart response: { success, data: [{ name, "Fund Inflow", "Total Expenditure" }] }
  type ChartPoint = { name: string; 'Fund Inflow': number; 'Total Expenditure': number }
  const chartArr: ChartPoint[] = Array.isArray(chartRaw) ? (chartRaw as ChartPoint[]) : []
  const months     = chartArr.map((d) => d.name)
  const inflowVals = chartArr.map((d) => d['Fund Inflow'] ?? 0)
  const expendVals = chartArr.map((d) => d['Total Expenditure'] ?? 0)

  const user      = getUserData<User>()
  const displayName = user ? getUserDisplayName(user) : 'Officer'
  const firstName   = displayName.includes('@') ? displayName.split('@')[0] : displayName.split(' ')[0]

  const numVal = (v: number | undefined) => (v != null ? fmt(v) : '—')
  const pctVal = (v: number | undefined) => (v != null ? `${v.toFixed(1)}%` : '—')

  const subStats = [
    { label: 'AIE Expenditure',  value: numVal(cards?.aieActualTotal) },
    { label: 'Total Expenditure', value: numVal(cards?.totalExpenditure) },
    { label: 'Utilization',       value: pctVal(cards?.utilization) },
  ]

  const queueItems = [
    { label: 'Fund Inflow Records', value: cards?.fundInflowCount ?? 0, dot: '#0d2137' },
    { label: 'AIE Records',         value: cards?.aieCount ?? 0,        dot: '#f59e0b' },
    { label: 'Carry-Over Budget',   value: numVal(cards?.aieCarryOver),  dot: '#6b7280', isText: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>

      {/* ── Dev inspectors ── */}
      {IS_DEV && (cardsError || chartError) && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c' }}>
          {cardsError && <div>Cards error: {String((cardsError as Error).message)}</div>}
          {chartError && <div>Chart error: {String((chartError as Error).message)}</div>}
        </div>
      )}
      {IS_DEV && cards && (
        <details style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
          <summary style={{ cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>Dev — raw API keys: {Object.keys(cards).join(', ')}</summary>
          <pre style={{ margin: '6px 0 0', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(cards, null, 2)}</pre>
        </details>
      )}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            {greeting()}, {firstName}
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '5px 0 0' }}>
            Here is a summary of NPF budget activity
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#6b7280',
          background: '#f0f2f5', borderRadius: 6, padding: '4px 10px',
          letterSpacing: '0.04em',
        }}>
          FY {YEAR}
        </span>
      </div>

      {/* ── Main 2-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Primary stat card */}
          <Card>
            <div style={{ padding: '24px 28px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                Total Fund Inflows
              </p>

              {isLoading ? (
                <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CircleNotch size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</span>
                </div>
              ) : (
                <p style={{ fontSize: 36, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {numVal(cards?.totalFundInflow)}
                </p>
              )}
            </div>

            <div style={{ height: 1, background: '#f7f8fa' }} />

            {/* Sub-stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {subStats.map((s, i) => (
                <div key={s.label} style={{
                  padding: '16px 20px',
                  borderRight: i < subStats.length - 1 ? '1px solid #f7f8fa' : 'none',
                }}>
                  <p style={{ fontSize: 10.5, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {s.label}
                  </p>
                  {isLoading ? (
                    <div style={{ height: 20, width: 80, background: '#f7f8fa', borderRadius: 4 }} />
                  ) : (
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {s.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Chart card */}
          <Card>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Inflow vs Expenditure</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Monthly comparison · FY {YEAR}</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ label: 'Inflow', color: '#0d2137', dashed: false }, { label: 'Expenditure', color: '#9ca3af', dashed: true }].map(l => (
                    <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
                      <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed ? '4 3' : undefined} /></svg>
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              {chartLoading ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircleNotch size={22} className="animate-spin" style={{ color: '#d1d5db' }} />
                </div>
              ) : (
                <AreaChart months={months} inflows={inflowVals} expenditures={expendVals} />
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT column — Queue status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div style={{ padding: '20px 20px 8px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
                Action Queue
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {queueItems.map((item, i) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < queueItems.length - 1 ? '1px solid #f7f8fa' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, flexShrink: 0, display: 'block' }} />
                      <p style={{ fontSize: 12.5, color: '#374151', margin: 0 }}>{item.label}</p>
                    </div>
                    {isLoading ? (
                      <div style={{ width: 24, height: 20, background: '#f7f8fa', borderRadius: 4 }} />
                    ) : (
                      <p style={{ fontSize: item.isText ? 13 : 20, fontWeight: 700, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: '#f7f8fa' }} />
            <div style={{ padding: '12px 20px' }}>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                Items requiring your attention
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Overview
