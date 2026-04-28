import { X } from 'lucide-react'

interface Order {
  id: string
  itemNumber: string
  itemName: string
  price: string
  advance: string
  customerName: string
  phone: string
  address: string
  postcode: string
  deliveryDate: string
  deliveryStartTime: string
  deliveryEndTime: string
  additionalNotes: string
}

interface OrderViewModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export default function OrderViewModal({ isOpen, onClose, order }: OrderViewModalProps) {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">Order Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-1">Item Number</p>
              <p className="text-base">{order.itemNumber}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Item Name</p>
              <p className="text-base">{order.itemName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Price</p>
              <p className="text-base">${order.price}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Advance</p>
              <p className="text-base">${order.advance}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Customer Name</p>
              <p className="text-base">{order.customerName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Phone</p>
              <p className="text-base">{order.phone}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-1">Address</p>
              <p className="text-base">{order.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Postcode</p>
              <p className="text-base">{order.postcode}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery Date</p>
              <p className="text-base">{order.deliveryDate}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery Start Time</p>
              <p className="text-base">{order.deliveryStartTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery End Time</p>
              <p className="text-base">{order.deliveryEndTime}</p>
            </div>

            {order.additionalNotes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-1">Additional Notes</p>
                <p className="text-base">{order.additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn border px-6"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
