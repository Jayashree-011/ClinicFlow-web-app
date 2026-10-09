/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/shared.ts
 * Shared types, cookie helpers and date utilities used by all Dashboard/* files.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ── Backend DTOs ── */

export interface BackendAppt {
  id?:          number;
  patientName?: string;
  patientId?:   number;
  doctorId?:    number;
  doctorName?:  string;
  startAt?:     any;
  department?:  string;
  status?:      string;
  serviceType?: string;
}

export interface BackendInvoice {
  invoiceId?:   number;
  id?:          number;
  patientId?:   number;
  totalAmount?: number;
  status?:      string;
  issuedAt?:    any;   // primary date field from billing-service
  createdAt?:   any;   // fallback alias
  issueDate?:   any;   // fallback alias
  dueDate?:     any;
}

export interface BackendPatient {
  id?:        number;
  name?:      string;
  gender?:    string;
  phone?:     string;
  email?:     string;
  condition?: string;
  dob?:       string;
}

/* ── Cookie helpers ── */

export function getRole(): string {
  const m = document.cookie.match(/(?:^|;\s*)role=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Returns true if the current user's role matches any of the supplied values. */
export function hasAnyRole(...roles: string[]): boolean {
  return roles.includes(getRole());
}

/* ── Date helpers ── */

export function parseStartAt(value: any): Date | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, mo, d, h = 0, m = 0, s = 0] = value as number[];
    const dt = new Date(y, mo - 1, d, h, m, s);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value as string);
  return isNaN(dt.getTime()) ? null : dt;
}

export function fmtDate(value: any): string {
  const dt = parseStartAt(value);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(value: any): string {
  const dt = parseStartAt(value);
  if (!dt) return '—';
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
