import { Search, Filter, FileText, Download, Trash2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Invoice } from './types';
import { invoiceStatusColors, invoiceStatusDots } from './constants';
import { EmptyState } from './EmptyState';

interface InvoicesTableProps {
  invoiceLoading: boolean;
  invoiceError: string;
  filteredInvoices: Invoice[];
  invoiceFilter: string;
  setInvoiceFilter: (f: string) => void;
  invoiceSearch: string;
  setInvoiceSearch: (s: string) => void;
  onDownloadPdf: (id: number) => void;
  onDeleteClick: (id: number) => void;
}

export function InvoicesTable({
  invoiceLoading, invoiceError, filteredInvoices,
  invoiceFilter, setInvoiceFilter,
  invoiceSearch, setInvoiceSearch,
  onDownloadPdf, onDeleteClick,
}: InvoicesTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100">
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50 w-full sm:w-auto">
          {['All', 'Paid', 'Pending', 'Cancelled'].map(tab => (
            <button key={tab} onClick={() => setInvoiceFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                invoiceFilter === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}>{tab}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search by ID, patient, status..."
              value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter
          </button>
        </div>
      </div>

      {invoiceError && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" /> {invoiceError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-50/50">
              {['Invoice ID','Patient ID','Encounter ID','Subtotal','Taxes','Discounts','Total Amount','Issued At','Status','Actions'].map(h => (
                <th key={h} className="p-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {invoiceLoading ? (
              <tr><td colSpan={10} className="py-16 text-center">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-slate-400 text-xs">Loading invoices...</p>
              </td></tr>
            ) : invoiceError ? (
              <tr><td colSpan={10} className="py-4" /></tr>
            ) : filteredInvoices.length === 0 ? (
              <EmptyState colSpan={10}
                message={invoiceSearch || invoiceFilter !== 'All' ? 'No invoices match your filters.' : 'No invoices yet.'}
                sub={invoiceSearch || invoiceFilter !== 'All' ? 'Try adjusting your search or filter.' : 'Click "New Invoice" above to create your first invoice.'} />
            ) : filteredInvoices.map(inv => (
              <tr key={inv.invoiceId} className="hover:bg-slate-50/70 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <FileText className="w-4 h-4 text-slate-300 shrink-0" />#{inv.invoiceId}
                  </div>
                  {inv.description && (
                    <p className="mt-1 text-[11px] text-slate-400 font-normal max-w-[260px] leading-relaxed" title={inv.description}>
                      {inv.description.length > 72 ? inv.description.slice(0, 72) + '…' : inv.description}
                    </p>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-slate-800 font-medium">{inv.patientId}</span>
                  {inv.patientName
                    ? <p className="text-xs text-slate-400 mt-0.5">{inv.patientName}</p>
                    : <p className="text-xs text-slate-300 mt-0.5">—</p>
                  }
                </td>
                <td className="p-4 text-slate-600">{inv.encounterId ?? '—'}</td>
                <td className="p-4 text-slate-600">₹{(inv.subtotal ?? 0).toFixed(2)}</td>
                <td className="p-4 text-slate-500">₹{(inv.taxes ?? 0).toFixed(2)}</td>
                <td className="p-4 text-slate-500">-₹{(inv.discounts ?? 0).toFixed(2)}</td>
                <td className="p-4 font-bold text-slate-900">₹{(inv.totalAmount ?? 0).toFixed(2)}</td>
                <td className="p-4 text-slate-500">
                  {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${invoiceStatusColors[inv.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${invoiceStatusDots[inv.status]}`} />
                    {inv.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDownloadPdf(inv.invoiceId)} title="Download PDF"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteClick(inv.invoiceId)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
        <div>Showing <span className="text-slate-900 font-bold">1–{filteredInvoices.length}</span> of <span className="text-slate-900 font-bold">{filteredInvoices.length}</span> entries</div>
        <div className="flex items-center gap-1">
          <button disabled className="p-1.5 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">1</button>
          <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
