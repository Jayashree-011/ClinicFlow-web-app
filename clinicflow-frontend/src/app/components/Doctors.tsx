import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, AlertCircle,
  UserCheck, Stethoscope, Mail, Phone, GraduationCap,
} from 'lucide-react';
import {
  getDoctors,
  type DoctorView,
} from '../services/doctors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ---------------------------------------------------------------------------
// Colour palettes
// ---------------------------------------------------------------------------

const SPECIALTY_PALETTE: Record<string, { ring: string; badge: string }> = {
  Cardiology:         { ring: 'bg-rose-100 text-rose-600 border-rose-200',         badge: 'bg-rose-50 text-rose-600 border border-rose-100' },
  Neurology:          { ring: 'bg-purple-100 text-purple-700 border-purple-200',   badge: 'bg-purple-50 text-purple-700 border border-purple-100' },
  'General Practice': { ring: 'bg-emerald-100 text-emerald-700 border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  Pediatrics:         { ring: 'bg-sky-100 text-sky-600 border-sky-200',            badge: 'bg-sky-50 text-sky-600 border border-sky-100' },
  Orthopedics:        { ring: 'bg-amber-100 text-amber-700 border-amber-200',      badge: 'bg-amber-50 text-amber-700 border border-amber-100' },
  Oncology:           { ring: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', badge: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' },
  Dermatology:        { ring: 'bg-orange-100 text-orange-600 border-orange-200',   badge: 'bg-orange-50 text-orange-600 border border-orange-100' },
  Radiology:          { ring: 'bg-cyan-100 text-cyan-700 border-cyan-200',         badge: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  Psychiatry:         { ring: 'bg-indigo-100 text-indigo-700 border-indigo-200',   badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
};
const DEFAULT_PALETTE = {
  ring:  'bg-blue-100 text-blue-600 border-blue-200',
  badge: 'bg-blue-50 text-blue-600 border border-blue-100',
};
function palette(specialty: string) {
  return SPECIALTY_PALETTE[specialty] ?? DEFAULT_PALETTE;
}

const STATUS_STYLES: Record<string, string> = {
  'Active':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'On Call':   'bg-blue-50 text-blue-700 border border-blue-200',
  'Off Duty':  'bg-slate-100 text-slate-600 border border-slate-200',
};
const STATUS_DOTS: Record<string, string> = {
  'Active':   'bg-emerald-500',
  'On Call':  'bg-blue-500',
  'Off Duty': 'bg-slate-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Teams() {
  const [doctors,    setDoctors]    = useState<DoctorView[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setDoctors(await getDoctors());
      } catch {
        setError('Failed to load doctors. Check that consultation-service is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Search filter ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      (d.qualification ?? '').toLowerCase().includes(q),
    );
  }, [doctors, searchTerm]);

  // ── Specialty summary ─────────────────────────────────────────────────────
  const specialtyCounts = useMemo(
    () => doctors.reduce<Record<string, number>>((acc, d) => {
      acc[d.specialty] = (acc[d.specialty] ?? 0) + 1;
      return acc;
    }, {}),
    [doctors],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Affiliated Doctors</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? 'Loading…' : `${doctors.length} physician${doctors.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, specialty…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white text-sm"
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
            <AlertCircle size={15} /> {error}
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Specialty strip */}
        {!loading && Object.keys(specialtyCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(specialtyCounts).map(([spec, count]) => (
              <button
                key={spec}
                onClick={() => setSearchTerm(searchTerm === spec ? '' : spec)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${searchTerm === spec
                    ? palette(spec).badge + ' ring-2 ring-offset-1 ring-current'
                    : palette(spec).badge + ' opacity-75 hover:opacity-100'}`}
              >
                {spec} · {count}
              </button>
            ))}
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            <span className="text-sm">Loading doctors…</span>
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(doc => {
              const { ring, badge } = palette(doc.specialty);
              const statusStyle = STATUS_STYLES[doc.status ?? ''] ?? STATUS_STYLES['Active'];
              const statusDot   = STATUS_DOTS[doc.status ?? '']   ?? STATUS_DOTS['Active'];
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col"
                >
                  {/* Avatar + name block */}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border text-lg font-bold shrink-0 ${ring}`}>
                      {initials(doc.name)}
                    </div>
                    <div className="flex-1 overflow-hidden pt-0.5">
                      <h3 className="font-bold text-slate-800 text-sm leading-snug">{doc.name}</h3>
                      {doc.qualification && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <GraduationCap size={11} />
                          {doc.qualification}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specialty */}
                  <div className="mt-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge}`}>
                      <Stethoscope size={11} />
                      {doc.specialty}
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                    {doc.email ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{doc.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-300 italic">
                        <Mail size={13} className="shrink-0" />
                        <span>No email on file</span>
                      </div>
                    )}
                    {doc.phone ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{doc.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-300 italic">
                        <Phone size={13} className="shrink-0" />
                        <span>No phone on file</span>
                      </div>
                    )}
                  </div>

                  {/* Footer — status + ID */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                      {doc.status ?? 'Active'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <UserCheck size={11} />
                      <span className="font-mono">ID #{doc.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {searchTerm ? `No doctors matching "${searchTerm}".` : 'No doctors registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
