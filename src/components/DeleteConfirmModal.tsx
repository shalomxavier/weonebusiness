import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderName: string
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, orderName }: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md card">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Delete Order</h3>
            <p className="text-sm mb-6">
              Are you sure you want to delete the order for <strong>{orderName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn border px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn border px-4"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
