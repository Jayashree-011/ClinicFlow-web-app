import { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, ChevronRight } from 'lucide-react';
import axiosInstance from '../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Minimal appointment shape needed by this widget. Compatible with BackendAppt. */
interface ApptRow {
  id?: number;
  patientName?: string;
  patientId?: number;
  doctorId?: number;
  startAt?: unknown;
  status?: string;
}

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getUserId(): number {
  const m = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
  return m ? parseInt(decodeURIComponent(m[1]), 10) : 0;
}

function getRole(): string {
  const m = document.cookie.match(/(?:^|;\s*)role=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function parseStartAt(value: unknown): Date | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, mo, d, h = 0, m = 0, s = 0] = value as number[];
    const dt = new Date(y, mo - 1, d, h, m, s);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value as string);
  return isNaN(dt.getTime()) ? null : dt;
}

function fmtTime(value: unknown): string {
  const dt = parseStartAt(value);
  if (!dt) return '—';
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ─── ClinicianSection ─────────────────────────────────────────────────────────
//
// Renders two cards: today's personal schedule + sign-off queue count.
// Returns null when the logged-in user is not a Clinician.

export function ClinicianSection({
  appointments,
  loading,
  onNavigate,
}: {
  appointments: ApptRow[];
  loading: boolean;
  onNavigate?: (tab: string) => void;
}) {
  const [completedCount, setCompletedCount] = useState(0);

  // Fetch COMPLETED encounters (awaiting sign-off) — hook must run before early return
  useEffect(() => {
    if (getRole() !== 'Clinician') return;
    const doctorId = getUserId();
    if (!doctorId) return;
    axiosInstance
      .get<unknown[]>(`/encounter/doctor/${doctorId}/status/COMPLETED`)
      .then(r => setCompletedCount(r.data.length))
      .catch(() => {});
  }, []);

  // Only render for clinicians
  if (getRole() !== 'Clinician') return null;

  const doctorId = getUserId();
  const today = new Date().toISOString().split('T')[0];

  const myToday = appointments.filter(a => {
    if (a.doctorId !== doctorId) return false;
    const s = a.startAt;
    if (!s) return false;
    if (Array.isArray(s)) {
      const [y, mo, d] = s as number[];
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` === today;
    }
    return String(s).startsWith(today);
  });

  return (
    <div className="grid grid-cols-2 gap-4">

      {/* ── Today's personal schedule ── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-blue-500" />
            <h3 className="font-bold text-gray-900 text-sm">My Schedule Today</h3>
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : myToday.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            No appointments scheduled for today
          </p>
        ) : (
          <div className="space-y-1.5">
            {myToday.slice(0, 5).map((a, i) => (
              <div
                key={a.id ?? i}
                className="flex items-center justify-between text-xs border-t border-gray-50 pt-2 first:border-0 first:pt-0"
              >
                <div>
                  <span className="font-semibold text-gray-800">
                    {a.patientName ?? `Patient #${a.patientId}`}
                  </span>
                  <span className="text-gray-400 ml-2">{fmtTime(a.startAt)}</span>
                </div>
                <span className={`font-semibold ${
                  a.status === 'CONFIRMED' ? 'text-green-500' :
                  a.status === 'CANCELLED' ? 'text-red-400'   : 'text-amber-500'
                }`}>
                  {a.status ?? '—'}
                </span>
              </div>
            ))}
            {myToday.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                +{myToday.length - 5} more
              </p>
            )}
          </div>
        )}

        {!loading && (
          <div className="mt-3 pt-2 border-t border-gray-50">
            <span className="text-xs text-gray-500 font-semibold">
              {myToday.length} appointment{myToday.length !== 1 ? 's' : ''} today
            </span>
          </div>
        )}
      </div>

      {/* ── Sign-off queue ── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <h3 className="font-bold text-gray-900 text-sm">Sign-off Queue</h3>
          </div>
          <button
            onClick={() => onNavigate?.('encounters')}
            className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-0.5"
          >
            Review <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-4xl font-extrabold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-1">
              encounter{completedCount !== 1 ? 's' : ''} awaiting sign-off
            </p>
          </div>
          {completedCount > 0 && (
            <div className="flex-1 flex items-center justify-end">
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full">
                Action Required
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50">
          <button
            onClick={() => onNavigate?.('encounters')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
          >
            Go to Encounters <ChevronRight size={12} />
          </button>
        </div>
      </div>

    </div>
  );
}
