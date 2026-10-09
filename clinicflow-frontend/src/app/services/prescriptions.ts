import axiosInstance from './client';

export async function createPrescription(dto: any) {
  const res = await axiosInstance.post('/prescriptions', dto);
  return res.data;
}

export async function getPrescriptionById(id: number) {
  const res = await axiosInstance.get(`/prescriptions/${id}`);
  return res.data;
}

export async function getPrescriptionsByPatient(patientId: number) {
  const res = await axiosInstance.get(`/prescriptions/patient/${patientId}`);
  return res.data;
}

export async function issuePrescription(id: number) {
  const res = await axiosInstance.put(`/prescriptions/${id}/issue`);
  return res.data;
}

export async function cancelPrescription(id: number) {
  const res = await axiosInstance.delete(`/prescriptions/${id}`);
  return res.data;
}

export async function getPrescriptionsByEncounter(encounterId: number) {
  const res = await axiosInstance.get(`/prescriptions/encounter/${encounterId}`);
  return res.data;
}

export async function getIssuedPrescriptions() {
  const res = await axiosInstance.get('/prescriptions/issued');
  return res.data;
}

export async function dispensePrescription(id: number) {
  const res = await axiosInstance.put(`/prescriptions/${id}/dispense`);
  return res.data;
}

/** Permanently removes a prescription row from the database */
export async function hardDeletePrescription(id: number) {
  await axiosInstance.delete(`/prescriptions/${id}/hard`);
}

