import { Download, User, X } from 'lucide-react';
import {
  btnCancel, btnSubmit, btnDanger,
  modalOverlayCls, modalHeaderCls, modalFooterCls,
} from '../ui/design';
import { statusBg, statusDot } from './statusHelpers';
import { PatientHistoryPanel } from './PatientHistoryPanel';
import { printPrescriptionPDF } from './printPdf';
import type { Prescription } from './types';

// ─── View / Issue / Cancel Modal ─────────────────────────────────────────────

export interface ViewModalProps {
  rx: Prescription | null;
  onClose: () => void;
  patientName: string;
  prescriptions: Prescription[];
  getPatientName: (id: number) => string;
  onIssue: (rxId: number) => void;
  onCancel: (rxId: number) => void;
  /** Called when user clicks a history entry — parent updates viewRx + viewPatientName */
  onViewOther: (rx: Prescription) => void;
}

export function ViewModal({
  rx, onClose, patientName, prescriptions, getPatientName, onIssue, onCancel, onViewOther,
}: ViewModalProps) {
  if (!rx) return null;

  return (
    <div className={modalOverlayCls}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className={modalHeaderCls}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {rx.medicationName || `Rx #${rx.rxId}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rx #{rx.rxId} ·{' '}
              {patientName
                ? <span className="font-semibold text-sky-600">{patientName}</span>
                : `Patient #${rx.patientId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* Status banner */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${statusBg(rx.status)}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot(rx.status)}`} />
            <span className="text-sm font-semibold">{rx.status}</span>
            {rx.issuedAt && (
              <span className="ml-auto text-xs opacity-70">
                Issued {new Date(rx.issuedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Patient card */}
          {patientName && (
            <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-sky-700">{patientName}</p>
                <p className="text-xs text-sky-500">Patient ID #{rx.patientId}</p>
              </div>
            </div>
          )}

          {/* Context grid */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Context</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Patient',      value: patientName ? `${patientName} (#${rx.patientId})` : `#${rx.patientId}` },
                { label: 'Doctor ID',    value: rx.doctorId ? `#${rx.doctorId}` : '—' },
                { label: 'Encounter ID', value: rx.encounterId ? `#${rx.encounterId}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 font-semibold mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Medication grid */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Medication</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Med ID',    value: rx.medId ?? '—' },
                { label: 'Dosage',    value: rx.dosage || '—' },
                { label: 'Frequency', value: rx.frequency || '—' },
                { label: 'Route',     value: rx.route || '—' },
                { label: 'Duration',  value: rx.durationDays ? `${rx.durationDays} days` : '—' },
                { label: 'Quantity',  value: rx.quantity ?? '—' },
                { label: 'Repeats',   value: rx.repeats ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 font-semibold mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800">{String(value)}</p>
                </div>
              ))}
              {rx.notes && (
                <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-amber-600 font-semibold mb-0.5">Notes</p>
                  <p className="font-semibold text-amber-800">{rx.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient history within the current search result set */}
          <PatientHistoryPanel
            patientId={rx.patientId}
            patientName={patientName}
            currentRxId={rx.rxId}
            prescriptions={prescriptions}
            onView={onViewOther}
          />
        </div>

        {/* Footer */}
        <div className={modalFooterCls}>
          <button onClick={onClose} className={btnCancel}>Close</button>
          <button
            onClick={() => printPrescriptionPDF(rx, patientName)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          {rx.status === 'DRAFT' && (
            <button onClick={() => onIssue(rx.rxId)} className={btnSubmit}>
              Issue Prescription
            </button>
          )}
          {rx.status !== 'CANCELLED' && rx.status !== 'DISPENSED' && (
            <button onClick={() => onCancel(rx.rxId)} className={btnDanger}>
              Cancel Rx
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
