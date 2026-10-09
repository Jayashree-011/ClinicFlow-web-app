package com.clinicflow.billingService.service;

import com.clinicflow.billingService.entity.Invoice;

public interface PdfExportService {
    byte[] generateInvoicePdf(Invoice invoice);

}