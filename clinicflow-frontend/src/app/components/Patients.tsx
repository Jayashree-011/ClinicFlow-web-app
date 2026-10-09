import React, { useState } from "react";
import { Search, Plus, Phone, Mail, Calendar, Edit, Trash2, X, RotateCw } from "lucide-react";
import {
  getPatients,
  createPatient,
  updatePatient as apiUpdatePatient,
  deletePatient as apiDeletePatient,
} from "../services/api";
import { Patient } from "./CentralDashboard";
import { PatientTimeline } from './PatientTimeline';
import {
  pageCls, pageInnerCls, pageTitleCls,
  btnPrimary, btnSecondary, btnCancel, btnDanger, btnSubmit,
  inputCls, selectCls, labelCls,
  searchInputCls,
  modalOverlayCls, modalBoxCls, modalHeaderCls, modalBodyCls, modalFooterCls,
  errorBannerCls,
} from "./ui/design";

const doctors = [
  { name: "Dr. Sarah Smith",    department: "Cardiology"       },
  { name: "Dr. Michael Johnson",department: "General Medicine" },
  { name: "Dr. Emily Davis",    department: "Neurology"        },
  { name: "Dr. Rajesh Kumar",   department: "Orthopedics"      },
  { name: "Dr. Ananya Iyer",    department: "Gynecology"       },
  { name: "Dr. Vikram Singh",   department: "Pediatrics"       },
];

const timeSlots = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","02:00 PM","02:30 PM",
  "03:00 PM","03:30 PM","04:00 PM","04:30 PM",
  "05:00 PM","05:30 PM","06:00 PM","06:30 PM",
  "07:00 PM","07:30 PM","08:00 PM","08:30 PM","09:00 PM",
];

export function Patients({
  patients,
  setPatients,
  appointments = [],
  addAppointment,
  onDirectBook,
}: {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  appointments?: any[];
  addAppointment: (app: any) => void;
  onDirectBook?: (name: string) => void;
}) {
  const [searchTerm,       setSearchTerm]       = useState("");
  const [showCreate,       setShowCreate]       = useState(false);
  const [showEdit,         setShowEdit]         = useState(false);
  const [showBooking,      setShowBooking]      = useState(false);
  const [isRefreshing,     setIsRefreshing]     = useState(false);
  const [selectedPatient,  setSelectedPatient]  = useState<Patient | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<Patient | null>(null);
  const [timelinePatient,  setTimelinePatient]  = useState<Patient | null>(null);

  const [form, setForm] = useState<Omit<Patient, "id" | "lastVisit">>({
    name: "", dob: "", gender: "Male", phone: "", email: "", condition: "", address: "",
  });

  const [appointment, setAppointment] = useState({
    doctor: "", department: "", date: "", time: "", type: "General Checkup",
  });

  const refreshPatients = async () => {
    setIsRefreshing(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (e) {
      console.error("Failed to fetch patients:", e);
    } finally {
      setIsRefreshing(false);
    }
  };


  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    try {
      // The consultation-service automatically provisions a linked user account
      // via its internal UserServiceClient — no need to call registerUser here.
      await createPatient(form);
      await refreshPatients();
      closeAll();
    } catch (e) {
      console.error("Failed to add patient:", e);
      alert("Error adding patient. Please try again.");
    }
  };

  const updatePatient = async () => {
    if (!selectedPatient) return;
    try {
      await apiUpdatePatient(selectedPatient.id, form);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, ...form } : p));
      closeAll();
    } catch (e) {
      console.error("Failed to update patient records:", e);
      alert("Could not update patient directory setup.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeletePatient(deleteTarget.id);
      setPatients(prev => prev.filter(p => p.id !== deleteTarget.id));
    } catch (e) {
      console.error("Failed to remove patient:", e);
    }
    setDeleteTarget(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedPatient || !appointment.doctor || !appointment.date || !appointment.time) {
      alert("Please fill in all appointment fields.");
      return;
    }
    addAppointment({ ...appointment, patientId: selectedPatient.id, patient: selectedPatient.name });
    closeAll();
  };

  const openEdit = (p: Patient) => {
    setSelectedPatient(p);
    setForm({ name: p.name, dob: p.dob, gender: p.gender, phone: p.phone, email: p.email, condition: p.condition, address: p.address });
    setShowEdit(true);
  };

  const openBooking = (p: Patient) => {
    if (onDirectBook) { onDirectBook(p.name); return; }
    setSelectedPatient(p);
    setShowBooking(true);
  };

  const closeAll = () => {
    setShowCreate(false); setShowEdit(false); setShowBooking(false); setSelectedPatient(null);
    setForm({ name: "", dob: "", gender: "Male", phone: "", email: "", condition: "", address: "" });
    setAppointment({ doctor: "", department: "", date: "", time: "", type: "General Checkup" });
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={pageCls}>
      <div className={pageInnerCls}>

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className={pageTitleCls}>Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage patient records</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshPatients}
              disabled={isRefreshing}
              title="Refresh Data"
              className={btnSecondary + ' disabled:opacity-50'}
            >
              <RotateCw size={16} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
              Refresh
            </button>
            <button onClick={() => setShowCreate(true)} className={btnPrimary}>
              <Plus size={16} /> Add Patient
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search by name or condition..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={searchInputCls}
            />
          </div>
        </div>

        {/* Empty state */}
        {patients.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            No patients added yet. Click <b className="text-slate-600">Add Patient</b> to begin.
          </div>
        )}

        {/* Patient Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.dob} · {p.gender}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} title="Edit Profile"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} title="Delete Profile"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex gap-2 items-center"><Phone size={14} className="text-slate-400" /> {p.phone || 'N/A'}</div>
                  <div className="flex gap-2 items-center"><Mail size={14} className="text-slate-400" /> {p.email || 'N/A'}</div>
                  <div className="flex gap-2 items-center"><Calendar size={14} className="text-slate-400" /> Last visit: {p.lastVisit ? p.lastVisit : 'N/A'  }</div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[11px] font-semibold">
                  {p.condition || "General Health"}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setTimelinePatient(p)}
                    className="text-violet-600 text-xs font-semibold hover:text-violet-800 transition">
                    Timeline
                  </button>
                  <button onClick={() => openBooking(p)}
                    className="text-blue-600 text-xs font-semibold hover:text-blue-800 transition">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal: Create / Edit Patient */}
      {(showCreate || showEdit) && (
        <div className={modalOverlayCls}>
          <div className={modalBoxCls}>
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{showCreate ? "Add Patient" : "Edit Patient"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the patient details below.</p>
              </div>
              <button onClick={closeAll} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={showCreate ? addPatient : e => { e.preventDefault(); updatePatient(); }}>
              <div className={modalBodyCls}>
                <PatientForm form={form} setForm={setForm} />
              </div>
              <div className={modalFooterCls}>
                <button type="button" onClick={closeAll} className={btnCancel}>Cancel</button>
                <button type="submit" className={btnSubmit}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book Appointment */}
      {showBooking && selectedPatient && (
        <div className={modalOverlayCls}>
          <div className={modalBoxCls}>
            <div className={modalHeaderCls}>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPatient.name}</p>
              </div>
              <button onClick={closeAll} className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className={modalBodyCls}>
              <div>
                <label className={labelCls}>Doctor</label>
                <select
                  className={selectCls}
                  value={appointment.doctor ? `${appointment.doctor} - ${appointment.department}` : ""}
                  onChange={e => {
                    const d = doctors.find(doc => `${doc.name} - ${doc.department}` === e.target.value);
                    if (d) setAppointment({ ...appointment, doctor: d.name, department: d.department });
                    else   setAppointment({ ...appointment, doctor: "", department: "" });
                  }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.name} value={`${d.name} - ${d.department}`}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} value={appointment.date}
                  onChange={e => setAppointment({ ...appointment, date: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Available Slots</label>
                <select
                  className={selectCls}
                  value={appointment.time}
                  onChange={e => setAppointment({ ...appointment, time: e.target.value })}
                  disabled={!appointment.doctor || !appointment.date}
                >
                  <option value="">
                    {!appointment.doctor || !appointment.date ? "Select Doctor & Date First" : "Select Time"}
                  </option>
                  {timeSlots.map(t => {
                    const isBooked = appointments.some(
                      (a: any) => a.doctor === appointment.doctor && a.date === appointment.date && a.time === t && a.status !== "Cancelled"
                    );
                    return (
                      <option key={t} value={t} disabled={isBooked}>
                        {t}{isBooked ? " • (Booked)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className={modalFooterCls}>
              <button type="button" onClick={closeAll} className={btnCancel}>Cancel</button>
              <button type="button" onClick={handleConfirmBooking}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Timeline drawer */}
      {timelinePatient && (
        <PatientTimeline
          patientId={timelinePatient.id}
          patientName={timelinePatient.name}
          onClose={() => setTimelinePatient(null)}
        />
      )}

      {/* Modal: Delete Confirmation */}
      {deleteTarget && (
        <div className={modalOverlayCls}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Delete {deleteTarget.name}?</h2>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
            <div className={modalFooterCls}>
              <button onClick={() => setDeleteTarget(null)} className={btnCancel}>Cancel</button>
              <button onClick={confirmDelete} className={btnDanger}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientForm({ form, setForm }: { form: any; setForm: (v: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className={labelCls}>Full Name</label>
        <input placeholder="e.g. John Doe" value={form.name} required
          onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Date of Birth</label>
        <input type="date" value={form.dob || ""} required
          onChange={e => setForm({ ...form, dob: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Gender</label>
        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={selectCls}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Phone Number</label>
        <input placeholder="Phone number" value={form.phone} required
          onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Email Address</label>
        <input type="email" placeholder="Email (optional)" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Medical Condition</label>
        <input placeholder="e.g. Hypertension" value={form.condition}
          onChange={e => setForm({ ...form, condition: e.target.value })} className={inputCls} />
      </div>
    </div>
  );
}
