import { RefreshCw, Plus } from 'lucide-react';

interface TopBarProps {
  mainTab: 'invoices' | 'payments';
  onRefresh: () => void;
  onNewInvoice: () => void;
  onRecordPayment: () => void;
}

export function TopBar({ mainTab, onRefresh, onNewInvoice, onRecordPayment }: TopBarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-slate-900">Billing & Payments</h1>
      <div className="flex items-center gap-3">
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        {mainTab === 'invoices' ? (
          <button onClick={onNewInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        ) : (
          <button onClick={onRecordPayment}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
      </div>
    </div>
  );
}
