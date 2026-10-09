import { Clock, Pill } from 'lucide-react';
import { badgeCls } from '../ui/design';
import { statusBg, statusDot } from './statusHelpers';
import type { Prescription } from './types';

// ─── Patient History Panel ────────────────────────────────────────────────────
// Shown inside the View modal — lists other prescriptions for the same patient
// that are already loaded in the current search result set.

export interface HistoryPanelProps {
  patientId: number;
  patientName: string;
  currentRxId: number;
  prescriptions: Prescription[];
  onView: (rx: Prescription) => void;
}

export function PatientHistoryPanel({
  patientId, patientName, currentRxId, prescriptions, onView,
}: HistoryPanelProps) {
  const others = prescriptions.filter(p => p.rxId !== currentRxId);
  if (others.length === 0) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Prescription History — {patientName || `Patient #${patientId}`}
        </p>
        <span className="ml-auto text-xs font-semibold text-slate-400">{others.length} past rx</span>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {others.map(p => (
          <button
            key={p.rxId}
            type="button"
            onClick={() => onView(p)}
            className="w-full text-left bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-xl px-4 py-3 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
                <span className="text-sm font-semibold text-slate-700">{p.medicationName || '—'}</span>
                <span className="text-xs text-slate-400">Rx #{p.rxId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${badgeCls} border ${statusBg(p.status)} text-[10px]`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(p.status)}`} />
                  {p.status}
                </span>
                <span className="text-xs text-slate-400">
                  {p.issuedAt ? new Date(p.issuedAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-400 pl-5">
              {[p.dosage, p.frequency, p.route].filter(Boolean).join(' · ') || 'No details'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
