import axiosInstance from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DoctorView {
  id:            number;
  name:          string;
  specialty:     string;
  qualification: string | null;
  email:         string | null;
  phone:         string | null;
  status:        string | null;   // "Active" | "On Call" | "Off Duty"
}

export interface RegisterDoctorPayload {
  name:          string;
  specialty:     string;
  qualification?: string;
  email?:        string;
  phone?:        string;
  status?:       string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getDoctors(): Promise<DoctorView[]> {
  const { data } = await axiosInstance.get('/consultation/doctor/list');
  return data as DoctorView[];
}

export async function registerDoctor(
  userId: number,
  payload: RegisterDoctorPayload,
  provisionUser = true,
): Promise<DoctorView> {
  const { data } = await axiosInstance.post(
    `/consultation/doctor/${userId}/register?provisionUser=${provisionUser}`,
    payload,
  );
  return data as DoctorView;
}

export async function updateDoctorById(
  doctorId: number,
  payload: RegisterDoctorPayload,
): Promise<DoctorView> {
  const { data } = await axiosInstance.put(
    `/consultation/doctor/${doctorId}/update`,
    payload,
  );
  return data as DoctorView;
}

export async function deleteDoctorById(doctorId: number): Promise<void> {
  await axiosInstance.delete(`/consultation/doctor/${doctorId}`);
}
