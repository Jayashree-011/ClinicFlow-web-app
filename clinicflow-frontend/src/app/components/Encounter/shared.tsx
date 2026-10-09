import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react';
import type { EncounterStatus, AlertLevel } from './types';
import { STATUS_META } from './constants';

export function StatusBadge({ status }: { status: EncounterStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function JsonBlock({ data, label, icon: Icon }: { data: unknown; label: string; icon: React.ElementType }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-semibold text-slate-700"
      >
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          {label}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <pre className="p-4 text-xs text-slate-600 bg-white overflow-x-auto font-mono leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function VitalAlert({ level, msg }: { level: AlertLevel; msg: string }) {
  const critical = level === 'critical';
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${
      critical
        ? 'bg-rose-50 text-rose-700 border border-rose-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      <AlertTriangle className="w-3 h-3 shrink-0" />
      {msg}
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-slate-500 shrink-0 w-32">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}

export function ActionBtn({ label, icon: Icon, color, loading, onClick }: {
  label: string;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'rose';
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    blue:    'bg-blue-600 hover:bg-blue-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    rose:    'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${colors[color]}`}
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-slate-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

export function ProblemField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
