import React, { useEffect, useState } from 'react';
import { X, Stethoscope, Pill, FlaskConical, Clock } from 'lucide-react';
import axiosInstance, { getPrescriptionsByPatient } from '../services/api';

// ─── Inline types ─────────────────────────────────────────────────────────────

interface EncounterRow {
  encounterId: number;
  visitType: string;
  chiefComplaint: string;
  status: string;
  startAt: string;
}

interface RxRow {
  rxId: number;
  medicationName: string;
  dosage: string;
  status: string;
  issuedAt: string | null;
  createdAt?: string;
}

interface LabRow {
  orderId?: number;
  id?: number;
  testName?: string;
  tests?: string;
  status: string;
  createdAt?: string;
  orderedAt?: string;
}

// ─── Timeline entry union ─────────────────────────────────────────────────────

type TimelineEntry =
  | { kind: 'encounter';    sortDate: string; enc: EncounterRow }
  | { kind: 'prescription'; sortDate: string; rx:  RxRow }
  | { kind: 'lab';          sortDate: string; lab: LabRow };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encounterStatusClass(status: string): string {
  switch (status) {
    case 'IN_PROGRESS': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'COMPLETED':   return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'SIGNED':      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'CANCELLED':   return 'text-rose-500 bg-rose-50 border-rose-100';
    default:            return 'text-slate-500 bg-slate-50 border-slate-100';
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-slate-200 mt-1" />
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>
      <div className="pb-6 flex-1 space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PatientTimelineProps {
  patientId: number;
  patientName: string;
  onClose: () => void;
}

export function PatientTimeline({ patientId, patientName, onClose }: PatientTimelineProps) {
  const [entries, setEntries]   = useState<TimelineEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [labError, setLabError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);

      const [encResult, rxResult, labResult] = await Promise.allSettled([
        axiosInstance.get<EncounterRow[]>(`/encounter/patient/${patientId}`),
        getPrescriptionsByPatient(patientId),
        axiosInstance.get<LabRow[]>(`/lab/orders?patientId=${patientId}`),
      ]);

      if (cancelled) return;

      const merged: TimelineEntry[] = [];

      if (encResult.status === 'fulfilled') {
        const encs: EncounterRow[] = encResult.value?.data ?? encResult.value ?? [];
        for (const enc of encs) {
          merged.push({ kind: 'encounter', sortDate: enc.startAt ?? '', enc });
        }
      }

      if (rxResult.status === 'fulfilled') {
        const rxList: RxRow[] = rxResult.value ?? [];
        for (const rx of rxList) {
          const sortDate = rx.issuedAt ?? rx.createdAt ?? '';
          merged.push({ kind: 'prescription', sortDate, rx });
        }
      }

      if (labResult.status === 'fulfilled') {
        const labs: LabRow[] = labResult.value?.data ?? labResult.value ?? [];
        for (const lab of labs) {
          const sortDate = lab.createdAt ?? lab.orderedAt ?? '';
          merged.push({ kind: 'lab', sortDate, lab });
        }
      } else {
        // 404 or network error — show soft error banner but don't block the whole timeline
        setLabError(true);
      }

      // Sort descending (newest first)
      merged.sort((a, b) => {
        if (!a.sortDate && !b.sortDate) return 0;
        if (!a.sortDate) return 1;
        if (!b.sortDate) return -1;
        return b.sortDate.localeCompare(a.sortDate);
      });

      setEntries(merged);
      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    /* Backdrop + panel wrapper */
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel — slides in from the right */}
      <div className="relative ml-auto w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">{patientName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Clinical Timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Lab soft-error banner */}
          {labError && !loading && (
            <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
              Lab records unavailable — they may not be loaded yet.
            </div>
          )}

          {loading ? (
            <div className="border-l-2 border-slate-100 ml-4 space-y-0">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Clock size={32} className="text-slate-200" />
              <p className="text-sm">No clinical history found for this patient.</p>
            </div>
          ) : (
            <div className="border-l-2 border-slate-100 ml-4">
              {entries.map((entry, idx) => (
                <TimelineItem key={idx} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Individual timeline row ──────────────────────────────────────────────────

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const dotColor =
    entry.kind === 'encounter'    ? 'bg-blue-500' :
    entry.kind === 'prescription' ? 'bg-violet-500' :
                                    'bg-emerald-500';

  return (
    <div className="flex gap-4 -ml-1.5 pb-6">
      {/* Dot */}
      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotColor} ring-2 ring-white`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Date */}
        <p className="text-[11px] text-slate-400 mb-1">
          {entry.sortDate ? new Date(entry.sortDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </p>

        {entry.kind === 'encounter' && <EncounterCard enc={entry.enc} />}
        {entry.kind === 'prescription' && <PrescriptionCard rx={entry.rx} />}
        {entry.kind === 'lab' && <LabCard lab={entry.lab} />}
      </div>
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

function EncounterCard({ enc }: { enc: EncounterRow }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-semibold">
          <Stethoscope size={10} />
          Encounter
        </span>
        <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold ${encounterStatusClass(enc.status)}`}>
          {enc.status}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-800 truncate">{enc.visitType || 'Visit'}</p>
      {enc.chiefComplaint && (
        <p className="text-[11px] text-slate-500 truncate mt-0.5">{enc.chiefComplaint}</p>
      )}
    </div>
  );
}

function PrescriptionCard({ rx }: { rx: RxRow }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[10px] font-semibold">
          <Pill size={10} />
          Rx
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-800 truncate">{rx.medicationName || 'Medication'}</p>
      {rx.dosage && (
        <p className="text-[11px] text-slate-500 mt-0.5">{rx.dosage}</p>
      )}
    </div>
  );
}

function LabCard({ lab }: { lab: LabRow }) {
  const testLabel = lab.testName ?? lab.tests ?? 'Lab order';
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-semibold">
          <FlaskConical size={10} />
          Lab
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-800 truncate">{testLabel}</p>
      {lab.status && (
        <p className="text-[11px] text-slate-500 mt-0.5">{lab.status}</p>
      )}
    </div>
  );
}
