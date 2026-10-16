import { type ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label?: string }
  color?: 'blue' | 'gold' | 'green' | 'red' | 'indigo'
}

const COLORS = {
  blue: { icon: 'bg-blue-100 text-blue-700', border: 'border-l-blue-600' },
  gold: { icon: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  green: { icon: 'bg-green-100 text-green-700', border: 'border-l-green-600' },
  red: { icon: 'bg-red-100 text-red-700', border: 'border-l-red-600' },
  indigo: { icon: 'bg-indigo-100 text-indigo-700', border: 'border-l-indigo-600' },
}

export const StatCard = ({ title, value, subtitle, icon, trend, color = 'blue' }: Props) => {
  const c = COLORS[color]
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm p-5 border-l-4 ${c.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1.5 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
