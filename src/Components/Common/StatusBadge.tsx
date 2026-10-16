type Status = 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'returned' | 'open' | 'closed' | 'active' | 'inactive' | string

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  pending_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  pending_approval: { label: 'Pending Approval', className: 'bg-indigo-100 text-indigo-700' },
  reviewed: { label: 'Reviewed', className: 'bg-indigo-100 text-indigo-700' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  returned: { label: 'Returned', className: 'bg-orange-100 text-orange-700' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  open: { label: 'Open', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600' },
}

interface Props {
  status: Status
  size?: 'sm' | 'md'
}

export const StatusBadge = ({ status, size = 'md' }: Props) => {
  const key = (status ?? '').toLowerCase()
  const config = STATUS_CONFIG[key] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge
