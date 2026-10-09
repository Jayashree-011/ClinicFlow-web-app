import axiosInstance, { handleResponse } from './client';
import { Patient } from '../components/CentralDashboard';

export async function getPatients(): Promise<Patient[]> {
  const res = await axiosInstance.get('/consultation/patient/patients');
  console.log("Raw Patients Response:", res.data);
  return res.data.map((p: any): Patient => ({
    id: p.id,
    name: p.name,
    dob: p.dob,
    gender: p.gender,
    phone: p.phoneNumber,
    email: p.email,
    condition: p.condition,
    address: p.address,
    lastVisit: p.lastVisit || new Date().toISOString().split('T')[0],
  }));
}

export async function JsonToPatient(json: any): Promise<Patient> {
  return {
    id: json.id,
    name: json.name,
    dob: json.dob,
    gender: json.gender,
    phone: json.phoneNumber,
    email: json.email,
    condition: json.condition,
    address: json.address,
    lastVisit: json.lastVisit || new Date().toISOString().split('T')[0],
  };
}

export async function createPatient(payload: any) {
  const res = await axiosInstance.post('/consultation/patient/register', payload);
  return handleResponse(res);
}

export async function updatePatient(id: number, payload: any) {
  const res = await axiosInstance.put(`/consultation/patient/${id}`, payload);
  return handleResponse(res);
}

export async function deletePatient(id: number) {
  const res = await axiosInstance.delete(`/consultation/patient/${id}`);
  return handleResponse(res);
}

export async function getPatientById(id: number): Promise<Patient | null> {
  try {
    const res = await axiosInstance.get(`/consultation/patient/${id}`);
    const p = res.data;
    return {
      id: p.id,
      name: p.name,
      dob: p.dob,
      gender: p.gender,
      phone: p.phoneNumber,
      email: p.email,
      condition: p.condition,
      address: p.address,
      lastVisit: p.lastVisit || new Date().toISOString().split('T')[0],
    };
  } catch {
    return null;
  }
}
