import { useMemo, useState } from 'react'
import { Eye, Pencil, Trash2, Clock, CheckCircle2, XCircle, Search, X } from 'lucide-react'
import NewOrderModal from './NewOrderModal'
import OrderViewModal from './OrderViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

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

export default function UsedOrders() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      itemNumber: 'ITM-001',
      itemName: 'Vintage Sofa',
      price: '500',
      advance: '100',
      customerName: 'John Doe',
      phone: '555-0123',
      address: '123 Main St',
      postcode: '12345',
      deliveryDate: '2026-04-25',
      deliveryStartTime: '10:00',
      deliveryEndTime: '12:00',
      additionalNotes: 'Handle with care',
      status: 'pending',
    },
    {
      id: '2',
      itemNumber: 'ITM-002',
      itemName: 'Dining Table Set',
      price: '800',
      advance: '200',
      customerName: 'Jane Smith',
      phone: '555-0456',
      address: '456 Oak Ave',
      postcode: '67890',
      deliveryDate: '2026-04-26',
      deliveryStartTime: '14:00',
      deliveryEndTime: '16:00',
      additionalNotes: '',
      status: 'pending',
    },
  ])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all')
  const [dateFilter, setDateFilter] = useState('')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.itemName.toLowerCase().includes(query) ||
          order.itemNumber.toLowerCase().includes(query) ||
          order.address.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Date filter
    if (dateFilter) {
      result = result.filter((order) => order.deliveryDate === dateFilter)
    }

    return result
  }, [orders, searchQuery, statusFilter, dateFilter])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('')
  }

  // Calculate displayed orders based on showAll and pagination
  const displayedOrders = useMemo(() => {
    if (!showAll) {
      return filteredOrders.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, showAll, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  }, [filteredOrders.length])

  const handleView = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const handleDelete = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (selectedOrder) {
      setOrders(orders.filter((o) => o.id !== selectedOrder.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedOrder(null)
  }

  const handleSaveOrder = (order: Order) => {
    const existingIndex = orders.findIndex((o) => o.id === order.id)
    if (existingIndex >= 0) {
      const updatedOrders = [...orders]
      updatedOrders[existingIndex] = order
      setOrders(updatedOrders)
    } else {
      setOrders([...orders, order])
    }
  }

  return (
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Used Goods</p>
          <h1 className="text-3xl font-semibold leading-tight">Orders</h1>
        </header>
        <button type="button" className="btn border" onClick={() => setIsCreateModalOpen(true)}>
          New Order
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Pending Orders</p>
            <p className="text-2xl font-semibold">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Delivered Orders</p>
            <p className="text-2xl font-semibold">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Cancelled Orders</p>
            <p className="text-2xl font-semibold">{orders.filter(o => o.status === 'cancelled').length}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, item, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              placeholder="Select delivery date"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-1 rounded-full hover:bg-gray-100"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'all' || dateFilter) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT
          ? `Showing ${Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)} of ${filteredOrders.length} orders`
          : `Showing ${filteredOrders.length} of ${orders.length} orders`}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">
            {orders.length === 0
              ? 'No orders yet. Start by creating a new order.'
              : 'No orders match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Customer Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Delivery Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Item Number</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Item Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Address</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Postcode</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm">{order.customerName}</td>
                    <td className="px-4 py-3 text-sm">{order.deliveryDate}</td>
                    <td className="px-4 py-3 text-sm">{order.itemNumber}</td>
                    <td className="px-4 py-3 text-sm">{order.itemName}</td>
                    <td className="px-4 py-3 text-sm">{order.address}</td>
                    <td className="px-4 py-3 text-sm">{order.postcode}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : order.status === 'delivered'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(order)}
                          className="p-1.5 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          className="p-1.5 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show All / Show Less Button */}
      {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Show All ({filteredOrders.length} orders)
          </button>
        </div>
      )}

      {showAll && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(false)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Show Less (Last {Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)})
          </button>
        </div>
      )}

      {/* Pagination - only show when showing all and there are multiple pages */}
      {showAll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <NewOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveOrder}
      />

      <NewOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedOrder(null)
        }}
        editOrder={selectedOrder}
        onSave={handleSaveOrder}
      />

      <OrderViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedOrder(null)
        }}
        onConfirm={confirmDelete}
        orderName={selectedOrder?.customerName || ''}
      />
    </section>
  )
}
