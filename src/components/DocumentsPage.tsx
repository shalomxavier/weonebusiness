import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Loader2, FileText, Eye, Pencil, Printer } from 'lucide-react'
import NewDocumentModal, { DOCUMENT_LABELS, DocumentType } from './NewDocumentModal'
import InvoiceCategoryModal, { InvoiceCategory } from './InvoiceCategoryModal'
import UsedGoodsInvoiceModal from './UsedGoodsInvoiceModal'
import UsedGoodsInvoicePreview, { InvoiceDocument } from './UsedGoodsInvoicePreview'
import { downloadUsedGoodsInvoicePdf } from '../lib/invoicePdf'

interface DocumentsPageProps {
  docType: DocumentType
}

interface BusinessDoc extends InvoiceDocument {
  status?: string
  sourceInvoiceId?: string
}

// Which stored docType codes belong to each register page
const DOC_TYPE_CODES: Record<DocumentType, string[]> = {
  quotation: ['removals_quotation', 'clearance_quotation'],
  invoice: ['used_goods_invoice', 'removals_invoice', 'clearance_invoice'],
  receipt: ['removals_receipt', 'clearance_receipt', 'used_furniture_receipt'],
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-yellow-400 bg-yellow-400/10',
  issued: 'text-green-400 bg-green-400/10',
  superseded: 'text-gray-400 bg-gray-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}

export default function DocumentsPage({ docType }: DocumentsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isUGInvoiceModalOpen, setIsUGInvoiceModalOpen] = useState(false)
  const [invoiceCategory, setInvoiceCategory] = useState<InvoiceCategory | null>(null)
  const [documents, setDocuments] = useState<BusinessDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<BusinessDoc | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<BusinessDoc | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const label = DOCUMENT_LABELS[docType]

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    const q = query(collection(db, 'documents'), where('docType', 'in', DOC_TYPE_CODES[docType]))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setDocuments(snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            invoiceNumber: typeof data.invoiceNumber === 'string' ? data.invoiceNumber : undefined,
            itemNumber: typeof data.itemNumber === 'string' ? data.itemNumber : undefined,
            itemName: typeof data.itemName === 'string' ? data.itemName : undefined,
            customerName: typeof data.customerName === 'string' ? data.customerName : undefined,
            phone: typeof data.phone === 'string' ? data.phone : undefined,
            address: typeof data.address === 'string' ? data.address : undefined,
            postcode: typeof data.postcode === 'string' ? data.postcode : undefined,
            price: typeof data.price === 'string' ? data.price : undefined,
            deliveryDate: typeof data.deliveryDate === 'string' ? data.deliveryDate : undefined,
            bankDetails: typeof data.bankDetails === 'string' ? data.bankDetails : undefined,
            sourceInvoiceId: typeof data.sourceInvoiceId === 'string' ? data.sourceInvoiceId : undefined,
          } as BusinessDoc
        }))
        setLoading(false)
      },
      () => {
        setLoadError('Failed to load documents. Please try again.')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [docType])

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  }, [documents])

  const invoiceCountByItem = useMemo(() => {
    return documents.reduce<Record<string, number>>((counts, document) => {
      const itemNumber = document.itemNumber?.trim().toUpperCase()
      if (itemNumber) counts[itemNumber] = (counts[itemNumber] || 0) + 1
      return counts
    }, {})
  }, [documents])

  const handleNewClick = () => {
    if (docType === 'invoice') {
      setIsCategoryModalOpen(true)
    } else {
      setIsCreateModalOpen(true)
    }
  }

  const handleCategoryContinue = (category: InvoiceCategory) => {
    setInvoiceCategory(category)
    setIsCategoryModalOpen(false)
    if (category === 'used_goods') {
      setEditingInvoice(null)
      setIsUGInvoiceModalOpen(true)
    } else {
      setIsCreateModalOpen(true)
    }
  }

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false)
    setIsUGInvoiceModalOpen(false)
    setEditingInvoice(null)
    setInvoiceCategory(null)
  }

  const handleEdit = (invoice: BusinessDoc) => {
    if (invoice.docType !== 'used_goods_invoice' || invoice.status !== 'draft') return
    setActionError(null)
    setEditingInvoice(invoice)
    setIsUGInvoiceModalOpen(true)
  }

  const handleDownload = async (invoice: BusinessDoc) => {
    if (downloadingId) return
    setDownloadingId(invoice.id)
    setActionError(null)
    try {
      await downloadUsedGoodsInvoicePdf(invoice)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate the invoice PDF.')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatPrice = (price?: string) => {
    const n = parseFloat(price ?? '')
    return isNaN(n) ? (price || '—') : `£${n.toFixed(2)}`
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(`${iso.split('T')[0]}T00:00:00`)
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Documents</p>
          <h1 className="text-4xl font-semibold leading-tight">{label}s</h1>
        </header>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewClick}
            className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            New {label}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 flex items-center justify-center animate-stack-up delay-100">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : loadError ? (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center animate-stack-up delay-100">
          <p className="text-red-400">{loadError}</p>
        </div>
      ) : sortedDocuments.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center animate-stack-up delay-100">
          <FileText className="w-8 h-8 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No {label.toLowerCase()}s yet.</p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl animate-stack-up delay-100">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold">{label} Number</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Item Number</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Item Name</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Price</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Delivery Date</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">{docType === 'invoice' ? 'Actions' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-base">
                      <div>{doc.invoiceNumber || '—'}</div>
                      {doc.sourceInvoiceId && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          Updated {documents.find((source) => source.id === doc.sourceInvoiceId)?.invoiceNumber || 'invoice'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-base">
                      <div>{doc.itemNumber || '—'}</div>
                      {(invoiceCountByItem[doc.itemNumber?.trim().toUpperCase() || ''] || 0) > 1 && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          {invoiceCountByItem[doc.itemNumber?.trim().toUpperCase() || '']} invoices
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-base">{doc.itemName || '—'}</td>
                    <td className="px-4 py-3 text-base">{doc.customerName || '—'}</td>
                    <td className="px-4 py-3 text-base">{formatPrice(doc.price)}</td>
                    <td className="px-4 py-3 text-base">{formatDate(doc.deliveryDate)}</td>
                    <td className="px-4 py-3 text-base">
                      {docType === 'invoice' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setActionError(null); setPreviewInvoice(doc) }}
                            className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            title="Preview invoice"
                            aria-label={`Preview invoice ${doc.invoiceNumber || ''}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {doc.docType === 'used_goods_invoice' && doc.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => handleEdit(doc)}
                              className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                              title="Create new invoice from this invoice"
                              aria-label={`Create new invoice from invoice ${doc.invoiceNumber || ''}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId !== null}
                            className="p-1.5 rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            title="Download PDF"
                            aria-label={`Download invoice ${doc.invoiceNumber || ''} as PDF`}
                          >
                            {downloadingId === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Printer className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium capitalize ${STATUS_COLORS[doc.status ?? ''] ?? 'text-gray-400 bg-gray-400/10'}`}>
                          {doc.status || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <NewDocumentModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        docType={docType}
        category={invoiceCategory}
      />
      <InvoiceCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onContinue={handleCategoryContinue}
      />
      <UsedGoodsInvoiceModal
        isOpen={isUGInvoiceModalOpen}
        onClose={handleCreateModalClose}
        editInvoice={editingInvoice}
      />
      <UsedGoodsInvoicePreview
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />
    </section>
  )
}
