import React, { useState, useEffect, useCallback } from 'react';
import type { Invoice, Payment, InvoiceStatus, PaymentMethod, PaymentStatus } from './Billing/types';
import {
  getInvoices,
  backfillInvoiceNames,
  getPaymentsByInvoice,
  createInvoice,
  deleteInvoice as deleteInvoiceApi,
  downloadInvoicePdf,
  createPayment,
  deletePayment as deletePaymentApi,
} from '../services/billing';
import { TopBar } from './Billing/TopBar';
import { KpiCards } from './Billing/KpiCards';
import { TabSwitcher } from './Billing/TabSwitcher';
import { InvoicesTable } from './Billing/InvoicesTable';
import { PaymentsTable } from './Billing/PaymentsTable';
import { CreateInvoiceModal } from './Billing/CreateInvoiceModal';
import { RecordPaymentModal } from './Billing/RecordPaymentModal';
import { DeleteConfirmModal } from './Billing/DeleteConfirmModal';

function Billing() {
  const [mainTab, setMainTab] = useState<'invoices' | 'payments'>('invoices');

  // Invoice state
  const [invoices,       setInvoices]       = useState<Invoice[]>([]);
  const [invoiceFilter,  setInvoiceFilter]  = useState('All');
  const [invoiceSearch,  setInvoiceSearch]  = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError,   setInvoiceError]   = useState('');

  // Payment state
  const [payments,       setPayments]       = useState<Payment[]>([]);
  const [paymentSearch,  setPaymentSearch]  = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Invoice form — field names match InvoiceDTO
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invPatientId,   setInvPatientId]   = useState('');
  const [invEncounterId, setInvEncounterId] = useState('');
  const [invAmount,      setInvAmount]      = useState('');   // maps to DTO `amount` → entity `subtotal`
  const [invTaxes,       setInvTaxes]       = useState('');
  const [invDiscounts,   setInvDiscounts]   = useState('');
  const [invStatus,      setInvStatus]      = useState<InvoiceStatus>('PENDING');
  const [invFormError,   setInvFormError]   = useState('');
  const [invFormLoading, setInvFormLoading] = useState(false);

  // Payment form — field names match PaymentDTO
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [payInvoiceId,   setPayInvoiceId]   = useState('');
  const [payPatientId,   setPayPatientId]   = useState('');
  const [payAmount,      setPayAmount]      = useState('');
  const [payMethod,      setPayMethod]      = useState<PaymentMethod>('CASH');
  const [payStatus,      setPayStatus]      = useState<PaymentStatus>('COMPLETED');
  const [payFormError,   setPayFormError]   = useState('');
  const [payFormLoading, setPayFormLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'invoice' | 'payment'; id: number } | null>(null);

  // ── Fetch invoices ──────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      let data = await getInvoices();
      if (data.some(inv => !inv.patientName)) {
        await backfillInvoiceNames().catch(() => {});
        data = await getInvoices();
      }
      setInvoices(data);
    } catch {
      setInvoiceError('Cannot reach the server. Make sure the API gateway is running.');
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  // ── Fetch payments for all loaded invoices ──────────────────────────────────
  const fetchPayments = useCallback(async () => {
    if (invoices.length === 0) { setPayments([]); return; }
    setPaymentLoading(true);
    try {
      const results = await Promise.all(
        invoices.map(inv => getPaymentsByInvoice(inv.invoiceId).catch(() => [] as Payment[]))
      );
      setPayments(results.flat());
    } finally {
      setPaymentLoading(false);
    }
  }, [invoices]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { if (mainTab === 'payments') fetchPayments(); }, [mainTab, fetchPayments]);

  // ── KPI ─────────────────────────────────────────────────────────────────────
  const totalPaid      = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalPending   = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalCancelled = invoices.filter(i => i.status === 'CANCELLED').reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  // ── Create invoice — POST body matches InvoiceDTO exactly ──────────────────
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvFormError('');
    setInvFormLoading(true);
    try {
      await createInvoice({
        patientId:   Number(invPatientId),
        ...(invEncounterId ? { encounterId: Number(invEncounterId) } : {}),
        amount:      parseFloat(invAmount),
        taxes:       parseFloat(invTaxes    || '0'),
        discounts:   parseFloat(invDiscounts || '0'),
        status:      invStatus,
      });
      await fetchInvoices();
      closeInvoiceForm();
    } catch (e: any) {
      setInvFormError(e.response?.data ?? e.message ?? 'Failed to create invoice.');
    } finally {
      setInvFormLoading(false);
    }
  };

  const closeInvoiceForm = () => {
    setIsInvoiceFormOpen(false);
    setInvPatientId(''); setInvEncounterId('');
    setInvAmount(''); setInvTaxes(''); setInvDiscounts('');
    setInvStatus('PENDING'); setInvFormError('');
  };

  const handleDeleteInvoice = async (id: number) => {
    await deleteInvoiceApi(id).catch(() => {});
    setInvoices(prev => prev.filter(i => i.invoiceId !== id));
  };

  const handleDownloadPdf = async (invoiceId: number) => {
    try {
      const blob = await downloadInvoicePdf(invoiceId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `invoice_${invoiceId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF generation failed or not yet available.'); }
  };

  // ── Create payment — POST body matches PaymentDTO exactly ──────────────────
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayFormError('');
    setPayFormLoading(true);
    try {
      const saved = await createPayment({
        invoiceId:     Number(payInvoiceId),
        patientId:     Number(payPatientId),
        amount:        parseFloat(payAmount),
        paymentMethod: payMethod,
        status:        payStatus,
      });
      setPayments(prev => [saved, ...prev]);
      closePaymentForm();
    } catch (e: any) {
      setPayFormError(e.response?.data ?? e.message ?? 'Failed to record payment.');
    } finally {
      setPayFormLoading(false);
    }
  };

  const closePaymentForm = () => {
    setIsPaymentFormOpen(false);
    setPayInvoiceId(''); setPayPatientId('');
    setPayAmount(''); setPayMethod('CASH');
    setPayStatus('COMPLETED'); setPayFormError('');
  };

  const handleDeletePayment = async (id: number) => {
    await deletePaymentApi(id).catch(() => {});
    setPayments(prev => prev.filter(p => p.paymentId !== id));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'invoice') await handleDeleteInvoice(deleteTarget.id);
    else                                  await handleDeletePayment(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredInvoices = invoices.filter(inv => {
    const matchTab    = invoiceFilter === 'All' || inv.status === invoiceFilter.toUpperCase();
    const q           = invoiceSearch.toLowerCase();
    const matchSearch = !q ||
      String(inv.invoiceId).includes(q) ||
      String(inv.patientId).includes(q) ||
      String(inv.encounterId).includes(q) ||
      inv.status.toLowerCase().includes(q) ||
      (inv.description ?? '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const filteredPayments = payments.filter(p => {
    const q = paymentSearch.toLowerCase();
    return !q ||
      String(p.paymentId).includes(q) ||
      String(p.invoiceId).includes(q) ||
      String(p.patientId).includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q);
  });

  //  Render 
  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans text-slate-800 antialiased p-8 relative">
      <div className="max-w-[1150px] mx-auto">

        <TopBar
          mainTab={mainTab}
          onRefresh={fetchInvoices}
          onNewInvoice={() => setIsInvoiceFormOpen(true)}
          onRecordPayment={() => setIsPaymentFormOpen(true)}
        />

        <KpiCards
          invoices={invoices}
          totalPaid={totalPaid}
          totalPending={totalPending}
          totalCancelled={totalCancelled}
          onCardClick={(filter) => {
            setMainTab('invoices');
            setInvoiceFilter(filter);
          }}
        />

        

        <TabSwitcher mainTab={mainTab} onTabChange={setMainTab} />

        {mainTab === 'invoices' && (
          <InvoicesTable
            invoiceLoading={invoiceLoading}
            invoiceError={invoiceError}
            filteredInvoices={filteredInvoices}
            invoiceFilter={invoiceFilter}
            setInvoiceFilter={setInvoiceFilter}
            invoiceSearch={invoiceSearch}
            setInvoiceSearch={setInvoiceSearch}
            onDownloadPdf={handleDownloadPdf}
            onDeleteClick={id => setDeleteTarget({ type: 'invoice', id })}
          />
        )}

        {mainTab === 'payments' && (
          <PaymentsTable
            paymentLoading={paymentLoading}
            filteredPayments={filteredPayments}
            invoices={invoices}
            paymentSearch={paymentSearch}
            setPaymentSearch={setPaymentSearch}
            onDeleteClick={id => setDeleteTarget({ type: 'payment', id })}
          />
        )}

      </div>

      <CreateInvoiceModal
        isOpen={isInvoiceFormOpen}
        onClose={closeInvoiceForm}
        onSubmit={handleCreateInvoice}
        invPatientId={invPatientId}     setInvPatientId={setInvPatientId}
        invEncounterId={invEncounterId} setInvEncounterId={setInvEncounterId}
        invAmount={invAmount}           setInvAmount={setInvAmount}
        invTaxes={invTaxes}             setInvTaxes={setInvTaxes}
        invDiscounts={invDiscounts}     setInvDiscounts={setInvDiscounts}
        invStatus={invStatus}           setInvStatus={setInvStatus}
        invFormError={invFormError}
        invFormLoading={invFormLoading}
      />

      <RecordPaymentModal
        isOpen={isPaymentFormOpen}
        onClose={closePaymentForm}
        onSubmit={handleCreatePayment}
        payInvoiceId={payInvoiceId}   setPayInvoiceId={setPayInvoiceId}
        payPatientId={payPatientId}   setPayPatientId={setPayPatientId}
        payAmount={payAmount}         setPayAmount={setPayAmount}
        payMethod={payMethod}         setPayMethod={setPayMethod}
        payStatus={payStatus}         setPayStatus={setPayStatus}
        payFormError={payFormError}
        payFormLoading={payFormLoading}
      />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Billing;
