import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, User, Plus, X, InboxIcon, Loader2, AlertCircle, Stethoscope } from "lucide-react";
import {
  pageCls, pageInnerCls, pageTitleCls,
  btnPrimary, btnCancel, btnSubmit,
  inputCls, selectCls, labelCls,
  badgeCls, filterBarCls, filterActiveCls, filterInactiveCls,
  modalOverlayCls, modalBoxCls, modalHeaderCls, modalBodyCls, modalFooterCls,
} from "./ui/design";
import {
  getAppointments,
  getDoctors,
  bookAppointment,
  patchAppointmentStatus,
  type AppointmentView,
  type AppointmentStatus,
  type DoctorItem,
} from "../services/appointments";
import { getPatients } from "../services/patients";
import type { Patient } from "./CentralDashboard";
import { getCookie } from "../services/client";

// ---------------------------------------------------------------------------
// Static style maps
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "pending" | "confirmed" | "in progress" | "cancelled";

const statusColors: Record<AppointmentStatus, string> = {
  Confirmed:    "bg-emerald-50 text-emerald-600 border border-emerald-100",
  Pending:      "bg-orange-50  text-orange-500  border border-orange-100",
  "In Progress":"bg-blue-50    text-blue-600    border border-blue-100",
  Cancelled:    "bg-rose-50    text-rose-500    border border-rose-100",
};
const statusDots: Record<AppointmentStatus, string> = {
  Confirmed:    "bg-emerald-500",
  Pending:      "bg-orange-500",
  "In Progress":"bg-blue-500",
  Cancelled:    "bg-rose-500",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Props kept backward-compatible so existing parent components don't break.
 * The component now manages its own state via API calls and ignores the
 * appointments/setAppointments/onAddAppointment props.
 */
export function Appointments({
  selectedPatient,
  clearSelectedPatient,
  onStartEncounter,
}: {
  selectedPatient?: string | null;
  /** @deprecated — state is now managed internally via API */
  appointments?: unknown;
  /** @deprecated — state is now managed internally via API */
  setAppointments?: unknown;
  /** @deprecated — booking goes through API */
  onAddAppointment?: unknown;
  clearSelectedPatient?: () => void;
  onStartEncounter?: (data: { patientId: number; patientName: string; visitType: string; doctorId: number }) => void;
}) {
  // ---- data state ----
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [patients,     setPatients]     = useState<Patient[]>([]);
  const [doctors,      setDoctors]      = useState<DoctorItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // ---- UI state ----
  const [filter,      setFilter]     = useState<FilterStatus>("all");
  const [myOnly,      setMyOnly]     = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const currentDoctorId = parseInt(getCookie('userId') || '0', 10);

  // ---- form state ----
  const [form, setForm] = useState({
    patientId:  null as number | null,
    patient:    "",
    department: "",
    doctorId:   null as number | null,
    doctor:     "",
    date:       "",
    time:       "",
    type:       "General Checkup",
  });

  // ---- initial load ----
  useEffect(() => {
    (async () => {
      try {
        const [appts, pts, docs] = await Promise.all([
          getAppointments(),
          getPatients(),
          getDoctors(),
        ]);
        setAppointments(appts);
        setPatients(pts);
        setDoctors(docs);
      } catch {
        setError("Failed to load data. Check that consultation-service is running.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- pre-fill form when parent passes a patient name ----
  useEffect(() => {
    if (!selectedPatient || patients.length === 0) return;
    const match = patients.find(p => p.name === selectedPatient);
    if (match) {
      setForm(f => ({ ...f, patientId: match.id, patient: match.name }));
    } else {
      // patient name provided but not yet in list — use name only, id stays null
      setForm(f => ({ ...f, patient: selectedPatient }));
    }
    setShowCreate(true);
  }, [selectedPatient, patients]);

  // ---- doctors grouped by specialty ----
  const doctorsBySpecialty = useMemo(
    () =>
      doctors.reduce<Record<string, DoctorItem[]>>((acc, d) => {
        (acc[d.specialty] ??= []).push(d);
        return acc;
      }, {}),
    [doctors],
  );
  const departments = useMemo(
    () => Object.keys(doctorsBySpecialty).sort(),
    [doctorsBySpecialty],
  );

  // ---- filtered list ----
  const baseFiltered = filter === "all"
    ? appointments
    : appointments.filter(a => a.status.toLowerCase() === filter);
  const filtered = myOnly && currentDoctorId > 0
    ? baseFiltered.filter(a => a.doctorId === currentDoctorId)
    : baseFiltered;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCloseModal = () => {
    setShowCreate(false);
    setFormError(null);
    clearSelectedPatient?.();
    setForm({
      patientId: null, patient: "",
      department: "", doctorId: null, doctor: "",
      date: "", time: "", type: "General Checkup",
    });
  };

  const handleBook = async () => {
    const { patientId, department, doctorId, date, time } = form;
    if (!patientId || !department || !doctorId || !date || !time) {
      setFormError("Please fill in all required fields.");
      return;
    }

    // Build ISO datetimes: endAt = startAt + 1 hour
    const startAt = `${date}T${time}:00`;
    const endDt   = new Date(`${date}T${time}:00`);
    endDt.setHours(endDt.getHours() + 1);
    const endAt = `${endDt.getFullYear()}-${String(endDt.getMonth() + 1).padStart(2, "0")}-${String(endDt.getDate()).padStart(2, "0")}T${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}:00`;

    setSubmitting(true);
    setFormError(null);
    try {
      const booked = await bookAppointment(patientId, {
        doctorId:    doctorId,
        department:  department,
        serviceType: form.type,
        startAt,
        endAt,
      });
      setAppointments(prev => [booked, ...prev]);
      handleCloseModal();
    } catch {
      setFormError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: AppointmentStatus) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await patchAppointmentStatus(id, status);
    } catch {
      // Revert on failure
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: appointments.find(x => x.id === id)?.status ?? a.status } : a),
      );
      setError("Status update failed.");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={pageCls}>
      <div className={pageInnerCls}>

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className={pageTitleCls}>Appointments</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track and scheduling system</p>
          </div>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>
            <Plus size={16} /> Book Appointment
          </button>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
            <AlertCircle size={15} /> {error}
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Filter pills + Mine toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className={`${filterBarCls} w-fit`}>
            {(["all", "pending", "confirmed", "in progress", "cancelled"] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={filter === s ? filterActiveCls : filterInactiveCls + " capitalize"}>
                {s}
              </button>
            ))}
          </div>
          {currentDoctorId > 0 && (
            <button
              onClick={() => setMyOnly(v => !v)}
              title={myOnly ? "Show all appointments" : "Show only my appointments"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                myOnly
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <User size={12} />
              {myOnly ? 'My appointments' : 'All doctors'}
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading appointments…</span>
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(a => (
              <div key={a.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-bold text-slate-900 flex gap-2 items-center text-sm">
                      <User size={16} className="text-slate-400" /> {a.patient}
                    </h3>
                    <span className={`${badgeCls} ${statusColors[a.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[a.status]}`} />
                      {a.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-slate-600 mt-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{a.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-slate-400" />
                      <span>{a.time}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Doctor: </span>
                      <span className="font-semibold text-slate-700">{a.doctor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Clinic: </span>
                      <span className="font-medium text-slate-700">{a.department}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-1">
                  <p className="text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Update Status</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      ["Confirm",  "Confirmed",    "hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"],
                      ["Progress", "In Progress",  "hover:border-blue-400    hover:bg-blue-50    hover:text-blue-700"],
                      ["Cancel",   "Cancelled",    "hover:border-rose-400    hover:bg-rose-50    hover:text-rose-600"],
                    ] as const).map(([label, status, hoverCls]) => (
                      <button key={label}
                        onClick={() => handleStatusChange(a.id, status as AppointmentStatus)}
                        className={`border border-slate-200 text-slate-600 text-[11px] py-1.5 rounded-lg font-semibold transition-all ${hoverCls}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {a.status === "Confirmed" && onStartEncounter && (
                    <button
                      onClick={() => onStartEncounter({ patientId: a.patientId, patientName: a.patient, visitType: a.type, doctorId: a.doctorId })}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100">
                      <Stethoscope size={13} /> Start Encounter
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <InboxIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No appointments matching &quot;{filter}&quot;.
            </p>
            <p className="text-xs text-slate-400">Try a different filter or book a new appointment.</p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Book Appointment                                             */}
      {/* ------------------------------------------------------------------ */}
      {showCreate && (
        <div className={modalOverlayCls}>
          <div className={modalBoxCls}>
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the scheduling details below.</p>
              </div>
              <button onClick={handleCloseModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className={modalBodyCls}>
              {/* Form error */}
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs">
                  <AlertCircle size={13} /> {formError}
                </div>
              )}

              {/* Patient */}
              <div>
                <label className={labelCls}>Patient</label>
                {selectedPatient ? (
                  <input
                    value={form.patient}
                    disabled
                    className={inputCls + " opacity-60 cursor-not-allowed"}
                  />
                ) : (
                  <select
                    className={selectCls}
                    value={form.patientId ?? ""}
                    onChange={e => {
                      const p = patients.find(pt => pt.id === Number(e.target.value));
                      setForm(f => ({ ...f, patientId: p?.id ?? null, patient: p?.name ?? "" }));
                    }}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Department */}
              <div>
                <label className={labelCls}>Medical Department</label>
                <select
                  className={selectCls}
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value, doctorId: null, doctor: "" }))}
                >
                  <option value="">Select Department</option>
                  {departments.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className={labelCls}>Assigned Physician</label>
                <select
                  className={selectCls + (!form.department ? " opacity-60 cursor-not-allowed" : "")}
                  disabled={!form.department}
                  value={form.doctorId ?? ""}
                  onChange={e => {
                    const d = doctors.find(doc => doc.id === Number(e.target.value));
                    setForm(f => ({ ...f, doctorId: d?.id ?? null, doctor: d?.name ?? "" }));
                  }}
                >
                  <option value="">Select Doctor</option>
                  {(doctorsBySpecialty[form.department] ?? []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" className={inputCls} value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <input type="time" className={inputCls} value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              {/* Service type */}
              <div>
                <label className={labelCls}>Service Type</label>
                <select
                  className={selectCls}
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  {["General Checkup", "Follow-up", "Consultation", "Emergency", "Lab Review", "Procedure"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={modalFooterCls}>
              <button onClick={handleCloseModal} className={btnCancel} disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleBook} className={btnSubmit} disabled={submitting}>
                {submitting
                  ? <><Loader2 size={13} className="animate-spin" /> Booking…</>
                  : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
