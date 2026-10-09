import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { getCookie } from '../services/client';
import { AppointmentView } from '../services/appointments';

import { Sidebar } from './Sidebar';
import Dashboard from './Dashboard';
import { Patients } from './Patients';
import { Appointments } from './Appointments';
import Billing from './Billing';
import { Teams } from './Doctors';
import { Staff } from './Staff';
import { Users } from './Users';
import { RecordsSection } from './RecordsSection';
import { Lab } from './Lab';
import { PharmacyComponent as Pharmacy } from './PharmacyComponent';
import { PrescriptionModule as Prescription } from './Prescription';
import { Encounters } from './Encounters';
import Settings from './Settings';
import Help from './Help';
import Notifications from './Notifications';
import { getUnreadCount } from '../services/notifications';

export type Patient = {
  id: number;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  condition: string;
  lastVisit: string;
};

type Status = "Pending" | "Confirmed" | "In Progress" | "Cancelled";

export type Appointment = {
  id: number;
  patient: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: Status;
  duration?: string;
};

export type Encounter = {
  id: number;
  patientId: number | null;
  patientName: string;
  reason: string;
  notes?: string;
  date: string;
};

export function CentralDashboard({ tabList }: { tabList: string[] }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);

  const [usersInitialSearch,    setUsersInitialSearch]    = useState<string>('');
  const [pendingBookingPatient, setPendingBookingPatient] = useState<string | null>(null);
  const [pendingEncounterData, setPendingEncounterData] = useState<{
    patientId: number; patientName: string; visitType: string; doctorId?: number;
  } | null>(null);
  const [pendingPrescriptionData, setPendingPrescriptionData] = useState<{
    encounterId: number; patientId: number; doctorId?: number; mode: 'view' | 'add';
  } | null>(null);

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const raw = localStorage.getItem('clinicflow_patients');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const raw = localStorage.getItem('clinicflow_appointments');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [encounters, setEncounters] = useState<Encounter[]>(() => {
    try {
      const raw = localStorage.getItem('clinicflow_encounters');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState(true);

  // Poll unread notification count every 60 s
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {}
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Clear badge when user opens the notification panel
  useEffect(() => {
    if (activeTab === 'notification') setUnreadCount(0);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [pResult, aResult] = await Promise.allSettled([
          api.getPatients(),
          api.getAppointments(),
        ]);

        if (mounted) {
          if (pResult.status === 'fulfilled' && Array.isArray(pResult.value)) {
            setPatients(prev => {
              const map = new Map(prev.map(p => [p.id, p]));
              (pResult.value as Patient[]).forEach(p => map.set(p.id, p));
              return Array.from(map.values());
            });
          }
          if (aResult.status === 'fulfilled' && Array.isArray(aResult.value)) {
            setAppointments((aResult.value as AppointmentView[]).map(a => ({
              id:         a.id,
              patient:    a.patient,
              department: a.department,
              doctor:     a.doctor,
              date:       a.date,
              time:       a.time,
              type:       a.type,
              status:     a.status as Status,
            })));
          }
        }
      } catch {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('clinicflow_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('clinicflow_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('clinicflow_encounters', JSON.stringify(encounters));
  }, [encounters]);

  const addPatient = (patient: Partial<Patient>) => {
    if (!patient.name?.trim() || !patient.phone?.trim()) return;
    setPatients(prev => [
      ...prev,
      {
        id: Date.now(),
        name: patient.name || '',
        dob: patient.dob || '',
        gender: patient.gender || 'Male',
        phone: patient.phone || '',
        address: patient.address || '',
        email: patient.email || '',
        condition: patient.condition || '',
        lastVisit: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const addAppointment = (appointment: Partial<Appointment>) => {
    if (!appointment.patient?.trim() || !appointment.date) return;
    setAppointments(prev => [
      ...prev,
      {
        id: Date.now(),
        patient: appointment.patient || '',
        department: appointment.department || '',
        doctor: appointment.doctor || '',
        date: appointment.date || '',
        time: appointment.time || '',
        type: appointment.type || 'General',
        status: 'Confirmed',
        duration: '30 min',
      },
    ]);
    setActiveTab('appointments');
  };

  const handleContextualBooking = (patientName: string) => {
    setPendingBookingPatient(patientName);
    setActiveTab('appointments');
  };

  const clearPendingBooking = () => setPendingBookingPatient(null);

  const SERVICE_TO_VISIT_TYPE: Record<string, string> = {
    "General Checkup": "Routine Check-up",
    "Lab Review":      "Consultation",
  };

  const handleStartEncounter = (data: { patientId: number; patientName: string; visitType: string; doctorId: number }) => {
    setPendingEncounterData({
      ...data,
      visitType: SERVICE_TO_VISIT_TYPE[data.visitType] ?? data.visitType,
    });
    setActiveTab('encounters');
  };

  const handleGoToPrescription = (encounterId: number, patientId: number, mode: 'view' | 'add', doctorId?: number) => {
    setPendingPrescriptionData({ encounterId, patientId, doctorId, mode });
    setActiveTab('prescription');
  };

  const createEncounter = async (payload: Partial<Encounter>) => {
    const doctorId = parseInt(getCookie('userId') || '1', 10);
    try {
      const created = await api.createEncounter({
        patientId: payload.patientId,
        doctorId,
        visitType: 'General',
        chiefComplaint: payload.reason || 'General consultation',
        notes: payload.notes ? { notes: payload.notes } : null,
        startAt: new Date().toISOString().slice(0, 19),
      });
      setEncounters(prev => [
        ...prev,
        {
          id: created.encounterId || created.id || Date.now(),
          patientId: payload.patientId ?? null,
          patientName: payload.patientName || 'Unknown',
          reason: payload.reason || '',
          notes: payload.notes,
          date: new Date(created.startAt).toISOString().split('T')[0],
        },
      ]);
    } catch {
      setEncounters(prev => [
        ...prev,
        {
          id: Date.now(),
          patientId: payload.patientId ?? null,
          patientName: payload.patientName || 'Unknown',
          reason: payload.reason || '',
          notes: payload.notes,
          date: new Date().toISOString().split('T')[0],
        },
      ]);
    }
  };

  const handleLogout = () => {
    ['token', 'role', 'userId', 'username', 'name', 'userEmail', 'password'].forEach(n => {
      document.cookie = `${n}=; path=/; expires=${new Date(0).toUTCString()}`;
    });
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard onNavigate={setActiveTab} />;
      case 'patients':
        return (
          <Patients
            patients={patients}
            setPatients={setPatients}
            appointments={appointments}
            addAppointment={addAppointment}
            onDirectBook={handleContextualBooking}
          />
        );
      case 'appointments':
        return (
          <Appointments
            appointments={appointments}
            setAppointments={setAppointments}
            onAddAppointment={addAppointment}
            selectedPatient={pendingBookingPatient}
            clearSelectedPatient={clearPendingBooking}
            onStartEncounter={handleStartEncounter}
          />
        );
      case 'encounters':
        return (
          <Encounters
            patients={patients}
            currentDoctorId={parseInt(getCookie('userId') || '1', 10)}
            prefillEncounter={pendingEncounterData}
            clearPrefillEncounter={() => setPendingEncounterData(null)}
            onGoToPrescription={handleGoToPrescription}
          />
        );
      case 'billing':      return <Billing />;
      case 'doctors':      return <Teams />;
      case 'staff':        return (
        <Staff
          onNavigateToUsers={(name) => {
            setUsersInitialSearch(name);
            setActiveTab('users');
          }}
        />
      );
      case 'users':        return (
        <Users
          initialSearch={usersInitialSearch}
          onClearSearch={() => setUsersInitialSearch('')}
        />
      );
      case 'records':      return <RecordsSection />;
      case 'lab':          return <Lab />;
      case 'pharmacy':     return <Pharmacy readOnly={getCookie('role') === 'Clinician'} />;
      case 'prescription':
        return (
          <Prescription
            prefillEncounterId={pendingPrescriptionData?.encounterId}
            prefillPatientId={pendingPrescriptionData?.patientId}
            prefillDoctorId={pendingPrescriptionData?.doctorId}
            autoOpenCreate={pendingPrescriptionData?.mode === 'add'}
            clearPrefill={() => setPendingPrescriptionData(null)}
          />
        );
      case 'notification':  return <Notifications />;
      case 'settings':     return <Settings />;
      case 'help':         return <Help />;
      default:             return <ComingSoon title={activeTab.toUpperCase()} />;
    }
  };

  if (loading) {
    return <div className="p-4 text-lg">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
      <Sidebar
        tabList={tabList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        unreadNotifications={unreadCount}
      />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-600">This section is coming soon!</p>
      </div>
    </div>
  );
}
