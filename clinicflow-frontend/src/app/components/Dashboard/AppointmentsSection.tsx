/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/AppointmentsSection.tsx
 *
 * Visible to: Administrator, Manager, Receptionist
 *
 * Contains:
 *   PatientActivity         — recent-appointments table + weekly bar/line charts
 *   AppointmentStatusWidget — today's breakdown by status
 * ─────────────────────────────────────────────────────────────────────────── */

import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { hasAnyRole, parseStartAt, fmtDate, type BackendAppt } from './shared';
import { Modal } from './Modal';

/* ── PatientActivity ── */

function PatientActivity({ appointments, loading }: { appointments: BackendAppt[]; loading: boolean }) {
  const [modal, setModal] = useState(false);
  const rows = appointments.slice(0, 4);

  const barData = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);
    appointments.forEach(a => {
      const dt = parseStartAt(a.startAt);
      if (!dt) return;
      const diff = Math.floor((dt.getTime() - monday.getTime()) / 86_400_000);
      if (diff >= 0 && diff < 7) counts[diff]++;
    });
    return labels.map((day, i) => ({ day, value: counts[i] }));
  }, [appointments]);

  const lineData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (7 - i));
      const iso = d.toISOString().split('T')[0];
      const value = appointments.filter(a => {
        const dt = parseStartAt(a.startAt);
        return dt ? dt.toISOString().split('T')[0] === iso : false;
      }).length;
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), value };
    });
  }, [appointments]);

  return (
    <>
      <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Recent Appointments</h3>
        <p className="text-blue-600 text-xs font-semibold mb-2">Latest Activity</p>

        {loading ? (
          <div className="space-y-2 mb-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <table className="w-full text-xs mb-3">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Patient</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Doctor</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No appointments yet</td></tr>
              ) : rows.map((a, i) => (
                <tr key={a.id ?? i} className="border-t border-gray-50">
                  <td className="py-1.5 text-gray-700 truncate max-w-[100px]">{a.patientName ?? `Patient #${a.patientId}`}</td>
                  <td className="py-1.5 text-gray-500">{fmtDate(a.startAt)}</td>
                  <td className="py-1.5 text-gray-700 truncate max-w-[80px]">{a.doctorName ?? '—'}</td>
                  <td className={`py-1.5 font-semibold text-xs ${
                    a.status === 'CONFIRMED' ? 'text-green-500' :
                    a.status === 'CANCELLED' ? 'text-red-400' : 'text-amber-500'
                  }`}>{a.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-semibold">This Week's Activity</p>
          <button onClick={() => setModal(true)} className="text-blue-600 text-xs font-medium flex items-center gap-0.5 hover:underline">
            View All <ChevronRight size={12} />
          </button>
        </div>

        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData} barSize={18}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f0f4ff' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={55}>
          <LineChart data={lineData}>
            <Line dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {modal && (
        <Modal title="All Appointments" onClose={() => setModal(false)}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Patient</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Doctor</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No appointments found</td></tr>
              ) : appointments.map((a, i) => (
                <tr key={a.id ?? i} className="border-t border-gray-50">
                  <td className="py-2 text-gray-700">{a.patientName ?? `Patient #${a.patientId}`}</td>
                  <td className="py-2 text-gray-500">{fmtDate(a.startAt)}</td>
                  <td className="py-2 text-gray-700">{a.doctorName ?? '—'}</td>
                  <td className={`py-2 font-semibold ${
                    a.status === 'CONFIRMED' ? 'text-green-500' :
                    a.status === 'CANCELLED' ? 'text-red-400' : 'text-amber-500'
                  }`}>{a.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

/* ── AppointmentStatusWidget ── */

function AppointmentStatusWidget({ appointments, loading }: { appointments: BackendAppt[]; loading: boolean }) {
  const today = new Date().toISOString().split('T')[0];

  const todayAppts = appointments.filter(a => {
    const s = a.startAt;
    if (!s) return false;
    if (Array.isArray(s)) {
      const [y, mo, d] = s as number[];
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` === today;
    }
    return String(s).startsWith(today);
  });

  const confirmed = todayAppts.filter(a => a.status === 'CONFIRMED').length;
  const pending   = todayAppts.filter(a => a.status === 'PENDING').length;
  const cancelled = todayAppts.filter(a => a.status === 'CANCELLED').length;
  const total     = todayAppts.length;

  const rows = [
    { label: 'Confirmed', count: confirmed, bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending',   count: pending,   bar: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50'  },
    { label: 'Cancelled', count: cancelled, bar: 'bg-red-400',     text: 'text-red-500',     bg: 'bg-red-50'    },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-1">Today's Appointments</h3>
      <p className="text-xs text-gray-400 mb-3">Status breakdown for today</p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-4xl font-extrabold text-gray-900 mb-3">{total}</p>

          <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-gray-100">
            {total > 0 && confirmed > 0 && (
              <div className="bg-emerald-500 transition-all" style={{ width: `${(confirmed / total) * 100}%` }} />
            )}
            {total > 0 && pending > 0 && (
              <div className="bg-amber-400 transition-all" style={{ width: `${(pending / total) * 100}%` }} />
            )}
            {total > 0 && cancelled > 0 && (
              <div className="bg-red-400 transition-all" style={{ width: `${(cancelled / total) * 100}%` }} />
            )}
          </div>

          <div className="space-y-2">
            {rows.map(({ label, count, bar, text, bg }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-sm ${bar}`} />
                  {label}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── AppointmentsSection (exported) ── */

interface AppointmentsSectionProps {
  appointments: BackendAppt[];
  loading: boolean;
}

export function AppointmentsSection({ appointments, loading }: AppointmentsSectionProps) {
  // Hooks must run before any early return (React rules)
  // No hooks in this section itself — widget-level hooks run inside each child

  if (!hasAnyRole('Administrator', 'Manager', 'Receptionist')) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <PatientActivity appointments={appointments} loading={loading} />
      <AppointmentStatusWidget appointments={appointments} loading={loading} />
    </div>
  );
}
