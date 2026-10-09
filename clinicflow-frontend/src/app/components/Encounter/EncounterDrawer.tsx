import React, { useState } from 'react';
import {
  X, AlertCircle, Edit2, RefreshCw, CheckCircle2, Ban,
  Pen, Activity, FlaskConical, Pill, FileText, ClipboardList,
  Plus, User, MessageSquare,
} from 'lucide-react';
import type { EncounterDTO, Patient } from './types';
import { api } from './api';
import { VISIT_TYPES } from './constants';
import { fmt } from './utils';
import { StatusBadge, JsonBlock, Row, ActionBtn } from './shared';
import { ProblemListSection } from './ProblemList';

export function EncounterDrawer({
  enc, patients, currentDoctorId, onClose, onUpdate, onGoToPrescription,
}: {
  enc: EncounterDTO;
  patients: Patient[];
  currentDoctorId: number;
  onClose: () => void;
  onUpdate: (updated: EncounterDTO) => void;
  onGoToPrescription?: (encounterId: number, patientId: number, mode: 'view' | 'add', doctorId?: number) => void;
}) {
  const [loading,      setLoading]      = useState<string | null>(null);
  const [error,        setError]        = useState('');
  const [confirmSign,  setConfirmSign]  = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [editDraft,    setEditDraft]    = useState({ visitType: enc.visitType, chiefComplaint: enc.chiefComplaint });
  const [showHandoff,  setShowHandoff]  = useState(false);
  const [handoffDraft, setHandoffDraft] = useState({ to: '', reason: '' });

  const patient = patients.find(p => p.id === enc.patientId);
  const existingReferral = enc.orders?.['referral'] as { to?: string; reason?: string; at?: string } | undefined;

  const act = async (label: string, fn: () => Promise<EncounterDTO>) => {
    setLoading(label); setError('');
    try { onUpdate(await fn()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Action failed'); }
    finally { setLoading(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={enc.status} />
              <span className="text-xs text-slate-400 font-mono">#{enc.encounterId}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display">{enc.visitType}</h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {patient?.name ?? `Patient #${enc.patientId}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Core info / inline edit */}
          {showEdit ? (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Edit Encounter
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Visit Type</label>
                <select
                  value={editDraft.visitType}
                  onChange={e => setEditDraft(d => ({ ...d, visitType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                >
                  {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Chief Complaint</label>
                <input
                  value={editDraft.chiefComplaint}
                  onChange={e => setEditDraft(d => ({ ...d, chiefComplaint: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowEdit(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={loading === 'Edit'}
                  onClick={() => act('Edit', async () => {
                    const updated = await api.update(enc.encounterId, {
                      visitType: editDraft.visitType,
                      chiefComplaint: editDraft.chiefComplaint,
                    });
                    setShowEdit(false);
                    return updated;
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {loading === 'Edit' ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <Row label="Chief Complaint" value={enc.chiefComplaint} />
              <Row label="Visit Type"      value={enc.visitType} />
              <Row label="Started"         value={fmt(enc.startAt)} />
              <Row label="Ended"           value={fmt(enc.endAt)} />
              {enc.signedBy && <Row label="Signed by" value={`Clinician #${enc.signedBy} @ ${fmt(enc.signedAt)}`} />}
            </div>
          )}

          {/* Existing referral banner */}
          {existingReferral?.to && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl">
              <MessageSquare className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-violet-800">Referral on record</p>
                <p className="text-xs text-violet-700 mt-0.5">To: <span className="font-semibold">{existingReferral.to}</span></p>
                {existingReferral.reason && <p className="text-xs text-violet-600 mt-0.5">{existingReferral.reason}</p>}
                {existingReferral.at && (
                  <p className="text-[10px] text-violet-400 mt-1">
                    {new Date(existingReferral.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Problem List */}
          <ProblemListSection
            encounterId={enc.encounterId}
            patientId={enc.patientId}
            readOnly={enc.status === 'SIGNED' || enc.status === 'CANCELLED'}
          />

          {/* JsonNode sections */}
          <JsonBlock data={enc.vitals}        label="Vitals"        icon={Activity}     />
          <JsonBlock data={enc.notes}         label="Notes"         icon={FileText}     />
          <JsonBlock data={enc.diagnoses}     label="Diagnoses"     icon={FlaskConical} />
          <JsonBlock data={enc.orders}        label="Orders"        icon={ClipboardList}/>
          <JsonBlock data={enc.prescriptions} label="Prescriptions" icon={Pill}         />

          <div className="text-xs text-slate-400 space-y-1 pt-2">
            <p>Created: {fmt(enc.createdAt)}</p>
            <p>Updated: {fmt(enc.updatedAt)}</p>
          </div>
        </div>

        {/* Action footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            {enc.status === 'IN_PROGRESS' && (
              <>
                <ActionBtn label={showEdit ? 'Editing…' : 'Edit'} icon={Edit2} color="blue" loading={loading === 'Edit'}
                  onClick={() => { setEditDraft({ visitType: enc.visitType, chiefComplaint: enc.chiefComplaint }); setShowEdit(v => !v); setConfirmSign(false); setShowHandoff(false); }} />
                <ActionBtn label="Complete" icon={CheckCircle2} color="blue" loading={loading === 'Complete'}
                  onClick={() => act('Complete', () => api.complete(enc.encounterId))} />
                <ActionBtn label="Refer" icon={MessageSquare} color="blue" loading={loading === 'Refer'}
                  onClick={() => { setShowHandoff(v => !v); setShowEdit(false); setConfirmSign(false); }} />
                <ActionBtn label="Cancel" icon={Ban} color="rose" loading={loading === 'Cancel'}
                  onClick={() => act('Cancel', () => api.cancel(enc.encounterId))} />
              </>
            )}
            {enc.status === 'COMPLETED' && (
              confirmSign ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Confirm sign-off?</p>
                      <p className="text-xs text-amber-700 mt-0.5">This permanently finalises the encounter. Only sign when all documentation is complete.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmSign(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors">
                      Cancel
                    </button>
                    <ActionBtn label="Confirm Sign" icon={Pen} color="emerald" loading={loading === 'Sign'}
                      onClick={() => { setConfirmSign(false); act('Sign', () => api.sign(enc.encounterId, currentDoctorId)); }} />
                  </div>
                </div>
              ) : (
                <ActionBtn label="Sign Encounter" icon={Pen} color="emerald" loading={loading === 'Sign'}
                  onClick={() => setConfirmSign(true)} />
              )
            )}
            {enc.status === 'SIGNED' && (
              onGoToPrescription ? (
                <>
                  <button
                    onClick={() => { onClose(); onGoToPrescription(enc.encounterId, enc.patientId, 'view', enc.doctorId); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-violet-300 text-violet-700 bg-white hover:bg-violet-50 transition-colors">
                    <Pill className="w-4 h-4" /> View Prescriptions
                  </button>
                  <button
                    onClick={() => { onClose(); onGoToPrescription(enc.encounterId, enc.patientId, 'add', enc.doctorId); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Prescription
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">Encounter signed.</p>
              )
            )}
            {enc.status === 'CANCELLED' && (
              <p className="text-sm text-slate-400 italic">No further actions available.</p>
            )}
          </div>

          {/* Handoff / referral inline form */}
          {showHandoff && enc.status === 'IN_PROGRESS' && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Referral / Handoff Note
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Refer to (colleague)</label>
                <input
                  value={handoffDraft.to}
                  onChange={e => setHandoffDraft(d => ({ ...d, to: e.target.value }))}
                  placeholder="e.g. Dr. Sarah Smith — Cardiology"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Reason / instructions</label>
                <textarea
                  value={handoffDraft.reason}
                  onChange={e => setHandoffDraft(d => ({ ...d, reason: e.target.value }))}
                  placeholder="Referral reason or instructions for the receiving clinician…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowHandoff(false); setHandoffDraft({ to: '', reason: '' }); }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  disabled={!handoffDraft.to.trim() || loading === 'Refer'}
                  onClick={() => act('Refer', async () => {
                    const updated = await api.update(enc.encounterId, {
                      orders: {
                        ...(enc.orders ?? {}),
                        referral: {
                          to: handoffDraft.to.trim(),
                          reason: handoffDraft.reason.trim(),
                          at: new Date().toISOString(),
                        },
                      },
                    });
                    setShowHandoff(false);
                    setHandoffDraft({ to: '', reason: '' });
                    return updated;
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {loading === 'Refer' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                  Save Referral
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
