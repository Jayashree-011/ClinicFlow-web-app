import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Calendar, FileText, CreditCard, LogOut,
  AlertCircle, RefreshCw, Settings, HelpCircle,
  Users, FlaskConical,
} from 'lucide-react';
import axiosInstance, { getCookie } from '../../services/client';

import {
  PatientInfo, Appointment, Invoice, Payment, Encounter,
  PatientPrescription, UserProfile, FamilyMember, LabOrder, LabResult,
  ActiveTab, SettingsSubTab,
} from './types';

import OverviewTab      from './OverviewTab';
import AppointmentsTab  from './AppointmentsTab';
import RecordsTab       from './RecordsTab';
import BillingTab       from './BillingTab';
import LabResultsTab    from './LabResultsTab';
import FamilyTab        from './FamilyTab';
import SettingsTab      from './SettingsTab';
import HelpTab          from './HelpTab';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // ── Core data ──────────────────────────────────────────────────────────────
  const [patientId,    setPatientId]    = useState<number | null>(null);
  const [patient,      setPatient]      = useState<PatientInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [encounters,   setEncounters]   = useState<Encounter[]>([]);
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [payments,     setPayments]     = useState<Payment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ── Settings ───────────────────────────────────────────────────────────────
  const [settingsSubTab,  setSettingsSubTab]  = useState<SettingsSubTab>('profile');
  const [settingsSaving,  setSettingsSaving]  = useState(false);
  const [settingsMsg,     setSettingsMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [patientForm,     setPatientForm]     = useState({ name: '', email: '', phoneNumber: '', address: '', dob: '', gender: '' });
  const [userProfile,     setUserProfile]     = useState<UserProfile | null>(null);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const [userForm,        setUserForm]        = useState({ fullName: '', email: '', phone: '' });
  const [passwords,       setPasswords]       = useState({ current: '', next: '', confirm: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ── Family ─────────────────────────────────────────────────────────────────
  const [familyMembers,  setFamilyMembers]  = useState<FamilyMember[]>([]);
  const [familyLoaded,   setFamilyLoaded]   = useState(false);
  const [showAddMember,  setShowAddMember]  = useState(false);
  const [memberSaving,   setMemberSaving]   = useState(false);
  const [memberError,    setMemberError]    = useState('');
  const [memberSuccess,  setMemberSuccess]  = useState('');
  const [newMember,      setNewMember]      = useState({ name: '', relationship: '', dob: '', gender: '', email: '', phone: '' });

  // ── Prescriptions ─────────────────────────────────────────────────────────
  const [prescriptions,       setPrescriptions]       = useState<PatientPrescription[]>([]);
  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // ── Lab ────────────────────────────────────────────────────────────────────
  const [labOrders,        setLabOrders]        = useState<LabOrder[]>([]);
  const [labLoaded,        setLabLoaded]        = useState(false);
  const [labResults,       setLabResults]       = useState<Record<number, LabResult[]>>({});
  const [labResultLoading, setLabResultLoading] = useState<Record<number, boolean>>({});
  const [expandedOrder,    setExpandedOrder]    = useState<number | null>(null);

  // ── Step 1: resolve patient identity on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      let uid: number | null = null;
      try {
        const cookieRaw = getCookie('userId');
        const parsed = cookieRaw ? Number(cookieRaw) : NaN;
        if (!isNaN(parsed) && parsed > 0) {
          uid = parsed;
        } else {
          const meRes = await axiosInstance.get('/auth/user/me');
          uid = meRes.data?.id ?? null;
        }
      } catch { /* fall through */ }

      if (uid) {
        try {
          const pRes = await axiosInstance.post('/consultation/patient/resolve', {
            userId: uid,
            name:   getCookie('name')      || '',
            email:  getCookie('userEmail') || '',
          });
          setPatient(pRes.data);
          setPatientId(pRes.data.id);
          return;
        } catch { /* fall through */ }
      }

      const cookieName = getCookie('name');
      if (cookieName) {
        setPatient({ id: 0, name: cookieName, mrn: '—', dob: '', gender: '', email: getCookie('userEmail') || '', phoneNumber: '', address: '', condition: '', status: 'ACTIVE' });
        setLoading(false);
      } else {
        setError('Session expired. Please sign in again.');
        setLoading(false);
      }
    })();
  }, []);

  // ── Step 2: fetch appointments, encounters, billing ────────────────────────
  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      try {
        const r = await axiosInstance.get(`/consultation/patient/${patientId}/appointments`);
        setAppointments(Array.isArray(r.data)
          ? r.data.map((a: any) => ({
              ...a,
              appointmentId: a.appointmentId ?? a.id,
              clinicianId:   a.clinicianId   ?? a.doctorId,
            }))
          : []);
      } catch { setAppointments([]); }

      try {
        const r = await axiosInstance.get(`/encounter/patient/${patientId}`);
        setEncounters(Array.isArray(r.data) ? r.data : []);
      } catch { setEncounters([]); }

      try {
        const r = await axiosInstance.get(`/billing/invoices/patient/${patientId}`);
        const invs: Invoice[] = Array.isArray(r.data) ? r.data : [];
        setInvoices(invs);
        const payArrays = await Promise.all(
          invs.map(inv =>
            axiosInstance.get(`/billing/payments/invoice/${inv.invoiceId}`)
              .then(r => (Array.isArray(r.data) ? r.data : []))
              .catch(() => [])
          )
        );
        setPayments((payArrays as Payment[][]).flat());
      } catch { setInvoices([]); setPayments([]); }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // ── Silent refresh (no loading spinner — used for polling & tab-switch) ───
  const refreshData = useCallback(async () => {
    if (!patientId) return;
    try {
      try {
        const r = await axiosInstance.get(`/consultation/patient/${patientId}/appointments`);
        setAppointments(Array.isArray(r.data)
          ? r.data.map((a: any) => ({
              ...a,
              appointmentId: a.appointmentId ?? a.id,
              clinicianId:   a.clinicianId   ?? a.doctorId,
            }))
          : []);
      } catch { /* keep existing */ }

      try {
        const r = await axiosInstance.get(`/encounter/patient/${patientId}`);
        setEncounters(Array.isArray(r.data) ? r.data : []);
      } catch { /* keep existing */ }

      try {
        const r = await axiosInstance.get(`/billing/invoices/patient/${patientId}`);
        const invs: Invoice[] = Array.isArray(r.data) ? r.data : [];
        setInvoices(invs);
        const payArrays = await Promise.all(
          invs.map(inv =>
            axiosInstance.get(`/billing/payments/invoice/${inv.invoiceId}`)
              .then(r => (Array.isArray(r.data) ? r.data : []))
              .catch(() => [])
          )
        );
        setPayments((payArrays as Payment[][]).flat());
      } catch { /* keep existing */ }
    } catch { /* silent fail */ }
  }, [patientId]);

  useEffect(() => { if (patientId) fetchAll(); }, [patientId, fetchAll]);

  // ── Auto-refresh every 30 s (silent — keeps stats current) ───────────────
  useEffect(() => {
    if (!patientId) return;
    const id = setInterval(() => refreshData(), 30_000);
    return () => clearInterval(id);
  }, [patientId, refreshData]);

  // ── Re-fetch when the user returns to the Overview tab ────────────────────
  useEffect(() => {
    if (activeTab === 'overview' && patientId) refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Family: lazy-load on first open ───────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'family' || familyLoaded) return;
    const cookieUid = getCookie('userId');
    if (!cookieUid) return;
    setFamilyLoaded(true);
    axiosInstance.get(`/consultation/patient/family/${cookieUid}`)
      .then(r => setFamilyMembers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setFamilyMembers([]));
  }, [activeTab, familyLoaded]);

  // ── Prescriptions: lazy-load when records tab is opened ───────────────────
  useEffect(() => {
    if (activeTab !== 'records' || prescriptionsLoaded || !patientId) return;
    setPrescriptionsLoaded(true);
    setPrescriptionsLoading(true);
    axiosInstance.get(`/prescriptions/patient/${patientId}`)
      .then(r => setPrescriptions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPrescriptions([]))
      .finally(() => setPrescriptionsLoading(false));
  }, [activeTab, prescriptionsLoaded, patientId]);

  const refreshPrescriptions = () => {
    if (!patientId) return;
    setPrescriptionsLoaded(false);
    setPrescriptions([]);
    setPrescriptionsLoading(true);
    axiosInstance.get(`/prescriptions/patient/${patientId}`)
      .then(r => setPrescriptions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPrescriptions([]))
      .finally(() => { setPrescriptionsLoading(false); setPrescriptionsLoaded(true); });
  };

  // ── Lab: lazy-load on first open ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'lab' || labLoaded || !patientId) return;
    setLabLoaded(true);
    axiosInstance.get(`/lab/orders/patient/${patientId}`)
      .then(r => setLabOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLabOrders([]));
  }, [activeTab, labLoaded, patientId]);

  // ── Settings: sync patient form + fetch user profile ──────────────────────
  useEffect(() => {
    if (activeTab !== 'settings') return;
    setPatientForm({
      name: patient?.name || '', email: patient?.email || '',
      phoneNumber: patient?.phoneNumber || '', address: patient?.address || '',
      dob: patient?.dob || '', gender: patient?.gender || '',
    });
  }, [activeTab, patient]);

  useEffect(() => {
    if (activeTab !== 'settings' || userProfileLoaded) return;
    setUserProfileLoaded(true);
    axiosInstance.get('/auth/user/me')
      .then(r => {
        const up: UserProfile = { username: r.data.username || getCookie('username') || '', fullName: r.data.fullName || '', email: r.data.email || '', phone: r.data.phone || '', role: r.data.role || 'Patient' };
        setUserProfile(up);
        setUserForm({ fullName: up.fullName, email: up.email, phone: up.phone });
      })
      .catch(() => {
        const up: UserProfile = { username: getCookie('username') || '', fullName: getCookie('name') || '', email: getCookie('userEmail') || '', phone: '', role: 'Patient' };
        setUserProfile(up);
        setUserForm({ fullName: up.fullName, email: up.email, phone: up.phone });
      });
  }, [activeTab, userProfileLoaded]);

  useEffect(() => {
    if (settingsSubTab !== 'security') {
      setPasswords({ current: '', next: '', confirm: '' });
      setShowCurrentPass(false); setShowNewPass(false); setShowConfirmPass(false);
    }
    setSettingsMsg(null);
  }, [settingsSubTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogout = () => {
    ['token', 'role', 'userId', 'username', 'name', 'userEmail'].forEach(n => {
      document.cookie = `${n}=; path=/; expires=${new Date(0).toUTCString()}`;
    });
    navigate('/login');
  };

  const handleDownloadPdf = async (invoiceId: number) => {
    try {
      const res = await axiosInstance.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice_${invoiceId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF not available.'); }
  };

  const handleToggleOrder = async (orderId: number) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);
    if (labResults[orderId] !== undefined) return;
    setLabResultLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const r = await axiosInstance.get(`/lab/results/order/${orderId}`);
      setLabResults(prev => ({ ...prev, [orderId]: Array.isArray(r.data) ? r.data : [] }));
    } catch {
      setLabResults(prev => ({ ...prev, [orderId]: [] }));
    } finally {
      setLabResultLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) { setMemberError('Name is required.'); return; }
    const cookieUid = getCookie('userId');
    if (!cookieUid) { setMemberError('Session expired. Please sign in again.'); return; }
    setMemberSaving(true); setMemberError(''); setMemberSuccess('');
    try {
      const res = await axiosInstance.post('/consultation/patient/register', {
        name: newMember.name.trim(), relationship: newMember.relationship,
        dob: newMember.dob || null, gender: newMember.gender,
        email: newMember.email, phoneNumber: newMember.phone,
        registeredByUserId: Number(cookieUid),
      });
      setFamilyMembers(prev => [...prev, res.data]);
      setNewMember({ name: '', relationship: '', dob: '', gender: '', email: '', phone: '' });
      setShowAddMember(false);
      setMemberSuccess('Family member added successfully.');
      setTimeout(() => setMemberSuccess(''), 3000);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Failed to add member.';
      setMemberError(typeof msg === 'string' ? msg : 'Failed to add member.');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Remove this family member?')) return;
    try {
      await axiosInstance.delete(`/consultation/patient/${memberId}`);
      setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
    } catch { alert('Failed to remove member. Please try again.'); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setSettingsSaving(true); setSettingsMsg(null);
    try {
      const res = await axiosInstance.put(`/consultation/patient/${patientId}`, {
        name: patientForm.name, email: patientForm.email,
        phoneNumber: patientForm.phoneNumber, address: patientForm.address,
        dob: patientForm.dob || null, gender: patientForm.gender,
      });
      setPatient(res.data);
      setSettingsMsg({ text: 'Patient profile saved.', ok: true });
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch { setSettingsMsg({ text: 'Failed to save. Please try again.', ok: false }); }
    finally { setSettingsSaving(false); }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSettingsSaving(true); setSettingsMsg(null);
    try {
      await axiosInstance.put('/auth/update', {
        username: userProfile.username, oldPassword: getCookie('password') || '',
        fullName: userForm.fullName, email: userForm.email,
        phone: userForm.phone, role: userProfile.role, password: '',
      });
      setUserProfile(p => p ? { ...p, fullName: userForm.fullName, email: userForm.email, phone: userForm.phone } : p);
      setSettingsMsg({ text: 'Account details saved.', ok: true });
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Failed to save. Please try again.';
      setSettingsMsg({ text: typeof msg === 'string' ? msg : 'Failed to save. Please try again.', ok: false });
    } finally { setSettingsSaving(false); }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSettingsMsg(null);
    if (!passwords.current) { setSettingsMsg({ text: 'Please enter your current password.', ok: false }); return; }
    if (!passwords.next)    { setSettingsMsg({ text: 'Please enter a new password.', ok: false }); return; }
    if (passwords.next !== passwords.confirm) { setSettingsMsg({ text: 'New passwords do not match.', ok: false }); return; }
    setSettingsSaving(true);
    try {
      await axiosInstance.put('/auth/update', {
        username: userProfile.username, oldPassword: passwords.current,
        fullName: userProfile.fullName, email: userProfile.email,
        phone: userProfile.phone, role: userProfile.role, password: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setSettingsMsg({ text: 'Password updated successfully.', ok: true });
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Failed to update password.';
      setSettingsMsg({ text: typeof msg === 'string' ? msg : 'Failed to update password. Check your current password.', ok: false });
    } finally { setSettingsSaving(false); }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalPaid     = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending  = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.totalAmount, 0);
  const upcomingAppts = appointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status?.toUpperCase()));
  const displayName   = patient?.name || getCookie('name') || 'Patient';
  const initials      = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Nav config ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview',     label: 'Overview',     icon: Home         },
    { id: 'appointments', label: 'Appointments', icon: Calendar     },
    { id: 'records',      label: 'Records',      icon: FileText     },
    { id: 'billing',      label: 'Billing',      icon: CreditCard   },
    { id: 'lab',          label: 'Lab Results',  icon: FlaskConical },
    { id: 'family',       label: 'Family',       icon: Users        },
  ] as const;

  const bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: Settings   },
    { id: 'help',     label: 'Help',     icon: HelpCircle },
  ] as const;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading your health dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">

      {/* ── Sidebar ── */}
      <div className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-blue-400">ClinicFlow</h1>
            <p className="text-slate-400 text-xs mt-0.5">Patient Portal</p>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}>
                <Icon size={16} className={activeTab === id ? 'text-white' : 'text-slate-400'} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800">
          <nav className="p-4 space-y-1">
            {bottomNavItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                }`}>
                <Icon size={16} className={activeTab === id ? 'text-white' : 'text-slate-500'} />
                {label}
              </button>
            ))}
          </nav>
          <div className="px-4 pb-4 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">{initials}</div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">{displayName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Patient</p>
                </div>
              </div>
              <button onClick={handleLogout} title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">

        {error && (
          <div className="mx-8 mt-6 flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {activeTab === 'overview'     && <OverviewTab patient={patient} displayName={displayName} initials={initials} appointments={appointments} encounters={encounters} invoices={invoices} totalPaid={totalPaid} totalPending={totalPending} upcomingAppts={upcomingAppts} setActiveTab={setActiveTab} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} patientId={patientId} fetchAll={fetchAll} />}
        {activeTab === 'records'      && <RecordsTab encounters={encounters} prescriptions={prescriptions} prescriptionsLoading={prescriptionsLoading} patientName={displayName} fetchAll={fetchAll} onRefreshRx={refreshPrescriptions} />}
        {activeTab === 'billing'      && <BillingTab invoices={invoices} payments={payments} totalPaid={totalPaid} totalPending={totalPending} patientId={patientId} fetchAll={fetchAll} handleDownloadPdf={handleDownloadPdf} />}
        {activeTab === 'lab'          && <LabResultsTab labOrders={labOrders} labResults={labResults} labResultLoading={labResultLoading} expandedOrder={expandedOrder} handleToggleOrder={handleToggleOrder} onRefresh={() => { setLabLoaded(false); setLabOrders([]); setLabResults({}); setExpandedOrder(null); }} />}
        {activeTab === 'family'       && <FamilyTab familyMembers={familyMembers} showAddMember={showAddMember} memberSaving={memberSaving} memberError={memberError} memberSuccess={memberSuccess} newMember={newMember} setShowAddMember={setShowAddMember} setNewMember={setNewMember} setMemberError={setMemberError} handleAddMember={handleAddMember} handleDeleteMember={handleDeleteMember} />}
        {activeTab === 'settings'     && <SettingsTab patient={patient} displayName={displayName} initials={initials} patientForm={patientForm} setPatientForm={setPatientForm} userProfile={userProfile} userForm={userForm} setUserForm={setUserForm} passwords={passwords} setPasswords={setPasswords} showCurrentPass={showCurrentPass} setShowCurrentPass={setShowCurrentPass} showNewPass={showNewPass} setShowNewPass={setShowNewPass} showConfirmPass={showConfirmPass} setShowConfirmPass={setShowConfirmPass} settingsSubTab={settingsSubTab} setSettingsSubTab={setSettingsSubTab} settingsSaving={settingsSaving} settingsMsg={settingsMsg} handleSaveProfile={handleSaveProfile} handleSaveAccount={handleSaveAccount} handleSavePassword={handleSavePassword} />}
        {activeTab === 'help'         && <HelpTab />}

      </div>
    </div>
  );
}
