import { X } from 'lucide-react'

interface RemovalOrder {
  id: string
  customerName: string
  email: string
  phone: string
  postcode: string
  address: string
  notes: string
  removalDate: string
  totalPrice: string
  advance: string
  startTime: string
  endTime: string
  paymentMethod: 'card' | 'cash' | 'both'
  status: 'pending' | 'completed'
}

interface RemovalViewModalProps {
  isOpen: boolean
  onClose: () => void
  order: RemovalOrder | null
}

export default function RemovalViewModal({ isOpen, onClose, order }: RemovalViewModalProps) {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">Removal Details</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-1">Customer Name</p>
              <p className="text-base">{order.customerName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Email Address</p>
              <p className="text-base">{order.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Phone Number</p>
              <p className="text-base">{order.phone}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Postcode</p>
              <p className="text-base">{order.postcode}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-1">Removal Address</p>
              <p className="text-base">{order.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Removal Date</p>
              <p className="text-base">{order.removalDate}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <p className="text-base capitalize">{order.status}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Start Time</p>
              <p className="text-base">{order.startTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">End Time</p>
              <p className="text-base">{order.endTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Total Price</p>
              <p className="text-base">£{order.totalPrice}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Advance Amount</p>
              <p className="text-base">£{order.advance || '—'}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Payment Method</p>
              <p className="text-base capitalize">{order.paymentMethod}</p>
            </div>

            {order.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-1">Additional Notes</p>
                <p className="text-base">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="btn border px-6">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
