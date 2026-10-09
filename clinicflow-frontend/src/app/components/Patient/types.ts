// ─── Shared types for the Patient Dashboard ──────────────────────────────────

export interface PatientInfo {
  id: number;
  name: string;
  mrn: string;
  dob: string;
  gender: string;
  email: string;
  phoneNumber: string;
  address: string;
  condition: string;
  status: string;
}

export interface Appointment {
  appointmentId: number;
  clinicianId: number;
  department: string;
  serviceType: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface Invoice {
  invoiceId: number;
  patientId: number;
  encounterId: number;
  subtotal: number;
  taxes: number;
  discounts: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  issuedAt: string;
}

export interface Payment {
  paymentId: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  status: string;
}

export interface Encounter {
  encounterId: number;
  chiefComplaint: string;
  visitType: string;
  startAt: string;
  endAt: string | null;
  status: string;
  notes?: any;
  doctorId?: number;
}

export interface PatientPrescription {
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

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  dob: string;
  gender: string;
  email: string;
  phoneNumber: string;
  mrn: string;
  status: string;
}

export interface LabOrder {
  labOrderId: number;
  encounterId: number;
  patientId: number;
  orderedBy: number;
  testsJson: string;
  sampleId: string;
  collectedAt: string;
  status: string;
  resultUri: string;
}

export interface LabResult {
  resultId: number;
  labOrderId: number;
  testCode: string;
  resultValue: string;
  units: string;
  referenceRangeJson: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  reportedAt: string;
  reportedBy: number;
}

export type ActiveTab =
  | 'overview' | 'appointments' | 'records'
  | 'billing'  | 'lab'          | 'family'
  | 'settings' | 'help';

export type SettingsSubTab = 'profile' | 'account' | 'security';
