package com.clinicflow.billingService.service;

import com.clinicflow.billingService.entity.Invoice;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

@Service
public class PdfExportServiceImpl implements PdfExportService {

    // ── Brand Colour Palette ───────────────────────────────────────────────────
    private static final Color HEADER_BAR     = new Color(15,  58, 138);   // deep navy
    private static final Color BRAND_BLUE     = new Color(37,  99, 235);   // blue-600
    private static final Color TEXT_DARK      = new Color(15,  23,  42);   // slate-900
    private static final Color TEXT_MUTED     = new Color(100,116,139);    // slate-500
    private static final Color TABLE_HEADER   = new Color(37,  99, 235);   // blue-600
    private static final Color ROW_ALT        = new Color(248,250,252);    // slate-50
    private static final Color TOTAL_BG       = new Color(239,246,255);    // blue-50
    private static final Color DIVIDER        = new Color(226,232,240);    // slate-200
    private static final Color PAID_COLOR     = new Color(5,  150,105);    // emerald-600
    private static final Color PENDING_COLOR  = new Color(217,119,  6);    // amber-600
    private static final Color CANCELLED_COLOR= new Color(220, 38, 38);    // red-600
    private static final Color SECTION_LABEL  = new Color(148,163,184);    // slate-400

    // ── Currency ───────────────────────────────────────────────────────────────
    private static final String CURRENCY = "Rs. ";

    // ── Date Format ────────────────────────────────────────────────────────────
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public byte[] generateInvoicePdf(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Document document = new Document(PageSize.A4, 45, 45, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // ── Fonts ─────────────────────────────────────────────────────────
            Font clinicNameFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  22, HEADER_BAR);
            Font taglineFont       = FontFactory.getFont(FontFactory.HELVETICA,        9, TEXT_MUTED);
            Font mutedFont         = FontFactory.getFont(FontFactory.HELVETICA,        9, TEXT_MUTED);
            Font invoiceLabelFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  30, BRAND_BLUE);
            Font invoiceNumFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  11, TEXT_MUTED);
            Font sectionLabelFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, SECTION_LABEL);
            Font normalFont        = FontFactory.getFont(FontFactory.HELVETICA,       10, TEXT_DARK);
            Font boldFont          = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  10, TEXT_DARK);
            Font tableHeaderFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   9, Color.WHITE);
            Font tableBodyFont     = FontFactory.getFont(FontFactory.HELVETICA,       10, TEXT_DARK);
            Font totalLabelFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  11, TEXT_DARK);
            Font totalValueFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  12, BRAND_BLUE);
            Font statusFont        = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   9, Color.WHITE);
            Font footerFont        = FontFactory.getFont(FontFactory.HELVETICA,        8, TEXT_MUTED);
            Font notesTitleFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, TEXT_MUTED);
            Font notesBodyFont     = FontFactory.getFont(FontFactory.HELVETICA,        9, TEXT_DARK);

            String invoiceNum = String.format("INV-%05d", invoice.getInvoiceId());
            String dateStr    = invoice.getIssuedAt() != null
                    ? invoice.getIssuedAt().format(DATE_FMT) : "N/A";
            String statusStr  = invoice.getStatus() != null
                    ? invoice.getStatus().toString() : "PENDING";

            // ═══════════════════════════════════════════════════════════════════
            // 1. TOP COLOUR BAR
            // ═══════════════════════════════════════════════════════════════════
            document.add(colorBar(HEADER_BAR, 8));
            document.add(spacer(10));

            // ═══════════════════════════════════════════════════════════════════
            // 2. HEADER — Clinic info (left)  |  INVOICE label (right)
            // ═══════════════════════════════════════════════════════════════════
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{58f, 42f});
            headerTable.setSpacingAfter(18);

            // Left block
            PdfPCell leftCell = noBorderCell();
            leftCell.addElement(new Paragraph("CLINICFLOW", clinicNameFont));
            Paragraph subTagline = new Paragraph("Medical Center", taglineFont);
            subTagline.setSpacingBefore(2);
            leftCell.addElement(subTagline);
            Paragraph addr = new Paragraph(
                    "\n123, Health Avenue, Mumbai - 400001, India\n" +
                    "support@clinicflow.com   |   +91 98765 43210", mutedFont);
            leftCell.addElement(addr);
            headerTable.addCell(leftCell);

            // Right block
            PdfPCell rightCell = noBorderCell();
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph invLabel = new Paragraph("INVOICE", invoiceLabelFont);
            invLabel.setAlignment(Element.ALIGN_RIGHT);
            Paragraph invNum = new Paragraph(invoiceNum, invoiceNumFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(invLabel);
            rightCell.addElement(invNum);
            headerTable.addCell(rightCell);
            document.add(headerTable);

            // ═══════════════════════════════════════════════════════════════════
            // 3. DIVIDER
            // ═══════════════════════════════════════════════════════════════════
            document.add(dividerLine());

            // ═══════════════════════════════════════════════════════════════════
            // 4. INFO ROW — Bill To (left)  |  Invoice Details (right)
            // ═══════════════════════════════════════════════════════════════════
            document.add(spacer(8));
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{50f, 50f});
            infoTable.setSpacingAfter(8);

            // Left — Bill To
            PdfPCell billToCell = noBorderCell();
            Paragraph billToLabel = new Paragraph("BILLED TO", sectionLabelFont);
            billToLabel.setSpacingAfter(5);
            billToCell.addElement(billToLabel);
            billToCell.addElement(labelValueLine("Patient ID", String.valueOf(invoice.getPatientId()), normalFont, boldFont));
            if (invoice.getEncounterId() != null) {
                billToCell.addElement(labelValueLine("Encounter ID", String.valueOf(invoice.getEncounterId()), normalFont, normalFont));
            }
            infoTable.addCell(billToCell);

            // Right — Invoice Details
            PdfPCell detailCell = noBorderCell();
            detailCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph detailLabel = new Paragraph("INVOICE DETAILS", sectionLabelFont);
            detailLabel.setAlignment(Element.ALIGN_RIGHT);
            detailLabel.setSpacingAfter(5);
            detailCell.addElement(detailLabel);
            detailCell.addElement(rightAlignedRow("Invoice No", invoiceNum, normalFont, boldFont));
            detailCell.addElement(rightAlignedRow("Issue Date", dateStr,    normalFont, normalFont));
            detailCell.addElement(rightAlignedRow("Status",    statusStr,   normalFont, boldFont));
            infoTable.addCell(detailCell);
            document.add(infoTable);

            document.add(dividerLine());
            document.add(spacer(10));

            // ═══════════════════════════════════════════════════════════════════
            // 5. BILLING TABLE
            // ═══════════════════════════════════════════════════════════════════
            PdfPTable billingTable = new PdfPTable(3);
            billingTable.setWidthPercentage(100);
            billingTable.setWidths(new float[]{55f, 18f, 27f});
            billingTable.setSpacingAfter(0);

            // Header row
            addTableHeader(billingTable, "DESCRIPTION", tableHeaderFont, Element.ALIGN_LEFT);
            addTableHeader(billingTable, "QTY",          tableHeaderFont, Element.ALIGN_CENTER);
            addTableHeader(billingTable, "AMOUNT",        tableHeaderFont, Element.ALIGN_RIGHT);

            // Rows
            addTableRow(billingTable, "Medical Consultation & Services",
                    "1", formatCurrency(invoice.getSubtotal()), tableBodyFont, ROW_ALT);
            addTableRow(billingTable, "Taxes & Government Levies",
                    "—", formatCurrency(invoice.getTaxes()), tableBodyFont, Color.WHITE);
            addTableRow(billingTable, "Discounts Applied",
                    "—", "- " + formatCurrency(invoice.getDiscounts()), tableBodyFont, ROW_ALT);

            document.add(billingTable);

            // ═══════════════════════════════════════════════════════════════════
            // 6. TOTALS SUMMARY — right-aligned block
            // ═══════════════════════════════════════════════════════════════════
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setWidths(new float[]{52f, 48f});
            totalsTable.setSpacingAfter(18);

            addTotalRow(totalsTable, "Subtotal",    formatCurrency(invoice.getSubtotal()),     normalFont,     normalFont,     false);
            addTotalRow(totalsTable, "Taxes",       formatCurrency(invoice.getTaxes()),         normalFont,     normalFont,     false);
            addTotalRow(totalsTable, "Discounts",   "- " + formatCurrency(invoice.getDiscounts()), normalFont, normalFont,     false);

            // Thin divider row inside the table
            PdfPCell d1 = noBorderPaddedCell("", normalFont, 3);
            d1.setBorderWidthTop(1); d1.setBorderColorTop(DIVIDER);
            PdfPCell d2 = noBorderPaddedCell("", normalFont, 3);
            d2.setBorderWidthTop(1); d2.setBorderColorTop(DIVIDER);
            totalsTable.addCell(d1);
            totalsTable.addCell(d2);

            addTotalRow(totalsTable, "TOTAL DUE", formatCurrency(invoice.getTotalAmount()),
                    totalLabelFont, totalValueFont, true);

            document.add(totalsTable);

            // ═══════════════════════════════════════════════════════════════════
            // 7. STATUS BADGE
            // ═══════════════════════════════════════════════════════════════════
            Color statusBg = PAID_COLOR;
            if ("PENDING".equals(statusStr))   statusBg = PENDING_COLOR;
            if ("CANCELLED".equals(statusStr)) statusBg = CANCELLED_COLOR;

            PdfPTable badgeTable = new PdfPTable(1);
            badgeTable.setWidthPercentage(22);
            badgeTable.setHorizontalAlignment(Element.ALIGN_LEFT);
            badgeTable.setSpacingAfter(18);
            PdfPCell badgeCell = new PdfPCell(new Phrase("  " + statusStr + "  ", statusFont));
            badgeCell.setBackgroundColor(statusBg);
            badgeCell.setBorder(Rectangle.NO_BORDER);
            badgeCell.setPadding(7);
            badgeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            badgeTable.addCell(badgeCell);
            document.add(badgeTable);

            // ═══════════════════════════════════════════════════════════════════
            // 8. PAYMENT INFORMATION BOX
            // ═══════════════════════════════════════════════════════════════════
            document.add(dividerLine());
            document.add(spacer(8));

            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            notesTable.setSpacingAfter(18);
            PdfPCell notesCell = new PdfPCell();
            notesCell.setBorder(Rectangle.BOX);
            notesCell.setBorderColor(DIVIDER);
            notesCell.setBackgroundColor(new Color(248, 250, 252));
            notesCell.setPadding(12);

            Paragraph notesHeader = new Paragraph("PAYMENT INFORMATION", notesTitleFont);
            notesHeader.setSpacingAfter(6);
            notesCell.addElement(notesHeader);
            notesCell.addElement(new Paragraph("Please complete payment within 30 days of the invoice date.", notesBodyFont));
            notesCell.addElement(new Paragraph("Accepted Methods:  Cash  |  UPI  |  Bank Transfer  |  Insurance", mutedFont));
            notesTable.addCell(notesCell);
            document.add(notesTable);

            // ═══════════════════════════════════════════════════════════════════
            // 9. FOOTER
            // ═══════════════════════════════════════════════════════════════════
            document.add(dividerLine());
            document.add(spacer(8));

            Paragraph f1 = new Paragraph(
                    "This is a computer-generated invoice and does not require a physical signature.", footerFont);
            f1.setAlignment(Element.ALIGN_CENTER);
            Paragraph f2 = new Paragraph(
                    "Billing enquiries: support@clinicflow.com   |   ClinicFlow Medical Center, Mumbai - 400001", footerFont);
            f2.setAlignment(Element.ALIGN_CENTER);
            document.add(f1);
            document.add(f2);

            // ═══════════════════════════════════════════════════════════════════
            // 10. BOTTOM COLOUR BAR
            // ═══════════════════════════════════════════════════════════════════
            document.add(spacer(10));
            document.add(colorBar(HEADER_BAR, 6));

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF for Invoice ID: " + invoice.getInvoiceId(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /** Full-width coloured horizontal bar */
    private PdfPTable colorBar(Color color, float height) throws DocumentException {
        PdfPTable bar = new PdfPTable(1);
        bar.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(" "));
        cell.setBackgroundColor(color);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setFixedHeight(height);
        bar.addCell(cell);
        return bar;
    }

    /** Thin horizontal rule using a bottom-bordered cell */
    private PdfPTable dividerLine() throws DocumentException {
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(" "));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(DIVIDER);
        cell.setBorderWidthBottom(0.8f);
        cell.setPaddingBottom(4);
        line.addCell(cell);
        return line;
    }

    /** Invisible spacer paragraph */
    private Paragraph spacer(float leading) {
        Paragraph p = new Paragraph(" ");
        p.setLeading(leading);
        return p;
    }

    /** Cell with no border, used for free-layout blocks */
    private PdfPCell noBorderCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0);
        return cell;
    }

    /** No-border cell with explicit padding, for totals divider rows */
    private PdfPCell noBorderPaddedCell(String text, Font font, float padding) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(padding);
        return cell;
    }

    /** "Label : Value" paragraph for the Bill-To block */
    private Paragraph labelValueLine(String label, String value, Font labelFont, Font valueFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", labelFont));
        p.add(new Chunk(value, valueFont));
        p.setSpacingBefore(2);
        return p;
    }

    /** Right-aligned "Label : Value" for the Invoice Details block */
    private Paragraph rightAlignedRow(String label, String value, Font labelFont, Font valueFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", labelFont));
        p.add(new Chunk(value, valueFont));
        p.setAlignment(Element.ALIGN_RIGHT);
        p.setSpacingBefore(2);
        return p;
    }

    /** Adds one column header cell with blue background */
    private void addTableHeader(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(TABLE_HEADER);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(10);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    /** Adds one data row (description / qty / amount) with alternating background */
    private void addTableRow(PdfPTable table, String desc, String qty, String amount, Font font, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(desc, font));
        c1.setBackgroundColor(bg); c1.setBorder(Rectangle.NO_BORDER); c1.setPadding(10);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(qty, font));
        c2.setBackgroundColor(bg); c2.setBorder(Rectangle.NO_BORDER); c2.setPadding(10);
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase(amount, font));
        c3.setBackgroundColor(bg); c3.setBorder(Rectangle.NO_BORDER); c3.setPadding(10);
        c3.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(c3);
    }

    /** Adds one row to the right-aligned totals block */
    private void addTotalRow(PdfPTable table, String label, String value,
                              Font labelFont, Font valueFont, boolean highlight) {
        Color bg = highlight ? TOTAL_BG : Color.WHITE;

        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont));
        lc.setBackgroundColor(bg); lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(6); lc.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(lc);

        PdfPCell vc = new PdfPCell(new Phrase(value, valueFont));
        vc.setBackgroundColor(bg); vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(6); vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(vc);
    }

    /** Formats a BigDecimal as "Rs. 1,234.00" — returns "Rs. 0.00" for null */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return CURRENCY + "0.00";
        return CURRENCY + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
