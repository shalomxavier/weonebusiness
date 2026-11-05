import DocumentPdfPreview from './DocumentPdfPreview'
import { InvoiceDocument, UsedGoodsInvoicePdfDocument } from './UsedGoodsInvoicePdf'

export type { InvoiceDocument } from './UsedGoodsInvoicePdf'

interface UsedGoodsInvoicePreviewProps {
  invoice: InvoiceDocument | null
  onClose: () => void
}

export default function UsedGoodsInvoicePreview({ invoice, onClose }: UsedGoodsInvoicePreviewProps) {
  return (
    <DocumentPdfPreview
      key={invoice?.id || 'closed'}
      document={invoice ? <UsedGoodsInvoicePdfDocument invoice={invoice} /> : null}
      title={invoice?.invoiceNumber || 'Untitled invoice'}
      heading="Invoice preview"
      onClose={onClose}
    />
  )
}
