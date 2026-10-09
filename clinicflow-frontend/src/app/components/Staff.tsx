import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Trash2, Edit2, X, Loader2, AlertCircle,
  UserCheck, Stethoscope, Mail, Phone, GraduationCap, ChevronDown,
} from 'lucide-react';
import { getCookie } from '../services/client';
import {
  getDoctors, registerDoctor, deleteDoctorById, updateDoctorById,
  type DoctorView,
} from '../services/doctors';
import { getUsers, type SystemUser } from '../services/auth';

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
  Cardiology:         { ring: 'bg-rose-100 text-rose-600 border-rose-200',          badge: 'bg-rose-50 text-rose-600 border border-rose-100' },
  Neurology:          { ring: 'bg-purple-100 text-purple-700 border-purple-200',    badge: 'bg-purple-50 text-purple-700 border border-purple-100' },
  'General Practice': { ring: 'bg-emerald-100 text-emerald-700 border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  Pediatrics:         { ring: 'bg-sky-100 text-sky-600 border-sky-200',             badge: 'bg-sky-50 text-sky-600 border border-sky-100' },
  Orthopedics:        { ring: 'bg-amber-100 text-amber-700 border-amber-200',       badge: 'bg-amber-50 text-amber-700 border border-amber-100' },
  Oncology:           { ring: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', badge: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' },
  Dermatology:        { ring: 'bg-orange-100 text-orange-600 border-orange-200',    badge: 'bg-orange-50 text-orange-600 border border-orange-100' },
  Radiology:          { ring: 'bg-cyan-100 text-cyan-700 border-cyan-200',          badge: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  Psychiatry:         { ring: 'bg-indigo-100 text-indigo-700 border-indigo-200',    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
};
const DEFAULT_PALETTE = {
  ring:  'bg-blue-100 text-blue-600 border-blue-200',
  badge: 'bg-blue-50 text-blue-600 border border-blue-100',
};
function palette(specialty: string) {
  return SPECIALTY_PALETTE[specialty] ?? DEFAULT_PALETTE;
}

const STATUS_STYLES: Record<string, string> = {
  'Active':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'On Call':  'bg-blue-50 text-blue-700 border border-blue-200',
  'Off Duty': 'bg-slate-100 text-slate-600 border border-slate-200',
};
const STATUS_DOTS: Record<string, string> = {
  'Active':   'bg-emerald-500',
  'On Call':  'bg-blue-500',
  'Off Duty': 'bg-slate-400',
};

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'General Practice', 'Pediatrics',
  'Orthopedics', 'Oncology', 'Dermatology', 'Radiology',
  'Psychiatry', 'Gastroenterology', 'Endocrinology', 'Urology',
];
const QUALIFICATIONS = ['MD', 'MD, PhD', 'MBBS', 'MBBS, MD', 'DO', 'PhD', 'DDS', 'PharmD'];
const STATUSES       = ['Active', 'On Call', 'Off Duty'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StaffProps {
  onNavigateToUsers?: (searchName: string) => void;
}

export function Staff({ onNavigateToUsers }: StaffProps = {}) {
  const [doctors,    setDoctors]    = useState<DoctorView[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', specialty: '', qualification: '', email: '', phone: '', status: 'Active',
    linkedUserId: '',
  });

  const [clinicianUsers,  setClinicianUsers]  = useState<SystemUser[]>([]);
  const [usersLoading,    setUsersLoading]    = useState(false);
  const [userSearch,      setUserSearch]      = useState('');
  const [userDropOpen,    setUserDropOpen]    = useState(false);

  const [editDoc,        setEditDoc]        = useState<DoctorView | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError,      setEditError]      = useState<string | null>(null);
  const [editForm,       setEditForm]       = useState({
    name: '', specialty: '', qualification: '', email: '', phone: '', status: 'Active',
  });

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

  // ── Clinician user search filter ─────────────────────────────────────────
  const filteredClinicians = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return clinicianUsers;
    return clinicianUsers.filter(u =>
      u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
    );
  }, [clinicianUsers, userSearch]);

  const selectedUser = clinicianUsers.find(u => String(u.userId) === form.linkedUserId) ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenModal = async () => {
    setShowModal(true);
    setUsersLoading(true);
    try {
      const all = await getUsers();
      setClinicianUsers(all.filter(u => u.role === 'Clinician'));
    } catch {
      // leave dropdown empty — user can still register without linking
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError(null);
    setUserSearch('');
    setUserDropOpen(false);
    setClinicianUsers([]);
    setForm({ name: '', specialty: '', qualification: '', email: '', phone: '', status: 'Active', linkedUserId: '' });
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.specialty.trim()) {
      setFormError('Name and specialty are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const linkedId    = form.linkedUserId ? parseInt(form.linkedUserId, 10) : null;
      const userId      = linkedId ?? parseInt(getCookie('userId') || '1', 10);
      // If an existing user was linked, skip auto-provisioning a new account
      const provisionUser = linkedId === null;

      const newDoc = await registerDoctor(userId, {
        name:          form.name.trim(),
        specialty:     form.specialty,
        qualification: form.qualification || undefined,
        email:         form.email.trim() || undefined,
        phone:         form.phone.trim() || undefined,
        status:        form.status || 'Active',
      }, provisionUser);
      setDoctors(prev => [...prev, newDoc]);
      handleCloseModal();
    } catch {
      setFormError('Failed to register doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (doc: DoctorView) => {
    setEditDoc(doc);
    setEditError(null);
    setEditForm({
      name:          doc.name,
      specialty:     doc.specialty,
      qualification: doc.qualification ?? '',
      email:         doc.email  ?? '',
      phone:         doc.phone  ?? '',
      status:        doc.status ?? 'Active',
    });
  };

  const handleCloseEdit = () => {
    setEditDoc(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editDoc) return;
    if (!editForm.name.trim() || !editForm.specialty.trim()) {
      setEditError('Name and specialty are required.');
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await updateDoctorById(editDoc.id, {
        name:          editForm.name.trim(),
        specialty:     editForm.specialty,
        qualification: editForm.qualification || undefined,
        email:         editForm.email.trim()  || undefined,
        phone:         editForm.phone.trim()  || undefined,
        status:        editForm.status        || 'Active',
      });
      setDoctors(prev => prev.map(d => d.id === editDoc.id ? updated : d));
      handleCloseEdit();
    } catch {
      setEditError('Failed to update doctor. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
    try {
      await deleteDoctorById(id);
    } catch {
      try { setDoctors(await getDoctors()); } catch { /* ignore */ }
      setError('Failed to delete doctor.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Staff Management</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? 'Loading…' : `${doctors.length} physician${doctors.length !== 1 ? 's' : ''} on record`}
            </p>
          </div>
          <div className="flex gap-3">
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
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} /> Register Doctor
            </button>
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
            <Loader2 size={22} className="animate-spin" />
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
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col group relative"
                >
                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    title="Edit doctor"
                    className="absolute top-4 right-11 p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="Remove doctor"
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>

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

                  {/* View user account link */}
                  {onNavigateToUsers && (
                    <button
                      onClick={() => onNavigateToUsers(doc.name)}
                      className="mt-3 w-full text-[11px] font-semibold text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-xl py-1.5 transition-colors flex items-center justify-center gap-1"
                    >
                      View User Account →
                    </button>
                  )}
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
            {!searchTerm && (
              <button onClick={handleOpenModal} className="text-xs text-blue-600 hover:underline font-semibold mt-1">
                Register the first doctor
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Register Doctor Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Modal header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register Doctor</h2>
                <p className="text-xs text-slate-400 mt-0.5">Add a new physician to the system.</p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs">
                  <AlertCircle size={13} /> {formError}
                </div>
              )}

              {/* Link User Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Link User Account
                </label>

                {usersLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin" /> Loading Clinician accounts…
                  </div>
                ) : (
                  <div className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => { setUserDropOpen(o => !o); setUserSearch(''); }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {selectedUser ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                            {selectedUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-medium text-slate-800">{selectedUser.fullName}</span>
                          <span className="text-slate-400 text-xs">@{selectedUser.username}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Auto-create new account</span>
                      )}
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown panel */}
                    {userDropOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                        {/* Search */}
                        <div className="p-2 border-b border-slate-100">
                          <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search by name or username…"
                              value={userSearch}
                              onChange={e => setUserSearch(e.target.value)}
                              autoFocus
                              className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Options list */}
                        <div className="max-h-52 overflow-y-auto">
                          {/* Clear option */}
                          <button
                            type="button"
                            onClick={() => {
                              setForm(f => ({ ...f, linkedUserId: '' }));
                              setUserDropOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                              !form.linkedUserId ? 'bg-slate-50 font-semibold text-slate-600' : 'text-slate-400 italic'
                            }`}
                          >
                            <UserCheck size={12} className="text-slate-300 flex-shrink-0" />
                            Auto-create new account
                          </button>

                          {filteredClinicians.length === 0 && (
                            <div className="px-3 py-4 text-xs text-slate-400 text-center">
                              {clinicianUsers.length === 0
                                ? 'No Clinician accounts found'
                                : `No results for "${userSearch}"`}
                            </div>
                          )}

                          {filteredClinicians.map(u => (
                            <button
                              key={u.userId}
                              type="button"
                              onClick={() => {
                                setForm(f => ({
                                  ...f,
                                  linkedUserId: String(u.userId),
                                  // auto-fill name and email only if still blank
                                  name:  f.name.trim()  ? f.name  : u.fullName,
                                  email: f.email.trim() ? f.email : (u.email ?? ''),
                                }));
                                setUserDropOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-blue-50 transition-colors ${
                                form.linkedUserId === String(u.userId)
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-slate-700'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block truncate">{u.fullName}</span>
                                <span className="block text-slate-400 font-normal">@{u.username}</span>
                              </span>
                              {u.status === 'ACTIVE' && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 flex-shrink-0">
                                  Active
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-1">
                  Choose an existing Clinician account to link, or leave blank to auto-create one.
                </p>
              </div>

              {/* Row 1 — Name + Qualification */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Qualification</label>
                  <select
                    value={form.qualification}
                    onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 — Specialty + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Specialty <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.specialty}
                    onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3 — Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="doctor@clinicflow.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {submitting
                  ? <><Loader2 size={13} className="animate-spin" /> Registering…</>
                  : 'Register Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Doctor Modal ─────────────────────────────────────────── */}
      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Doctor</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update physician details for {editDoc.name}.</p>
              </div>
              <button onClick={handleCloseEdit} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs">
                  <AlertCircle size={13} /> {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input type="text" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Qualification</label>
                  <select value={editForm.qualification}
                    onChange={e => setEditForm(f => ({ ...f, qualification: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Specialty <span className="text-rose-400">*</span>
                  </label>
                  <select value={editForm.specialty}
                    onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                  <input type="email" value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                  <input type="tel" value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
              <button onClick={handleCloseEdit} disabled={editSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60">
                {editSubmitting
                  ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
