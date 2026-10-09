import { FileText, CreditCard } from 'lucide-react';

interface TabSwitcherProps {
  mainTab: 'invoices' | 'payments';
  onTabChange: (tab: 'invoices' | 'payments') => void;
}

export function TabSwitcher({ mainTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-4 border border-slate-200/50">
      {(['invoices', 'payments'] as const).map(tab => (
        <button key={tab} onClick={() => onTabChange(tab)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
            mainTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          {tab === 'invoices' ? <FileText className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}
