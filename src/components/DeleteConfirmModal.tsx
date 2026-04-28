import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderName?: string
  title?: string
  message?: string
  itemName?: string
  loading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  orderName,
  title = 'Delete Order',
  message,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  const displayName = itemName || orderName || 'this item'
  const defaultMessage = `Are you sure you want to delete ${title.toLowerCase().includes('user') ? '' : 'the order for '}<strong>${displayName}</strong>? This action cannot be undone.`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md card">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm mb-6" dangerouslySetInnerHTML={{ __html: message || defaultMessage }} />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn border px-4"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn border px-4 flex items-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
