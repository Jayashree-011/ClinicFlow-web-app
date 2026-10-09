import React, { useState, useEffect, useRef } from 'react';
import {
  createPrescription, getPrescriptionsByPatient, getPrescriptionsByEncounter,
  issuePrescription, cancelPrescription, getIssuedPrescriptions,
  hardDeletePrescription,
  getInventory, getPatients,
} from '../../services/api';
import { emptyForm } from './types';
import { PrescriptionTable } from './PrescriptionTable';
import { CreateModal } from './CreateModal';
import { ViewModal } from './ViewModal';
import type { Prescription, InventoryMed, PrescriptionForm } from './types';

// ─── PrescriptionModule ───────────────────────────────────────────────────────
// Owns all state and async handlers.
// Renders PrescriptionTable + CreateModal + ViewModal.

export function PrescriptionModule({
  prefillEncounterId,
  prefillPatientId,
  prefillDoctorId,
  autoOpenCreate = false,
  clearPrefill,
}: {
  prefillEncounterId?: number | null;
  prefillPatientId?: number | null;
  prefillDoctorId?: number | null;
  autoOpenCreate?: boolean;
  clearPrefill?: () => void;
} = {}) {
  // ── State ──────────────────────────────────────────────────────────────────

  const [prescriptions,       setPrescriptions]       = useState<Prescription[]>([]);
  const [searchMode,          setSearchMode]          = useState<'patient' | 'encounter' | 'drug'>('patient');
  const [searchValue,         setSearchValue]         = useState('');
  const [searchedPatientName, setSearchedPatientName] = useState('');
  const [showCreate,          setShowCreate]          = useState(false);
  const [viewRx,              setViewRx]              = useState<Prescription | null>(null);
  const [viewPatientName,     setViewPatientName]     = useState('');
  const [createError,         setCreateError]         = useState('');
  const [searchError,         setSearchError]         = useState('');
  const [form,                setForm]                = useState<PrescriptionForm>(emptyForm);
  const [loading,             setLoading]             = useState(false);
  const [searchLoading,       setSearchLoading]       = useState(false);
  const [inventory,           setInventory]           = useState<InventoryMed[]>([]);
  const [patientNames,        setPatientNames]        = useState<Record<number, string>>({});

  const hasPrefill      = useRef(!!prefillEncounterId);
  const [localEncounterId, setLocalEncounterId] = useState<number | null>(prefillEncounterId ?? null);
  const [localPatientId,   setLocalPatientId]   = useState<number | null>(prefillPatientId   ?? null);
  const [localDoctorId,    setLocalDoctorId]    = useState<number | null>(prefillDoctorId    ?? null);
  const [patientConditions, setPatientConditions] = useState<Record<number, string>>({});

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Pharmacy inventory for the medication combobox
    getInventory()
      .then((data: InventoryMed[]) =>
        setInventory(data.filter(m => m.status !== 'REMOVED' && m.status !== 'EXPIRED'))
      )
      .catch(() => {});

    // Patient id → name map + condition map for inline display
    getPatients()
      .then((patients: any[]) => {
        const nameMap: Record<number, string> = {};
        const condMap: Record<number, string> = {};
        patients.forEach(p => {
          nameMap[p.id] = p.name;
          if (p.condition) condMap[p.id] = p.condition;
        });
        setPatientNames(nameMap);
        setPatientConditions(condMap);
      })
      .catch(() => {});

    // Default view: all issued prescriptions (skip when opened via encounter prefill)
    if (hasPrefill.current) return;
    (async () => {
      setSearchLoading(true);
      try {
        const data = await getIssuedPrescriptions();
        setPrescriptions(data ?? []);
      } catch {
        // leave table empty — user can search
      } finally {
        setSearchLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-search + open create modal when navigated from a signed encounter
  useEffect(() => {
    if (!prefillEncounterId) return;
    setSearchError('');
    setLocalEncounterId(prefillEncounterId);
    setLocalPatientId(prefillPatientId ?? null);
    setLocalDoctorId(prefillDoctorId ?? null);
    setSearchMode('encounter');
    setSearchValue(String(prefillEncounterId));
    setForm({
      ...emptyForm,
      encounterId: String(prefillEncounterId),
      patientId:   prefillPatientId ? String(prefillPatientId) : '',
      doctorId:    prefillDoctorId  ? String(prefillDoctorId)  : '',
    });
    if (autoOpenCreate) setShowCreate(true);
    (async () => {
      setSearchLoading(true);
      try {
        const data = await getPrescriptionsByEncounter(prefillEncounterId);
        setPrescriptions(data ?? []);
      } catch {
        setSearchError(`Could not load prescriptions for encounter #${prefillEncounterId}. Try the Search button.`);
      } finally {
        setSearchLoading(false);
      }
    })();
    clearPrefill?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEncounterId]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getPatientName = (patientId: number) => patientNames[patientId] || '';

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchValue) return;
    setSearchError('');
    setSearchLoading(true);
    setSearchedPatientName('');
    try {
      if (searchMode === 'drug') {
        const all = await getIssuedPrescriptions();
        const q = searchValue.toLowerCase().trim();
        const filtered = (all ?? []).filter((rx: Prescription) =>
          rx.medicationName?.toLowerCase().includes(q)
        );
        setPrescriptions(filtered);
        if (filtered.length === 0) {
          setSearchError(`No issued prescriptions found for drug "${searchValue}".`);
        }
      } else {
        const data = searchMode === 'patient'
          ? await getPrescriptionsByPatient(Number(searchValue))
          : await getPrescriptionsByEncounter(Number(searchValue));
        setPrescriptions(data ?? []);
        if (searchMode === 'patient') {
          setSearchedPatientName(getPatientName(Number(searchValue)));
        }
      }
    } catch {
      setSearchError(
        searchMode === 'drug'
          ? 'Failed to load prescriptions for drug search.'
          : `Failed to load prescriptions for this ${searchMode === 'patient' ? 'patient' : 'encounter'}.`
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const switchMode = (mode: 'patient' | 'encounter' | 'drug') => {
    setSearchMode(mode);
    setSearchValue('');
    setPrescriptions([]);
    setSearchedPatientName('');
    setSearchError('');
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      encounterId: localEncounterId ? String(localEncounterId) : '',
      patientId:   localPatientId   ? String(localPatientId)   : '',
      doctorId:    localDoctorId    ? String(localDoctorId)    : '',
    });
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError('');
    setForm(emptyForm);
  };

  const openView = (rx: Prescription) => {
    setViewRx(rx);
    setViewPatientName(getPatientName(rx.patientId));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setLoading(true);
    try {
      const created = await createPrescription({
        patientId:      Number(form.patientId),
        doctorId:       form.doctorId     ? Number(form.doctorId)     : null,
        encounterId:    form.encounterId  ? Number(form.encounterId)  : null,
        medId:          form.medId        ? Number(form.medId)        : null,
        medicationName: form.medicationName || null,
        dosage:         form.dosage        || null,
        frequency:      form.frequency     || null,
        durationDays:   form.durationDays  ? Number(form.durationDays)  : null,
        quantity:       form.quantity      ? Number(form.quantity)      : null,
        repeats:        form.repeats       ? Number(form.repeats)       : null,
        route:          form.route         || null,
        notes:          form.notes         || null,
      });
      setPrescriptions(prev => [created, ...prev]);
      closeCreate();
      // Auto-open the new prescription for review
      setViewRx(created);
      setViewPatientName(getPatientName(Number(form.patientId)));
    } catch (e: any) {
      const d = e?.response?.data;
      setCreateError(d?.message || d?.detail || d?.error || `Error ${e?.response?.status || ''}: Failed to create prescription.`);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (rxId: number) => {
    try {
      const updated = await issuePrescription(rxId);
      setPrescriptions(prev => prev.map(p => p.rxId === rxId ? updated : p));
      if (viewRx?.rxId === rxId) setViewRx(updated);
    } catch {
      alert('Failed to issue prescription.');
    }
  };

  const handleCancel = async (rxId: number) => {
    if (!confirm('Cancel this prescription?')) return;
    try {
      const updated = await cancelPrescription(rxId);
      setPrescriptions(prev => prev.map(p => p.rxId === rxId ? updated : p));
      if (viewRx?.rxId === rxId) setViewRx(updated);
    } catch {
      alert('Failed to cancel prescription.');
    }
  };

  const handleDelete = async (rxId: number) => {
    if (!confirm(`Permanently delete prescription #${rxId}? This cannot be undone.`)) return;
    try {
      await hardDeletePrescription(rxId);
      setPrescriptions(prev => prev.filter(p => p.rxId !== rxId));
      if (viewRx?.rxId === rxId) setViewRx(null);
    } catch {
      alert('Failed to delete prescription.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PrescriptionTable
        prescriptions={prescriptions}
        searchMode={searchMode}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchedPatientName={searchedPatientName}
        searchLoading={searchLoading}
        searchError={searchError}
        onClearSearchError={() => setSearchError('')}
        onSearch={handleSearch}
        onSwitchMode={switchMode}
        onOpenCreate={openCreate}
        getPatientName={getPatientName}
        onView={openView}
        onIssue={handleIssue}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      <CreateModal
        show={showCreate}
        onClose={closeCreate}
        onSubmit={handleCreate}
        form={form}
        setForm={setForm}
        loading={loading}
        error={createError}
        inventory={inventory}
        patientNames={patientNames}
        patientConditions={patientConditions}
      />

      <ViewModal
        rx={viewRx}
        onClose={() => setViewRx(null)}
        patientName={viewPatientName}
        prescriptions={prescriptions}
        getPatientName={getPatientName}
        onIssue={handleIssue}
        onCancel={handleCancel}
        onViewOther={rx => {
          setViewRx(rx);
          setViewPatientName(getPatientName(rx.patientId));
        }}
      />
    </>
  );
}
