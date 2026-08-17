/**
 * BookingInvoice — React PDF Document Component
 *
 * Renders a professional A4 invoice for a clubhouse booking.
 * Used by the /api/invoice/[bookingId] API route to stream a PDF download.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { BookingWithFacility } from "@/types/database";

// ── Fonts ─────────────────────────────────────────────────────────────────────
// We use the built-in Helvetica family to avoid bundling custom font files
// in server routes. Swap to a registered font later if needed.

// ── Styles ───────────────────────────────────────────────────────────────────

const NAVY = "#0B3272";
const SLATE = "#4B5563";
const LIGHT_GREY = "#F3F4F6";
const BORDER_GREY = "#E5E7EB";
const WHITE = "#FFFFFF";
const SUCCESS_GREEN = "#059669";
const WARNING_AMBER = "#D97706";
const DANGER_RED = "#DC2626";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
    backgroundColor: WHITE,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 44,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
  },
  logo: {
    width: 110,
    height: 44,
    objectFit: "contain",
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1.5,
  },
  invoiceSubLabel: {
    fontSize: 8,
    color: SLATE,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 6,
    letterSpacing: 0.5,
  },

  // ── Meta row (Society info + Bill To) ───────────────────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaBlock: {
    width: "47%",
  },
  metaBlockTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  metaLine: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
    lineHeight: 1.4,
  },
  metaLineLabel: {
    fontFamily: "Helvetica-Bold",
    color: SLATE,
  },

  // ── Status Badge ────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Booking Details Table ───────────────────────────────────────────────
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER_GREY,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GREY,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },

  // ── Col widths for main table ───────────────────────────────────────────
  colDescription: { flex: 3 },
  colSlotType: { flex: 2 },
  colDate: { flex: 2 },
  colAmount: { flex: 1.5, textAlign: "right" },

  // ── Amount Summary ──────────────────────────────────────────────────────
  summaryBox: {
    marginTop: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: NAVY,
  },
  summaryLabel: {
    fontSize: 9,
    color: SLATE,
  },
  summaryValue: {
    fontSize: 9,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  summaryLabelTotal: {
    fontSize: 10,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
  },
  summaryValueTotal: {
    fontSize: 10,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
  },

  // ── Payment Info ────────────────────────────────────────────────────────
  paymentBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER_GREY,
    borderRadius: 4,
    padding: 12,
    backgroundColor: LIGHT_GREY,
  },
  paymentTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  paymentLine: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },

  // ── Notes / Policy ──────────────────────────────────────────────────────
  notesBox: {
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: SLATE,
    lineHeight: 1.6,
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BORDER_GREY,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#9CA3AF",
  },
  footerBrand: {
    fontSize: 7.5,
    color: NAVY,
    fontFamily: "Helvetica-Bold",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getStatusStyle(status: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    confirmed:         { color: WHITE,          bg: SUCCESS_GREEN },
    completed:         { color: WHITE,          bg: SUCCESS_GREEN },
    pending_approval:  { color: WHITE,          bg: WARNING_AMBER },
    awaiting_payment:  { color: WHITE,          bg: WARNING_AMBER },
    cancelled:         { color: WHITE,          bg: DANGER_RED },
    rejected:          { color: WHITE,          bg: DANGER_RED },
    expired:           { color: WHITE,          bg: "#6B7280" },
  };
  return map[status] ?? { color: WHITE, bg: "#6B7280" };
}

function humanStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function slotLabel(b: BookingWithFacility): string {
  if (b.start_time && b.end_time) {
    return `${formatTime(b.start_time)} – ${formatTime(b.end_time)}`;
  }
  return b.slot_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  booking: BookingWithFacility;
  societyName?: string;
  societyAddress?: string;
  societyPhone?: string;
  logoUrl?: string; // base64 or absolute URL
}

export function BookingInvoice({
  booking: b,
  societyName = "Suncity Clubhouse",
  societyAddress = "Suncity Society, Ahmedabad",
  societyPhone,
  logoUrl,
}: Props) {
  const statusStyle = getStatusStyle(b.status);
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Invoice – ${b.booking_ref}`}
      author="Mahavir Group"
      subject="Clubhouse Booking Invoice"
    >
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Logo */}
          <View>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: NAVY }}>
                MG
              </Text>
            )}
            <Text style={{ fontSize: 7, color: SLATE, marginTop: 3 }}>
              EXPERIENCE · QUALITY · TRUST
            </Text>
          </View>

          {/* Invoice Title */}
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceSubLabel}>CLUBHOUSE BOOKING</Text>
            <Text style={styles.invoiceNumber}>{b.booking_ref}</Text>
            <Text style={{ fontSize: 8, color: SLATE, marginTop: 3 }}>
              Date: {generatedDate}
            </Text>
          </View>
        </View>

        {/* ── STATUS BADGE ───────────────────────────────────────────────── */}
        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusBadge,
              { color: statusStyle.color, backgroundColor: statusStyle.bg },
            ]}
          >
            {humanStatus(b.status)}
          </Text>
        </View>

        {/* ── META: Society + Bill To ────────────────────────────────────── */}
        <View style={styles.metaRow}>
          {/* Society */}
          <View style={styles.metaBlock}>
            <Text style={styles.metaBlockTitle}>From</Text>
            <Text style={[styles.metaLine, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
              {societyName}
            </Text>
            <Text style={styles.metaLine}>{societyAddress}</Text>
            {societyPhone && (
              <Text style={styles.metaLine}>Tel: {societyPhone}</Text>
            )}
            <Text style={[styles.metaLine, { marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
              GSTIN: 22AAIFV5205EI2K
            </Text>
            <Text style={[styles.metaLine, { marginTop: 1, color: SLATE, fontSize: 8 }]}>
              Managed by Mahavir Group
            </Text>
          </View>

          {/* Bill To */}
          <View style={styles.metaBlock}>
            <Text style={styles.metaBlockTitle}>Bill To</Text>
            <Text style={[styles.metaLine, { fontFamily: "Helvetica-Bold", fontSize: 10 }]}>
              {b.customer_name}
            </Text>
            <Text style={styles.metaLine}>{b.customer_email}</Text>
            <Text style={styles.metaLine}>+91 {b.customer_phone}</Text>
            {b.house_number && (
              <Text style={styles.metaLine}>Flat / Unit: {b.house_number}</Text>
            )}
            <Text style={[styles.metaLine, { marginTop: 2 }]}>
              {b.is_resident ? "Resident Member" : "Non-Resident Guest"}
            </Text>
          </View>
        </View>

        {/* ── BOOKING DETAILS TABLE ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Facility / Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colSlotType]}>Slot Type</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date & Time</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {/* Main row */}
          <View style={styles.tableRow}>
            <View style={styles.colDescription}>
              <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                {(b as any).facility?.name ?? "Facility"}
              </Text>
              {b.event_purpose && (
                <Text style={[styles.tableCell, { color: SLATE, marginTop: 2 }]}>
                  {b.event_purpose}
                </Text>
              )}
              {b.guest_count && (
                <Text style={[styles.tableCell, { color: SLATE, marginTop: 1 }]}>
                  Guests: {b.guest_count}
                </Text>
              )}
              {(b as any).package?.name && (
                <Text style={[styles.tableCell, { color: SLATE, marginTop: 1 }]}>
                  Package: {(b as any).package.name}
                </Text>
              )}
            </View>
            <Text style={[styles.tableCell, styles.colSlotType]}>
              {b.slot_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              {b.quantity > 1 ? `\n× ${b.quantity} units` : ""}
            </Text>
            <View style={styles.colDate}>
              <Text style={styles.tableCell}>{formatDisplayDate(b.booking_date)}</Text>
              {b.end_date && b.end_date !== b.booking_date && (
                <Text style={[styles.tableCell, { color: SLATE, marginTop: 2 }]}>
                  To: {formatDisplayDate(b.end_date)}
                </Text>
              )}
              <Text style={[styles.tableCell, { color: SLATE, marginTop: 2 }]}>
                {slotLabel(b)}
              </Text>
            </View>
            <Text style={[styles.tableCell, styles.colAmount, { fontFamily: "Helvetica-Bold" }]}>
              {formatINR(b.base_amount)}
            </Text>
          </View>

          {/* Discount row (if any) */}
          {b.discount_amount > 0 && (
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.colDescription, { color: SUCCESS_GREEN }]}>
                Resident Discount
              </Text>
              <Text style={[styles.tableCell, styles.colSlotType]} />
              <Text style={[styles.tableCell, styles.colDate]} />
              <Text style={[styles.tableCell, styles.colAmount, { color: SUCCESS_GREEN }]}>
                − {formatINR(b.discount_amount)}
              </Text>
            </View>
          )}
        </View>

        {/* ── AMOUNT SUMMARY ─────────────────────────────────────────────── */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sub-total</Text>
            <Text style={styles.summaryValue}>{formatINR(b.base_amount)}</Text>
          </View>
          {Number(b.cgst_amount) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CGST ({Number(b.gst_percentage ?? 0) / 2}%){b.is_gst_inclusive === false ? ' (Exclusive)' : ' (Inclusive)'}</Text>
              <Text style={styles.summaryValue}>+ {formatINR(Number(b.cgst_amount))}</Text>
            </View>
          )}
          {Number(b.sgst_amount) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SGST ({Number(b.gst_percentage ?? 0) / 2}%)</Text>
              <Text style={styles.summaryValue}>+ {formatINR(Number(b.sgst_amount))}</Text>
            </View>
          )}
          {Number(b.discount_amount) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: SUCCESS_GREEN }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: SUCCESS_GREEN }]}>
                − {formatINR(Number(b.discount_amount))}
              </Text>
            </View>
          )}
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryLabelTotal}>TOTAL AMOUNT</Text>
            <Text style={styles.summaryValueTotal}>{formatINR(b.total_amount)}</Text>
          </View>
        </View>

        {/* ── PAYMENT INFORMATION ────────────────────────────────────────── */}
        {(b.payment_reference || b.payment_uploaded_at || (b as any).payment_type) && (
          <>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.paymentBox}>
              {(b as any).payment_type && (
                <Text style={styles.paymentLine}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment Method: </Text>
                  {String((b as any).payment_type).toUpperCase().replace(/_/g, " ")}
                </Text>
              )}
              {b.payment_reference && (
                <Text style={styles.paymentLine}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Transaction / UTR Ref: </Text>
                  {b.payment_reference}
                </Text>
              )}
              {b.payment_uploaded_at && (
                <Text style={styles.paymentLine}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment Submitted: </Text>
                  {new Date(b.payment_uploaded_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </Text>
              )}
              {b.approved_at && (
                <Text style={styles.paymentLine}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Approved: </Text>
                  {new Date(b.approved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </Text>
              )}
            </View>
          </>
        )}

        {/* ── TERMS & CANCELLATION POLICY ───────────────────────────────── */}
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Terms & Cancellation Policy</Text>
          <Text style={styles.notesText}>
            • Cancellation 7+ days before event: Full refund{"\n"}
            • Cancellation 3–6 days before event: 25% cancellation charge{"\n"}
            • Cancellation 1–2 days before event: 50% cancellation charge{"\n"}
            • Cancellation on event day or later: No refund{"\n"}
            • Contact the clubhouse office for refund processing.{"\n"}
            • This invoice is computer-generated and does not require a signature.
          </Text>
        </View>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {generatedDate} · Booking Ref: {b.booking_ref}
          </Text>
          <Text style={styles.footerBrand}>Mahavir Group — Mahavir Suncity, Rajnandgaon</Text>
        </View>

      </Page>
    </Document>
  );
}
