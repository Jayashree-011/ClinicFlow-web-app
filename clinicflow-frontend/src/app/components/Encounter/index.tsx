import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, RefreshCw, AlertCircle, ChevronRight,
  Stethoscope, ClipboardList,
  Clock, User, Filter, Search, CalendarDays,
} from 'lucide-react';
import type { EncounterDTO, EncounterStatus, Patient } from './types';
import { api } from './api';
import { STATUS_META } from './constants';
import { fmt } from './utils';
import { StatusBadge } from './shared';
import { EncounterDrawer } from './EncounterDrawer';
import { CreateModal } from './CreateModal';

export type { Patient };

interface EncountersProps {
  patients: Patient[];
  currentDoctorId?: number;
  defaultPatientId?: number;
  prefillEncounter?: { patientId: number; patientName: string; visitType: string; doctorId?: number } | null;
  clearPrefillEncounter?: () => void;
  onGoToPrescription?: (encounterId: number, patientId: number, mode: 'view' | 'add', doctorId?: number) => void;
}

export function Encounters({
  patients,
  currentDoctorId = 1,
  defaultPatientId,
  prefillEncounter,
  clearPrefillEncounter,
  onGoToPrescription,
}: EncountersProps) {
  const [encounters,    setEncounters]    = useState<EncounterDTO[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [selected,      setSelected]      = useState<EncounterDTO | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState<EncounterStatus | 'ALL'>('ALL');
  const [patientFilter, setPatientFilter] = useState<number | null>(defaultPatientId ?? null);
  const [fromDate,      setFromDate]      = useState('');
  const [toDate,        setToDate]        = useState('');

  const loadEncounters = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let data: EncounterDTO[];
      if (patientFilter) {
        data = await api.getByPatient(patientFilter);
      } else if (filterStatus !== 'ALL') {
        data = await api.getByDoctorStatus(currentDoctorId, filterStatus);
      } else {
        const [inProgress, completed, signed, cancelled] = await Promise.all([
          api.getByDoctorStatus(currentDoctorId, 'IN_PROGRESS'),
          api.getByDoctorStatus(currentDoctorId, 'COMPLETED'),
          api.getByDoctorStatus(currentDoctorId, 'SIGNED'),
          api.getByDoctorStatus(currentDoctorId, 'CANCELLED'),
        ]);
        data = [...inProgress, ...completed, ...signed, ...cancelled];
      }
      setEncounters(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load encounters.');
    } finally { setLoading(false); }
  }, [patientFilter, filterStatus, currentDoctorId]);

  useEffect(() => { loadEncounters(); }, [loadEncounters]);

  useEffect(() => {
    if (prefillEncounter) setShowCreate(true);
  }, [prefillEncounter]);

  const handleCreated = (enc: EncounterDTO) => {
    setEncounters(prev => [enc, ...prev]);
    setShowCreate(false);
    clearPrefillEncounter?.();
  };

  const handleUpdated = (enc: EncounterDTO) => {
    setEncounters(prev => prev.map(e => e.encounterId === enc.encounterId ? enc : e));
    setSelected(enc);
  };

  const filtered = encounters.filter(enc => {
    const matchSearch = !search ||
      enc.chiefComplaint?.toLowerCase().includes(search.toLowerCase()) ||
      enc.visitType?.toLowerCase().includes(search.toLowerCase()) ||
      String(enc.patientId).includes(search);
    const matchStatus = filterStatus === 'ALL' || enc.status === filterStatus;
    const encDay   = enc.startAt ? enc.startAt.slice(0, 10) : '';
    const matchFrom = !fromDate || encDay >= fromDate;
    const matchTo   = !toDate   || encDay <= toDate;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const patient = (id: number) => patients.find(p => p.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
        .font-display { font-family: 'Sora', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 font-display">Encounters</h1>
            </div>
            <p className="text-sm text-slate-500 pl-10">Clinical encounters &amp; visit records</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadEncounters} disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-slate-500 disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200">
              <Plus className="w-4 h-4" /> New Encounter
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by complaint, visit type, patient ID…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400" />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={patientFilter ?? ''} onChange={e => setPatientFilter(Number(e.target.value) || null)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none cursor-pointer min-w-[160px]">
              <option value="">All Patients</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EncounterStatus | 'ALL')}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none cursor-pointer min-w-[150px]">
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="SIGNED">Signed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="From date"
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="To date"
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); }} title="Clear date range"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Summary Chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(['IN_PROGRESS', 'COMPLETED', 'SIGNED', 'CANCELLED'] as EncounterStatus[]).map(s => {
            const count = encounters.filter(e => e.status === s).length;
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => setFilterStatus(prev => prev === s ? 'ALL' : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === s ? `${m.bg} ${m.color} shadow-sm` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                {m.label} <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table / Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <p className="text-sm text-slate-500">Loading encounters…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600 font-display">No encounters found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or create a new encounter.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['Date', 'Patient', 'Visit Type', 'Chief Complaint', 'Status', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((enc, i) => {
                      const p = patient(enc.patientId);
                      return (
                        <tr key={enc.encounterId}
                          className={`border-b border-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                          onClick={() => setSelected(enc)}>
                          <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{fmt(enc.startAt)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm font-semibold text-slate-900">{p?.name ?? `Patient #${enc.patientId}`}</div>
                            {p?.age && <div className="text-xs text-slate-400">{p.age}y {p.gender}</div>}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-700">{enc.visitType}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[220px] truncate">{enc.chiefComplaint}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={enc.status} /></td>
                          <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map(enc => {
                  const p = patient(enc.patientId);
                  return (
                    <button key={enc.encounterId} onClick={() => setSelected(enc)}
                      className="w-full text-left px-4 py-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-slate-900 truncate">{p?.name ?? `Patient #${enc.patientId}`}</span>
                          <StatusBadge status={enc.status} />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{enc.visitType} · {enc.chiefComplaint}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(enc.startAt)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>

              {/* Footer count */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{encounters.length}</span>{' '}
                encounter{encounters.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          patients={patients}
          currentDoctorId={currentDoctorId}
          onClose={() => { setShowCreate(false); clearPrefillEncounter?.(); }}
          onCreate={handleCreated}
          initialValues={prefillEncounter
            ? { patientId: prefillEncounter.patientId, visitType: prefillEncounter.visitType, doctorId: prefillEncounter.doctorId }
            : undefined}
        />
      )}
      {selected && (
        <EncounterDrawer
          enc={selected}
          patients={patients}
          currentDoctorId={currentDoctorId}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdated}
          onGoToPrescription={onGoToPrescription}
        />
      )}
    </div>
  );
}

