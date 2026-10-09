import axiosInstance from './client';

export async function getInventory() {
  const res = await axiosInstance.get('/pharmacy/inventory');
  return res.data;
}

export async function addInventoryItem(dto: any) {
  const res = await axiosInstance.post('/pharmacy/inventory', dto);
  return res.data;
}

export async function updateInventoryItem(id: number, dto: any) {
  const res = await axiosInstance.put(`/pharmacy/inventory/${id}`, dto);
  return res.data;
}

export async function deleteInventoryItem(id: number) {
  const res = await axiosInstance.delete(`/pharmacy/inventory/${id}`);
  return res.data;
}

export async function dispenseMedication(dto: any) {
  const res = await axiosInstance.post('/pharmacy/dispense', dto);
  return res.data;
}

export async function getDispenseHistory(patientId: number) {
  const res = await axiosInstance.get(`/pharmacy/dispense/history/${patientId}`);
  return res.data;
}

export async function patchInventoryStatus(id: number, status: string) {
  const res = await axiosInstance.patch(`/pharmacy/inventory/${id}/status?status=${encodeURIComponent(status)}`);
  return res.data;
}

/** Permanently removes a single inventory row (bypasses soft-delete) */
export async function hardDeleteInventoryItem(id: number) {
  await axiosInstance.delete(`/pharmacy/inventory/${id}/hard`);
}

/** Permanently wipes every row with status=REMOVED; returns { purged, message } */
export async function purgeRemovedInventory(): Promise<{ purged: number; message: string }> {
  const res = await axiosInstance.delete('/pharmacy/inventory/purge-removed');
  return res.data;
}

