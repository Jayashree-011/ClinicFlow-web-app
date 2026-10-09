import React, { useEffect, useState } from 'react';
import { User, Building, Shield, Bell, Save, Upload, Eye, EyeOff } from 'lucide-react';
import { fetchUserProfile, getCookie, saveUserProfile } from '../services/api';

function Settings() {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    current: '',
    next:    '',
    confirm: '',
  });

  const [profile, setProfile] = useState({
    name:      '',
    username:  '',
    email:     '',
    phone:     '',
    role:      '',
    clinicName: 'ClinicFlow Healthcare Center',
    address:    '123 Medical Park, Sector 5',
    city:       'Kolkata',
    notifications: {
      emailAlerts:          true,
      appointmentReminders: true,
      billingUpdates:       false,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUserProfile();
        setProfile(prev => ({
          ...prev,
          name:       data.fullName   || '',
          username:   data.username   || '',
          email:      data.email      || '',
          phone:      data.phone      || '',
          role:       data.role       || '',
          clinicName: data.clinicName ?? prev.clinicName,
          address:    data.address    ?? prev.address,
          city:       data.city       ?? prev.city,
          notifications: {
            emailAlerts:          data.notifEmailAlerts  ?? prev.notifications.emailAlerts,
            appointmentReminders: data.notifAppointments ?? prev.notifications.appointmentReminders,
            billingUpdates:       data.notifBilling      ?? prev.notifications.billingUpdates,
          },
        }));
        document.cookie = `name=${encodeURIComponent(data.fullName)}; path=/; expires=${
          new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
        }; SameSite=Lax`;
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (key: string) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key as keyof typeof prev.notifications],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveUserProfile({
        username:          getCookie('username') || '',
        password:          '',
        fullName:          profile.name,
        email:             profile.email,
        phone:             profile.phone,
        role:              profile.role,
        oldPassword:       getCookie('password') || '',
        clinicName:        profile.clinicName,
        address:           profile.address,
        city:              profile.city,
        notifEmailAlerts:  profile.notifications.emailAlerts,
        notifAppointments: profile.notifications.appointmentReminders,
        notifBilling:      profile.notifications.billingUpdates,
      });
      setSaveMsg('Settings saved successfully.');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Clear password fields whenever the user leaves the Security tab
  useEffect(() => {
    if (activeSubTab !== 'security') {
      setPasswords({ current: '', next: '', confirm: '' });
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    }
  }, [activeSubTab]);

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);

    if (!passwords.current) {
      setSaveMsg('Please enter your current password.');
      return;
    }
    if (!passwords.next) {
      setSaveMsg('Please enter a new password.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setSaveMsg('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({
        username:    getCookie('username') || '',
        password:    passwords.next,
        fullName:    profile.name,
        email:       profile.email,
        phone:       profile.phone,
        role:        profile.role,
        oldPassword: passwords.current,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setSaveMsg('Password updated successfully.');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg('Failed to update password. Check your current password and try again.');
    } finally {
      setSaving(false);
    }
  };

  const subTabs = [
    { id: 'profile',       label: 'Account Profile',    icon: User },
    { id: 'clinic',        label: 'Clinic Information', icon: Building },
    { id: 'security',      label: 'Security & Password', icon: Shield },
    { id: 'notifications', label: 'Notifications',       icon: Bell },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto font-sans text-slate-600 text-center antialiased">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage your personal preferences, clinic setup, and account security.</p>
        </div>
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans text-slate-600 antialiased">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          {profile.username && (
            <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              @{profile.username}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-0.5">Manage your personal preferences, clinic setup, and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Left sub-nav */}
        <div className="md:col-span-1 space-y-1">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right content panel */}
        <div className="md:col-span-3 bg-white border border-slate-200/70 shadow-sm rounded-2xl overflow-hidden">
          <form onSubmit={activeSubTab === 'security' ? handlePasswordSave : handleSave} className="p-6 space-y-6">

            {/* ── PROFILE ─────────────────────────────────────────────────── */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update your personal account credentials and profile visual card.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-inner">
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                      <Upload size={14} /> Upload photo
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                    <input type="text" name="name" value={profile.name} onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role / Position</label>
                    <input disabled type="text" name="role" value={profile.role}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                    <input type="email" name="email" value={profile.email} onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
                    <input type="text" name="phone" value={profile.phone} onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                  </div>
                </div>
              </div>
            )}

            {/* ── CLINIC INFO ──────────────────────────────────────────────── */}
            {activeSubTab === 'clinic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clinic Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure institutional address lines displaying on system invoices.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Clinic Name</label>
                    <input type="text" name="clinicName" value={profile.clinicName} onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Street Address</label>
                    <input type="text" name="address" value={profile.address} onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">City</label>
                      <input type="text" name="city" value={profile.city} onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Country</label>
                      <input disabled type="text" value="India"
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-medium" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ─────────────────────────────────────────────────── */}
            {activeSubTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Password Update</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ensure your account is using a long, unique password you don't use elsewhere.</p>
                </div>
                <div className="space-y-4 max-w-md">

                  {/* Current password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setShowCurrentPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwords.next}
                        onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setShowNewPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm new password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 transition-all ${
                          passwords.confirm && passwords.next !== passwords.confirm
                            ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-400'
                            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwords.confirm && passwords.next !== passwords.confirm && (
                      <p className="text-[11px] text-rose-500 mt-1 ml-0.5">Passwords do not match</p>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ────────────────────────────────────────────── */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notification Channels</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle system broadcast items and dispatch logs routing to email parameters.</p>
                </div>
                <div className="space-y-4 divide-y divide-slate-100">
                  {[
                    { key: 'emailAlerts',          label: 'Critical System Alerts',      desc: 'Receive immediate warnings for insurance claim rejections or profile edits.' },
                    { key: 'appointmentReminders',  label: 'Appointment Confirmations',   desc: 'Dispatch automated schedules logs directly down to incoming checking staff panels.' },
                    { key: 'billingUpdates',        label: 'Invoice Status Messages',     desc: 'Get notified instantly when customer payments clear insurance network pipelines.' },
                  ].map(({ key, label, desc }, i) => (
                    <div key={key} className={`flex items-center justify-between ${i > 0 ? 'pt-4' : 'pt-1'}`}>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      <input type="checkbox"
                        checked={profile.notifications[key as keyof typeof profile.notifications]}
                        onChange={() => handleToggleChange(key)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs">
                {saveMsg && (
                  <span className={saveMsg.startsWith('Failed') ? 'text-rose-500' : 'text-emerald-600'}>
                    {saveMsg}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button"
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors disabled:opacity-60">
                  <Save size={14} />
                  {saving
                    ? 'Saving…'
                    : activeSubTab === 'security' ? 'Update Password' : 'Save Configuration'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;
