import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

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

interface NewRemovalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (order: RemovalOrder) => void
  editRemoval?: Omit<RemovalOrder, 'id'> | null
  editId?: string | null
}

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'both', label: 'Both' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function NewRemovalModal({ isOpen, onClose, onSave, editRemoval, editId }: NewRemovalModalProps) {
  const [formData, setFormData] = useState<Omit<RemovalOrder, 'id'>>({
    customerName: '',
    email: '',
    phone: '',
    postcode: '',
    address: '',
    notes: '',
    removalDate: getTodayDate(),
    totalPrice: '',
    advance: '',
    startTime: '',
    endTime: '',
    paymentMethod: 'card',
    status: 'pending',
  })

  useEffect(() => {
    if (editRemoval) {
      setFormData(editRemoval)
    } else {
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        postcode: '',
        address: '',
        notes: '',
        removalDate: getTodayDate(),
        totalPrice: '',
        advance: '',
        startTime: '',
        endTime: '',
        paymentMethod: 'card',
        status: 'pending',
      })
    }
  }, [editRemoval, isOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const orderData = {
      ...formData,
      id: editId ?? Date.now().toString(),
    } as RemovalOrder
    if (onSave) {
      onSave(orderData)
    }
    onClose()
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      postcode: '',
      address: '',
      notes: '',
      removalDate: getTodayDate(),
      totalPrice: '',
      advance: '',
      startTime: '',
      endTime: '',
      paymentMethod: 'card',
      status: 'pending',
    })
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
          <h2 className="text-2xl font-semibold">{editId ? 'Edit Removal' : 'New Removal'}</h2>
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
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone Number
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

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Removal Address
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

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="removalDate" className="block text-sm font-medium mb-1">
                Removal Date
              </label>
              <input
                type="date"
                id="removalDate"
                name="removalDate"
                value={formData.removalDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="totalPrice" className="block text-sm font-medium mb-1">
                Total Price (£)
              </label>
              <input
                type="number"
                id="totalPrice"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="advance" className="block text-sm font-medium mb-1">
                Advance Amount
              </label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editId ? 'Update Removal' : 'Save Removal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
