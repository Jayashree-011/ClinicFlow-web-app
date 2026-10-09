import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Invoice } from './types';

interface KpiCardsProps {
  invoices: Invoice[];
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  onCardClick: (filter: 'All' | 'Paid' | 'Pending' | 'Cancelled') => void;
}

export function KpiCards({ invoices, totalPaid, totalPending, totalCancelled, onCardClick }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {([
        { label: 'Total Revenue',  value: totalPaid + totalPending,   color: 'text-blue-600',    Icon: ArrowUpRight,   sub: `${invoices.length} invoices total`,                              filter: 'All'       as const },
        { label: 'Total Paid',     value: totalPaid,                  color: 'text-emerald-600', Icon: ArrowUpRight,   sub: `${invoices.filter(i=>i.status==='PAID').length} paid`,            filter: 'Paid'      as const },
        { label: 'Total Pending',  value: totalPending,               color: 'text-amber-600',   Icon: ArrowDownRight, sub: `${invoices.filter(i=>i.status==='PENDING').length} pending`,      filter: 'Pending'   as const },
        { label: 'Cancelled',      value: totalCancelled,             color: 'text-rose-600',    Icon: ArrowDownRight, sub: `${invoices.filter(i=>i.status==='CANCELLED').length} cancelled`,  filter: 'Cancelled' as const },
      ] as const).map(({ label, value, color, Icon, sub, filter }) => (
        <div
          key={label}
          onClick={() => onCardClick(filter)}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-150"
        >
          <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-2`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{value.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}
