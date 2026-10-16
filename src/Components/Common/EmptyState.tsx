import { type ReactNode } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline'

interface Props {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export const EmptyState = ({ title = 'No data found', description, action, icon }: Props) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      {icon ?? <InboxIcon className="h-7 w-7 text-slate-400" />}
    </div>
    <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState
