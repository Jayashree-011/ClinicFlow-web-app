import React from 'react';
import { Calendar, Activity, CheckCircle, AlertCircle, ChevronRight, User, Mail, Phone, MapPin } from 'lucide-react';
import { PatientInfo, Appointment, Encounter, Invoice, ActiveTab } from './types';
import { fmtDate, apptStatusCls, Empty } from './utils';

interface Props {
  patient:        PatientInfo | null;
  displayName:    string;
  initials:       string;
  appointments:   Appointment[];
  encounters:     Encounter[];
  invoices:       Invoice[];
  totalPaid:      number;
  totalPending:   number;
  upcomingAppts:  Appointment[];
  setActiveTab:   (tab: ActiveTab) => void;
}

export default function OverviewTab({
  patient, displayName, initials, appointments, encounters,
  invoices, totalPaid, totalPending, upcomingAppts, setActiveTab,
}: Props) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {displayName.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's a summary of your health activity.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Upcoming Appointments', value: upcomingAppts.length,          icon: Calendar,     color: 'text-blue-600',    bg: 'bg-blue-50',    sub: 'scheduled',        tab: 'appointments' as ActiveTab },
          { label: 'Total Visits',           value: encounters.length,             icon: Activity,     color: 'text-purple-600',  bg: 'bg-purple-50',  sub: 'encounters',       tab: 'records'      as ActiveTab },
          { label: 'Amount Paid',            value: `₹${totalPaid.toFixed(2)}`,    icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'settled invoices', tab: 'billing'      as ActiveTab },
          { label: 'Amount Due',             value: `₹${totalPending.toFixed(2)}`, icon: AlertCircle,  color: 'text-amber-600',   bg: 'bg-amber-50',   sub: 'pending payment',  tab: 'billing'      as ActiveTab },
        ].map(({ label, value, icon: Icon, color, bg, sub, tab }) => (
          <button
            key={label}
            onClick={() => setActiveTab(tab)}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left w-full cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all group"
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
            <p className={`text-[11px] mt-0.5 ${color} font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>View details →</p>
          </button>
        ))}
      </div>

      {/* Profile card + recent appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{displayName}</h3>
              <p className="text-xs text-slate-400">{patient?.mrn || 'MRN not available'}</p>
              {patient?.condition && (
                <span className="mt-1 inline-block text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                  {patient.condition}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: User,   label: patient?.gender      || '—' },
              { icon: Mail,   label: patient?.email       || '—' },
              { icon: Phone,  label: patient?.phoneNumber || '—' },
              { icon: MapPin, label: patient?.address     || '—' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-xs text-slate-600">
                <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Appointments</h3>
            <button onClick={() => setActiveTab('appointments')}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {appointments.length === 0 ? (
            <Empty message="No appointments yet" sub="Your upcoming appointments will appear here." />
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map(a => (
                <div key={a.appointmentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{a.serviceType || a.department || 'Appointment'}</p>
                      <p className="text-[11px] text-slate-400">{a.department} · {fmtDate(a.startAt)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${apptStatusCls(a.status)}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
