import type { AlertLevel } from './types';
import { VITAL_THRESHOLDS } from './constants';

export function fmt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

export function getVitalAlert(key: string, value: string): { level: AlertLevel; msg: string } | null {
  if (!value) return null;
  const t = VITAL_THRESHOLDS[key];
  if (!t) return null;
  const n = Number(value);
  if (isNaN(n)) return null;
  if (t.criticalMax !== undefined && n >= t.criticalMax)
    return { level: 'critical', msg: `Critical high ≥ ${t.criticalMax} ${t.unit}` };
  if (t.criticalMin !== undefined && n <= t.criticalMin)
    return { level: 'critical', msg: `Critical low ≤ ${t.criticalMin} ${t.unit}` };
  if (t.max !== undefined && n > t.max)
    return { level: 'warning', msg: `Above normal (> ${t.max} ${t.unit})` };
  if (t.min !== undefined && n < t.min)
    return { level: 'warning', msg: `Below normal (< ${t.min} ${t.unit})` };
  return null;
}
