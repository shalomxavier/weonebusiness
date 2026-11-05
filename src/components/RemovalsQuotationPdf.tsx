import { Document, Image, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { DEFAULT_INCLUDED_SERVICES, INCLUDED_SERVICE_DETAILS, MovingFromDetails, MovingToDetails, RemovalsQuotationRecord, REMOVALS_QUOTATION_COMPANY_DETAILS } from './NewDocumentModal'
import logo from '../assets/we-one-logo-since2016-navy.png'

const NAVY = '#12355B'
const BORDER = '#C6D0DC'
const styles = StyleSheet.create({
  page: { padding: 26, fontFamily: 'Helvetica', fontSize: 8, color: NAVY, justifyContent: 'space-between' },
  section: { flexShrink: 0, marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1 solid ${NAVY}`, paddingBottom: 7, flexShrink: 0 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 32, marginBottom: 3 },
  brandSub: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginBottom: 5 },
  muted: { color: '#5D7088', fontSize: 8.5 },
  logo: { width: 110, height: 68, objectFit: 'contain' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 25, marginTop: 4, marginBottom: 4 },
  metadata: { width: 199, border: `0.6 solid ${BORDER}`, borderRadius: 3, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', backgroundColor: '#E8EDF3', borderBottom: `0.4 solid ${BORDER}` },
  metaLabel: { width: 88, padding: 4, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  metaValue: { flex: 1, padding: 4, fontSize: 8 },
  heading: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 4 },
  table: { border: `0.6 solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: { paddingHorizontal: 9, paddingVertical: 4, borderRight: `0.4 solid ${BORDER}`, fontSize: 8, lineHeight: 1.3 },
  tableHead: { backgroundColor: '#E5EBF2', borderBottom: `0.5 solid ${BORDER}`, fontSize: 7 },
  third: { width: '33.333%' },
  half: { width: '50%' },
  propertyDivider: { borderLeft: `0.4 solid ${BORDER}` },
  propertyRow: { flexDirection: 'row', borderBottom: `0.4 solid ${BORDER}`, minHeight: 18 },
  propertyLabel: { width: '36%', paddingHorizontal: 9, paddingVertical: 3, borderRight: `0.4 solid ${BORDER}`, fontSize: 7 },
  propertyValue: { width: '15%', paddingHorizontal: 6, paddingVertical: 3, borderRight: `0.4 solid ${BORDER}`, fontSize: 7 },
  propertyNotes: { flex: 1, paddingHorizontal: 7, paddingVertical: 3, fontSize: 7, lineHeight: 1.4 },
  service: { flex: 1, flexDirection: 'row', padding: 10, borderRight: `0.4 solid ${BORDER}`, backgroundColor: '#F7F9FC' },
  serviceText: { flex: 1, marginLeft: 8, fontSize: 7, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  additionalRow: { flexDirection: 'row', borderBottom: `0.4 solid ${BORDER}` },
  additionalLabel: { width: '25%', padding: 5, borderRight: `0.4 solid ${BORDER}`, fontSize: 7 },
  additionalValue: { flex: 1, padding: 5, fontSize: 7, lineHeight: 1.4, borderRight: `0.4 solid ${BORDER}` },
  totals: { backgroundColor: NAVY, color: '#FFFFFF', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.6 solid #FFFFFF', paddingTop: 6, paddingBottom: 4, marginTop: 2, fontFamily: 'Helvetica-Bold', fontSize: 10 },
  grandAmount: { fontSize: 16 },
  thanks: { textAlign: 'center', lineHeight: 1.35, fontSize: 7 },
  closingHeading: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3 },
  footer: { flexDirection: 'row', borderTop: `0.6 solid ${BORDER}`, marginTop: 6, paddingTop: 6, fontSize: 6.5, lineHeight: 1.35 },
  legal: { width: '50%', paddingRight: 12 },
  contacts: { width: '50%', paddingLeft: 12, textAlign: 'right' },
})

const value = (input?: string) => input?.trim() || '—'
const amount = (input?: string) => input?.trim() && Number.isFinite(Number(input)) ? Number(input).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) : '—'
const yesNo = (input?: string) => input === 'yes' ? 'Yes' : input === 'no' ? 'No' : '—'
const date = (input?: string) => {
  if (!input) return '—'
  const parsed = new Date(`${input.split('T')[0]}T00:00:00`)
  return isNaN(parsed.getTime()) ? input : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function ServiceIcon({ service }: { service: keyof typeof INCLUDED_SERVICE_DETAILS }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 32 32">
      {service === 'transportation' ? <>
        <Path d="M2 7H20V23H2Z M20 13H26L30 19V23H20 M22 15H25L28 19H22Z" stroke={NAVY} strokeWidth={1.5} fill="none" />
        <Path d="M7 21A3 3 0 1 0 7 27A3 3 0 1 0 7 21 M25 21A3 3 0 1 0 25 27A3 3 0 1 0 25 21" fill="#FFFFFF" stroke={NAVY} strokeWidth={1.5} />
      </> : service === 'loading' ? <>
        <Path d="M5 9L16 3L27 9V23L16 29L5 23Z M5 9L16 15L27 9 M16 15V29 M10 6L22 12" stroke={NAVY} strokeWidth={1.5} fill="none" />
      </> : <>
        <Path d="M2 14L16 3L30 14 M6 12V28H26V12" stroke={NAVY} strokeWidth={1.5} fill="none" />
        <Rect x={13} y={18} width={7} height={10} stroke={NAVY} strokeWidth={1.5} fill="none" />
      </>}
    </Svg>
  )
}

function PropertyRow({ label, text, notes }: { label: string; text: string; notes?: string }) {
  return <View style={styles.propertyRow}><Text style={styles.propertyLabel}>{label}</Text><Text style={styles.propertyValue}>{text}</Text><Text style={styles.propertyNotes}>{notes || ''}</Text></View>
}

function PropertyDetails({ details, destination = false }: { details?: Partial<MovingFromDetails & MovingToDetails>; destination?: boolean }) {
  return <View style={destination ? [styles.half, styles.propertyDivider] : styles.half}>
    <PropertyRow label="Bedrooms" text={value(details?.bedrooms)} />
    <PropertyRow label="Garage" text={yesNo(details?.garage)} notes={details?.garageNotes} />
    <PropertyRow label="Garden shed" text={yesNo(details?.gardenShed)} notes={details?.gardenShedNotes} />
    <PropertyRow label="Garden furniture" text={yesNo(details?.gardenFurniture)} notes={details?.gardenFurnitureNotes} />
    <PropertyRow label={destination ? 'Assembly required' : 'Dismantling required'} text={yesNo(destination ? details?.assemblyRequired : details?.dismantlingRequired)} notes={destination ? details?.assemblyNotes : details?.dismantlingNotes} />
  </View>
}

function Address({ details }: { details?: Partial<MovingFromDetails> }) {
  return <View style={[styles.cell, styles.half]}>
    <Text>{value(details?.address)}</Text>
    {details?.postcode?.trim() && <Text>{details.postcode.trim()}</Text>}
    {details?.bedrooms?.trim() && <Text>{details.bedrooms}-bedroom house</Text>}
  </View>
}

export function RemovalsQuotationPdfDocument({ quotation }: { quotation: RemovalsQuotationRecord }) {
  const company = REMOVALS_QUOTATION_COMPANY_DETAILS
  const packing = quotation.packingRequired === 'yes'
  const movingPrice = Number(quotation.totalMovingPrice)
  const packingPrice = packing ? Number(quotation.totalPackingCost) : 0
  const hasPrices = !!quotation.totalMovingPrice?.trim() && (!packing || !!quotation.totalPackingCost?.trim())
  const total = hasPrices && Number.isFinite(movingPrice + packingPrice) ? amount(String(movingPrice + packingPrice)) : '—'
  const services = { ...DEFAULT_INCLUDED_SERVICES, ...quotation.includedServices }
  const selectedServices = (Object.keys(INCLUDED_SERVICE_DETAILS) as (keyof typeof INCLUDED_SERVICE_DETAILS)[]).filter((key) => services[key])

  return (
    <Document title={`House Move Quote ${quotation.quoteNumber || ''}`} author={company.companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <View><Text style={styles.brand}>WE ONE</Text><Text style={styles.brandSub}>REMOVALS &amp; CLEARANCES LTD</Text><Text style={styles.muted}>Nationwide Services on House Moves &amp; House Clearances</Text></View>
          <Image src={logo} style={styles.logo} />
        </View>
        <View style={[styles.section, styles.titleRow]} wrap={false}>
          <View><Text style={styles.title}>HOUSE MOVE QUOTE</Text><Text style={styles.muted}>Professional removal service quotation</Text></View>
          <View style={styles.metadata}>
            {([['QUOTE NO.', value(quotation.quoteNumber)], ['QUOTE DATE', date(quotation.quoteDate)], ['MOVE DATE', date(quotation.movingDate)]]).map(([label, text]) => <View key={label} style={styles.metaRow}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{text}</Text></View>)}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading} minPresenceAhead={50}>CUSTOMER DETAILS</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.tableHead]}>{['CUSTOMER NAME', 'PHONE', 'EMAIL'].map((label) => <Text key={label} style={[styles.cell, styles.third]}>{label}</Text>)}</View>
            <View style={styles.row}>{[quotation.customerName, quotation.phone, quotation.email].map((text, index) => <Text key={index} style={[styles.cell, styles.third]}>{value(text)}</Text>)}</View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading} minPresenceAhead={60}>MOVE DETAILS</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.tableHead]}><Text style={[styles.cell, styles.half]}>MOVING FROM</Text><Text style={[styles.cell, styles.half]}>MOVING TO</Text></View>
            <View style={styles.row}><Address details={quotation.movingFrom} /><Address details={quotation.movingTo} /></View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading} minPresenceAhead={60}>PROPERTY DETAILS</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.tableHead]}><Text style={[styles.cell, styles.half]}>AT COLLECTION (FROM)</Text><Text style={[styles.cell, styles.half]}>AT DELIVERY (TO)</Text></View>
            <View style={styles.row}><PropertyDetails details={quotation.movingFrom} /><PropertyDetails details={quotation.movingTo} destination /></View>
          </View>
        </View>
        <View style={styles.section} wrap={false}>
          <Text style={styles.heading}>WHAT'S INCLUDED</Text>
          <View style={[styles.table, styles.row]}>
            {selectedServices.length ? selectedServices.map((key) => <View key={key} style={styles.service}><ServiceIcon service={key} /><View style={styles.serviceText}><Text style={styles.bold}>{INCLUDED_SERVICE_DETAILS[key].label}</Text><Text>{INCLUDED_SERVICE_DETAILS[key].description}</Text></View></View>) : <Text style={styles.cell}>No included services selected.</Text>}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading} minPresenceAhead={60}>ADDITIONAL SERVICES</Text>
          <View style={styles.table}>
            <View style={styles.additionalRow} wrap={false}><Text style={styles.additionalLabel}>Packing required</Text><Text style={styles.additionalValue}>{yesNo(quotation.packingRequired)}</Text></View>
            {packing && <>
              <View style={styles.additionalRow} wrap={false}><Text style={styles.additionalLabel}>Packing day</Text><Text style={styles.additionalValue}>{quotation.packingDay === 'different_date' ? 'Different date' : 'Same day as move'}</Text><Text style={styles.additionalValue}>{date(quotation.packingDay === 'different_date' ? quotation.packingDate : quotation.movingDate)}</Text></View>
              <View style={styles.additionalRow}><Text style={styles.additionalLabel}>Packing cost</Text><Text style={styles.additionalValue}>{amount(quotation.totalPackingCost)}</Text><Text style={styles.additionalValue}>{value(quotation.packingDescription)}</Text></View>
              {quotation.packingNotes?.trim() && <View style={styles.additionalRow}><Text style={styles.additionalLabel}>Packing notes</Text><Text style={styles.additionalValue}>{quotation.packingNotes}</Text></View>}
            </>}
            <View style={styles.additionalRow}><Text style={styles.additionalLabel}>Additional notes</Text><Text style={styles.additionalValue}>{value(quotation.additionalNotes)}</Text></View>
          </View>
        </View>
        <View style={[styles.section, styles.totals]} wrap={false}>
          <View style={styles.totalRow}><Text>TOTAL MOVING COST</Text><Text>{amount(quotation.totalMovingPrice)}</Text></View>
          <View style={styles.totalRow}><Text>TOTAL PACKING COST</Text><Text>{packing ? amount(quotation.totalPackingCost) : '£0.00'}</Text></View>
          <View style={styles.grandTotal}><Text>TOTAL QUOTE AMOUNT</Text><Text style={styles.grandAmount}>{total}</Text></View>
        </View>
        <View style={styles.section} wrap={false}>
          <View style={styles.thanks}>
            <Text style={styles.closingHeading}>THANKS FOR CONSIDERING WE ONE</Text>
            <Text>{company.thankYou}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.legal}>
              <Text style={styles.bold}>WE ONE REMOVALS &amp; CLEARANCES LTD</Text>
              <Text>Company No. {company.companyNumber}</Text>
              <Text>Waste Carrier No. {company.wasteCarrierNumber}</Text>
            </View>
            <View style={styles.contacts}>
              <Text>{company.phone} · {company.website}</Text>
              <Text>{company.email}</Text>
              <Text>{company.contactEmail}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
