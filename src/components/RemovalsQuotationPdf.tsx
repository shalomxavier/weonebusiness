import { Document, Image, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import { DEFAULT_INCLUDED_SERVICES, INCLUDED_SERVICE_DETAILS, MovingFromDetails, MovingToDetails, RemovalsQuotationRecord, REMOVALS_QUOTATION_COMPANY_DETAILS, CustomNote } from './NewDocumentModal'
import logo from '../assets/we-one-logo-since2016-navy.png'

const NAVY = '#12355B'
const BORDER = '#C6D0DC'
const TINT = '#EEF2F7'
const MUTED = '#5D7088'

const styles = StyleSheet.create({
  page: { paddingVertical: 28, paddingHorizontal: 30, fontFamily: 'Helvetica', fontSize: 8.5, color: NAVY },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1 solid ${NAVY}`, paddingBottom: 8 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 30, lineHeight: 1.2, minHeight: 38, flexShrink: 0, letterSpacing: 1 },
  brandSub: { fontFamily: 'Helvetica-Bold', fontSize: 10, lineHeight: 1.4, marginTop: 4 },
  brandTag: { color: MUTED, fontSize: 8, lineHeight: 1.4, marginTop: 3 },
  logo: { width: 104, height: 64, objectFit: 'contain' },
  // Title + metadata
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 19, lineHeight: 1.2, minHeight: 26, flexShrink: 0 },
  titleTag: { color: MUTED, fontSize: 8.5, lineHeight: 1.4, marginTop: 5 },
  metadata: { width: 200, borderRadius: 4, overflow: 'hidden', border: `0.6 solid ${BORDER}` },
  metaRow: { flexDirection: 'row', borderBottom: `0.5 solid ${BORDER}` },
  metaRowLast: { flexDirection: 'row' },
  metaLabel: { width: 82, paddingVertical: 4, paddingHorizontal: 7, fontSize: 7, fontFamily: 'Helvetica-Bold', backgroundColor: TINT },
  metaValue: { flex: 1, paddingVertical: 4, paddingHorizontal: 7, fontSize: 8 },
  // Sections
  section: { marginTop: 16 },
  heading: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, letterSpacing: 0.6, color: NAVY, paddingBottom: 3, marginBottom: 7, borderBottom: `1 solid ${NAVY}` },
  // Generic label/value field
  field: { flexDirection: 'row', marginBottom: 2.5 },
  fieldLabel: { width: 96, color: MUTED, fontSize: 8 },
  fieldValue: { flex: 1, fontSize: 8.5 },
  // Two-column container
  cols: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },
  // Card used for property / address blocks
  card: { flex: 1, borderRadius: 4, border: `0.6 solid ${BORDER}`, overflow: 'hidden' },
  cardHead: { backgroundColor: NAVY, color: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 9, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  cardBody: { padding: 9 },
  addressLine: { fontSize: 8.5, marginBottom: 1 },
  descriptor: { fontSize: 8, color: MUTED, marginTop: 2 },
  // Feature / notes rows inside a property card
  groupLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginTop: 7, marginBottom: 2 },
  featureRow: { flexDirection: 'row', marginBottom: 2 },
  featureName: { width: 92, fontSize: 8 },
  featureNotes: { flex: 1, fontSize: 8, color: MUTED },
  bullet: { flexDirection: 'row', marginBottom: 1.5 },
  bulletDot: { width: 8, fontSize: 8, color: NAVY },
  bulletText: { flex: 1, fontSize: 8 },
  customTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  customNote: { fontSize: 8, color: MUTED, marginBottom: 3 },
  // Services
  servicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  serviceCard: { width: '31.8%', flexDirection: 'row', padding: 8, borderRadius: 4, border: `0.6 solid ${BORDER}`, backgroundColor: '#F7F9FC' },
  serviceText: { flex: 1, marginLeft: 7 },
  serviceLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  serviceDesc: { fontSize: 7, color: MUTED, marginTop: 1, lineHeight: 1.35 },
  // Packing / additional
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 110, color: MUTED, fontSize: 8 },
  infoValue: { flex: 1, fontSize: 8.5 },
  // Totals
  totals: { marginTop: 16, backgroundColor: NAVY, color: '#FFFFFF', borderRadius: 5, paddingHorizontal: 14, paddingVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 9 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.7 solid #FFFFFF', paddingTop: 6, paddingBottom: 2, marginTop: 3, fontFamily: 'Helvetica-Bold', fontSize: 11 },
  grandAmount: { fontSize: 16 },
  // Closing
  thanks: { marginTop: 16, textAlign: 'center', lineHeight: 1.4, fontSize: 7.5 },
  closingHeading: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 3 },
  footer: { flexDirection: 'row', borderTop: `0.7 solid ${BORDER}`, marginTop: 12, paddingTop: 7, fontSize: 6.8, lineHeight: 1.4 },
  legal: { width: '50%', paddingRight: 12 },
  contacts: { width: '50%', paddingLeft: 12, textAlign: 'right' },
  bold: { fontFamily: 'Helvetica-Bold' },
})

// ---------- helpers ----------
const has = (s?: string) => !!s && s.trim().length > 0
const clean = (s?: string) => (s ? s.trim() : '')
const cleanList = (arr?: string[]) => (arr || []).map((x) => clean(x)).filter(Boolean)
const cleanCustom = (arr?: CustomNote[]) =>
  (arr || []).map((c) => ({ title: clean(c?.title), note: clean(c?.note) })).filter((c) => c.title || c.note)
const isYes = (v?: string) => v === 'yes'
const showFeature = (value?: string, notes?: string) => isYes(value) || has(notes)
const amount = (input?: string) =>
  has(input) && Number.isFinite(Number(input))
    ? Number(input).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
    : ''
const dateFmt = (input?: string) => {
  if (!has(input)) return ''
  const parsed = new Date(`${input!.split('T')[0]}T00:00:00`)
  return isNaN(parsed.getTime()) ? input! : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

type Details = Partial<MovingFromDetails & MovingToDetails>

const propertyDescriptor = (d?: Details): string => {
  if (!d) return ''
  const parts: string[] = []
  if (d.propertyType === 'house') parts.push('House')
  else if (d.propertyType === 'flat') parts.push('Flat')
  if (has(d.bedrooms)) parts.push(`${clean(d.bedrooms)} bedroom${clean(d.bedrooms) === '1' ? '' : 's'}`)
  if (d.propertyType === 'house' && has(d.storeys)) parts.push(`${clean(d.storeys)} storey${clean(d.storeys) === '1' ? '' : 's'}`)
  if (d.propertyType === 'flat' && has(d.floor)) parts.push(`Floor ${clean(d.floor)}`)
  if (d.propertyType === 'flat') parts.push(`Lift: ${isYes(d.lift) ? 'Yes' : 'No'}`)
  return parts.join('  ·  ')
}

// Build the list of feature rows applicable to a property side
type Feature = { label: string; value?: string; notes?: string }
const fromFeatures = (d?: Partial<MovingFromDetails>): Feature[] => [
  { label: 'Kitchen', value: d?.kitchen, notes: d?.kitchenNotes },
  { label: 'Utility room', value: d?.utilityRoom, notes: d?.utilityRoomNotes },
  { label: 'Conservatory', value: d?.conservatory, notes: d?.conservatoryNotes },
  { label: 'Downstairs hallway', value: d?.downstairsHallway, notes: d?.downstairsHallwayNotes },
  { label: 'Upstairs hallway', value: d?.upstairsHallway, notes: d?.upstairsHallwayNotes },
  { label: 'Garage', value: d?.garage, notes: d?.garageNotes },
  { label: 'Garden shed', value: d?.gardenShed, notes: d?.gardenShedNotes },
  { label: 'Garden furniture', value: d?.gardenFurniture, notes: d?.gardenFurnitureNotes },
  { label: 'Dismantling required', value: d?.dismantlingRequired, notes: d?.dismantlingNotes },
]
const toFeatures = (d?: Partial<MovingToDetails>): Feature[] => [
  { label: 'Garage', value: d?.garage, notes: d?.garageNotes },
  { label: 'Garden shed', value: d?.gardenShed, notes: d?.gardenShedNotes },
  { label: 'Garden furniture', value: d?.gardenFurniture, notes: d?.gardenFurnitureNotes },
  { label: 'Assembly required', value: d?.assemblyRequired, notes: d?.assemblyNotes },
]

// ---------- small components ----------
function Field({ label, value }: { label: string; value?: string }) {
  if (!has(value)) return null
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{clean(value)}</Text>
    </View>
  )
}

function FeatureList({ features }: { features: Feature[] }) {
  const visible = features.filter((f) => showFeature(f.value, f.notes))
  if (!visible.length) return null
  return (
    <>
      {visible.map((f) => (
        <View key={f.label} style={styles.featureRow}>
          <Text style={styles.featureName}>{f.label}</Text>
          <Text style={styles.featureNotes}>{has(f.notes) ? clean(f.notes) : 'Yes'}</Text>
        </View>
      ))}
    </>
  )
}

function NotesGroup({ label, notes }: { label: string; notes?: string[] }) {
  const list = cleanList(notes)
  if (!list.length) return null
  return (
    <>
      <Text style={styles.groupLabel}>{label}</Text>
      {list.map((n, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{n}</Text>
        </View>
      ))}
    </>
  )
}

function CustomNotesList({ items }: { items?: CustomNote[] }) {
  const list = cleanCustom(items)
  if (!list.length) return null
  return (
    <>
      <Text style={styles.groupLabel}>Additional details</Text>
      {list.map((c, i) => (
        <View key={i}>
          {!!c.title && <Text style={styles.customTitle}>{c.title}</Text>}
          {!!c.note && <Text style={styles.customNote}>{c.note}</Text>}
        </View>
      ))}
    </>
  )
}

function ServiceIcon({ service }: { service: keyof typeof INCLUDED_SERVICE_DETAILS }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32">
      {service === 'safeTransportation' ? <>
        <Path d="M2 7H20V23H2Z M20 13H26L30 19V23H20 M22 15H25L28 19H22Z" stroke={NAVY} strokeWidth={1.5} fill="none" />
        <Path d="M7 21A3 3 0 1 0 7 27A3 3 0 1 0 7 21 M25 21A3 3 0 1 0 25 27A3 3 0 1 0 25 21" fill="#FFFFFF" stroke={NAVY} strokeWidth={1.5} />
      </> : service === 'loadingUnloading' ? <>
        <Path d="M5 9L16 3L27 9V23L16 29L5 23Z M5 9L16 15L27 9 M16 15V29 M10 6L22 12" stroke={NAVY} strokeWidth={1.5} fill="none" />
      </> : <>
        <Path d="M2 14L16 3L30 14 M6 12V28H26V12" stroke={NAVY} strokeWidth={1.5} fill="none" />
        <Rect x={13} y={18} width={7} height={10} stroke={NAVY} strokeWidth={1.5} fill="none" />
      </>}
    </Svg>
  )
}

// Returns true if a property side has any renderable content beyond the address card header
function propertyHasContent(features: Feature[], groups: string[][], customs: CustomNote[]): boolean {
  if (features.some((f) => showFeature(f.value, f.notes))) return true
  if (groups.some((g) => cleanList(g).length > 0)) return true
  if (cleanCustom(customs).length > 0) return true
  return false
}

function AddressCard({ title, details }: { title: string; details?: Details }) {
  const desc = propertyDescriptor(details)
  const hasAny = has(details?.address) || has(details?.postcode) || !!desc
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardHead}>{title}</Text>
      <View style={styles.cardBody}>
        {hasAny ? (
          <>
            {has(details?.address) && <Text style={styles.addressLine}>{clean(details?.address)}</Text>}
            {has(details?.postcode) && <Text style={styles.addressLine}>{clean(details?.postcode)}</Text>}
            {!!desc && <Text style={styles.descriptor}>{desc}</Text>}
          </>
        ) : (
          <Text style={styles.descriptor}>Not provided</Text>
        )}
      </View>
    </View>
  )
}

function PropertyCard({
  title,
  details,
  features,
  bedroomBathroomGroups,
}: {
  title: string
  details?: Details
  features: Feature[]
  bedroomBathroomGroups: { label: string; notes?: string[] }[]
}) {
  const groupArrays = bedroomBathroomGroups.map((g) => g.notes || [])
  if (!propertyHasContent(features, groupArrays, details?.customNotes || [])) return null
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardHead}>{title}</Text>
      <View style={styles.cardBody}>
        <FeatureList features={features} />
        {bedroomBathroomGroups.map((g) => (
          <NotesGroup key={g.label} label={g.label} notes={g.notes} />
        ))}
        <CustomNotesList items={details?.customNotes} />
      </View>
    </View>
  )
}

export function RemovalsQuotationPdfDocument({ quotation }: { quotation: RemovalsQuotationRecord }) {
  const company = REMOVALS_QUOTATION_COMPANY_DETAILS
  const from = quotation.movingFrom
  const to = quotation.movingTo

  // Metadata rows (hide blanks)
  const metaRows = [
    ['QUOTE NO.', clean(quotation.quoteNumber)],
    ['QUOTE DATE', dateFmt(quotation.quoteDate)],
    ['MOVE DATE', dateFmt(quotation.movingDate)],
  ].filter(([, v]) => has(v))

  // Customer fields (hide blanks)
  const customerFields = [
    { label: 'Name', value: quotation.customerName },
    { label: 'Phone', value: quotation.phone },
    { label: 'Email', value: quotation.email },
  ].filter((f) => has(f.value))

  // Logistics (operational) fields
  const logisticsFields = [
    { label: 'Vans', value: quotation.numberOfVans },
    { label: 'Crew members', value: quotation.crewMembers },
  ].filter((f) => has(f.value))

  // Addresses / property
  const fromDesc = propertyDescriptor(from)
  const toDesc = propertyDescriptor(to)
  const hasAddresses =
    has(from?.address) || has(from?.postcode) || !!fromDesc || has(to?.address) || has(to?.postcode) || !!toDesc

  const fromFeat = fromFeatures(from)
  const toFeat = toFeatures(to)
  const fromGroups = [
    { label: 'Upstairs bedrooms', notes: from?.upstairsBedroomNotes },
    { label: 'Downstairs bedrooms', notes: from?.downstairsBedroomNotes },
    { label: 'Upstairs bathrooms', notes: from?.upstairsBathroomNotes },
    { label: 'Downstairs bathrooms', notes: from?.downstairsBathroomNotes },
  ]
  const fromHasProperty = propertyHasContent(
    fromFeat,
    fromGroups.map((g) => g.notes || []),
    from?.customNotes || []
  )
  const toHasProperty = propertyHasContent(toFeat, [], to?.customNotes || [])
  const hasPropertyDetails = fromHasProperty || toHasProperty

  // Services
  const services = { ...DEFAULT_INCLUDED_SERVICES, ...quotation.includedServices }
  const selectedServices = (Object.keys(INCLUDED_SERVICE_DETAILS) as (keyof typeof INCLUDED_SERVICE_DETAILS)[]).filter(
    (key) => services[key]
  )

  // Packing / additional
  const packing = quotation.packingRequired === 'yes'
  const packingDate = packing
    ? quotation.packingDay === 'different_date'
      ? dateFmt(quotation.packingDate)
      : dateFmt(quotation.movingDate)
    : ''
  const hasAdditionalSection =
    packing || has(quotation.additionalNotes)

  // Totals (always shown)
  const movingPrice = Number(quotation.totalMovingPrice)
  const packingCost = packing ? Number(quotation.totalPackingCost) : 0
  const movingAmount = amount(quotation.totalMovingPrice)
  const hasMoving = has(quotation.totalMovingPrice) && Number.isFinite(movingPrice)
  const grand =
    hasMoving && (!packing || (has(quotation.totalPackingCost) && Number.isFinite(packingCost)))
      ? amount(String(movingPrice + (packing ? packingCost : 0)))
      : ''
  const placeholder = 'To be confirmed'

  return (
    <Document title={`House Move Quote ${quotation.quoteNumber || ''}`} author={company.companyName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} wrap={false}>
          <View>
            <Text style={styles.brand}>WE ONE</Text>
            <Text style={styles.brandSub}>REMOVALS &amp; CLEARANCES LTD</Text>
            <Text style={styles.brandTag}>Nationwide Services on House Moves &amp; House Clearances</Text>
          </View>
          <Image src={logo} style={styles.logo} />
        </View>

        {/* Title + metadata */}
        <View style={styles.titleRow} wrap={false}>
          <View style={{ width: 315, flexShrink: 0 }}>
            <Text style={styles.title}>HOUSE MOVE QUOTE</Text>
            <Text style={styles.titleTag}>Professional removal service quotation</Text>
          </View>
          {!!metaRows.length && (
            <View style={styles.metadata}>
              {metaRows.map(([label, text], i) => (
                <View key={label} style={i === metaRows.length - 1 ? styles.metaRowLast : styles.metaRow}>
                  <Text style={styles.metaLabel}>{label}</Text>
                  <Text style={styles.metaValue}>{text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Customer details */}
        {(!!customerFields.length || !!logisticsFields.length) && (
          <View style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={40}>CUSTOMER DETAILS</Text>
            <View style={styles.cols}>
              {!!customerFields.length && (
                <View style={{ flex: 1, borderRadius: 4, overflow: 'hidden', border: `0.6 solid ${BORDER}` }}>
                  {customerFields.map((f, index) => (
                    <View key={f.label} style={index === customerFields.length - 1 ? styles.metaRowLast : styles.metaRow} wrap={false}>
                      <Text style={{ ...styles.metaLabel, width: '35%', paddingVertical: 6, paddingHorizontal: 9 }}>{f.label.toUpperCase()}</Text>
                      <Text style={{ ...styles.metaValue, paddingVertical: 6, paddingHorizontal: 9 }}>{clean(f.value)}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!!logisticsFields.length && (
                <View style={styles.col}>
                  {logisticsFields.map((f) => (
                    <Field key={f.label} label={f.label} value={f.value} />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Move details (addresses) */}
        {hasAddresses && (
          <View style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={60}>MOVE DETAILS</Text>
            <View style={styles.cols}>
              <AddressCard title="MOVING FROM" details={from} />
              <AddressCard title="MOVING TO" details={to} />
            </View>
          </View>
        )}

        {/* Property details */}
        {hasPropertyDetails && (
          <View style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={60}>PROPERTY DETAILS</Text>
            <View style={styles.cols}>
              {fromHasProperty && (
                <PropertyCard
                  title="AT COLLECTION (MOVING FROM)"
                  details={from}
                  features={fromFeat}
                  bedroomBathroomGroups={fromGroups}
                />
              )}
              {toHasProperty && (
                <PropertyCard
                  title="AT DELIVERY (MOVING TO)"
                  details={to}
                  features={toFeat}
                  bedroomBathroomGroups={[]}
                />
              )}
            </View>
          </View>
        )}

        {/* What's included */}
        {!!selectedServices.length && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.heading}>WHAT'S INCLUDED</Text>
            <View style={styles.servicesWrap}>
              {selectedServices.map((key) => (
                <View key={key} style={styles.serviceCard}>
                  <ServiceIcon service={key} />
                  <View style={styles.serviceText}>
                    <Text style={styles.serviceLabel}>{INCLUDED_SERVICE_DETAILS[key].label}</Text>
                    <Text style={styles.serviceDesc}>{INCLUDED_SERVICE_DETAILS[key].description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional services */}
        {hasAdditionalSection && (
          <View style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={50}>ADDITIONAL SERVICES</Text>
            {packing && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Packing service</Text>
                  <Text style={styles.infoValue}>Included</Text>
                </View>
                {!!packingDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Packing date</Text>
                    <Text style={styles.infoValue}>
                      {quotation.packingDay === 'different_date' ? packingDate : `${packingDate} (same day as move)`}
                    </Text>
                  </View>
                )}
                {has(quotation.packingDescription) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Packing details</Text>
                    <Text style={styles.infoValue}>{clean(quotation.packingDescription)}</Text>
                  </View>
                )}
                {has(quotation.packingNotes) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Packing notes</Text>
                    <Text style={styles.infoValue}>{clean(quotation.packingNotes)}</Text>
                  </View>
                )}
              </>
            )}
            {has(quotation.additionalNotes) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Additional notes</Text>
                <Text style={styles.infoValue}>{clean(quotation.additionalNotes)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Totals (always) */}
        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text>TOTAL MOVING COST</Text>
            <Text>{movingAmount || placeholder}</Text>
          </View>
          {packing && (
            <View style={styles.totalRow}>
              <Text>TOTAL PACKING COST</Text>
              <Text>{amount(quotation.totalPackingCost) || placeholder}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text>TOTAL QUOTE AMOUNT</Text>
            <Text style={styles.grandAmount}>{grand || placeholder}</Text>
          </View>
        </View>

        {/* Closing */}
        <View style={styles.thanks} wrap={false}>
          <Text style={styles.closingHeading}>THANKS FOR CONSIDERING WE ONE</Text>
          <Text>{company.thankYou}</Text>
        </View>
        <View style={styles.footer} wrap={false}>
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
      </Page>
    </Document>
  )
}
