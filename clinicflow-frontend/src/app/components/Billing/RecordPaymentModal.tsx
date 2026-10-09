import React from 'react';
import { X, AlertCircle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import type { PaymentMethod, PaymentStatus } from './types';
import { inputCls, selectCls } from './constants';
import { usePatientLookup } from './usePatientLookup';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  payInvoiceId: string;
  setPayInvoiceId: (v: string) => void;
  payPatientId: string;
  setPayPatientId: (v: string) => void;
  payAmount: string;
  setPayAmount: (v: string) => void;
  payMethod: PaymentMethod;
  setPayMethod: (v: PaymentMethod) => void;
  payStatus: PaymentStatus;
  setPayStatus: (v: PaymentStatus) => void;
  payFormError: string;
  payFormLoading: boolean;
}

export function RecordPaymentModal({
  isOpen, onClose, onSubmit,
  payInvoiceId, setPayInvoiceId,
  payPatientId, setPayPatientId,
  payAmount, setPayAmount,
  payMethod, setPayMethod,
  payStatus, setPayStatus,
  payFormError, payFormLoading,
}: RecordPaymentModalProps) {
  const { name: patientName, loading: patientLoading, error: patientError } = usePatientLookup(payPatientId);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Link a payment to an existing invoice.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            {payFormError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" /> {payFormError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Invoice ID *</label>
                <input type="number" required placeholder="e.g. 1" value={payInvoiceId} onChange={e => setPayInvoiceId(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Patient ID *</label>
                <input type="number" required placeholder="e.g. 1" value={payPatientId} onChange={e => setPayPatientId(e.target.value)} className={inputCls} />
                {/* Patient name resolution feedback */}
                {patientLoading && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Looking up patient...
                  </p>
                )}
                {!patientLoading && patientName && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {patientName}
                  </p>
                )}
                {!patientLoading && patientError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1.5">
                    <AlertCircle className="w-3 h-3" /> {patientError}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount (₹) *</label>
              <input type="number" required min="0" step="0.01" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)} className={selectCls}>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="MOBILE_PAYMENT">Mobile Payment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
                <select value={payStatus} onChange={e => setPayStatus(e.target.value as PaymentStatus)} className={selectCls}>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={payFormLoading}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
              {payFormLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
