import React, { useState } from 'react';
import {
  RefreshCw, Clock, Activity, ChevronDown, ChevronUp,
  Pill, Download, FileText, Stethoscope, CalendarDays,
  AlarmClock, InboxIcon,
} from 'lucide-react';
import { Encounter, PatientPrescription } from './types';
import { fmtDate, fmtTime, apptStatusCls, TH, Empty } from './utils';
import { printPrescriptionPDF } from '../Prescription/printPdf';

// ─── Status helpers for prescriptions ────────────────────────────────────────

function rxStatusCls(status: string) {
  switch ((status || '').toUpperCase()) {
    case 'ISSUED':    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'DRAFT':     return 'bg-amber-50   text-amber-600   border border-amber-100';
    case 'DISPENSED': return 'bg-blue-50    text-blue-600    border border-blue-100';
    case 'CANCELLED': return 'bg-rose-50    text-rose-500    border border-rose-100';
    default:          return 'bg-slate-50   text-slate-500   border border-slate-100';
  }
}

function rxDot(status: string) {
  switch ((status || '').toUpperCase()) {
    case 'ISSUED':    return 'bg-emerald-500';
    case 'DRAFT':     return 'bg-amber-500';
    case 'DISPENSED': return 'bg-blue-500';
    case 'CANCELLED': return 'bg-rose-500';
    default:          return 'bg-slate-400';
  }
}

// ─── Encounter expanded detail ────────────────────────────────────────────────

function EncounterDetail({ enc }: { enc: Encounter }) {
  const notesText = (() => {
    if (!enc.notes) return null;
    if (typeof enc.notes === 'string') return enc.notes;
    if (typeof enc.notes === 'object') {
      const val = enc.notes.notes ?? enc.notes.text ?? enc.notes.content ?? JSON.stringify(enc.notes);
      return typeof val === 'string' ? val : JSON.stringify(val);
    }
    return null;
  })();

  const durationMin = enc.startAt && enc.endAt
    ? Math.round((new Date(enc.endAt).getTime() - new Date(enc.startAt).getTime()) / 60000)
    : null;

  return (
    <tr>
      <td colSpan={4} className="px-4 pb-4 pt-0 bg-slate-50/60">
        <div className="rounded-xl border border-slate-100 bg-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Start Time</p>
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <AlarmClock className="w-3 h-3 text-slate-400" />
              {fmtTime(enc.startAt)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-1">End Time</p>
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <AlarmClock className="w-3 h-3 text-slate-400" />
              {enc.endAt ? fmtTime(enc.endAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Duration</p>
            <p className="font-semibold text-slate-700">
              {durationMin != null ? `${durationMin} min` : '—'}
            </p>
          </div>
          {enc.doctorId && (
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Doctor ID</p>
              <p className="font-semibold text-slate-700">#{enc.doctorId}</p>
            </div>
          )}
          {notesText && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Clinical Notes</p>
              <p className="text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                {notesText}
              </p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Prescription expanded detail ─────────────────────────────────────────────

function PrescriptionDetail({ rx }: { rx: PatientPrescription }) {
  const fields = [
    { label: 'Med ID',    value: rx.medId ?? '—' },
    { label: 'Dosage',    value: rx.dosage || '—' },
    { label: 'Frequency', value: rx.frequency || '—' },
    { label: 'Route',     value: rx.route || '—' },
    { label: 'Duration',  value: rx.durationDays ? `${rx.durationDays} days` : '—' },
    { label: 'Quantity',  value: rx.quantity ?? '—' },
    { label: 'Repeats',   value: rx.repeats ?? '—' },
    { label: 'Doctor ID', value: rx.doctorId ? `#${rx.doctorId}` : '—' },
  ];

  return (
    <tr>
      <td colSpan={7} className="px-4 pb-4 pt-0 bg-slate-50/60">
        <div className="rounded-xl border border-slate-100 bg-white p-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">{label}</p>
                <p className="font-semibold text-slate-700">{String(value)}</p>
              </div>
            ))}
          </div>
          {rx.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-amber-700 font-semibold text-[10px] uppercase tracking-wide mb-0.5">Notes</p>
              <p className="text-amber-800">{rx.notes}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  encounters:            Encounter[];
  prescriptions:         PatientPrescription[];
  prescriptionsLoading:  boolean;
  patientName:           string;
  fetchAll:              () => void;
  onRefreshRx:           () => void;
}

// ─── RecordsTab ───────────────────────────────────────────────────────────────

export default function RecordsTab({
  encounters, prescriptions, prescriptionsLoading, patientName, fetchAll, onRefreshRx,
}: Props) {
  const [section, setSection] = useState<'encounters' | 'prescriptions'>('encounters');
  const [expandedEnc, setExpandedEnc] = useState<number | null>(null);
  const [expandedRx,  setExpandedRx]  = useState<number | null>(null);

  const toggleEnc = (id: number) => setExpandedEnc(prev => prev === id ? null : id);
  const toggleRx  = (id: number) => setExpandedRx(prev  => prev === id ? null : id);

  return (
    <div className="p-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Medical Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {section === 'encounters'
              ? `${encounters.length} encounter${encounters.length !== 1 ? 's' : ''}`
              : `${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={section === 'encounters' ? fetchAll : onRefreshRx}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ── Section toggle buttons ── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSection('encounters')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            section === 'encounters'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Encounters
          {encounters.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              section === 'encounters' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              {encounters.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSection('prescriptions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            section === 'prescriptions'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescriptions
          {prescriptions.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              section === 'prescriptions' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {prescriptions.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════ ENCOUNTERS ══════════════════ */}
      {section === 'encounters' && (
        encounters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Empty message="No visits recorded" sub="Your medical visit history will appear here after your first encounter." />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Date', 'Visit Type', 'Chief Complaint', 'Status', ''].map(h => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700">
                  {encounters.map(e => (
                    <React.Fragment key={e.encounterId}>
                      <tr
                        onClick={() => toggleEnc(e.encounterId)}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            {fmtDate(e.startAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <Activity className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            <span className="font-semibold text-slate-800">{e.visitType || 'General Visit'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 max-w-[240px] truncate">{e.chiefComplaint || '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${apptStatusCls(e.status)}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {expandedEnc === e.encounterId
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </td>
                      </tr>
                      {expandedEnc === e.encounterId && <EncounterDetail enc={e} />}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ══════════════════ PRESCRIPTIONS ══════════════════ */}
      {section === 'prescriptions' && (
        prescriptionsLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading prescriptions…</p>
            </div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Empty
              message="No prescriptions yet"
              sub="Prescriptions issued by your doctor during visits will appear here."
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Rx #', 'Medication', 'Dosage', 'Frequency', 'Qty', 'Status', 'Issued At', ''].map(h => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700">
                  {prescriptions.map(rx => (
                    <React.Fragment key={rx.rxId}>
                      <tr
                        onClick={() => toggleRx(rx.rxId)}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-bold text-slate-800">#{rx.rxId}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                              <Pill className="w-3.5 h-3.5 text-sky-500" />
                            </div>
                            <span className="font-semibold text-slate-800">{rx.medicationName || '—'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{rx.dosage || '—'}</td>
                        <td className="p-4 text-slate-600">{rx.frequency || '—'}</td>
                        <td className="p-4 text-slate-600">{rx.quantity ?? '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${rxStatusCls(rx.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rxDot(rx.status)}`} />
                            {rx.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {rx.issuedAt ? fmtDate(rx.issuedAt) : '—'}
                        </td>
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => printPrescriptionPDF(rx as any, patientName)}
                              title="Download PDF"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleRx(rx.rxId)}
                              title="View details"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 transition-colors"
                            >
                              {expandedRx === rx.rxId
                                ? <ChevronUp className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRx === rx.rxId && <PrescriptionDetail rx={rx} />}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 font-medium">
              {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} total
            </div>
          </div>
        )
      )}
    </div>
  );
}
