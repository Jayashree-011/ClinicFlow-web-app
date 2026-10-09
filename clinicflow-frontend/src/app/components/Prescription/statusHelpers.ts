// ─── Status colour helpers ────────────────────────────────────────────────────

export const statusBg = (status: string): string => {
  switch ((status || '').toUpperCase()) {
    case 'ISSUED':    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'DRAFT':     return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'DISPENSED': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
    default:          return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};

export const statusDot = (status: string): string => {
  switch ((status || '').toUpperCase()) {
    case 'ISSUED':    return 'bg-emerald-500';
    case 'DRAFT':     return 'bg-amber-500';
    case 'DISPENSED': return 'bg-blue-500';
    case 'CANCELLED': return 'bg-rose-500';
    default:          return 'bg-slate-400';
  }
};
