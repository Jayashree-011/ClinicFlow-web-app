import type { InvoiceStatus, PaymentMethod, PaymentStatus } from './types';

export const API_BASE = '/api/billing';

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  PAID:      'bg-emerald-50 text-emerald-600 border border-emerald-100',
  PENDING:   'bg-orange-50  text-orange-500  border border-orange-100',
  CANCELLED: 'bg-rose-50    text-rose-500    border border-rose-100',
};
export const invoiceStatusDots: Record<InvoiceStatus, string> = {
  PAID:      'bg-emerald-500',
  PENDING:   'bg-orange-500',
  CANCELLED: 'bg-rose-500',
};
export const paymentStatusColors: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  PENDING:   'bg-orange-50  text-orange-500  border border-orange-100',
  FAILED:    'bg-rose-50    text-rose-500    border border-rose-100',
  REFUNDED:  'bg-slate-50   text-slate-500   border border-slate-200',
};
export const paymentStatusDots: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-emerald-500',
  PENDING:   'bg-orange-500',
  FAILED:    'bg-rose-500',
  REFUNDED:  'bg-slate-400',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH:           'Cash',
  CREDIT_CARD:    'Credit Card',
  DEBIT_CARD:     'Debit Card',
  INSURANCE:      'Insurance',
  MOBILE_PAYMENT: 'Mobile Payment',
  OTHER:          'Other',
};

export const inputCls  = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
export const selectCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer';
