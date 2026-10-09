import axiosInstance, { handleResponse } from './client';

export async function suggestUsername(baseName: string): Promise<string> {
  const res = await axiosInstance.get(`/auth/suggestUsername/${encodeURIComponent(baseName)}`);
  return handleResponse(res);
}

export async function registerUser(data: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
}): Promise<string> {
  const res = await axiosInstance.post('/auth/register', data);
  return handleResponse(res);
}

export async function fetchUserProfile() {
  const res = await axiosInstance.get('/auth/user/me');
  return handleResponse(res);
}

export async function saveUserProfile(data: {
  username:          string;
  password:          string;
  fullName:          string;
  email:             string;
  phone:             string;
  role:              string;
  oldPassword:       string;
  clinicName?:       string;
  address?:          string;
  city?:             string;
  notifEmailAlerts?:  boolean;
  notifAppointments?: boolean;
  notifBilling?:      boolean;
}) {
  const res = await axiosInstance.put('/auth/update', data);
  return handleResponse(res);
}

export async function getUsers(): Promise<SystemUser[]> {
  const res = await axiosInstance.get('/auth/user');
  return handleResponse(res);
}

/**
 * Admin-only password reset. Requires a dedicated backend endpoint:
 *   POST /api/auth/user/{id}/reset-password  { newPassword: string }
 */
export async function adminResetPassword(userId: number, newPassword: string): Promise<void> {
  const res = await axiosInstance.post(`/auth/user/${userId}/reset-password`, { newPassword });
  return handleResponse(res);
}

export async function adminUpdateUser(
  id: number,
  data: {
    fullName?:          string;
    email?:             string;
    phone?:             string;
    role?:              string;
    status?:            string;
    clinicName?:        string;
    address?:           string;
    city?:              string;
    notifEmailAlerts?:  boolean;
    notifAppointments?: boolean;
    notifBilling?:      boolean;
  },
): Promise<SystemUser> {
  const res = await axiosInstance.put(`/auth/user/${id}`, data);
  return handleResponse(res);
}

export interface SystemUser {
  userId:   number;
  username: string;
  fullName: string;
  email:    string;
  phone:    string | null;
  role:     string;
  status:   string;
  createdAt:    string;
  updatedAt:    string;
  lastLoginAt?: string | null;
  // Profile extras — null when the user has never saved them
  clinicName:        string | null;
  address:           string | null;
  city:              string | null;
  notifEmailAlerts:  boolean | null;
  notifAppointments: boolean | null;
  notifBilling:      boolean | null;
}
