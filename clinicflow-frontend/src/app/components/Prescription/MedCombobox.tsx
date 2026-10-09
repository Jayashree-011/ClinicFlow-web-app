import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputCls, labelCls } from '../ui/design';
import type { InventoryMed } from './types';

// ─── Medication Combobox ──────────────────────────────────────────────────────
// Single onMedIdChange / onNameChange callback pattern — each fires ONE setForm()
// in the parent to avoid the stale-closure bug where two separate setState calls
// would cancel each other.

export interface MedComboboxProps {
  inventory: InventoryMed[];
  medId: string;
  medicationName: string;
  onMedIdChange: (val: string, autoName?: string) => void;
  onNameChange: (val: string, autoMedId?: string) => void;
}

export function MedCombobox({
  inventory, medId, medicationName, onMedIdChange, onNameChange,
}: MedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const available = inventory.filter(i => i.status === 'ACTIVE' || i.status === 'LOW_STOCK');

  const filtered = available.filter(
    i =>
      i.medicationName.toLowerCase().includes(query.toLowerCase()) ||
      String(i.medId).includes(query),
  );

  return (
    <div className="grid grid-cols-2 gap-4 col-span-2">
      {/* Med ID */}
      <div>
        <label className={labelCls}>Med ID (from Pharmacy)</label>
        <input
          type="text"
          placeholder="e.g. 1"
          value={medId}
          onChange={e => {
            const val = e.target.value;
            const found = inventory.find(i => String(i.medId) === val.trim());
            onMedIdChange(val, found?.medicationName);
          }}
          className={inputCls}
        />
      </div>

      {/* Medication Name with dropdown */}
      <div className="relative" ref={ref}>
        <label className={labelCls}>Medication Name *</label>
        <div className="relative">
          <input
            required
            placeholder="Search or type name…"
            value={medicationName}
            onChange={e => {
              const val = e.target.value;
              const found = inventory.find(i => i.medicationName.toLowerCase() === val.toLowerCase());
              onNameChange(val, found ? String(found.medId) : undefined);
              setQuery(val);
              setOpen(true);
            }}
            onFocus={() => { setQuery(''); setOpen(true); }}
            className={`${inputCls} pr-8`}
          />
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No matching medications in pharmacy inventory.<br />
                <span className="text-slate-500 font-medium">You can still type the name manually.</span>
              </div>
            ) : filtered.map(item => (
              <button
                key={item.inventoryId}
                type="button"
                onClick={() => {
                  onMedIdChange(String(item.medId), item.medicationName);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{item.medicationName}</span>
                    <span className="ml-2 text-xs text-slate-400">ID: {item.medId}</span>
                  </div>
                  <span className="text-xs text-slate-500">{item.quantity} {item.unit}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
