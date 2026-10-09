import React from 'react';
import { User, AtSign, Lock, RefreshCw, Save, Eye, EyeOff } from 'lucide-react';
import { PatientInfo, UserProfile, SettingsSubTab } from './types';

interface PatientForm {
  name: string; email: string; phoneNumber: string;
  address: string; dob: string; gender: string;
}
interface UserForm { fullName: string; email: string; phone: string; }
interface Passwords { current: string; next: string; confirm: string; }

interface Props {
  patient:         PatientInfo | null;
  displayName:     string;
  initials:        string;
  patientForm:     PatientForm;
  setPatientForm:  (v: PatientForm | ((p: PatientForm) => PatientForm)) => void;
  userProfile:     UserProfile | null;
  userForm:        UserForm;
  setUserForm:     (v: UserForm | ((p: UserForm) => UserForm)) => void;
  passwords:       Passwords;
  setPasswords:    (v: Passwords | ((p: Passwords) => Passwords)) => void;
  showCurrentPass: boolean; setShowCurrentPass: (v: boolean) => void;
  showNewPass:     boolean; setShowNewPass:     (v: boolean) => void;
  showConfirmPass: boolean; setShowConfirmPass: (v: boolean) => void;
  settingsSubTab:  SettingsSubTab;
  setSettingsSubTab: (t: SettingsSubTab) => void;
  settingsSaving:  boolean;
  settingsMsg:     { text: string; ok: boolean } | null;
  handleSaveProfile:  (e: React.FormEvent) => void;
  handleSaveAccount:  (e: React.FormEvent) => void;
  handleSavePassword: (e: React.FormEvent) => void;
}

const INPUT = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium';
const INPUT_DISABLED = 'w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-medium';
const LABEL = 'block text-xs font-semibold text-slate-500 mb-1.5';

export default function SettingsTab({
  patient, displayName, initials,
  patientForm, setPatientForm,
  userProfile, userForm, setUserForm,
  passwords, setPasswords,
  showCurrentPass, setShowCurrentPass,
  showNewPass,     setShowNewPass,
  showConfirmPass, setShowConfirmPass,
  settingsSubTab, setSettingsSubTab,
  settingsSaving, settingsMsg,
  handleSaveProfile, handleSaveAccount, handleSavePassword,
}: Props) {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          {userProfile?.username && (
            <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              @{userProfile.username}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-0.5">Manage your profile, account details, and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Left sub-nav */}
        <div className="md:col-span-1 space-y-1">
          {([
            { id: 'profile',  label: 'Patient Profile',    icon: User   },
            { id: 'account',  label: 'Account Details',    icon: AtSign },
            { id: 'security', label: 'Security & Password', icon: Lock  },
          ] as { id: SettingsSubTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSettingsSubTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                settingsSubTab === id
                  ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
              }`}>
              <Icon size={16} className={settingsSubTab === id ? 'text-blue-600' : 'text-slate-400'} />
              {label}
            </button>
          ))}
        </div>

        {/* Right content panel */}
        <div className="md:col-span-3 bg-white border border-slate-200/70 shadow-sm rounded-2xl overflow-hidden">
          <form
            onSubmit={
              settingsSubTab === 'security' ? handleSavePassword :
              settingsSubTab === 'account'  ? handleSaveAccount  :
              handleSaveProfile
            }
            className="p-6 space-y-6"
          >

            {/* ── Patient Profile ── */}
            {settingsSubTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Patient Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update your clinical record details stored in ClinicFlow.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-inner shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {patient?.mrn && patient.mrn !== '—' ? `MRN: ${patient.mrn}` : 'MRN not assigned'}
                    </p>
                    {patient?.condition && (
                      <span className="mt-1 inline-block text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                        {patient.condition}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Full Name</label>
                    <input type="text" value={patientForm.name}
                      onChange={e => setPatientForm(f => ({ ...f, name: e.target.value }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Gender</label>
                    <select value={patientForm.gender}
                      onChange={e => setPatientForm(f => ({ ...f, gender: e.target.value }))}
                      className={INPUT + ' appearance-none'}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Email Address</label>
                    <input type="email" value={patientForm.email}
                      onChange={e => setPatientForm(f => ({ ...f, email: e.target.value }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Phone Number</label>
                    <input type="text" value={patientForm.phoneNumber}
                      onChange={e => setPatientForm(f => ({ ...f, phoneNumber: e.target.value }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Date of Birth</label>
                    <input type="date" value={patientForm.dob}
                      onChange={e => setPatientForm(f => ({ ...f, dob: e.target.value }))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Address</label>
                    <input type="text" value={patientForm.address}
                      onChange={e => setPatientForm(f => ({ ...f, address: e.target.value }))}
                      className={INPUT} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Account Details ── */}
            {settingsSubTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update your login account information in user-service.</p>
                </div>

                {!userProfile ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading account details…
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={LABEL}>Username</label>
                      <input disabled value={userProfile.username} className={INPUT_DISABLED} />
                    </div>
                    <div>
                      <label className={LABEL}>Full Name</label>
                      <input type="text" value={userForm.fullName}
                        onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))}
                        className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Role</label>
                      <input disabled value={userProfile.role} className={INPUT_DISABLED} />
                    </div>
                    <div>
                      <label className={LABEL}>Email Address</label>
                      <input type="email" value={userForm.email}
                        onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                        className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Phone Number</label>
                      <input type="text" value={userForm.phone}
                        onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))}
                        className={INPUT} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Security & Password ── */}
            {settingsSubTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Password Update</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Use a long, unique password you don't use elsewhere.</p>
                </div>
                <div className="space-y-4 max-w-md">

                  {[
                    { label: 'Current Password', key: 'current' as const, show: showCurrentPass, setShow: setShowCurrentPass },
                    { label: 'New Password',      key: 'next'    as const, show: showNewPass,     setShow: setShowNewPass     },
                    { label: 'Confirm New Password', key: 'confirm' as const, show: showConfirmPass, setShow: setShowConfirmPass },
                  ].map(({ label, key, show, setShow }) => (
                    <div key={key}>
                      <label className={LABEL}>{label}</label>
                      <div className="relative">
                        <input type={show ? 'text' : 'password'} placeholder="••••••••"
                          value={passwords[key]}
                          onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 pr-10 text-xs focus:outline-none focus:ring-2 transition-all ${
                            key === 'confirm' && passwords.confirm && passwords.next !== passwords.confirm
                              ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-400'
                              : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`} />
                        <button type="button" onClick={() => setShow(!show)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {key === 'confirm' && passwords.confirm && passwords.next !== passwords.confirm && (
                        <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs">
                {settingsMsg && (
                  <span className={settingsMsg.ok ? 'text-emerald-600' : 'text-rose-500'}>
                    {settingsMsg.text}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button"
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={settingsSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors disabled:opacity-60">
                  <Save size={14} />
                  {settingsSaving ? 'Saving…' : settingsSubTab === 'security' ? 'Update Password' : 'Save Changes'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
