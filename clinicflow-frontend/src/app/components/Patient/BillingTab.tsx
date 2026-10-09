import React, { useState } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight, CreditCard, FileText, Download, X, AlertCircle } from 'lucide-react';
import { Invoice, Payment } from './types';
import { fmtDate, apptStatusCls, INVOICE_COLORS, INVOICE_DOTS, TH, Empty } from './utils';
import axiosInstance from '../../services/client';

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'MOBILE_PAYMENT' | 'OTHER';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:           'Cash',
  CREDIT_CARD:    'Credit Card',
  DEBIT_CARD:     'Debit Card',
  INSURANCE:      'Insurance',
  MOBILE_PAYMENT: 'Mobile Payment',
  OTHER:          'Other',
};

const inputCls  = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const selectCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer';

interface Props {
  invoices:          Invoice[];
  payments:          Payment[];
  totalPaid:         number;
  totalPending:      number;
  patientId:         number | null;
  fetchAll:          () => void;
  handleDownloadPdf: (invoiceId: number) => void;
}

export default function BillingTab({
  invoices, payments, totalPaid, totalPending, patientId, fetchAll, handleDownloadPdf,
}: Props) {

  // ── Pay modal state ─────────────────────────────────────────────────────────
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethod,     setPayMethod]     = useState<PaymentMethod>('CASH');
  const [payAmount,     setPayAmount]     = useState('');
  const [paying,        setPaying]        = useState(false);
  const [payError,      setPayError]      = useState('');

  const openPayModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayAmount((inv.totalAmount ?? 0).toFixed(2));
    setPayMethod('CASH');
    setPayError('');
  };

  const closePayModal = () => {
    setPayingInvoice(null);
    setPayAmount('');
    setPayMethod('CASH');
    setPayError('');
    setPaying(false);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !patientId) return;
    setPayError('');
    setPaying(true);
    try {
      await axiosInstance.post('/billing/payments', {
        invoiceId:     payingInvoice.invoiceId,
        patientId,
        amount:        parseFloat(payAmount),
        paymentMethod: payMethod,
        status:        'COMPLETED',
      });
      closePayModal();
      fetchAll();   // refresh invoices + payments so status flips to PAID
    } catch (err: any) {
      const d = err?.response?.data;
      setPayError(
        d?.message || d?.error || d?.detail ||
        `Error ${err?.response?.status ?? ''}: Failed to process payment.`
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Billing &amp; Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Paid',     value: totalPaid,    icon: ArrowUpRight,   color: 'text-emerald-600', sub: `${invoices.filter(i => i.status === 'PAID').length} invoices`     },
          { label: 'Total Pending',  value: totalPending, icon: ArrowDownRight, color: 'text-amber-600',   sub: `${invoices.filter(i => i.status === 'PENDING').length} unpaid`     },
          { label: 'Total Payments', value: payments.reduce((s, p) => s + Number(p.amount), 0), icon: CreditCard, color: 'text-blue-600', sub: `${payments.length} transactions` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-2`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{Number(value).toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Invoices ─────────────────────────────────────────────────────────── */}
      <h2 className="text-sm font-bold text-slate-700 mb-3">Invoices</h2>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        {invoices.length === 0 ? (
          <Empty message="No invoices found" sub="Your billing invoices will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Invoice', 'Subtotal', 'Taxes', 'Discounts', 'Total', 'Issued', 'Status', ''].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {invoices.map(inv => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-300" /> #{inv.invoiceId}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">₹{(inv.subtotal   ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">₹{(inv.taxes      ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">-₹{(inv.discounts ?? 0).toFixed(2)}</td>
                    <td className="p-4 font-bold text-slate-900">₹{(inv.totalAmount ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">{fmtDate(inv.issuedAt)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${INVOICE_COLORS[inv.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${INVOICE_DOTS[inv.status]}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Pay Now — only for PENDING invoices */}
                        {inv.status === 'PENDING' && (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay Now
                          </button>
                        )}
                        <button onClick={() => handleDownloadPdf(inv.invoiceId)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment history ───────────────────────────────────────────────────── */}
      <h2 className="text-sm font-bold text-slate-700 mb-3">Payment History</h2>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <Empty message="No payments recorded" sub="Your payment history will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Payment', 'Invoice', 'Amount', 'Method', 'Date', 'Status'].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {payments.map(p => (
                  <tr key={p.paymentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-300" /> #{p.paymentId}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">#{p.invoiceId}</td>
                    <td className="p-4 font-bold text-slate-900">₹{Number(p.amount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethod] ?? p.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{fmtDate(p.paidAt)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${apptStatusCls(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pay Now Modal ─────────────────────────────────────────────────────── */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pay Invoice #{payingInvoice.invoiceId}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Choose a payment method to complete your payment.</p>
              </div>
              <button onClick={closePayModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePay}>
              <div className="p-6 space-y-5">

                {payError && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {payError}
                  </div>
                )}

                {/* Invoice summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{(payingInvoice.subtotal ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Taxes</span>
                    <span>₹{(payingInvoice.taxes ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Discounts</span>
                    <span>-₹{(payingInvoice.discounts ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-bold text-blue-700">
                    <span>Total Due</span>
                    <span>₹{(payingInvoice.totalAmount ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Amount (pre-filled, editable in case of partial payment) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount to Pay (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                    className={selectCls}
                  >
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Method icons row */}
                <div className="flex gap-2 flex-wrap">
                  {(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        payMethod === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {PAYMENT_METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={closePayModal}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {paying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {paying ? 'Processing…' : `Pay $${parseFloat(payAmount || '0').toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
