import React, { useState } from "react";
import { X, FlaskConical, CheckSquare, Square, Info } from "lucide-react";
import {
  LabOrder, LabResult,
  getTestsByPanel, buildBlankForms, buildEditForms,
  getTestMeta, parseTestCodes,
} from "./LabTestDictionary";

// ─────────────────────────────────────────────────────────────────────────────
// OrderFormModal — Create a new lab order
// ─────────────────────────────────────────────────────────────────────────────
interface OrderFormModalProps {
  patientId:        string;
  patientName:      string;
  encounterId:      string;
  defaultOrderedBy: string;
  onClose:          () => void;
  onSubmit:         (data: { orderedBy: string; tests: string[] }) => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  patientId, patientName, encounterId, defaultOrderedBy, onClose, onSubmit,
}) => {
  const [orderedBy, setOrderedBy] = useState(defaultOrderedBy ?? "");
  const [selected, setSelected]   = useState<string[]>([]);
  const byPanel = getTestsByPanel();

  const toggle = (code: string) =>
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const canSubmit = orderedBy.trim().length > 0 && selected.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FlaskConical size={18} className="text-blue-600" /> New Lab Order
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Context */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-gray-500">Patient:</span> <strong>{patientName}</strong></p>
            <p><span className="text-gray-500">Patient ID:</span> <strong>{patientId}</strong></p>
            <p><span className="text-gray-500">Encounter:</span> <strong>{encounterId}</strong></p>
          </div>

          {/* Ordering physician */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordering Physician <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orderedBy}
              onChange={e => setOrderedBy(e.target.value)}
              placeholder="e.g. Dr. Smith"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Test selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tests <span className="text-red-500">*</span>
              {selected.length > 0 && (
                <span className="ml-2 text-blue-600 font-normal text-xs">
                  {selected.length} selected
                </span>
              )}
            </label>
            <div className="space-y-3">
              {Object.entries(byPanel).map(([panel, tests]) => (
                <div key={panel}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {panel}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {tests.map(t => {
                      const on = selected.includes(t.code);
                      return (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => toggle(t.code)}
                          className={`flex items-start gap-2 text-left text-xs px-3 py-2 rounded-lg border transition ${
                            on ? "border-blue-500 bg-blue-50 text-blue-800"
                               : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          {on
                            ? <CheckSquare size={14} className="mt-0.5 shrink-0 text-blue-600" />
                            : <Square     size={14} className="mt-0.5 shrink-0 text-gray-400" />
                          }
                          <span>
                            <span className="font-medium">{t.name}</span><br />
                            <span className="text-gray-400">{t.units} · Ref: {t.range}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onSubmit({ orderedBy: orderedBy.trim(), tests: selected })}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ResultFormModal — Enter / edit test result values
// Flags are NOT entered here — the backend calculates them automatically
// from resultValue vs referenceRangeJson using validateAndSetFlag()
// ─────────────────────────────────────────────────────────────────────────────
interface ResultFormModalProps {
  order:           LabOrder;
  existingResults: LabResult[];
  isEditMode?:     boolean;
  onClose:         () => void;
  onSave:          (results: LabResult[]) => void;
}

export const ResultFormModal: React.FC<ResultFormModalProps> = ({
  order, existingResults, isEditMode = false, onClose, onSave,
}) => {
  const codes = parseTestCodes(order.testsJson);

  const [forms, setForms] = useState<LabResult[]>(() =>
    isEditMode
      ? buildEditForms(codes, existingResults, order.labOrderId)
      : buildBlankForms(codes, order.labOrderId)
  );

  const updateValue = (idx: number, value: string) =>
    setForms(prev => prev.map((r, i) => i === idx ? { ...r, resultValue: value } : r));

  const allFilled = forms.every(r => r.resultValue.trim() !== "");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <FlaskConical size={18} className="text-blue-600" />
              {isEditMode ? "Edit Results" : "Enter Results"} — LAB-{String(order.labOrderId ?? 0).padStart(4, "0")}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 ml-6 flex items-center gap-1">
              <Info size={11} /> Flags (Normal/Low/High/Critical) are auto-calculated by the server
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {forms.map((r, idx) => {
            const meta = getTestMeta(r.testCode);
            return (
              <div key={r.testCode} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-800">
                    {meta?.name ?? r.testCode}
                  </p>
                  <span className="text-xs text-gray-400">
                    Ref: {meta?.range ?? "—"} &nbsp;|&nbsp; {r.units}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 shrink-0">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={r.resultValue}
                    onChange={e => updateValue(idx, e.target.value)}
                    placeholder="e.g. 5.2"
                    className="border rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs text-gray-500">{r.units}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={() => allFilled && onSave(forms)}
            disabled={!allFilled}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditMode ? "Update Results" : "Save Results"}
          </button>
        </div>
      </div>
    </div>
  );
};
