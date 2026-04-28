import { X } from 'lucide-react'
import { FormEvent, useState, useEffect } from 'react'

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
  status: 'pending' | 'delivered' | 'cancelled'
}

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  editOrder?: Order | null
  onSave?: (order: Order) => void
}

export default function NewOrderModal({ isOpen, onClose, editOrder, onSave }: NewOrderModalProps) {
  const [formData, setFormData] = useState<Omit<Order, 'id'>>({  
    itemNumber: '',
    itemName: '',
    price: '',
    advance: '',
    customerName: '',
    phone: '',
    address: '',
    postcode: '',
    deliveryDate: '',
    deliveryStartTime: '',
    deliveryEndTime: '',
    additionalNotes: '',
    status: 'pending',
  })

  useEffect(() => {
    if (editOrder) {
      setFormData(editOrder)
    } else {
      setFormData({
        itemNumber: '',
        itemName: '',
        price: '',
        advance: '',
        customerName: '',
        phone: '',
        address: '',
        postcode: '',
        deliveryDate: '',
        deliveryStartTime: '',
        deliveryEndTime: '',
        additionalNotes: '',
        status: 'pending',
      })
    }
  }, [editOrder])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const orderData = {
      ...formData,
      id: editOrder?.id || Date.now().toString(),
    } as Order
    if (onSave) {
      onSave(orderData)
    }
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">{editOrder ? 'Edit Order' : 'New Order'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itemNumber" className="block text-sm font-medium mb-1">
                Item Number
              </label>
              <input
                type="text"
                id="itemNumber"
                name="itemNumber"
                value={formData.itemNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="itemName" className="block text-sm font-medium mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="advance" className="block text-sm font-medium mb-1">
                Advance
              </label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium mb-1">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="deliveryStartTime" className="block text-sm font-medium mb-1">
                Delivery Start Time
              </label>
              <input
                type="time"
                id="deliveryStartTime"
                name="deliveryStartTime"
                value={formData.deliveryStartTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="deliveryEndTime" className="block text-sm font-medium mb-1">
                Delivery End Time
              </label>
              <input
                type="time"
                id="deliveryEndTime"
                name="deliveryEndTime"
                value={formData.deliveryEndTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="additionalNotes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Order Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              >
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn border px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn border px-6"
            >
              {editOrder ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
