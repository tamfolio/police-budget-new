import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export const ConfirmDialog = ({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', loading, variant = 'danger',
}: Props) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <ExclamationTriangleIcon className={`h-5 w-5 ${variant === 'danger' ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  </Modal>
)

export default ConfirmDialog
