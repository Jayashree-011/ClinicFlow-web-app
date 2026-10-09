import React, { useState } from 'react';
import { RefreshCw, Clock, Plus, X, AlertCircle, Calendar } from 'lucide-react';
import { Appointment } from './types';
import { fmtDate, fmtTime, apptStatusCls, TH, Empty } from './utils';
import axiosInstance from '../../services/client';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface Props {
  appointments: Appointment[];
  patientId:    number | null;
  fetchAll:     () => void;
}

const SERVICE_TYPES = [
  'General Consultation',
  'Follow-up',
  'Specialist Visit',
  'Diagnostic',
  'Vaccination',
  'Emergency',
  'Other',
];

const inputCls  = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const selectCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer';

export default function AppointmentsTab({ appointments, patientId, fetchAll }: Props) {

  // ── Book modal state ────────────────────────────────────────────────────────
  const [showModal,    setShowModal]    = useState(false);
  const [doctors,      setDoctors]      = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const [doctorId,     setDoctorId]     = useState('');
  const [serviceType,  setServiceType]  = useState('General Consultation');
  const [date,         setDate]         = useState('');
  const [time,         setTime]         = useState('09:00');
  const [duration,     setDuration]     = useState('30');   // minutes
  const [booking,      setBooking]      = useState(false);
  const [bookError,    setBookError]    = useState('');

  // ── Open modal — load doctors lazily ────────────────────────────────────────
  const openModal = async () => {
    setDoctorId('');
    setServiceType('General Consultation');
    setDate('');
    setTime('09:00');
    setDuration('30');
    setBookError('');
    setShowModal(true);

    if (doctors.length === 0) {
      setDoctorsLoading(true);
      try {
        const res = await axiosInstance.get('/consultation/doctor/list');
        const list: Doctor[] = Array.isArray(res.data)
          ? res.data.map((d: any) => ({
              id:        d.id ?? d.doctorId,
              name:      d.name,
              specialty: d.specialty ?? '',
            }))
          : [];
        setDoctors(list);
        if (list.length > 0) setDoctorId(String(list[0].id));
      } catch {
        /* stay empty — user can type a doctor ID manually if needed */
      } finally {
        setDoctorsLoading(false);
      }
    } else {
      if (!doctorId && doctors.length > 0) setDoctorId(String(doctors[0].id));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setBookError('');
    setBooking(false);
  };

  // ── Submit booking ──────────────────────────────────────────────────────────
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setBookError('Patient session not found. Please log out and back in.'); return; }
    if (!doctorId)  { setBookError('Please select a doctor.'); return; }
    if (!date)      { setBookError('Please choose a date.'); return; }

    setBookError('');
    setBooking(true);

    // Build ISO-like strings without timezone: "yyyy-MM-ddTHH:mm:ss"
    const startAt = `${date}T${time}:00`;
    const endMin  = parseInt(duration || '30', 10);
    const startMs = new Date(startAt).getTime();
    const endDate = new Date(startMs + endMin * 60 * 1000);
    const pad     = (n: number) => String(n).padStart(2, '0');
    const endAt   = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

    try {
      await axiosInstance.post(`/consultation/patient/${patientId}/appointments`, {
        doctorId:    Number(doctorId),
        serviceType,
        startAt,
        endAt,
        status:      'PENDING',
      });
      closeModal();
      fetchAll();   // refresh appointments list
    } catch (err: any) {
      const d = err?.response?.data;
      setBookError(
        d?.message || d?.error || d?.detail ||
        `Error ${err?.response?.status ?? ''}: Failed to book appointment.`
      );
    } finally {
      setBooking(false);
    }
  };

  // ── Minimum date = today ─────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{appointments.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Appointments table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {appointments.length === 0 ? (
          <Empty message="No appointments found" sub="Click 'Book Appointment' to schedule your first visit." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['#', 'Service / Dept', 'Date', 'Time', 'Status'].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {appointments.map(a => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">#{a.appointmentId}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{a.serviceType || '—'}</p>
                      <p className="text-slate-400 text-[11px]">{a.department}</p>
                    </td>
                    <td className="p-4 text-slate-500">{fmtDate(a.startAt)}</td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {fmtTime(a.startAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${apptStatusCls(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Book Appointment Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Book Appointment</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details to schedule a visit.</p>
              </div>
              <button onClick={closeModal}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBook}>
              <div className="p-6 space-y-4">

                {bookError && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {bookError}
                  </div>
                )}

                {/* Doctor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Doctor *</label>
                  {doctorsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading doctors…
                    </div>
                  ) : doctors.length > 0 ? (
                    <select
                      value={doctorId}
                      onChange={e => setDoctorId(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}{d.specialty ? ` — ${d.specialty}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="Enter Doctor ID manually"
                      value={doctorId}
                      onChange={e => setDoctorId(e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>

                {/* Service type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Service Type *</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className={selectCls}
                  >
                    {SERVICE_TYPES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" /> Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      <Clock className="w-3 h-3 inline mr-1" /> Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className={selectCls}
                  >
                    {['15', '30', '45', '60', '90'].map(d => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>

                {/* Summary */}
                {date && time && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(`${date}T${time}`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' at '}
                    {new Date(`${date}T${time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {duration} min
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {booking && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {booking ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
