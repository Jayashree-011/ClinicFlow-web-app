/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/AdminSection.tsx
 *
 * Visibility:
 *   ServiceHealthWidget  → Administrator only
 *   AdminAuditWidget     → Administrator, Auditor
 *   Whole section        → Administrator, Auditor (returns null otherwise)
 * ─────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import { getAuditLog, type AuditEntry } from '../../services/adminAudit';
import { hasAnyRole } from './shared';

/* ── Service health config ── */

const SERVICES = [
  { name: 'User Service',  path: '/api/auth/actuator/health'           },
  { name: 'Consultation',  path: '/api/consultation/actuator/health'   },
  { name: 'Billing',       path: '/api/billing/actuator/health'        },
  { name: 'Lab',           path: '/api/lab/actuator/health'            },
  { name: 'Pharmacy',      path: '/api/pharmacy/actuator/health'       },
  { name: 'Notification',  path: '/api/notification/actuator/health'   },
  { name: 'Encounter',     path: '/api/encounter/actuator/health'      },
];

type HealthStatus = 'UP' | 'DOWN' | 'checking';

/* ── ServiceHealthWidget ── */

function ServiceHealthWidget() {
  const [statuses, setStatuses] = useState<Record<string, HealthStatus>>(
    () => Object.fromEntries(SERVICES.map(s => [s.name, 'checking' as HealthStatus]))
  );
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    setStatuses(Object.fromEntries(SERVICES.map(s => [s.name, 'checking' as HealthStatus])));
    const results = await Promise.allSettled(
      SERVICES.map(s =>
        fetch(s.path, { signal: AbortSignal.timeout(4000) })
          .then(r => r.ok ? 'UP' : 'DOWN')
          .catch(() => 'DOWN')
      )
    );
    const next: Record<string, HealthStatus> = {};
    SERVICES.forEach((s, i) => {
      const r = results[i];
      next[s.name] = r.status === 'fulfilled' ? (r.value as HealthStatus) : 'DOWN';
    });
    setStatuses(next);
    setChecking(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  const upCount = Object.values(statuses).filter(v => v === 'UP').length;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
            <Activity size={14} className="text-blue-500" /> Service Health
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {checking ? 'Checking…' : `${upCount} / ${SERVICES.length} services UP`}
          </p>
        </div>
        <button
          onClick={check}
          disabled={checking}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
          title="Re-check all services"
        >
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-1.5">
        {SERVICES.map(s => {
          const st = statuses[s.name];
          return (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{s.name}</span>
              {st === 'checking' ? (
                <span className="flex items-center gap-1 text-gray-400 italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" /> checking
                </span>
              ) : st === 'UP' ? (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> UP
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> DOWN
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── AdminAuditWidget ── */

function AdminAuditWidget() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(getAuditLog(8));
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, []);

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
            <Clock size={14} className="text-violet-500" /> Recent Admin Actions
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Session-local audit trail</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4 italic">No admin actions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="flex gap-2 text-xs border-t border-gray-50 pt-2 first:border-0 first:pt-0">
              <div className="w-1 rounded-full bg-violet-300 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 leading-snug truncate" title={e.action}>{e.action}</p>
                <p className="text-gray-400 mt-0.5">{e.actor} · {relativeTime(e.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AdminSection (exported) ── */

export function AdminSection() {
  // Hooks must run before any early return
  // (no hooks here — both child widgets manage their own state)

  const isAdmin  = hasAnyRole('Administrator');
  const canAudit = hasAnyRole('Administrator', 'Auditor');

  // If the user can't see either widget, render nothing
  if (!canAudit) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Health widget: Administrator only */}
      {isAdmin && <ServiceHealthWidget />}

      {/* Audit widget: Administrator + Auditor */}
      {canAudit && (
        // When health widget is hidden (Auditor-only view), span full width
        <div className={isAdmin ? '' : 'col-span-2'}>
          <AdminAuditWidget />
        </div>
      )}
    </div>
  );
}
