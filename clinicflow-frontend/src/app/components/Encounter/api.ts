import axiosInstance from '../../services/api';
import type { EncounterDTO, EncounterCreateRequest, EncounterStatus, ProblemDTO, ProblemCreateRequest } from './types';

const BASE = '/encounter';

export const api = {
  create: (body: EncounterCreateRequest) =>
    axiosInstance.post<EncounterDTO>(BASE, body).then(r => r.data),
  getByPatient: (patientId: number) =>
    axiosInstance.get<EncounterDTO[]>(`${BASE}/patient/${patientId}`).then(r => r.data),
  getByDoctorStatus: (doctorId: number, status: EncounterStatus) =>
    axiosInstance.get<EncounterDTO[]>(`${BASE}/doctor/${doctorId}/status/${status}`).then(r => r.data),
  complete: (id: number) =>
    axiosInstance.post<EncounterDTO>(`${BASE}/${id}/complete`).then(r => r.data),
  sign: (id: number, doctorId: number) =>
    axiosInstance.post<EncounterDTO>(`${BASE}/${id}/sign`, null, { params: { doctorId } }).then(r => r.data),
  cancel: (id: number) =>
    axiosInstance.post<EncounterDTO>(`${BASE}/${id}/cancel`).then(r => r.data),
  addVitals: (id: number, vitals: Record<string, unknown>) =>
    axiosInstance.post<EncounterDTO>(`${BASE}/${id}/vitals`, vitals).then(r => r.data),
  addDiagnosis: (id: number, diagnosis: Record<string, unknown>) =>
    axiosInstance.post<EncounterDTO>(`${BASE}/${id}/diagnosis`, diagnosis).then(r => r.data),
  update: (id: number, dto: Partial<EncounterDTO>) =>
    axiosInstance.put<EncounterDTO>(`${BASE}/${id}`, dto).then(r => r.data),
};

export const problemApi = {
  getByEncounter: (encounterId: number) =>
    axiosInstance.get<ProblemDTO[]>(`/encounter/problem-list/encounter/${encounterId}`).then(r => r.data),
  create: (body: ProblemCreateRequest) =>
    axiosInstance.post<ProblemDTO>('/encounter/problem-list', body).then(r => r.data),
  update: (problemId: number, dto: ProblemDTO) =>
    axiosInstance.put<ProblemDTO>(`/encounter/problem-list/${problemId}`, dto).then(r => r.data),
  resolve: (problemId: number) =>
    axiosInstance.post<ProblemDTO>(`/encounter/problem-list/${problemId}/resolve`).then(r => r.data),
};
