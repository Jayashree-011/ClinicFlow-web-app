// ─── Domain types & form defaults ────────────────────────────────────────────

export interface Prescription {
  rxId: number;
  encounterId: number | null;
  patientId: number;
  doctorId: number | null;
  medId: number | null;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  quantity: number | null;
  repeats: number | null;
  route: string;
  notes: string;
  status: string;
  issuedAt: string | null;
}

export interface InventoryMed {
  inventoryId: number;
  medId: number;
  medicationName: string;
  quantity: number;
  unit: string;
  status: string;
}

export const emptyForm = {
  patientId: '', doctorId: '', encounterId: '',
  medId: '', medicationName: '', dosage: '', frequency: '',
  durationDays: '', quantity: '', repeats: '',
  route: '', notes: '',
};

export type PrescriptionForm = typeof emptyForm;
