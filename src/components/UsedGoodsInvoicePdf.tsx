import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { Timestamp } from 'firebase/firestore'
import logo from '../assets/we-one-logo-since2016-red.png'

export interface InvoiceDocument {
  id: string
  docType: string
  invoiceNumber?: string
  itemNumber?: string
  itemName?: string
  customerName?: string
  phone?: string
  address?: string
  postcode?: string
  price?: string
  deliveryDate?: string
  bankDetails?: string
  orderId?: string
  createdAt?: Timestamp | null
}

const RED = '#E4002B'
const BLACK = '#171717'
const MUTED = '#666666'
const PANEL = '#F7F7F8'
const BORDER = '#E4E4E7'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    color: '#2B2B2B',
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 27,
    paddingHorizontal: 34,
    paddingBottom: 28,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: RED,
  },
  header: {
    height: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 110,
    height: 78,
    objectFit: 'contain',
    objectPosition: 'left top',
  },
  company: {
    width: 275,
    paddingTop: 9,
    alignItems: 'flex-end',
  },
  companyName: {
    color: RED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11.5,
    marginBottom: 11,
    textAlign: 'right',
  },
  legalName: {
    color: MUTED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.6,
    marginBottom: 9,
  },
  companyLine: {
    color: '#555555',
    fontSize: 8,
    marginBottom: 7,
    textAlign: 'right',
  },
  banner: {
    height: 42,
    borderRadius: 5,
    backgroundColor: RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 9,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 19,
  },
  bannerMeta: {
    width: 165,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  metaLabel: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.3,
  },
  metaValue: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'right',
    width: 92,
  },
  sectionHeading: {
    color: RED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    marginLeft: 3,
    marginTop: 2,
    marginBottom: 7,
  },
  detailsPanel: {
    borderWidth: 0.7,
    borderColor: BORDER,
    borderRadius: 9,
    backgroundColor: PANEL,
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 18,
  },
  detailsColumn: {
    width: '50%',
    paddingRight: 10,
  },
  detailsColumnRight: {
    width: '50%',
    paddingLeft: 6,
  },
  detailRow: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.7,
    borderBottomColor: '#DEDEE2',
  },
  detailLabel: {
    width: 82,
    color: MUTED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  detailValue: {
    flex: 1,
    minHeight: 23,
    paddingTop: 7,
    color: MUTED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    lineHeight: 1.3,
  },
  table: {
    borderWidth: 0.7,
    borderColor: BORDER,
    marginBottom: 13,
  },
  tableHeader: {
    height: 30,
    backgroundColor: BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  tableBody: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 8.5,
  },
  qty: { width: 42, textAlign: 'center' },
  description: { flex: 1, paddingHorizontal: 5 },
  unitPrice: { width: 80, textAlign: 'right', paddingRight: 7, borderLeftWidth: 0.7, borderLeftColor: BORDER },
  amount: { width: 96, textAlign: 'right', paddingRight: 7, borderLeftWidth: 0.7, borderLeftColor: BORDER },
  paymentArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paymentLeft: {
    width: 270,
  },
  paymentPanel: {
    minHeight: 87,
    borderWidth: 0.7,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: PANEL,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  bankDetailsText: {
    color: '#333333',
    fontFamily: 'Helvetica',
    fontSize: 8.3,
    lineHeight: 1.65,
  },
  totals: {
    width: 238,
    paddingTop: 14,
  },
  subtotalPanel: {
    height: 85,
    borderWidth: 0.7,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: PANEL,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    color: MUTED,
  },
  totalValue: {
    color: '#222222',
    fontFamily: 'Helvetica-Bold',
  },
  due: {
    height: 40,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: RED,
    color: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1.5,
    borderTopColor: RED,
    paddingTop: 11,
  },
  thankYou: {
    color: RED,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    marginBottom: 10,
  },
  footerLine: {
    color: '#777777',
    fontSize: 6.8,
    marginBottom: 7,
  },
})

const value = (input?: string) => input?.trim() || '—'

export const formatDeliveryDate = (input?: string) => {
  if (!input) return '—'
  const date = new Date(`${input.split('T')[0]}T00:00:00`)
  return isNaN(date.getTime()) ? input : date.toLocaleDateString('en-GB')
}

export const formatInvoiceAmount = (input?: string) => {
  const amount = parseFloat(input ?? '')
  return isNaN(amount) ? '£0.00' : `£${amount.toFixed(2)}`
}

function DetailRow({ label, children }: { label: string; children: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{children.toUpperCase()}</Text>
    </View>
  )
}

export function UsedGoodsInvoicePdfDocument({ invoice }: { invoice: InvoiceDocument }) {
  const amount = formatInvoiceAmount(invoice.price)

  return (
    <Document title={`Invoice ${invoice.invoiceNumber || ''}`} author="WeOne Trading Limited">
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.topBar} fixed />

        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.company}>
            <Text style={styles.companyName}>WEONE USED FURNITURE &amp; APPLIANCES</Text>
            <Text style={styles.legalName}>(WeOne Trading Limited)</Text>
            <Text style={styles.companyLine}>weoneusedfurnituresandappliances.uk</Text>
            <Text style={styles.companyLine}>enquiry@weoneusedfurnituresandappliances.uk  |  07946 775933</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>INVOICE</Text>
          <View style={styles.bannerMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>INVOICE NO.</Text>
              <Text style={styles.metaValue}>{value(invoice.invoiceNumber)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>CUSTOMER &amp; DELIVERY DETAILS</Text>
        <View style={styles.detailsPanel}>
          <View style={styles.detailsColumn}>
            <DetailRow label="ITEM NUMBER">{value(invoice.itemNumber)}</DetailRow>
            <DetailRow label="ITEM NAME">{value(invoice.itemName)}</DetailRow>
            <DetailRow label="PHONE">{value(invoice.phone)}</DetailRow>
          </View>
          <View style={styles.detailsColumnRight}>
            <DetailRow label="POSTCODE">{value(invoice.postcode)}</DetailRow>
            <DetailRow label="DELIVERY DATE">{formatDeliveryDate(invoice.deliveryDate)}</DetailRow>
            <DetailRow label="ADDRESS">{value(invoice.address)}</DetailRow>
          </View>
        </View>

        <Text style={styles.sectionHeading}>INVOICE SUMMARY</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.qty}>QTY</Text>
            <Text style={styles.description}>DESCRIPTION</Text>
            <Text style={styles.unitPrice}>UNIT PRICE</Text>
            <Text style={styles.amount}>AMOUNT</Text>
          </View>
          <View style={styles.tableBody}>
            <Text style={styles.qty}>1</Text>
            <Text style={styles.description}>{value(invoice.itemName).toUpperCase()}</Text>
            <Text style={styles.unitPrice}>{amount}</Text>
            <Text style={styles.amount}>{amount}</Text>
          </View>
        </View>

        <View style={styles.paymentArea}>
          <View style={styles.paymentLeft}>
            <Text style={styles.sectionHeading}>BANK DETAILS</Text>
            <View style={styles.paymentPanel}>
              <Text style={styles.bankDetailsText}>{invoice.bankDetails?.trim() || ''}</Text>
            </View>
          </View>
          <View style={styles.totals}>
            <View style={styles.subtotalPanel}>
              <View style={styles.totalRow}><Text>Subtotal</Text><Text style={styles.totalValue}>{amount}</Text></View>
            </View>
            <View style={styles.due}><Text>TOTAL DUE</Text><Text>{amount}</Text></View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for choosing WeOne.</Text>
          <Text style={styles.footerLine}>WeOne Trading Limited  |  weoneusedfurnituresandappliances.uk</Text>
          <Text style={styles.footerLine}>Please retain this invoice for your records.</Text>
        </View>
      </Page>
    </Document>
  )
}
