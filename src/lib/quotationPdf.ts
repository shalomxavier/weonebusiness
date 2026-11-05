import { createElement, ReactElement } from 'react'
import { DocumentProps, pdf } from '@react-pdf/renderer'
import { RemovalsQuotationRecord } from '../components/NewDocumentModal'
import { RemovalsQuotationPdfDocument } from '../components/RemovalsQuotationPdf'

export async function createRemovalsQuotationPdfBlob(quotation: RemovalsQuotationRecord) {
  return pdf(createElement(RemovalsQuotationPdfDocument, { quotation }) as ReactElement<DocumentProps>).toBlob()
}

export async function downloadRemovalsQuotationPdf(quotation: RemovalsQuotationRecord) {
  const blob = await createRemovalsQuotationPdfBlob(quotation)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  const number = quotation.quoteNumber?.trim().replace(/[^a-zA-Z0-9_-]+/g, '-')
  anchor.download = `Quotation-${number || 'Draft'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
