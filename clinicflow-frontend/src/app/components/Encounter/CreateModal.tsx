import React, { useState } from 'react';
import { Plus, X, AlertCircle, RefreshCw, Activity, FileText, ClipboardList } from 'lucide-react';
import type { EncounterDTO, EncounterCreateRequest, Patient } from './types';
import { api } from './api';
import { VISIT_TYPES, ENCOUNTER_TEMPLATES } from './constants';
import { getVitalAlert } from './utils';
import { VitalAlert, Field } from './shared';

export function CreateModal({
  patients, currentDoctorId, onClose, onCreate, initialValues,
}: {
  patients: Patient[];
  currentDoctorId: number;
  onClose: () => void;
  onCreate: (enc: EncounterDTO) => void;
  initialValues?: { patientId: number; visitType: string; doctorId?: number };
}) {
  const [form, setForm] = useState<EncounterCreateRequest>({
    patientId:      initialValues?.patientId  ?? 0,
    doctorId:       initialValues?.doctorId   ?? currentDoctorId,
    visitType:      initialValues?.visitType  ?? '',
    chiefComplaint: '',
    startAt:        new Date().toISOString().slice(0, 19),
  });
  const [vitals, setVitals] = useState({
    systolic: '', diastolic: '', heartRate: '',
    temperature: '', spo2: '', weight: '', height: '', rr: '',
  });
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof EncounterCreateRequest, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId)            { setError('Please select a patient.');    return; }
    if (!form.visitType)            { setError('Please select a visit type.');  return; }
    if (!form.chiefComplaint.trim()) { setError('Chief complaint is required.'); return; }

    const vitalsObj: Record<string, unknown> = {};
    if (vitals.systolic && vitals.diastolic) vitalsObj.bp          = `${vitals.systolic}/${vitals.diastolic}`;
    if (vitals.heartRate)                    vitalsObj.heartRate   = Number(vitals.heartRate);
    if (vitals.temperature)                  vitalsObj.temperature = Number(vitals.temperature);
    if (vitals.spo2)                         vitalsObj.spo2        = Number(vitals.spo2);
    if (vitals.weight)                       vitalsObj.weight      = Number(vitals.weight);
    if (vitals.height)                       vitalsObj.height      = Number(vitals.height);
    if (vitals.rr)                           vitalsObj.rr          = Number(vitals.rr);
    const vitalsData = Object.keys(vitalsObj).length ? vitalsObj : undefined;

    const soapObj: Record<string, unknown> = {};
    if (soap.subjective.trim()) soapObj.subjective = soap.subjective.trim();
    if (soap.objective.trim())  soapObj.objective  = soap.objective.trim();
    if (soap.assessment.trim()) soapObj.assessment = soap.assessment.trim();
    if (soap.plan.trim())       soapObj.plan       = soap.plan.trim();
    const notesData = Object.keys(soapObj).length ? soapObj : undefined;

    setError(''); setLoading(true);
    try {
      const created = await api.create({ ...form, vitals: vitalsData, notes: notesData });
      onCreate(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create encounter.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">New Encounter</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details to start an encounter</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            {/* Template picker */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
              <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Quick Template <span className="font-normal normal-case text-slate-400">— optional, pre-fills fields below</span>
                </label>
                <select
                  defaultValue=""
                  onChange={e => {
                    const t = ENCOUNTER_TEMPLATES.find(t => t.id === e.target.value);
                    if (!t) return;
                    set('visitType', t.visitType);
                    set('chiefComplaint', t.chiefComplaint);
                    setSoap(t.soap);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                >
                  <option value="">— Select a template (or fill fields manually) —</option>
                  {ENCOUNTER_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Field label="Patient *">
              <select
                value={form.patientId || ''}
                onChange={e => set('patientId', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              >
                <option value="">Select patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.age ? ` (${p.age}y)` : ''}</option>
                ))}
              </select>
            </Field>

            <Field label="Visit Type *">
              <select
                value={form.visitType}
                onChange={e => set('visitType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              >
                <option value="">Select type</option>
                {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>

            <Field label="Chief Complaint *">
              <input
                value={form.chiefComplaint}
                onChange={e => set('chiefComplaint', e.target.value)}
                placeholder="e.g. Fever and sore throat for 3 days"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </Field>

            <Field label="Start Time">
              <input
                type="datetime-local"
                value={form.startAt.slice(0, 16)}
                onChange={e => set('startAt', e.target.value.length >= 16 ? e.target.value + ':00' : e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </Field>

            {/* Vitals */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitals (Optional)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Blood Pressure (mmHg)</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" placeholder="120" value={vitals.systolic}
                      onChange={e => setVitals(v => ({ ...v, systolic: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                    <span className="text-slate-400 font-bold text-sm">/</span>
                    <input type="number" placeholder="80" value={vitals.diastolic}
                      onChange={e => setVitals(v => ({ ...v, diastolic: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                  </div>
                  {(getVitalAlert('systolic', vitals.systolic) ?? getVitalAlert('diastolic', vitals.diastolic)) && (
                    <VitalAlert {...(getVitalAlert('systolic', vitals.systolic) ?? getVitalAlert('diastolic', vitals.diastolic))!} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Heart Rate (bpm)</label>
                  <input type="number" placeholder="72" value={vitals.heartRate}
                    onChange={e => setVitals(v => ({ ...v, heartRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                  {getVitalAlert('heartRate', vitals.heartRate) && (
                    <VitalAlert {...getVitalAlert('heartRate', vitals.heartRate)!} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Temperature (°C)</label>
                  <input type="number" step="0.1" placeholder="37.0" value={vitals.temperature}
                    onChange={e => setVitals(v => ({ ...v, temperature: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                  {getVitalAlert('temperature', vitals.temperature) && (
                    <VitalAlert {...getVitalAlert('temperature', vitals.temperature)!} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">SpO₂ (%)</label>
                  <input type="number" placeholder="98" min="0" max="100" value={vitals.spo2}
                    onChange={e => setVitals(v => ({ ...v, spo2: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                  {getVitalAlert('spo2', vitals.spo2) && (
                    <VitalAlert {...getVitalAlert('spo2', vitals.spo2)!} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Weight (kg)</label>
                  <input type="number" step="0.1" placeholder="70" value={vitals.weight}
                    onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Height (cm)</label>
                  <input type="number" placeholder="170" value={vitals.height}
                    onChange={e => setVitals(v => ({ ...v, height: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Respiratory Rate (/min)</label>
                  <input type="number" placeholder="16" value={vitals.rr}
                    onChange={e => setVitals(v => ({ ...v, rr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                  {getVitalAlert('rr', vitals.rr) && (
                    <VitalAlert {...getVitalAlert('rr', vitals.rr)!} />
                  )}
                </div>
              </div>
            </div>

            {/* SOAP Notes */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SOAP Notes (Optional)</p>
              </div>
              {([
                { key: 'subjective', label: 'S — Subjective',  hint: 'Chief complaints, history, symptoms reported by patient…',    ring: 'focus:ring-sky-500/30',     border: 'focus:border-sky-400',     bg: 'bg-sky-50/40'     },
                { key: 'objective',  label: 'O — Objective',   hint: 'Examination findings, observed data, test results…',           ring: 'focus:ring-emerald-500/30', border: 'focus:border-emerald-400', bg: 'bg-emerald-50/40' },
                { key: 'assessment', label: 'A — Assessment',  hint: 'Clinical impression, diagnosis, differential diagnoses…',      ring: 'focus:ring-amber-500/30',   border: 'focus:border-amber-400',   bg: 'bg-amber-50/40'   },
                { key: 'plan',       label: 'P — Plan',        hint: 'Treatment plan, medications, referrals, follow-up schedule…',  ring: 'focus:ring-violet-500/30',  border: 'focus:border-violet-400',  bg: 'bg-violet-50/40'  },
              ] as const).map(({ key, label, hint, ring, border, bg }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{label}</label>
                  <textarea
                    value={soap[key]}
                    onChange={e => setSoap(s => ({ ...s, [key]: e.target.value }))}
                    placeholder={hint}
                    rows={2}
                    className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all resize-none ${ring} ${border} ${bg}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 shadow-sm shadow-blue-200">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Encounter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
