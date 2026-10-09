import axiosInstance, { handleResponse } from './client';

export async function getPatientEncounters(patientId: number) {
  const res = await axiosInstance.get(`/encounter/patient/${patientId}`);
  return handleResponse(res);
}

export async function createEncounter(payload: any) {
  // Controller returns 201 Created, so return data directly instead of going
  // through handleResponse (which throws on any non-200 status).
  const res = await axiosInstance.post('/encounter', payload);
  return res.data;
}
