/**
 * MultiBookingInvoice — React PDF Document Component
 *
 * Renders a professional A4 consolidated invoice for multiple clubhouse bookings.
 * Used by the /api/invoice/multi API route to stream a PDF download.
 * Designed to match the same visual style as BookingInvoice.tsx.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { BookingWithFacility } from "@/types/database";

// ── Colours (shared with BookingInvoice) ──────────────────────────────────────
const NAVY         = "#0B3272";
const SLATE        = "#4B5563";
const LIGHT_GREY   = "#F3F4F6";
const BORDER_GREY  = "#E5E7EB";
const WHITE        = "#FFFFFF";
const SUCCESS_GREEN = "#059669";

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    backgroundColor: WHITE,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 44,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  logo: { width: 110, height: 44, objectFit: "contain" },
  invoiceTitleBlock: { alignItems: "flex-end" },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1.5,
  },
  invoiceSubLabel: { fontSize: 8, color: SLATE, marginTop: 2, letterSpacing: 0.5 },
  invoiceNumber:  { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 6, letterSpacing: 0.5 },

  // ── Meta row ────────────────────────────────────────────────────────────────
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metaBlock: { width: "47%" },
  metaBlockTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  metaLine: { fontSize: 9, color: "#374151", marginBottom: 3, lineHeight: 1.4 },

  // ── Section ─────────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 14,
  },

  // ── Table ───────────────────────────────────────────────────────────────────
  table: {
    borderWidth: 1,
    borderColor: BORDER_GREY,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    color: WHITE,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  tableRowAlt: { backgroundColor: LIGHT_GREY },
  td: { fontSize: 8.5, color: "#374151" },

  // ── Column widths ────────────────────────────────────────────────────────────
  colRef:      { width: 70 },
  colFacility: { flex: 2.2 },
  colDate:     { flex: 1.8 },
  colSlot:     { flex: 1.5 },
  colBase:     { width: 58, textAlign: "right" },
  colGstRate:  { width: 38, textAlign: "center" },
  colTotal:    { width: 60, textAlign: "right" },

  // ── Summary ─────────────────────────────────────────────────────────────────
  summaryBox: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: "42%",
    borderWidth: 1,
    borderColor: BORDER_GREY,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: NAVY,
  },
  summaryLabel:      { fontSize: 8.5, color: SLATE },
  summaryValue:      { fontSize: 8.5, color: "#111827", fontFamily: "Helvetica-Bold" },
  summaryLabelTotal: { fontSize: 10,  color: WHITE, fontFamily: "Helvetica-Bold" },
  summaryValueTotal: { fontSize: 10,  color: WHITE, fontFamily: "Helvetica-Bold" },

  // ── Notes ───────────────────────────────────────────────────────────────────
  notesBox: {
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  notesTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 4 },
  notesText:  { fontSize: 7.5, color: SLATE, lineHeight: 1.6 },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BORDER_GREY,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText:  { fontSize: 7.5, color: "#9CA3AF" },
  footerBrand: { fontSize: 7.5, color: NAVY, fontFamily: "Helvetica-Bold" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function slotLabel(b: BookingWithFacility): string {
  if (b.start_time && b.end_time) return `${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`;
  return b.slot_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  bookings:       BookingWithFacility[];
  societyName?:   string;
  societyAddress?: string;
  societyPhone?:  string;
  logoUrl?:       string;
}

export function MultiBookingInvoice({
  bookings,
  societyName    = "Suncity Clubhouse",
  societyAddress = "Suncity Society, Ahmedabad",
  societyPhone,
  logoUrl,
}: Props) {
  if (bookings.length === 0) return null;

  const primary = bookings[0]; // customer details taken from first booking
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── GST aggregation by slab ──────────────────────────────────────────────
  // Each item may have a different GST rate; we group totals by slab.
  let totalBase   = 0;
  const gstSlabs: Record<number, { cgst: number; sgst: number }> = {}; // key = gst_percentage (0|5|18)

  for (const b of bookings) {
    totalBase += Number(b.base_amount ?? 0);
    const rate = Number(b.gst_percentage ?? 0);
    if (!gstSlabs[rate]) gstSlabs[rate] = { cgst: 0, sgst: 0 };
    gstSlabs[rate].cgst += Number(b.cgst_amount ?? 0);
    gstSlabs[rate].sgst += Number(b.sgst_amount ?? 0);
  }

  const totalGst   = Object.values(gstSlabs).reduce((s, v) => s + v.cgst + v.sgst, 0);
  const grandTotal = bookings.reduce((s, b) => s + Number(b.total_amount ?? 0), 0);

  return (
    <Document title="Booking Invoice" author="Mahavir Group" subject="Clubhouse Booking Invoice">
      <Page size="A4" style={s.page}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            {logoUrl
              ? <Image src={logoUrl} style={s.logo} />
              : <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: NAVY }}>MG</Text>
            }
            <Text style={{ fontSize: 7, color: SLATE, marginTop: 3 }}>
              EXPERIENCE · QUALITY · TRUST
            </Text>
          </View>

          <View style={s.invoiceTitleBlock}>
            <Text style={s.invoiceLabel}>INVOICE</Text>
            <Text style={s.invoiceSubLabel}>CLUBHOUSE BOOKING</Text>
            <Text style={s.invoiceNumber}>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </Text>
            <Text style={{ fontSize: 8, color: SLATE, marginTop: 3 }}>
              Date: {generatedDate}
            </Text>
          </View>
        </View>

        {/* ── META: From + Bill To ────────────────────────────────────────── */}
        <View style={s.metaRow}>
          {/* Society / From */}
          <View style={s.metaBlock}>
            <Text style={s.metaBlockTitle}>From</Text>
            <Text style={[s.metaLine, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
              {societyName}
            </Text>
            <Text style={s.metaLine}>{societyAddress}</Text>
            {societyPhone && <Text style={s.metaLine}>Tel: {societyPhone}</Text>}
            <Text style={[s.metaLine, { marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
              GSTIN: 22AAIFV5205EI2K
            </Text>
            <Text style={[s.metaLine, { marginTop: 1, color: SLATE, fontSize: 8 }]}>
              Managed by Mahavir Group
            </Text>
          </View>

          {/* Bill To */}
          <View style={s.metaBlock}>
            <Text style={s.metaBlockTitle}>Bill To</Text>
            <Text style={[s.metaLine, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
              {primary.customer_name}
            </Text>
            {primary.customer_email && (
              <Text style={s.metaLine}>{primary.customer_email}</Text>
            )}
            <Text style={s.metaLine}>+91 {primary.customer_phone}</Text>
            {primary.house_number && (
              <Text style={s.metaLine}>Flat / Unit: {primary.house_number}</Text>
            )}
            <Text style={[s.metaLine, { marginTop: 2 }]}>
              {primary.is_resident ? "Resident Member" : "Non-Resident Guest"}
            </Text>
          </View>
        </View>

        {/* ── BOOKINGS TABLE ───────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Booking Details</Text>
        <View style={s.table}>

          {/* Header row */}
          <View style={s.tableHeader}>
            <Text style={[s.th, s.colRef]}>Ref #</Text>
            <Text style={[s.th, s.colFacility]}>Facility / Event</Text>
            <Text style={[s.th, s.colDate]}>Date</Text>
            <Text style={[s.th, s.colSlot]}>Slot</Text>
            <Text style={[s.th, s.colBase]}>Base Amt</Text>
            <Text style={[s.th, s.colGstRate]}>GST</Text>
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>

          {/* Data rows */}
          {bookings.map((b, idx) => {
            const isAlt = idx % 2 === 1;
            const gstRate = Number(b.gst_percentage ?? 0);
            return (
              <View key={b.id} style={[s.tableRow, isAlt ? s.tableRowAlt : {}]}>
                <Text style={[s.td, s.colRef, { fontFamily: "Helvetica-Bold", fontSize: 7.5 }]}>
                  {b.booking_ref}
                </Text>

                <View style={s.colFacility}>
                  <Text style={[s.td, { fontFamily: "Helvetica-Bold" }]}>
                    {(b as any).facility?.name ?? "—"}
                  </Text>
                  {b.event_purpose && (
                    <Text style={[s.td, { color: SLATE, fontSize: 7.5, marginTop: 1 }]}>
                      {b.event_purpose}
                    </Text>
                  )}
                  {(b as any).package?.name && (
                    <Text style={[s.td, { color: SLATE, fontSize: 7.5, marginTop: 1 }]}>
                      {(b as any).package.name}
                    </Text>
                  )}
                </View>

                <View style={s.colDate}>
                  <Text style={s.td}>{fmtDate(b.booking_date)}</Text>
                  {b.end_date && b.end_date !== b.booking_date && (
                    <Text style={[s.td, { color: SLATE, fontSize: 7.5, marginTop: 1 }]}>
                      — {fmtDate(b.end_date)}
                    </Text>
                  )}
                </View>

                <Text style={[s.td, s.colSlot, { fontSize: 7.5 }]}>
                  {slotLabel(b)}
                  {b.quantity > 1 ? `\n× ${b.quantity}` : ""}
                </Text>

                <Text style={[s.td, s.colBase]}>{fmt(Number(b.base_amount))}</Text>

                <Text style={[s.td, s.colGstRate, { color: gstRate > 0 ? NAVY : SLATE }]}>
                  {gstRate > 0 ? `${gstRate}%` : "Nil"}
                </Text>

                <Text style={[s.td, s.colTotal, { fontFamily: "Helvetica-Bold" }]}>
                  {fmt(Number(b.total_amount))}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── AMOUNT SUMMARY ──────────────────────────────────────────────── */}
        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Sub-total</Text>
            <Text style={s.summaryValue}>{fmt(totalBase)}</Text>
          </View>

          {/* Show each GST slab that was actually used */}
          {Object.entries(gstSlabs)
            .filter(([rate, v]) => Number(rate) > 0 && (v.cgst > 0 || v.sgst > 0))
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([rate, v]) => (
              <View key={rate}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>CGST @ {Number(rate) / 2}%</Text>
                  <Text style={s.summaryValue}>+ {fmt(v.cgst)}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>SGST @ {Number(rate) / 2}%</Text>
                  <Text style={s.summaryValue}>+ {fmt(v.sgst)}</Text>
                </View>
              </View>
            ))
          }

          {totalGst === 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>GST</Text>
              <Text style={[s.summaryValue, { color: SLATE }]}>Nil</Text>
            </View>
          )}

          <View style={s.summaryRowTotal}>
            <Text style={s.summaryLabelTotal}>GRAND TOTAL</Text>
            <Text style={s.summaryValueTotal}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* ── TERMS ───────────────────────────────────────────────────────── */}
        <View style={s.notesBox}>
          <Text style={s.notesTitle}>Terms & Cancellation Policy</Text>
          <Text style={s.notesText}>
            • Cancellation 7+ days before event: Full refund{"\n"}
            • Cancellation 3–6 days before event: 25% cancellation charge{"\n"}
            • Cancellation 1–2 days before event: 50% cancellation charge{"\n"}
            • Cancellation on event day or later: No refund{"\n"}
            • Contact the clubhouse office for refund processing.{"\n"}
            • This invoice is computer-generated and does not require a signature.
          </Text>
        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generated on {generatedDate} · {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </Text>
          <Text style={s.footerBrand}>Mahavir Group — Mahavir Suncity, Rajnandgaon</Text>
        </View>

      </Page>
    </Document>
  );
}
