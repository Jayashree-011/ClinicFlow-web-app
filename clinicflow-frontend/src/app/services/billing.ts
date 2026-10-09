import axiosInstance from './client';
import type { Invoice, Payment, InvoiceStatus, PaymentMethod, PaymentStatus } from '../components/Billing/types';

export type { Invoice, Payment, InvoiceStatus, PaymentMethod, PaymentStatus };

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await axiosInstance.get('/billing/invoices');
  return data as Invoice[];
}

export async function backfillInvoiceNames(): Promise<void> {
  await axiosInstance.put('/billing/invoices/backfill-names');
}

export async function getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
  const { data } = await axiosInstance.get(`/billing/payments/invoice/${invoiceId}`);
  return data as Payment[];
}

export interface CreateInvoicePayload {
  patientId: number;
  encounterId?: number;
  amount: number;
  taxes: number;
  discounts: number;
  status: InvoiceStatus;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  const { data } = await axiosInstance.post('/billing/invoices', payload);
  return data as Invoice;
}

export async function deleteInvoice(id: number): Promise<void> {
  await axiosInstance.delete(`/billing/invoices/${id}`);
}

export async function downloadInvoicePdf(invoiceId: number): Promise<Blob> {
  const { data } = await axiosInstance.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  return data as Blob;
}

export interface CreatePaymentPayload {
  invoiceId: number;
  patientId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const { data } = await axiosInstance.post('/billing/payments', payload);
  return data as Payment;
}

export async function deletePayment(id: number): Promise<void> {
  await axiosInstance.delete(`/billing/payments/${id}`);
}
