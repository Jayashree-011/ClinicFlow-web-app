import React from 'react';
import { X, AlertCircle, RefreshCw, User, Loader2, CheckCircle2 } from 'lucide-react';
import type { InvoiceStatus } from './types';
import { inputCls, selectCls } from './constants';
import { usePatientLookup } from './usePatientLookup';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  invPatientId: string;
  setInvPatientId: (v: string) => void;
  invEncounterId: string;
  setInvEncounterId: (v: string) => void;
  invAmount: string;
  setInvAmount: (v: string) => void;
  invTaxes: string;
  setInvTaxes: (v: string) => void;
  invDiscounts: string;
  setInvDiscounts: (v: string) => void;
  invStatus: InvoiceStatus;
  setInvStatus: (v: InvoiceStatus) => void;
  invFormError: string;
  invFormLoading: boolean;
}

export function CreateInvoiceModal({
  isOpen, onClose, onSubmit,
  invPatientId, setInvPatientId,
  invEncounterId, setInvEncounterId,
  invAmount, setInvAmount,
  invTaxes, setInvTaxes,
  invDiscounts, setInvDiscounts,
  invStatus, setInvStatus,
  invFormError, invFormLoading,
}: CreateInvoiceModalProps) {
  const { name: patientName, loading: patientLoading, error: patientError } = usePatientLookup(invPatientId);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Invoice</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the billing details below.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-4">
            {invFormError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" /> {invFormError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Patient ID *</label>
                <input type="number" required placeholder="e.g. 1" value={invPatientId} onChange={e => setInvPatientId(e.target.value)} className={inputCls} />
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Encounter ID</label>
                <input type="number" placeholder="e.g. 3" value={invEncounterId} onChange={e => setInvEncounterId(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Subtotal (₹) *</label>
              <input type="number" required min="0" step="0.01" placeholder="0.00" value={invAmount} onChange={e => setInvAmount(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Taxes (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={invTaxes} onChange={e => setInvTaxes(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Discounts (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={invDiscounts} onChange={e => setInvDiscounts(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
              <select value={invStatus} onChange={e => setInvStatus(e.target.value as InvoiceStatus)} className={selectCls}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            {(invAmount || invTaxes || invDiscounts) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-600">Calculated Total</span>
                <span className="text-sm font-bold text-blue-700">
                  ₹{(parseFloat(invAmount||'0') + parseFloat(invTaxes||'0') - parseFloat(invDiscounts||'0')).toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={invFormLoading}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
              {invFormLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
