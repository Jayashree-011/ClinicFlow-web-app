import React from 'react';
import { InboxIcon } from 'lucide-react';

// ─── Date / time formatters ───────────────────────────────────────────────────

export function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

export function apptStatusCls(status: string) {
  const s = status?.toUpperCase();
  if (['CONFIRMED', 'SCHEDULED', 'COMPLETED'].includes(s))
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (s === 'PENDING')
    return 'bg-amber-50 text-amber-600 border border-amber-100';
  return 'bg-rose-50 text-rose-500 border border-rose-100';
}

export const INVOICE_COLORS = {
  PAID:      'bg-emerald-50 text-emerald-600 border border-emerald-100',
  PENDING:   'bg-amber-50   text-amber-600   border border-amber-100',
  CANCELLED: 'bg-rose-50    text-rose-500    border border-rose-100',
};

export const INVOICE_DOTS = {
  PAID: 'bg-emerald-500', PENDING: 'bg-amber-500', CANCELLED: 'bg-rose-500',
};

// ─── Shared table header class ────────────────────────────────────────────────

export const TH = 'p-4 text-[11px] font-semibold tracking-wider text-slate-400 uppercase text-left';

// ─── Empty state component ────────────────────────────────────────────────────

export function Empty({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
        <InboxIcon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 max-w-xs text-center">{sub}</p>
    </div>
  );
}
