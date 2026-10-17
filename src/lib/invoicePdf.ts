import { createElement, ReactElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { InvoiceDocument, UsedGoodsInvoicePdfDocument } from '../components/UsedGoodsInvoicePdf'

const safeFilename = (number?: string) => {
  const clean = number?.trim().replace(/[^a-zA-Z0-9_-]+/g, '-')
  return `Invoice-${clean || 'Draft'}.pdf`
}

export async function createUsedGoodsInvoicePdfBlob(invoice: InvoiceDocument) {
  if (!invoice.invoiceNumber?.trim()) throw new Error('Invoice number is missing')
  if (isNaN(parseFloat(invoice.price ?? ''))) throw new Error('Invoice price is invalid')

  return pdf(createElement(UsedGoodsInvoicePdfDocument, { invoice }) as ReactElement<any>).toBlob()
}

export async function downloadUsedGoodsInvoicePdf(invoice: InvoiceDocument) {
  const blob = await createUsedGoodsInvoicePdfBlob(invoice)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeFilename(invoice.invoiceNumber)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
