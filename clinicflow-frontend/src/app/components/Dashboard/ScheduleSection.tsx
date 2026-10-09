/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/ScheduleSection.tsx
 *
 * Visible to: Administrator, Manager, Receptionist
 *
 * Contains:
 *   TodayScheduleWidget — today's appointments sorted earliest-first
 *   RecentPatients      — latest registered patients
 * ─────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { hasAnyRole, parseStartAt, fmtTime, type BackendAppt, type BackendPatient } from './shared';
import { Modal } from './Modal';

/* ── TodayScheduleWidget ── */

function TodayScheduleWidget({ appointments, loading, onNavigate }: {
  appointments: BackendAppt[];
  loading: boolean;
  onNavigate?: (tab: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];

  const todayRows = appointments
    .filter(a => {
      const s = a.startAt;
      if (!s) return false;
      if (Array.isArray(s)) {
        const [y, mo, d] = s as number[];
        return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` === today;
      }
      return String(s).startsWith(today);
    })
    .sort((a, b) => {
      const ta = parseStartAt(a.startAt)?.getTime() ?? 0;
      const tb = parseStartAt(b.startAt)?.getTime() ?? 0;
      return ta - tb;
    })
    .slice(0, 5);

  const statusColor = (s?: string) =>
    s === 'CONFIRMED' ? 'text-green-500' :
    s === 'CANCELLED' ? 'text-red-400'   : 'text-amber-500';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">Today's Schedule</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Appointments for today, earliest first</p>
        </div>
        <button
          onClick={() => onNavigate?.('appointments')}
          className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />)}
        </div>
      ) : todayRows.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No appointments scheduled for today</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 uppercase tracking-wide">
              <th className="text-left pb-2">Patient</th>
              <th className="text-left pb-2">Time</th>
              <th className="text-left pb-2">Doctor</th>
              <th className="text-left pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {todayRows.map((a, i) => (
              <tr key={a.id ?? i} className="border-t border-gray-50">
                <td className="py-1.5 text-blue-600 font-medium truncate max-w-[110px]">
                  {a.patientName ?? `PT-${a.patientId}`}
                </td>
                <td className="py-1.5 text-gray-500 font-mono">{fmtTime(a.startAt)}</td>
                <td className="py-1.5 text-gray-700 truncate max-w-[80px]">{a.doctorName ?? '—'}</td>
                <td className={`py-1.5 font-semibold ${statusColor(a.status)}`}>{a.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── RecentPatients ── */

function RecentPatients({ patients, loading, onNavigate }: {
  patients: BackendPatient[];
  loading: boolean;
  onNavigate?: (tab: string) => void;
}) {
  const [modal, setModal] = useState(false);
  const rows = patients.slice(0, 3);

  const genderBadge = (g?: string) => {
    const val = (g ?? '').toLowerCase();
    if (val === 'male')   return 'bg-blue-50 text-blue-600';
    if (val === 'female') return 'bg-pink-50 text-pink-600';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">Recent Patients</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Latest registered patients</p>
          </div>
          <button
            onClick={() => onNavigate ? onNavigate('patients') : setModal(true)}
            className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 animate-pulse rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">No patients registered yet</div>
        ) : (
          <div className="space-y-3">
            {rows.map((p, i) => (
              <div key={p.id ?? i} className="flex items-center gap-3 py-1.5 border-t border-gray-50 first:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(p.name ?? 'P').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.name ?? `Patient #${p.id}`}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.phone ?? p.email ?? '—'}</p>
                </div>
                {p.gender && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${genderBadge(p.gender)}`}>
                    {p.gender}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && patients.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} total
            </span>
            <button
              onClick={() => onNavigate ? onNavigate('patients') : setModal(true)}
              className="text-[11px] text-blue-500 font-semibold hover:underline flex items-center gap-0.5"
            >
              Manage patients <ArrowUpRight size={10} />
            </button>
          </div>
        )}
      </div>

      {modal && (
        <Modal title="All Patients" onClose={() => setModal(false)}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Gender</th>
                <th className="text-left pb-2">Phone</th>
                <th className="text-left pb-2">Condition</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0
                ? <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No patients found</td></tr>
                : patients.map((p, i) => (
                  <tr key={p.id ?? i} className="border-t border-gray-50">
                    <td className="py-2 text-gray-800 font-medium">{p.name ?? `Patient #${p.id}`}</td>
                    <td className="py-2 text-gray-500">{p.gender ?? '—'}</td>
                    <td className="py-2 text-gray-500">{p.phone ?? '—'}</td>
                    <td className="py-2 text-gray-500">{p.condition ?? '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

/* ── ScheduleSection (exported) ── */

interface ScheduleSectionProps {
  appointments: BackendAppt[];
  patients: BackendPatient[];
  loading: boolean;
  onNavigate?: (tab: string) => void;
}

export function ScheduleSection({ appointments, patients, loading, onNavigate }: ScheduleSectionProps) {
  if (!hasAnyRole('Administrator', 'Manager', 'Receptionist')) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <TodayScheduleWidget appointments={appointments} loading={loading} onNavigate={onNavigate} />
      <RecentPatients      patients={patients}         loading={loading} onNavigate={onNavigate} />
    </div>
  );
}
