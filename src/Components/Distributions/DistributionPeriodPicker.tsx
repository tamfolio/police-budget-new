import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { DistributionPeriod } from '../../types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const START_MONTHS = [1, 3, 5, 7, 9, 11]
const MANUAL = '__manual__'

export const distributionSelectStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#0d2137',
  backgroundColor: '#f5f7fa',
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
  width: '100%',
  minHeight: 40,
  outline: 'none',
}

export function canonicalPeriodId(value: string) {
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (!match) return value
  const month = Number(match[2])
  const startMonth = month % 2 === 1 ? month : month - 1
  return `${match[1]}-${String(startMonth).padStart(2, '0')}`
}

export function biMonthLabel(id: string) {
  const match = canonicalPeriodId(id).match(/^(\d{4})-(\d{2})$/)
  if (!match) return id || 'Period'
  const month = Number(match[2])
  return `${MONTHS[month - 1]}-${MONTHS[month]} ${match[1]}`
}

function getWorkingYear(periods: DistributionPeriod[]) {
  const currentYear = new Date().getFullYear()
  return periods.reduce((latest, period) => {
    const year = Number(period.id.slice(0, 4))
    return Number.isInteger(year) ? Math.max(latest, year) : latest
  }, currentYear)
}

export function getMissingDistributionPeriods(periods: DistributionPeriod[]) {
  const year = getWorkingYear(periods)
  const existing = new Set(periods.map((period) => canonicalPeriodId(period.id)))
  return START_MONTHS
    .map((month) => `${year}-${String(month).padStart(2, '0')}`)
    .filter((id) => !existing.has(id))
}

interface Props {
  periods: DistributionPeriod[]
  periodId: string
  onChange: (periodId: string) => void
  disabled?: boolean
}

const DistributionPeriodPicker = ({ periods, periodId, onChange, disabled }: Props) => {
  const missingPeriods = useMemo(() => getMissingDistributionPeriods(periods), [periods])
  const [manual, setManual] = useState(false)

  useEffect(() => {
    setManual(missingPeriods.length === 0)
    onChange(missingPeriods[0] ?? '')
  // The parent keys this component by view; initialize only when its available-period list changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingPeriods.join('|')])

  const selectedValue = manual ? MANUAL : periodId

  return (
    <div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Period</label>
        <select
          value={selectedValue}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === MANUAL) {
              setManual(true)
              onChange('')
            } else {
              setManual(false)
              onChange(event.target.value)
            }
          }}
          style={{ ...distributionSelectStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        >
          {missingPeriods.map((id) => <option key={id} value={id}>{biMonthLabel(id)}</option>)}
          <option value={MANUAL}>Enter manually…</option>
        </select>
      </div>
      {manual && (
        <div className="mt-2">
          <input
            value={periodId}
            onChange={(event) => onChange(event.target.value)}
            placeholder="YYYY-MM, e.g. 2028-03"
            autoFocus
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <p className="text-xs text-slate-400 mt-1">Either month in the two-month period is accepted.</p>
        </div>
      )}
      {!manual && periodId && <p className="text-xs text-slate-400 mt-1">The next available period is selected automatically.</p>}
    </div>
  )
}

export default DistributionPeriodPicker
