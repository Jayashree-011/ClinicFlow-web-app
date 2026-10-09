import axiosInstance from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Cancelled';

/** Flattened view used exclusively by the frontend. */
export interface AppointmentView {
  id: number;
  patientId: number;
  patient: string;      // patientName
  doctorId: number;
  doctor: string;       // doctorName
  department: string;
  date: string;         // yyyy-MM-dd  (derived from startAt)
  time: string;         // HH:mm       (derived from startAt)
  type: string;         // serviceType
  status: AppointmentStatus;
}

export interface DoctorItem {
  id: number;
  name: string;
  specialty: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TO_FRONTEND_STATUS: Record<string, AppointmentStatus> = {
  PENDING:     'Pending',
  SCHEDULED:   'Pending',
  CONFIRMED:   'Confirmed',
  IN_PROGRESS: 'In Progress',
  CANCELLED:   'Cancelled',
};

const TO_BACKEND_STATUS: Record<string, string> = {
  Pending:      'PENDING',
  Confirmed:    'CONFIRMED',
  'In Progress':'IN_PROGRESS',
  Cancelled:    'CANCELLED',
};

/**
 * Parse a startAt value that may arrive as:
 *  - an ISO string  "2025-05-23T09:00:00"  (after @JsonFormat fix)
 *  - a number array [2025, 5, 23, 9, 0, 0]  (old Jackson default)
 */
function parseDateTime(value: unknown): Date | null {
  if (!value) return null;
  // Array form from unpatched Jackson: [year, month, day, hour, min, sec]
  if (Array.isArray(value) && value.length >= 3) {
    const [y, mo, d, h = 0, m = 0, s = 0] = value as number[];
    // Java months are 1-based; Date months are 0-based
    const dt = new Date(y, mo - 1, d, h, m, s);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value as string);
  return isNaN(dt.getTime()) ? null : dt;
}

function mapAppointment(a: any): AppointmentView {
  const dt = parseDateTime(a.startAt);
  return {
    id:         a.id,
    patientId:  a.patientId,
    patient:    a.patientName ?? '',
    doctorId:   a.doctorId,
    doctor:     a.doctorName ?? '',
    department: a.department ?? '',
    date:       dt ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}` : '',
    time:       dt
      ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
      : '',
    type:       a.serviceType ?? 'General Checkup',
    status:     TO_FRONTEND_STATUS[a.status?.toUpperCase()] ?? 'Pending',
  };
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getAppointments(): Promise<AppointmentView[]> {
  const { data } = await axiosInstance.get('/consultation/appointment/appointments');
  return (data as any[]).map(mapAppointment);
}

export async function getDoctors(): Promise<DoctorItem[]> {
  const { data } = await axiosInstance.get('/consultation/doctor/list');
  return data as DoctorItem[];
}

export interface BookPayload {
  doctorId: number;
  department: string;
  serviceType: string;
  startAt: string;   // ISO 8601 datetime, e.g. "2025-03-10T09:00:00"
  endAt: string;
}

export async function bookAppointment(
  patientId: number,
  payload: BookPayload,
): Promise<AppointmentView> {
  const { data } = await axiosInstance.post(
    `/consultation/patient/${patientId}/appointments`,
    { ...payload, status: 'PENDING' },
  );
  return mapAppointment(data);
}

export async function patchAppointmentStatus(
  appointmentId: number,
  status: AppointmentStatus,
): Promise<void> {
  await axiosInstance.patch(
    `/consultation/appointment/appointments/${appointmentId}/status`,
    { status: TO_BACKEND_STATUS[status] ?? status.toUpperCase() },
  );
}

export async function deleteAppointmentById(appointmentId: number): Promise<void> {
  await axiosInstance.delete(`/consultation/appointment/appointments/${appointmentId}`);
}
