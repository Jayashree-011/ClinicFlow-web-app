import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, X, Search, InboxIcon, AlertCircle, Trash2, Pencil,
  ChevronDown, AlertTriangle, CheckCircle2, Package, RefreshCw,
} from 'lucide-react';
import {
  pageCls, pageInnerCls, pageTitleCls,
  btnPrimary, btnSecondary, btnCancel, btnSubmit, btnDanger,
  inputCls, selectCls, labelCls,
  cardCls, tableHeadRowCls, tableThCls, tableBodyCls, tableRowCls, tableTdCls,
  tableToolbarCls, tablePaginationCls,
  modalOverlayCls, modalBoxCls, modalHeaderCls, modalBodyCls, modalFooterCls,
  searchInputCls, errorBannerCls, badgeCls,
  tabBarCls, tabActiveCls, tabInactiveCls,
} from './ui/design';
import {
  getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  dispenseMedication, getDispenseHistory, purgeRemovedInventory,
  getIssuedPrescriptions, getPatients,
} from '../services/api';
// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  inventoryId: number;
  medId: number;
  medicationName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  location: string;
  costPrice: number;
  status: string;
}

interface PendingRx {
  rxId: number;
  patientId: number;
  doctorId: number | null;
  encounterId: number | null;
  medId: number | null;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  quantity: number | null;
  route: string | null;
  notes: string | null;
  status: string;
  issuedAt: string | null;
}

interface DispenseRecord {
  dispenseId: number;
  rxId: number;
  inventoryId: number;
  patientId: number;
  medicationName: string;
  unit: string;
  quantity: number;
  remainingStock: number | null;
  unitCost: number | null;
  totalCost: number | null;
  dispensedAt: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_LOCATIONS = [
  'Shelf A-1', 'Shelf A-2', 'Shelf A-3', 'Shelf A-4', 'Shelf A-5',
  'Shelf B-1', 'Shelf B-2', 'Shelf B-3', 'Shelf B-4', 'Shelf B-5',
  'Shelf C-1', 'Shelf C-2', 'Shelf C-3', 'Shelf C-4', 'Shelf C-5',
  'Shelf D-1', 'Shelf D-2', 'Shelf D-3', 'Shelf D-4', 'Shelf D-5',
  'Cold Storage-1', 'Cold Storage-2', 'Cold Storage-3',
  'Controlled Cabinet-1', 'Controlled Cabinet-2',
];

const UNIT_OPTIONS = [
  'Tablets', 'Capsules', 'Syrup (ml)', 'Injection (ml)',
  'Cream (g)', 'Ointment (g)', 'Drops', 'Patch',
  'Inhaler (dose)', 'Powder (g)', 'Liquid (ml)', 'Other',
];

const LOW_STOCK_THRESHOLD = 20;

const emptyInventoryForm = {
  medId: '', medicationName: '', batchNumber: '',
  quantity: '', unit: '', expiryDate: '',
  location: '', costPrice: '', status: 'ACTIVE',
};

const emptyDispenseForm = {
  rxId: '', inventoryId: '', patientId: '',
  dispensedBy: '', quantity: '', notes: '',
};

// ─── Auto batch-number generator ─────────────────────────────────────────────

function generateBatchNumber(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'MED';
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `BATCH-${prefix}-${seq}`;
}

// ─── Combobox (location or batch — free-type + dropdown) ─────────────────────

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; disabled?: boolean; tag?: string }[];
  placeholder: string;
  label: string;
  required?: boolean;
  extra?: React.ReactNode;
}

function Combobox({ value, onChange, options, placeholder, label, required, extra }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-500">{label}{required && ' *'}</label>
        {extra}
      </div>
      <div className="relative">
        <input
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={e => { onChange(e.target.value); setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
          className={`${inputCls} pr-8`}
        />
        <button type="button" onClick={() => setOpen(o => !o)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">No options — type to use custom value.</div>
          ) : filtered.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={o.disabled}
              onClick={() => { if (!o.disabled) { onChange(o.label); setOpen(false); setQuery(''); } }}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors
                ${o.disabled ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-sky-50 cursor-pointer'}`}
            >
              <span className="text-xs font-semibold text-slate-700">{o.label}</span>
              {o.tag && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  o.tag === 'In Use' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                }`}>{o.tag}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inventory Selector for Dispense ─────────────────────────────────────────

interface InventorySelectorProps {
  inventory: InventoryItem[];
  selectedId: string;
  onSelect: (item: InventoryItem) => void;
}

function InventorySelector({ inventory, selectedId, onSelect }: InventorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = inventory.find(i => String(i.inventoryId) === selectedId);
  const filtered = inventory.filter(i =>
    i.medicationName.toLowerCase().includes(query.toLowerCase()) ||
    String(i.inventoryId).includes(query) ||
    i.batchNumber?.toLowerCase().includes(query.toLowerCase())
  );

  const stockColor = (item: InventoryItem) => {
    if (item.quantity === 0) return 'text-rose-600';
    if (item.quantity <= LOW_STOCK_THRESHOLD || item.status === 'LOW_STOCK') return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="col-span-2 relative" ref={ref}>
      <label className={labelCls}>Select Medication (Inventory) *</label>
      <div className="relative">
        <input
          required
          readOnly={!!selected}
          value={selected
            ? `${selected.medicationName} · #${selected.inventoryId} · Stock: ${selected.quantity} ${selected.unit}`
            : query}
          placeholder="Search by name, ID or batch…"
          onChange={e => { setQuery(e.target.value); onSelect(null as any); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={`${inputCls} pr-8 ${selected ? 'bg-white font-semibold' : ''}`}
        />
        {selected ? (
          <button type="button" onClick={() => { onSelect(null as any); setQuery(''); setOpen(true); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={() => setOpen(o => !o)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">No inventory items found.</div>
          ) : filtered.map(item => (
            <button
              key={item.inventoryId}
              type="button"
              onClick={() => { onSelect(item); setOpen(false); setQuery(''); }}
              className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-slate-50 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800">{item.medicationName}</span>
                  <span className="ml-2 text-xs text-slate-400">#{item.inventoryId} · {item.batchNumber || 'No batch'}</span>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${stockColor(item)}`}>
                    {item.quantity} {item.unit}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.location}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stock Warning Banner ─────────────────────────────────────────────────────

function StockWarning({ item, quantity }: { item: InventoryItem | undefined; quantity: string }) {
  if (!item) return null;

  const qty = Number(quantity) || 0;
  const remaining = item.quantity - qty;

  if (item.quantity === 0) {
    return (
      <div className="col-span-2 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <div>
          <p className="font-bold">Out of Stock</p>
          <p className="font-normal text-rose-500 mt-0.5">This item has no remaining stock. Cannot dispense.</p>
        </div>
      </div>
    );
  }

  if (item.status === 'LOW_STOCK' || item.quantity <= LOW_STOCK_THRESHOLD) {
    return (
      <div className="col-span-2 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-3 rounded-xl">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold">Low Stock Warning</p>
          <p className="font-normal text-amber-600 mt-0.5">
            Only <span className="font-bold">{item.quantity} {item.unit}</span> remaining.
            {qty > 0 && remaining >= 0 && (
              <> After this dispense: <span className="font-bold">{remaining} {item.unit}</span> will remain.</>
            )}
            {qty > item.quantity && (
              <span className="text-rose-600 font-bold"> ⚠ Requested qty exceeds available stock!</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (qty > 0 && qty <= item.quantity) {
    return (
      <div className="col-span-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-3 rounded-xl">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <p>
          Current stock: <span className="font-bold">{item.quantity} {item.unit}</span>
          {' · '}After dispense: <span className="font-bold">{remaining} {item.unit}</span> will remain.
        </p>
      </div>
    );
  }

  if (qty > item.quantity) {
    return (
      <div className="col-span-2 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Requested quantity ({qty}) exceeds available stock ({item.quantity} {item.unit}). Please reduce.
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PharmacyComponent({ readOnly = false }: { readOnly?: boolean } = {}) {
  const [tab, setTab] = useState<'inventory' | 'pending' | 'dispense'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [records, setRecords] = useState<DispenseRecord[]>([]);
  const [pendingRx, setPendingRx] = useState<PendingRx[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [historyPatientId, setHistoryPatientId] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyInventoryForm);
  const [editError, setEditError] = useState('');
  const [inventoryForm, setInventoryForm] = useState(emptyInventoryForm);
  const [dispenseForm, setDispenseForm] = useState(emptyDispenseForm);
  const [selectedDispenseItem, setSelectedDispenseItem] = useState<InventoryItem | null>(null);

  const [inventoryError, setInventoryError] = useState('');
  const [dispenseError, setDispenseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  // inline status editor: which inventoryId is being edited
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  // top-of-page toast notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { loadInventory(); }, []);

  useEffect(() => {
    if (tab !== 'pending') return;
    loadPendingRx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    getPatients()
      .then((data: any[]) => {
        const map: Record<number, string> = {};
        data.forEach((p: any) => { map[p.id] = p.name; });
        setPatientNames(map);
      })
      .catch(() => {});
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  // Unique location suggestions from existing inventory
  const locationSuggestions = useMemo(() =>
    [...new Set(inventory.map(i => i.location).filter(Boolean))], [inventory]);

  // Unique batch suggestions
  const batchSuggestions = useMemo(() =>
    [...new Set(inventory.map(i => i.batchNumber).filter(Boolean))], [inventory]);

  // Currently selected inventory item in dispense modal
  const selectedInventoryItem = useMemo(() =>
    inventory.find(i => String(i.inventoryId) === dispenseForm.inventoryId) ?? null,
  [inventory, dispenseForm.inventoryId]);

  const stockWarning = useMemo(() => {
    if (!selectedInventoryItem) return null;
    const s = selectedInventoryItem.status?.toUpperCase();
    if (s === 'OUT_OF_STOCK' || selectedInventoryItem.quantity <= 0)
      return { level: 'error', msg: `OUT OF STOCK — ${selectedInventoryItem.medicationName} has no remaining stock.` };
    if (s === 'LOW_STOCK' || selectedInventoryItem.quantity <= 20)
      return { level: 'warn', msg: `LOW STOCK — only ${selectedInventoryItem.quantity} ${selectedInventoryItem.unit || 'units'} remaining.` };
    return null;
  }, [selectedInventoryItem]);

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (e) {
      console.error('Failed to load inventory', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRx = async () => {
    setPendingLoading(true);
    try {
      const data = await getIssuedPrescriptions();
      setPendingRx(data ?? []);
    } catch {
      setPendingRx([]);
    } finally {
      setPendingLoading(false);
    }
  };

  // Pre-fills the dispense form from a pending prescription and opens the modal
  const handleDispenseFromRx = (rx: PendingRx) => {
    // Find matching inventory item by medId
    const matchedItem = rx.medId != null
      ? inventory.find(i => i.medId === rx.medId && i.status !== 'REMOVED' && i.quantity > 0)
      : inventory.find(i =>
          i.medicationName?.toLowerCase() === rx.medicationName?.toLowerCase() &&
          i.status !== 'REMOVED' && i.quantity > 0
        );

    setDispenseForm({
      rxId:        String(rx.rxId),
      inventoryId: matchedItem ? String(matchedItem.inventoryId) : '',
      patientId:   String(rx.patientId),
      dispensedBy: '',
      quantity:    rx.quantity != null ? String(rx.quantity) : '',
      notes:       rx.notes ?? '',
    });
    setSelectedDispenseItem(matchedItem ?? null);
    setDispenseError('');
    setShowDispenseModal(true);
  };

  // ── Compute free vs occupied locations ──────────────────────────────────────
  const occupiedLocations = new Set(
    inventory
      .filter(i => i.status === 'ACTIVE' || i.status === 'LOW_STOCK')
      .map(i => i.location)
      .filter(Boolean)
  );

  const locationOptions = ALL_LOCATIONS.map(loc => ({
    label: loc,
    disabled: occupiedLocations.has(loc),
    tag: occupiedLocations.has(loc) ? 'In Use' : 'Free',
  }));

  // ── Existing batch numbers (for re-stocking same batch) ────────────────────
  const existingBatches = [
    ...new Set(inventory.map(i => i.batchNumber).filter(Boolean))
  ].map(b => ({ label: b, tag: 'Existing' }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInventoryError('');

    // detect before the API call whether this medId already exists
    const medIdNum = Number(inventoryForm.medId);
    const isRestock = inventory.some(
      i => i.medId === medIdNum &&
           (i.status === 'ACTIVE' || i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK')
    );

    try {
      const result = await addInventoryItem({
        medId: medIdNum,
        medicationName: inventoryForm.medicationName,
        batchNumber: inventoryForm.batchNumber,
        quantity: Number(inventoryForm.quantity),
        unit: inventoryForm.unit,
        expiryDate: inventoryForm.expiryDate || null,
        location: inventoryForm.location,
        costPrice: inventoryForm.costPrice ? Number(inventoryForm.costPrice) : null,
        status: inventoryForm.status,
      });

      await loadInventory();
      setShowAddModal(false);
      setInventoryForm(emptyInventoryForm);

      // show meaningful feedback
      if (isRestock) {
        showToast(
          `Restocked: +${inventoryForm.quantity} units added to ${result.medicationName || inventoryForm.medicationName}. New stock: ${result.quantity} · Status: ${result.status}`,
          'success'
        );
      } else {
        showToast(`New item added: ${result.medicationName} — ${result.quantity} ${result.unit || 'units'} at ${result.location || 'unassigned location'}`, 'success');
      }
    } catch (e: any) {
      const d = e?.response?.data;
      setInventoryError(d?.message || d?.detail || d?.error || `Error ${e?.response?.status || ''}: Failed to add inventory item.`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this inventory item?')) return;
    try {
      await deleteInventoryItem(id);
      await loadInventory();
    } catch {
      alert('Failed to delete item.');
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispenseError('');

    // guard: cannot dispense more than available
    if (selectedDispenseItem && Number(dispenseForm.quantity) > selectedDispenseItem.quantity) {
      setDispenseError(`Cannot dispense ${dispenseForm.quantity} — only ${selectedDispenseItem.quantity} ${selectedDispenseItem.unit} in stock.`);
      return;
    }
    if (selectedDispenseItem && selectedDispenseItem.quantity === 0) {
      setDispenseError('This item is out of stock and cannot be dispensed.');
      return;
    }

    try {
      const result = await dispenseMedication({
        rxId: dispenseForm.rxId ? Number(dispenseForm.rxId) : null,
        inventoryId: Number(dispenseForm.inventoryId),
        patientId: Number(dispenseForm.patientId),
        dispensedBy: dispenseForm.dispensedBy ? Number(dispenseForm.dispensedBy) : null,
        quantity: Number(dispenseForm.quantity),
        notes: dispenseForm.notes || null,
      });
      setRecords(prev => [result, ...prev]);
      // reload inventory so balance is updated immediately in the table
      await loadInventory();
      // remove the dispensed prescription from the pending list
      if (result.rxId) {
        setPendingRx(prev => prev.filter(rx => rx.rxId !== result.rxId));
      }
      setShowDispenseModal(false);
      setDispenseForm(emptyDispenseForm);
      setSelectedDispenseItem(null);
      showToast(
        `Dispensed ${result.quantity} ${result.unit || 'units'} of ${result.medicationName}. Remaining stock: ${result.remainingStock ?? '—'} ${result.unit || ''}`,
        result.remainingStock === 0 ? 'info' : 'success'
      );
    } catch (e: any) {
      const d = e?.response?.data;
      setDispenseError(d?.message || d?.detail || d?.error || `Error ${e?.response?.status || ''}: Failed to dispense medication.`);
    }
  };

  const loadHistory = async () => {
    if (!historyPatientId) return;
    setHistoryLoading(true);
    try {
      const data = await getDispenseHistory(Number(historyPatientId));
      setRecords(data);
    } catch {
      alert('Failed to load dispense history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStatusChange = async (inventoryId: number, newStatus: string) => {
    // find the current item so we can send the full object to PUT
    const current = inventory.find(i => i.inventoryId === inventoryId);
    if (!current) return;
    try {
      // use the existing PUT endpoint — no PATCH routing issues
      const updated = await updateInventoryItem(inventoryId, { ...current, status: newStatus });
      setInventory(prev => prev.map(i => i.inventoryId === inventoryId ? { ...i, status: updated.status } : i));
    } catch {
      alert('Failed to update status.');
    } finally {
      setEditingStatusId(null);
    }
  };

  const handlePurgeRemoved = async () => {
    if (!confirm(`Permanently delete ${removedCount} removed item(s)? This cannot be undone.`)) return;
    try {
      const result = await purgeRemovedInventory();
      showToast(result.message, 'success');
      await loadInventory();
    } catch {
      showToast('Failed to purge removed items.', 'info');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditItemId(item.inventoryId);
    setEditForm({
      medId: String(item.medId ?? ''),
      medicationName: item.medicationName ?? '',
      batchNumber: item.batchNumber ?? '',
      quantity: String(item.quantity ?? ''),
      unit: item.unit ?? '',
      expiryDate: item.expiryDate ?? '',
      location: item.location ?? '',
      costPrice: item.costPrice != null ? String(item.costPrice) : '',
      status: item.status ?? 'ACTIVE',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditError('');
    setEditItemId(null);
    setEditForm(emptyInventoryForm);
  };

  const handleEditInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemId) return;
    setEditError('');
    try {
      await updateInventoryItem(editItemId, {
        medId: Number(editForm.medId),
        medicationName: editForm.medicationName,
        batchNumber: editForm.batchNumber,
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        expiryDate: editForm.expiryDate || null,
        location: editForm.location,
        costPrice: editForm.costPrice ? Number(editForm.costPrice) : null,
        status: editForm.status,
      });
      await loadInventory();
      closeEditModal();
      showToast(`Updated: ${editForm.medicationName} (Med ID ${editForm.medId})`, 'success');
    } catch (e: any) {
      const d = e?.response?.data;
      setEditError(d?.message || d?.detail || d?.error || `Error ${e?.response?.status || ''}: Failed to update item.`);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setInventoryError('');
    setInventoryForm(emptyInventoryForm);
  };

  const closeDispenseModal = () => {
    setShowDispenseModal(false);
    setDispenseError('');
    setDispenseForm(emptyDispenseForm);
    setSelectedDispenseItem(null);
  };

  const removedCount = inventory.filter(i => i.status === 'REMOVED').length;

  const filteredInventory = inventory.filter(item =>
    item.status !== 'REMOVED' && (
      item.medicationName?.toLowerCase().includes(search.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // ── Status helpers ───────────────────────────────────────────────────────────

  const statusBg = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'LOW_STOCK':     return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'OUT_OF_STOCK':  return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'EXPIRED':       return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'DISPENSED':     return 'bg-blue-50 text-blue-600 border-blue-100';
      default:              return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const statusDot = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':        return 'bg-emerald-500';
      case 'LOW_STOCK':     return 'bg-amber-500';
      case 'OUT_OF_STOCK':  return 'bg-rose-500';
      case 'EXPIRED':       return 'bg-rose-500';
      case 'DISPENSED':     return 'bg-blue-500';
      default:              return 'bg-slate-400';
    }
  };

  const qtyColor = (item: InventoryItem) => {
    if (item.quantity === 0) return 'text-rose-600 font-bold';
    if (item.quantity <= LOW_STOCK_THRESHOLD || item.status === 'LOW_STOCK')
      return 'text-amber-600 font-bold';
    return 'text-slate-700';
  };

  // ── Effective status: backend auto-sets OUT_OF_STOCK/LOW_STOCK now,
  //    but keep client-side fallback for items added before the fix ───────────
  const effectiveStatus = (item: InventoryItem): string => {
    if (item.quantity === 0) return 'OUT_OF_STOCK';
    if (item.quantity <= LOW_STOCK_THRESHOLD
        && (item.status === 'ACTIVE' || item.status === 'LOW_STOCK')) return 'LOW_STOCK';
    return item.status;
  };

  const effectiveStatusLabel = (item: InventoryItem): string => {
    if (item.quantity === 0) return 'OUT OF STOCK';
    if (item.quantity <= LOW_STOCK_THRESHOLD
        && (item.status === 'ACTIVE' || item.status === 'LOW_STOCK')) return 'LOW STOCK';
    return item.status.replace('_', ' ');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={pageCls}>
      <div className={pageInnerCls}>

        {/* Toast notification */}
        {toast && (
          <div className={`flex items-start gap-3 px-5 py-3.5 rounded-2xl mb-5 text-sm font-medium shadow-sm border transition-all
            ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'}`}
          >
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${toast.type === 'success' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="flex-1">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Read-only banner */}
        {readOnly && (
          <div className="flex items-center gap-2 px-4 py-3 mb-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            You have <strong>view-only</strong> access to the pharmacy. Contact a pharmacist to add or dispense inventory.
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className={pageTitleCls}>Pharmacy{readOnly ? ' — Inventory' : ' Management'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {readOnly ? 'View available medications and stock levels' : 'Manage inventory and dispense medications'}
              {inventory.filter(i => i.quantity > 0 && i.quantity <= LOW_STOCK_THRESHOLD).length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {inventory.filter(i => i.quantity > 0 && i.quantity <= LOW_STOCK_THRESHOLD).length} low stock
                </span>
              )}
              {inventory.filter(i => i.quantity === 0).length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-rose-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {inventory.filter(i => i.quantity === 0).length} out of stock
                </span>
              )}
            </p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(true)} className={btnPrimary}>
                <Plus className="w-4 h-4" /> Add Inventory
              </button>
              <button onClick={() => setShowDispenseModal(true)} className={btnSecondary}>
                Dispense
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`${tabBarCls} mb-6`}>
          <button onClick={() => setTab('inventory')} className={tab === 'inventory' ? tabActiveCls : tabInactiveCls}>
            Inventory
          </button>
          {!readOnly && (
            <button onClick={() => setTab('pending')} className={`${tab === 'pending' ? tabActiveCls : tabInactiveCls} flex items-center gap-1.5`}>
              Pending Prescriptions
              {pendingRx.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'pending' ? 'bg-sky-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  {pendingRx.length}
                </span>
              )}
            </button>
          )}
          <button onClick={() => setTab('dispense')} className={tab === 'dispense' ? tabActiveCls : tabInactiveCls}>
            Dispense History
          </button>
        </div>

        {/* ── Inventory Tab ─────────────────────────────────────────────────── */}
        {tab === 'inventory' && (
          <div className={cardCls}>
            <div className={tableToolbarCls}>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search medication, batch or location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={searchInputCls}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {inventory.filter(i => i.status !== 'REMOVED' && i.quantity > LOW_STOCK_THRESHOLD && i.status === 'ACTIVE').length} in stock
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {inventory.filter(i => i.status !== 'REMOVED' && i.quantity > 0 && i.quantity <= LOW_STOCK_THRESHOLD).length} low
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {inventory.filter(i => i.status !== 'REMOVED' && i.quantity === 0).length} out
                  </span>
                </div>
                {!readOnly && removedCount > 0 && (
                  <button
                    onClick={handlePurgeRemoved}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                    title="Permanently delete all REMOVED items from the database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge Removed ({removedCount})
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className={tableHeadRowCls}>
                    {['ID', 'Medication', 'Batch', 'Stock', 'Unit', 'Expiry', 'Location', 'Cost', 'Status', ...(!readOnly ? ['Actions'] : [])].map(h => (
                      <th key={h} className={tableThCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={tableBodyCls}>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-sm text-slate-400">Loading inventory...</td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <InboxIcon className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">
                            {search ? 'No items match your search.' : 'No inventory items yet.'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {search ? 'Try adjusting your search.' : 'Click "Add Inventory" to get started.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInventory.map(item => (
                    <tr key={item.inventoryId}
                      className={`${tableRowCls} ${item.quantity === 0 ? 'bg-rose-50/30' : item.quantity <= LOW_STOCK_THRESHOLD ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className={`${tableTdCls} font-semibold text-slate-900`}>#{item.medId}</td>
                      <td className={`${tableTdCls} font-semibold text-slate-800`}>{item.medicationName}</td>
                      <td className={`${tableTdCls} font-mono text-xs text-slate-500`}>{item.batchNumber || '—'}</td>
                      <td className={`${tableTdCls} ${qtyColor(item)}`}>
                        {item.quantity}
                        {item.quantity === 0 && (
                          <span className="ml-1 text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">OUT</span>
                        )}
                        {item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">LOW</span>
                        )}
                      </td>
                      <td className={`${tableTdCls} text-slate-600`}>{item.unit || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>{item.expiryDate || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>{item.location || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>
                        {item.costPrice != null ? `₹${item.costPrice}` : '—'}
                      </td>
                      {/* Status — click badge to open inline editor */}
                      <td className={tableTdCls}>
                        {editingStatusId === item.inventoryId ? (
                          <select
                            autoFocus
                            value={item.status}
                            onBlur={() => setEditingStatusId(null)}
                            onChange={e => handleStatusChange(item.inventoryId, e.target.value)}
                            className="text-xs border border-blue-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="LOW_STOCK">LOW STOCK</option>
                            <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                            <option value="EXPIRED">EXPIRED</option>
                          </select>
                        ) : (
                          <button
                            title="Click to change status"
                            onClick={e => { e.stopPropagation(); setEditingStatusId(item.inventoryId); }}
                            className={`${badgeCls} border ${statusBg(effectiveStatus(item))} cursor-pointer hover:opacity-80 transition-opacity`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(effectiveStatus(item))}`} />
                            {effectiveStatusLabel(item)}
                          </button>
                        )}
                      </td>
                      {!readOnly && (
                        <td className={tableTdCls}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={e => { e.stopPropagation(); openEditModal(item); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-colors"
                              title="Edit item"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(item.inventoryId); }}
                              className={btnDanger}
                              title="Remove item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredInventory.length > 0 && (
              <div className={tablePaginationCls}>
                <span>
                  Showing <span className="text-slate-900 font-bold">{filteredInventory.length}</span>{' '}
                  item{filteredInventory.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Pending Prescriptions Tab ───────────────────────────────────── */}
        {tab === 'pending' && (
          <div className={cardCls}>
            <div className={tableToolbarCls}>
              <div>
                <p className="text-sm font-semibold text-slate-800">Issued Prescriptions awaiting dispensing</p>
                <p className="text-xs text-slate-400 mt-0.5">Click "Dispense" on any row to open a pre-filled dispense form.</p>
              </div>
              <button onClick={loadPendingRx} className={btnSecondary}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className={tableHeadRowCls}>
                    {['Rx ID', 'Patient', 'Medication', 'Dosage', 'Freq.', 'Qty', 'Route', 'Issued At', 'Stock', 'Action'].map(h => (
                      <th key={h} className={tableThCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={tableBodyCls}>
                  {pendingLoading ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-sm text-slate-400">Loading pending prescriptions…</td>
                    </tr>
                  ) : pendingRx.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">All clear — no pending prescriptions.</p>
                          <p className="text-xs text-slate-400">Issued prescriptions will appear here once created in the Prescriptions module.</p>
                        </div>
                      </td>
                    </tr>
                  ) : pendingRx.map(rx => {
                    const matchedItem = rx.medId != null
                      ? inventory.find(i => i.medId === rx.medId && i.status !== 'REMOVED' && i.quantity > 0)
                      : inventory.find(i =>
                          i.medicationName?.toLowerCase() === rx.medicationName?.toLowerCase() &&
                          i.status !== 'REMOVED' && i.quantity > 0
                        );
                    const noStock = !matchedItem;
                    return (
                      <tr key={rx.rxId} className={`${tableRowCls} ${noStock ? 'opacity-60' : ''}`}>
                        <td className={`${tableTdCls} font-semibold text-slate-900`}>#{rx.rxId}</td>
                        <td className={tableTdCls}>
                          <div className="font-semibold text-slate-800 text-sm leading-tight">
                            {patientNames[rx.patientId] || <span className="text-slate-400 text-xs font-normal">Patient</span>}
                          </div>
                          <div className="text-xs text-slate-400">#{rx.patientId}</div>
                        </td>
                        <td className={`${tableTdCls} font-semibold text-slate-800`}>{rx.medicationName || '—'}</td>
                        <td className={`${tableTdCls} text-slate-600`}>{rx.dosage || '—'}</td>
                        <td className={`${tableTdCls} text-slate-600`}>{rx.frequency || '—'}</td>
                        <td className={`${tableTdCls} font-semibold text-slate-700`}>{rx.quantity ?? '—'}</td>
                        <td className={`${tableTdCls} text-slate-600`}>{rx.route || '—'}</td>
                        <td className={`${tableTdCls} text-slate-500 text-xs`}>
                          {rx.issuedAt ? new Date(rx.issuedAt).toLocaleString() : '—'}
                        </td>
                        {/* Stock availability */}
                        <td className={tableTdCls}>
                          {matchedItem ? (
                            <div className="flex items-center gap-1.5">
                              <Package className={`w-3.5 h-3.5 ${matchedItem.quantity <= LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-emerald-400'}`} />
                              <span className={`text-xs font-bold ${matchedItem.quantity <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {matchedItem.quantity} {matchedItem.unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> No stock
                            </span>
                          )}
                        </td>
                        <td className={tableTdCls}>
                          <button
                            onClick={() => handleDispenseFromRx(rx)}
                            disabled={noStock}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border
                              ${noStock
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 hover:text-sky-700'
                              }`}
                          >
                            {noStock ? 'No Stock' : 'Dispense →'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pendingRx.length > 0 && (
              <div className={tablePaginationCls}>
                <span>
                  <span className="text-slate-900 font-bold">{pendingRx.length}</span> prescription{pendingRx.length !== 1 ? 's' : ''} awaiting dispense
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Dispense History Tab ─────────────────────────────────────────── */}
        {tab === 'dispense' && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                placeholder="Enter Patient ID"
                value={historyPatientId}
                onChange={e => setHistoryPatientId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadHistory()}
                className={`${inputCls} w-52`}
              />
              <button onClick={loadHistory} className={btnSecondary}>
                {historyLoading ? 'Loading...' : 'Load History'}
              </button>
            </div>
            <div className={cardCls}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className={tableHeadRowCls}>
                      {['Dispense ID', 'Rx ID', 'Patient ID', 'Medication', 'Dispensed Qty', 'Unit Cost', 'Total Cost', 'Dispensed At', 'Balance Stock', 'Status'].map(h => (
                        <th key={h} className={tableThCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={tableBodyCls}>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <InboxIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">No dispense records.</p>
                            <p className="text-xs text-slate-400">Enter a Patient ID and click Load History.</p>
                          </div>
                        </td>
                      </tr>
                    ) : records.map(r => {
                      const bal  = r.remainingStock;
                      const unit = r.unit || '';
                      const balColor = bal === null ? 'text-slate-400'
                        : bal === 0  ? 'text-rose-600'
                        : bal <= LOW_STOCK_THRESHOLD ? 'text-amber-600'
                        : 'text-emerald-600';
                      const balIcon = bal === null ? 'text-slate-300'
                        : bal === 0  ? 'text-rose-400'
                        : bal <= LOW_STOCK_THRESHOLD ? 'text-amber-400'
                        : 'text-emerald-400';
                      return (
                        <tr key={r.dispenseId} className={tableRowCls}>
                          <td className={`${tableTdCls} font-semibold text-slate-900`}>#{r.dispenseId}</td>
                          <td className={`${tableTdCls} text-slate-600`}>{r.rxId ? `#${r.rxId}` : '—'}</td>
                          <td className={`${tableTdCls} text-slate-600`}>{r.patientId}</td>
                          <td className={`${tableTdCls} font-semibold text-slate-800`}>{r.medicationName}</td>
                          <td className={`${tableTdCls} text-slate-700 font-semibold`}>
                            {r.quantity} {unit}
                          </td>
                          {/* Unit Cost */}
                          <td className={`${tableTdCls} text-slate-600`}>
                            {r.unitCost != null ? `₹${Number(r.unitCost).toFixed(2)}` : '—'}
                          </td>
                          {/* Total Cost — highlighted */}
                          <td className={tableTdCls}>
                            {r.totalCost != null ? (
                              <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-xs">
                                ₹{Number(r.totalCost).toFixed(2)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className={`${tableTdCls} text-slate-500 text-xs`}>
                            {r.dispensedAt ? new Date(r.dispensedAt).toLocaleString() : '—'}
                          </td>
                          {/* Balance — snapshot of stock remaining after THIS dispense */}
                          <td className={tableTdCls}>
                            {bal !== null && bal !== undefined ? (
                              <div className="flex items-center gap-1.5">
                                <Package className={`w-3.5 h-3.5 ${balIcon}`} />
                                <span className={`font-bold ${balColor}`}>
                                  {bal} {unit}
                                </span>
                                {bal === 0 && (
                                  <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">OUT</span>
                                )}
                                {bal > 0 && bal <= LOW_STOCK_THRESHOLD && (
                                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">LOW</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className={tableTdCls}>
                            <span className={`${badgeCls} border ${statusBg(r.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot(r.status)}`} />
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Add Inventory ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className={modalOverlayCls}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add / Restock Inventory</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Same Med ID automatically restocks the existing item.
                </p>
              </div>
              <button onClick={closeAddModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddInventory}>
              <div className={`${modalBodyCls} max-h-[70vh] overflow-y-auto`}>
                {inventoryError && (
                  <div className={errorBannerCls}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {inventoryError}
                  </div>
                )}
                {/* Hidden datalists for autocomplete */}
                <datalist id="locationList">
                  {locationSuggestions.map(l => <option key={l} value={l} />)}
                </datalist>
                <datalist id="batchList">
                  {batchSuggestions.map(b => <option key={b} value={b} />)}
                </datalist>

                <div className="grid grid-cols-2 gap-4">

                  {/* Med ID — with restock indicator */}
                  <div>
                    <label className={labelCls}>Med ID *</label>
                    <input required type="number" placeholder="e.g. 1" value={inventoryForm.medId}
                      onChange={e => setInventoryForm({ ...inventoryForm, medId: e.target.value })}
                      className={inputCls} />
                    {/* show existing stock hint when medId matches */}
                    {inventoryForm.medId && (() => {
                      const match = inventory.find(
                        i => i.medId === Number(inventoryForm.medId) &&
                             (i.status === 'ACTIVE' || i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK')
                      );
                      return match ? (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <RefreshCw className="w-3 h-3" />
                          Restock mode — {match.medicationName} has {match.quantity} {match.unit} in stock. New quantity will be ADDED.
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Medication Name */}
                  <div>
                    <label className={labelCls}>Medication Name *</label>
                    <input required placeholder="e.g. Paracetamol 500mg" value={inventoryForm.medicationName}
                      onChange={e => setInventoryForm({ ...inventoryForm, medicationName: e.target.value })}
                      className={inputCls} />
                  </div>

                  {/* Batch Number — combobox with existing batches + auto-generate */}
                  <div className="col-span-2">
                    <Combobox
                      label="Batch Number"
                      value={inventoryForm.batchNumber}
                      onChange={v => setInventoryForm({ ...inventoryForm, batchNumber: v })}
                      options={existingBatches.length > 0 ? existingBatches : []}
                      placeholder="e.g. BATCH-PCT-001"
                      extra={
                        <button
                          type="button"
                          onClick={() => setInventoryForm({
                            ...inventoryForm,
                            batchNumber: generateBatchNumber(inventoryForm.medicationName),
                          })}
                          className="text-[10px] text-sky-600 font-semibold hover:text-sky-800 underline underline-offset-2"
                        >
                          Auto-generate
                        </button>
                      }
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className={labelCls}>Quantity *</label>
                    <input
                      required type="number" placeholder="e.g. 100"
                      value={inventoryForm.quantity}
                      onChange={e => setInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Unit — dropdown */}
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select value={inventoryForm.unit}
                      onChange={e => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                      className={selectCls}>
                      <option value="">Select unit…</option>
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input
                      type="date"
                      value={inventoryForm.expiryDate}
                      onChange={e => setInventoryForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className={labelCls}>Cost Price (₹)</label>
                    <input type="number" step="0.01" placeholder="e.g. 10.50" value={inventoryForm.costPrice}
                      onChange={e => setInventoryForm({ ...inventoryForm, costPrice: e.target.value })}
                      className={inputCls} />
                  </div>

                  {/* Location — combobox showing free shelves */}
                  <div className="col-span-2">
                    <Combobox
                      label="Location"
                      value={inventoryForm.location}
                      onChange={v => setInventoryForm({ ...inventoryForm, location: v })}
                      options={locationOptions}
                      placeholder="Select or type a location…"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {locationOptions.filter(l => !l.disabled).length} free shelf{locationOptions.filter(l => !l.disabled).length !== 1 ? 's' : ''} available ·{' '}
                      <span className="text-slate-500">Greyed-out shelves are already occupied.</span>
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <label className={labelCls}>Status (auto-set from quantity)</label>
                    <select
                      value={inventoryForm.status}
                      onChange={e => setInventoryForm(prev => ({ ...prev, status: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LOW_STOCK">LOW_STOCK</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      Status is overridden by quantity on save (unless EXPIRED).
                    </p>
                  </div>
                </div>
              </div>
              <div className={modalFooterCls}>
                <button type="button" onClick={closeAddModal} className={btnCancel}>Cancel</button>
                <button type="submit" className={btnSubmit}>Add / Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Inventory ───────────────────────────────────────────── */}
      {showEditModal && (
        <div className={modalOverlayCls}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Inventory Item</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update any field including the Med ID. Status is auto-derived from quantity unless set to EXPIRED.
                </p>
              </div>
              <button onClick={closeEditModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditInventory}>
              <div className={`${modalBodyCls} max-h-[70vh] overflow-y-auto`}>
                {editError && (
                  <div className={errorBannerCls}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {editError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">

                  {/* Med ID */}
                  <div>
                    <label className={labelCls}>Med ID *</label>
                    <input
                      required type="number" placeholder="e.g. 1"
                      value={editForm.medId}
                      onChange={e => setEditForm(f => ({ ...f, medId: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Medication Name */}
                  <div>
                    <label className={labelCls}>Medication Name *</label>
                    <input
                      required placeholder="e.g. Paracetamol 500mg"
                      value={editForm.medicationName}
                      onChange={e => setEditForm(f => ({ ...f, medicationName: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Batch Number */}
                  <div className="col-span-2">
                    <label className={labelCls}>Batch Number</label>
                    <input
                      placeholder="e.g. BATCH-PCT-001"
                      value={editForm.batchNumber}
                      onChange={e => setEditForm(f => ({ ...f, batchNumber: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className={labelCls}>Quantity *</label>
                    <input
                      required type="number" placeholder="e.g. 100"
                      value={editForm.quantity}
                      onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select
                      value={editForm.unit}
                      onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select unit…</option>
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input
                      type="date"
                      value={editForm.expiryDate}
                      onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className={labelCls}>Cost Price (₹)</label>
                    <input
                      type="number" step="0.01" placeholder="e.g. 10.50"
                      value={editForm.costPrice}
                      onChange={e => setEditForm(f => ({ ...f, costPrice: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Location */}
                  <div className="col-span-2">
                    <Combobox
                      label="Location"
                      value={editForm.location}
                      onChange={v => setEditForm(f => ({ ...f, location: v }))}
                      options={locationOptions}
                      placeholder="Select or type a location…"
                    />
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <label className={labelCls}>Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LOW_STOCK">LOW_STOCK</option>
                      <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      Status is overridden by quantity on save (unless EXPIRED).
                    </p>
                  </div>
                </div>
              </div>
              <div className={modalFooterCls}>
                <button type="button" onClick={closeEditModal} className={btnCancel}>Cancel</button>
                <button type="submit" className={btnSubmit}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Dispense ─────────────────────────────────────────────────── */}
      {showDispenseModal && (
        <div className={modalOverlayCls}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden">
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Dispense Medication</h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a medication and fill in the dispense details.</p>
              </div>
              <button onClick={closeDispenseModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDispense}>
              <div className={`${modalBodyCls} max-h-[70vh] overflow-y-auto`}>
                {dispenseError && (
                  <div className={errorBannerCls}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {dispenseError}
                  </div>
                )}

                {/* Stock warning banner */}
                {stockWarning && (
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold mb-2 ${
                    stockWarning.level === 'error'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {stockWarning.msg}
                  </div>
                )}

                {/* Selected item quick-info */}
                {selectedInventoryItem && !stockWarning && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-700 font-medium mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {selectedInventoryItem.medicationName} — {selectedInventoryItem.quantity} {selectedInventoryItem.unit || 'units'} in stock
                    {selectedInventoryItem.costPrice != null && ` · ₹${selectedInventoryItem.costPrice} / unit`}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">

                  {/* Inventory searchable selector */}
                  <InventorySelector
                    inventory={inventory}
                    selectedId={dispenseForm.inventoryId}
                    onSelect={item => {
                      setSelectedDispenseItem(item);
                      setDispenseForm(f => ({
                        ...f,
                        inventoryId: item ? String(item.inventoryId) : '',
                        quantity: '',
                      }));
                    }}
                  />

                  {/* Stock warning / balance preview */}
                  <StockWarning item={selectedDispenseItem ?? undefined} quantity={dispenseForm.quantity} />

                  {/* Rx ID */}
                  <div>
                    <label className={labelCls}>Prescription ID (Rx ID)</label>
                    <input
                      type="number" placeholder="Optional"
                      value={dispenseForm.rxId}
                      onChange={e => setDispenseForm(prev => ({ ...prev, rxId: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Patient ID */}
                  <div>
                    <label className={labelCls}>Patient ID *</label>
                    <input
                      required type="number" placeholder="e.g. 1"
                      value={dispenseForm.patientId}
                      onChange={e => setDispenseForm(prev => ({ ...prev, patientId: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Dispensed By */}
                  <div>
                    <label className={labelCls}>Dispensed By (User ID)</label>
                    <input
                      type="number" placeholder="Optional"
                      value={dispenseForm.dispensedBy}
                      onChange={e => setDispenseForm(prev => ({ ...prev, dispensedBy: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Quantity with max guard */}
                  <div>
                    <label className={labelCls}>
                      Quantity *
                      {selectedDispenseItem && (
                        <span className="ml-1 font-normal text-slate-400">
                          (max {selectedDispenseItem.quantity})
                        </span>
                      )}
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 10"
                      min={1}
                      max={selectedDispenseItem?.quantity ?? undefined}
                      value={dispenseForm.quantity}
                      onChange={e => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input placeholder="Optional notes" value={dispenseForm.notes}
                      onChange={e => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
              </div>
              <div className={modalFooterCls}>
                <button type="button" onClick={closeDispenseModal} className={btnCancel}>Cancel</button>
                <button
                  type="submit"
                  disabled={!!selectedDispenseItem && selectedDispenseItem.quantity === 0}
                  className={btnSubmit}
                >
                  Dispense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
