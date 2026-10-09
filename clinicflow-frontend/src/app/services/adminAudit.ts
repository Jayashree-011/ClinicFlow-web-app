/**
 * adminAudit.ts — Session-local admin action log.
 *
 * Actions are written to localStorage (max 50 entries) by any admin component
 * that calls logAdminAction(). The Dashboard reads them to render a
 * "Recent Admin Actions" panel.
 */

const STORAGE_KEY = 'clinicflow_admin_audit';
const MAX_ENTRIES = 50;

export interface AuditEntry {
  id:     string;   // random short id
  at:     string;   // ISO-8601 timestamp
  actor:  string;   // username cookie, or 'admin'
  action: string;   // human-readable description
}

function getActor(): string {
  const m = document.cookie.match(/(?:^|;\s*)username=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : 'admin';
}

/** Prepend a new entry to the log. Safe to call from any component. */
export function logAdminAction(action: string): void {
  try {
    const existing: AuditEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    const entry: AuditEntry = {
      id:    Math.random().toString(36).slice(2, 9),
      at:    new Date().toISOString(),
      actor: getActor(),
      action,
    };
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently
  }
}

/** Read the most recent `limit` entries (default 10). */
export function getAuditLog(limit = 10): AuditEntry[] {
  try {
    const raw: AuditEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    return raw.slice(0, limit);
  } catch {
    return [];
  }
}

/** Wipe the stored log (useful for testing). */
export function clearAuditLog(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
