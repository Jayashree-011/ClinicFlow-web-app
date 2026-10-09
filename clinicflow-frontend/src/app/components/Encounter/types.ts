export type EncounterStatus = 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED' | 'CANCELLED';
export type ProblemStatus = 'ACTIVE' | 'INACTIVE' | 'RESOLVED';
export type AlertLevel = 'warning' | 'critical';

export interface EncounterDTO {
  encounterId: number;
  patientId: number;
  doctorId: number;
  visitType: string;
  chiefComplaint: string;
  vitals: Record<string, unknown> | null;
  notes: Record<string, unknown> | null;
  diagnoses: Record<string, unknown> | null;
  orders: Record<string, unknown> | null;
  prescriptions: Record<string, unknown> | null;
  startAt: string;
  endAt: string | null;
  status: EncounterStatus;
  signedBy: number | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EncounterCreateRequest {
  patientId: number;
  doctorId: number;
  visitType: string;
  chiefComplaint: string;
  vitals?: Record<string, unknown>;
  notes?: Record<string, unknown>;
  startAt: string;
}

export type Patient = { id: number; name: string; age?: number; gender?: string };

export interface ProblemDTO {
  problemId: number;
  patientId: number;
  encounterId: number;
  code: string;
  description: string | null;
  onsetDate: string | null;
  status: ProblemStatus;
  icdCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemCreateRequest {
  patientId: number;
  encounterId: number;
  code: string;
  description?: string;
  onsetDate?: string;
  icdCode?: string;
}

export interface VitalThreshold {
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
  unit: string;
}

export interface EncounterTemplate {
  id: string;
  name: string;
  visitType: string;
  chiefComplaint: string;
  soap: { subjective: string; objective: string; assessment: string; plan: string };
}
