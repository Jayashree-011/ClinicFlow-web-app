import React from 'react';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  btnCancel, btnSubmit,
  inputCls, labelCls,
  modalOverlayCls, modalHeaderCls, modalBodyCls, modalFooterCls,
  errorBannerCls,
} from '../ui/design';
import { MedCombobox } from './MedCombobox';
import type { InventoryMed, PrescriptionForm } from './types';

// ─── New Prescription Modal ───────────────────────────────────────────────────

export interface CreateModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: PrescriptionForm;
  setForm: React.Dispatch<React.SetStateAction<PrescriptionForm>>;
  loading: boolean;
  error: string;
  inventory: InventoryMed[];
  patientNames: Record<number, string>;
  patientConditions?: Record<number, string>;
}

export function CreateModal({
  show, onClose, onSubmit, form, setForm, loading, error, inventory, patientNames, patientConditions = {},
}: CreateModalProps) {
  if (!show) return null;

  return (
    <div className={modalOverlayCls}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className={modalHeaderCls}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Prescription</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a medication from the pharmacy or enter manually.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={`${modalBodyCls} max-h-[72vh] overflow-y-auto`}>
            {error && (
              <div className={errorBannerCls}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Context */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Context</p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className={labelCls}>Patient ID *</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 1"
                  value={form.patientId}
                  onChange={e => setForm(prev => ({ ...prev, patientId: e.target.value }))}
                  className={inputCls}
                />
                {form.patientId && patientNames[Number(form.patientId)] && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✓ {patientNames[Number(form.patientId)]}
                  </p>
                )}
                {form.patientId && patientConditions[Number(form.patientId)] && (
                  <div className="flex items-center gap-1.5 mt-2 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      <span className="font-semibold">Known condition:</span>{' '}
                      {patientConditions[Number(form.patientId)]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Doctor ID</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={form.doctorId}
                  onChange={e => setForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Encounter ID</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={form.encounterId}
                  onChange={e => setForm(prev => ({ ...prev, encounterId: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Medication */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Medication
              {inventory.length > 0 && (
                <span className="ml-2 font-normal normal-case text-sky-500">
                  · {inventory.filter(i => i.status === 'ACTIVE').length} items available in pharmacy
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <MedCombobox
                inventory={inventory}
                medId={form.medId}
                medicationName={form.medicationName}
                onMedIdChange={(val, autoName) =>
                  setForm(prev => ({
                    ...prev,
                    medId: val,
                    ...(autoName !== undefined ? { medicationName: autoName } : {}),
                  }))
                }
                onNameChange={(val, autoMedId) =>
                  setForm(prev => ({
                    ...prev,
                    medicationName: val,
                    ...(autoMedId !== undefined ? { medId: autoMedId } : {}),
                  }))
                }
              />

              <div>
                <label className={labelCls}>Dosage</label>
                <input
                  placeholder="e.g. 500mg"
                  value={form.dosage}
                  onChange={e => setForm(prev => ({ ...prev, dosage: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select frequency…</option>
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Four times daily</option>
                  <option>Every 4 hours</option>
                  <option>Every 6 hours</option>
                  <option>Every 8 hours</option>
                  <option>As needed (PRN)</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Route</label>
                <select
                  value={form.route}
                  onChange={e => setForm(prev => ({ ...prev, route: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select route…</option>
                  <option>Oral</option>
                  <option>Intravenous (IV)</option>
                  <option>Intramuscular (IM)</option>
                  <option>Subcutaneous</option>
                  <option>Topical</option>
                  <option>Inhalation</option>
                  <option>Rectal</option>
                  <option>Sublingual</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Duration (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 7"
                  value={form.durationDays}
                  onChange={e => setForm(prev => ({ ...prev, durationDays: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 14"
                  value={form.quantity}
                  onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Repeats</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={form.repeats}
                  onChange={e => setForm(prev => ({ ...prev, repeats: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <input
                  placeholder="Optional clinical notes"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className={modalFooterCls}>
            <button type="button" onClick={onClose} className={btnCancel}>Cancel</button>
            <button type="submit" disabled={loading} className={btnSubmit}>
              {loading ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
