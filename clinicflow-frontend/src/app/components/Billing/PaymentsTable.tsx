import { Search, Filter, CreditCard, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Payment, Invoice } from './types';
import { paymentStatusColors, paymentStatusDots, paymentMethodLabels } from './constants';
import { EmptyState } from './EmptyState';

interface PaymentsTableProps {
  paymentLoading: boolean;
  filteredPayments: Payment[];
  invoices: Invoice[];
  paymentSearch: string;
  setPaymentSearch: (s: string) => void;
  onDeleteClick: (id: number) => void;
}

export function PaymentsTable({
  paymentLoading, filteredPayments, invoices,
  paymentSearch, setPaymentSearch, onDeleteClick,
}: PaymentsTableProps) {
  // Build a patientId → patientName lookup from already-loaded invoices (no extra API calls)
  const patientNameMap = new Map(
    invoices
      .filter(inv => inv.patientName)
      .map(inv => [inv.patientId, inv.patientName!])
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 flex justify-between items-center gap-3 border-b border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          {invoices.length === 0 ? 'Create invoices first to see payments here.'
            : `Showing payments across ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}.`}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search payments..."
              value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-50/50">
              {['Payment ID','Invoice ID','Patient ID','Amount','Method','Paid At','Status','Actions'].map(h => (
                <th key={h} className="p-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {paymentLoading ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-slate-400 text-xs">Loading payments...</p>
              </td></tr>
            ) : filteredPayments.length === 0 ? (
              <EmptyState colSpan={8}
                message="No payments recorded yet."
                sub='Click "Record Payment" above to log a payment against an invoice.' />
            ) : filteredPayments.map(p => (
              <tr key={p.paymentId} className="hover:bg-slate-50/70 transition-colors group">
                <td className="p-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-300" />#{p.paymentId}</div>
                </td>
                <td className="p-4 text-slate-600">#{p.invoiceId}</td>
                <td className="p-4">
                  <span className="text-slate-800 font-medium">{p.patientId}</span>
                  {patientNameMap.get(p.patientId)
                    ? <p className="text-xs text-slate-400 mt-0.5">{patientNameMap.get(p.patientId)}</p>
                    : <p className="text-xs text-slate-300 mt-0.5">—</p>
                  }
                </td>
                <td className="p-4 font-bold text-slate-900">₹{Number(p.amount).toFixed(2)}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {paymentMethodLabels[p.paymentMethod] ?? p.paymentMethod}
                  </span>
                </td>
                <td className="p-4 text-slate-500">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${paymentStatusColors[p.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${paymentStatusDots[p.status]}`} />
                    {p.status}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => onDeleteClick(p.paymentId)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
        <div>Showing <span className="text-slate-900 font-bold">{filteredPayments.length}</span> payments</div>
        <div className="flex items-center gap-1">
          <button disabled className="p-1.5 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">1</button>
          <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
