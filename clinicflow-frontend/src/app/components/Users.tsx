import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Loader2, AlertCircle, User, ChevronDown,
  X, Save, UserPlus, Eye, EyeOff, CheckCircle2, XCircle, Download, Clock,
} from 'lucide-react';
import { getUsers, adminUpdateUser, adminResetPassword, registerUser, suggestUsername, type SystemUser } from '../services/auth';
import { logAdminAction } from '../services/adminAudit';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const ROLES = [
  'Patient', 'Receptionist', 'Clinician',
  'Pharmacy', 'Finance', 'Manager', 'Administrator', 'Auditor',
];

const ROLE_STYLES: Record<string, string> = {
  Administrator: 'bg-violet-100 text-violet-700 border border-violet-200',
  Clinician:     'bg-blue-100 text-blue-700 border border-blue-200',
  Receptionist:  'bg-sky-100 text-sky-700 border border-sky-200',
  Patient:       'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Pharmacy:      'bg-amber-100 text-amber-700 border border-amber-200',
  Finance:       'bg-rose-100 text-rose-700 border border-rose-200',
  Manager:       'bg-indigo-100 text-indigo-700 border border-indigo-200',
  Auditor:       'bg-slate-100 text-slate-700 border border-slate-200',
};
const DEFAULT_ROLE_STYLE = 'bg-gray-100 text-gray-700 border border-gray-200';
const roleStyle = (role: string) => ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE;

function avatarInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-sky-500', 'bg-indigo-500', 'bg-orange-500',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

// Derive a clean base username from a full name: "Dr. John Smith" → "john.smith"
function deriveBase(fullName: string): string {
  return fullName
    .replace(/^Dr\.?\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');
}

// ---------------------------------------------------------------------------
// Create user modal
// ---------------------------------------------------------------------------

interface CreateUserModalProps {
  onClose:   () => void;
  onCreated: () => void;     // caller re-fetches users after success
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email:    '',
    phone:    '',
    role:     'Patient',
    password: '',
  });
  const [usernameTouched,    setUsernameTouched]    = useState(false);
  const [usernameState,      setUsernameState]      = useState<'idle' | 'loading' | 'ok' | 'taken'>('idle');
  const [usernameSuggestion, setUsernameSuggestion] = useState<string | null>(null);
  const [showPassword,       setShowPassword]       = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-suggest username from fullName (stops once user edits the field manually)
  useEffect(() => {
    if (usernameTouched) return;
    const base = deriveBase(form.fullName);
    if (!base) {
      setForm(f => ({ ...f, username: '' }));
      setUsernameState('idle');
      return;
    }
    setUsernameState('loading');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const suggested = await suggestUsername(base);
        setForm(f => ({ ...f, username: suggested }));
        setUsernameState('ok');
      } catch {
        setForm(f => ({ ...f, username: base }));
        setUsernameState('idle');
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.fullName, usernameTouched]);

  const handleUsernameChange = (value: string) => {
    setUsernameTouched(true);
    setUsernameState('idle');       // stale — needs re-check
    setUsernameSuggestion(null);
    setForm(f => ({ ...f, username: value }));
  };

  const checkUsername = async () => {
    const base = form.username.trim();
    if (!base) return;
    setUsernameState('loading');
    setUsernameSuggestion(null);
    try {
      const suggestion = await suggestUsername(base);
      if (suggestion === base) {
        setUsernameState('ok');
      } else {
        setUsernameState('taken');
        setUsernameSuggestion(suggestion);
      }
    } catch {
      setUsernameState('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await registerUser({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        role:     form.role,
      });
      onCreated();
      logAdminAction(`Created user: ${form.username} (${form.role})`);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Failed to create user.';
      setError(typeof msg === 'string' ? msg : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Create New User</h3>
            <p className="text-xs text-slate-400 mt-0.5">Add a new account to the system</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input type="text" required value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800" />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username</label>
            <div className="relative">
              <input type="text" required value={form.username}
                onChange={e => handleUsernameChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800" />

              {/* Right-side indicator / validate button */}
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {/* Auto-suggest indicators */}
                {!usernameTouched && usernameState === 'loading' && (
                  <Loader2 size={13} className="animate-spin text-slate-400" />
                )}
                {!usernameTouched && usernameState === 'ok' && (
                  <CheckCircle2 size={13} className="text-emerald-500" />
                )}
                {/* Manual check button + results */}
                {usernameTouched && form.username && usernameState === 'idle' && (
                  <button type="button" onClick={checkUsername}
                    className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition">
                    Check
                  </button>
                )}
                {usernameTouched && usernameState === 'loading' && (
                  <Loader2 size={13} className="animate-spin text-slate-400" />
                )}
                {usernameTouched && usernameState === 'ok' && (
                  <CheckCircle2 size={13} className="text-emerald-500" />
                )}
                {usernameTouched && usernameState === 'taken' && (
                  <XCircle size={13} className="text-rose-500" />
                )}
              </div>
            </div>

            {/* Hint text */}
            {!usernameTouched && usernameState === 'ok' && form.username && (
              <p className="text-[11px] text-emerald-600 mt-1 ml-0.5">✓ Available — you can change it</p>
            )}
            {usernameTouched && usernameState === 'ok' && (
              <p className="text-[11px] text-emerald-600 mt-1 ml-0.5">✓ Username is available</p>
            )}
            {usernameTouched && usernameState === 'taken' && usernameSuggestion && (
              <p className="text-[11px] text-rose-500 mt-1 ml-0.5">
                Already taken — use{' '}
                <button type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, username: usernameSuggestion }));
                    setUsernameState('ok');
                    setUsernameSuggestion(null);
                  }}
                  className="text-blue-600 hover:underline font-semibold">
                  {usernameSuggestion}
                </button>
                {' '}instead?
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role</label>
            <div className="relative">
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 pr-8">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Initial Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800" />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60">
              {submitting
                ? <><Loader2 size={12} className="animate-spin" /> Creating…</>
                : <><UserPlus size={12} /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit panel
// ---------------------------------------------------------------------------

interface EditPanelProps {
  user: SystemUser;
  onClose: () => void;
  onSaved: (updated: SystemUser) => void;
}

// Profile matches the same shape used in Settings.tsx so both views stay in sync.
/** Fields exposed in the edit panel — all four are persisted via adminUpdateUser. */
interface UserProfile {
  fullName: string;
  email:    string;
  phone:    string;
  role:     string;
}

function buildProfile(u: SystemUser): UserProfile {
  return {
    fullName: u.fullName,
    email:    u.email,
    phone:    u.phone ?? '',
    role:     u.role,
  };
}

function EditPanel({ user, onClose, onSaved }: EditPanelProps) {
  const [saving,              setSaving]              = useState(false);
  const [error,               setError]               = useState<string | null>(null);
  const [saveMsg,             setSaveMsg]             = useState<string | null>(null);
  const [profile,             setProfile]             = useState<UserProfile>(() => buildProfile(user));
  // Role escalation guard
  const [awaitRoleConfirm,    setAwaitRoleConfirm]    = useState(false);
  // Password reset
  const [showResetPwd,        setShowResetPwd]        = useState(false);
  const [newPwd,              setNewPwd]              = useState('');
  const [resetPwdSubmitting,  setResetPwdSubmitting]  = useState(false);
  const [resetPwdMsg,         setResetPwdMsg]         = useState<string | null>(null);

  // Reset when a different user is selected
  useEffect(() => {
    setProfile(buildProfile(user));
    setError(null);
    setSaveMsg(null);
    setAwaitRoleConfirm(false);
    setShowResetPwd(false);
    setNewPwd('');
    setResetPwdMsg(null);
  }, [user.userId]);

  // All persisted fields drive the dirty check
  const isDirty =
    profile.fullName !== user.fullName      ||
    profile.email    !== user.email         ||
    profile.phone    !== (user.phone ?? '') ||
    profile.role     !== user.role;

  const HIGH_PRIV_ROLES = ['Administrator', 'Auditor', 'Manager'];

  const handleSave = async () => {
    // Intercept role escalation to high-privilege roles
    const isEscalation =
      HIGH_PRIV_ROLES.includes(profile.role) &&
      !HIGH_PRIV_ROLES.includes(user.role);
    if (isEscalation && !awaitRoleConfirm) {
      setAwaitRoleConfirm(true);
      return;
    }
    setAwaitRoleConfirm(false);

    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const updated = await adminUpdateUser(user.userId, {
        fullName: profile.fullName,
        email:    profile.email,
        phone:    profile.phone || undefined,
        role:     profile.role,
      });
      onSaved(updated);
      setSaveMsg('Saved successfully.');
      logAdminAction(`Updated user #${user.userId} ${user.username}: role=${profile.role}`);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPwd.trim()) return;
    setResetPwdSubmitting(true);
    setResetPwdMsg(null);
    try {
      await adminResetPassword(user.userId, newPwd.trim());
      setResetPwdMsg('Password reset successfully.');
      setShowResetPwd(false);
      setNewPwd('');
      setTimeout(() => setResetPwdMsg(null), 4000);
    } catch (e: any) {
      const status = e?.response?.status;
      setResetPwdMsg(
        status === 404
          ? 'Reset endpoint not yet available on this server.'
          : 'Failed to reset password. Please try again.'
      );
    } finally {
      setResetPwdSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800';
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5';

  return (
    <div className="w-[360px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(user.fullName)}`}>
            {avatarInitials(user.fullName)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">{profile.fullName || user.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5">@{user.username}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Full Name</label>
          <input type="text" value={profile.fullName}
            onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Email Address</label>
          <input type="email" value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone Number</label>
          <input type="tel" value={profile.phone} placeholder="—"
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Role</label>
          <div className="relative">
            <select value={profile.role}
              onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
              className={inputCls + ' appearance-none pr-8'}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Account status — read-only, flipped automatically by the system on login */}
        <div>
          <label className={labelCls}>Account Status</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <span className={`w-2 h-2 rounded-full shrink-0 ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`text-xs font-semibold ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
              {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
            <span className="ml-auto text-[10px] text-slate-400 italic">System-managed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 ml-0.5">
            Activated automatically on first login; deactivated by system events only.
          </p>
        </div>

        {/* No hard-delete notice */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[11px] text-slate-500 font-semibold mb-0.5">Account removal</p>
          <p className="text-[11px] text-slate-400 leading-snug">
            User accounts are retained for audit compliance and cannot be permanently deleted
            from this interface. To deactivate a test or junk account, change the role to{' '}
            <span className="font-semibold text-slate-500">Patient</span> and note it in the
            full name (e.g. <span className="font-mono">_archived_</span>).
          </p>
        </div>

        {/* Read-only meta */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          {[
            { label: 'Username',     value: `@${user.username}` },
            { label: 'User ID',      value: `#${user.userId}` },
            { label: 'Joined',       value: formatDate(user.createdAt) },
            { label: 'Last login',   value: user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never logged in' },
            { label: 'Last updated', value: formatDate(user.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">{label}</span>
              <span className="text-slate-600 font-mono">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Role escalation confirmation ─────────────────────── */}
        {awaitRoleConfirm && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" /> Confirm privilege escalation
            </p>
            <p className="text-xs text-amber-700 leading-snug">
              You are granting <span className="font-bold">{profile.role}</span> access to{' '}
              <span className="font-bold">{user.fullName}</span>. This role has elevated system
              permissions. Are you sure?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAwaitRoleConfirm(false)}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* ── Password reset ───────────────────────────────────── */}
        {resetPwdMsg && (
          <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${
            resetPwdMsg.startsWith('Password reset')
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            {resetPwdMsg}
          </p>
        )}

        {!showResetPwd ? (
          <button
            onClick={() => setShowResetPwd(true)}
            className="w-full text-left text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors"
          >
            🔑 Reset password for this account
          </button>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <p className="text-xs font-semibold text-slate-700">Set new password</p>
            <input
              type="password"
              placeholder="New password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowResetPwd(false); setNewPwd(''); }}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPwd.trim() || resetPwdSubmitting}
                className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {resetPwdSubmitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs min-w-0">
            {saveMsg && <span className="text-emerald-600">{saveMsg}</span>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving
                ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                : <><Save size={12} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface UsersProps {
  initialSearch?: string;
  onClearSearch?: () => void;
}

export function Users({ initialSearch, onClearSearch }: UsersProps = {}) {
  const [users,           setUsers]           = useState<SystemUser[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [searchTerm,      setSearchTerm]      = useState(initialSearch ?? '');
  const [roleFilter,      setRoleFilter]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState('');
  const [selected,        setSelected]        = useState<SystemUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page,            setPage]            = useState(0);
  const [selectedIds,     setSelectedIds]     = useState<Set<number>>(new Set());
  const [bulkRole,        setBulkRole]        = useState('');
  const [bulkSubmitting,  setBulkSubmitting]  = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load users. Check that user-service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Seed search from parent navigation
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
      setPage(0);
      onClearSearch?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter(u => {
      const matchSearch  = !q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole    = !roleFilter   || u.role   === roleFilter;
      const matchStatus  = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [searchTerm, roleFilter, statusFilter]);

  const pageCount  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExportCsv = () => {
    const header = ['User ID', 'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Last Login'];
    const rows   = filtered.map(u => [
      u.userId,
      u.username,
      u.fullName,
      u.email,
      u.phone ?? '',
      u.role,
      u.status,
      formatDate(u.createdAt),
      u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Not tracked',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv  = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logAdminAction(`Exported ${filtered.length} users to CSV`);
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole || selectedIds.size === 0) return;
    setBulkSubmitting(true);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.allSettled(
        ids.map(id => adminUpdateUser(id, { role: bulkRole }))
      );
      const succeeded: number[] = [];
      results.forEach((r, i) => { if (r.status === 'fulfilled') succeeded.push(ids[i]); });
      if (succeeded.length > 0) {
        setUsers(prev => prev.map(u =>
          succeeded.includes(u.userId) ? { ...u, role: bulkRole } : u
        ));
        logAdminAction(`Bulk role change → ${bulkRole} for ${succeeded.length} user(s): ${succeeded.join(', ')}`);
      }
      setSelectedIds(new Set());
      setBulkRole('');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allPageSelected = paginated.length > 0 && paginated.every(u => selectedIds.has(u.userId));
  const togglePageSelect = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach(u => next.delete(u.userId));
      else paginated.forEach(u => next.add(u.userId));
      return next;
    });
  };

  const handleSaved = (updated: SystemUser) => {
    setUsers(prev => prev.map(u => u.userId === updated.userId ? updated : u));
    setSelected(updated);
  };

  return (
    <div className="flex h-full bg-slate-50">

      {/* Table area */}
      <div className="flex-1 min-w-0 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? 'Loading…' : `${users.length} account${users.length !== 1 ? 's' : ''} in the system`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors">
              <UserPlus size={14} /> Create User
            </button>
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-40">
              <Download size={14} /> Export CSV
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input type="text" placeholder="Search users…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-52 bg-white text-sm" />
            </div>

            <div className="relative">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
            <AlertCircle size={15} /> {error}
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading users…</span>
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Floating bulk-action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold">
                <span>{selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected</span>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-blue-200">Change role to:</span>
                  <select
                    value={bulkRole}
                    onChange={e => setBulkRole(e.target.value)}
                    className="bg-blue-700 border border-blue-500 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={handleBulkRoleChange}
                    disabled={!bulkRole || bulkSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {bulkSubmitting ? <><Loader2 size={11} className="animate-spin" /> Applying…</> : 'Apply'}
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="p-1 hover:bg-blue-700 rounded transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={togglePageSelect}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Last Login', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(u => {
                  const isSelected = selected?.userId === u.userId;
                  const isChecked  = selectedIds.has(u.userId);
                  return (
                    <tr key={u.userId}
                      onClick={() => setSelected(isSelected ? null : u)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60' : isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}>

                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(u.userId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(u.fullName)}`}>
                            {avatarInitials(u.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-none">{u.fullName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate">{u.email}</td>

                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleStyle(u.role)}`}>{u.role}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(u.createdAt)}</td>

                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {u.lastLoginAt
                          ? <span className="flex items-center gap-1">
                              <Clock size={11} className="text-slate-400 shrink-0" />
                              {formatDate(u.lastLoginAt)}
                            </span>
                          : <span className="flex items-center gap-1 text-slate-400 italic">
                              <Clock size={11} className="shrink-0" />
                              Never logged in
                            </span>}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : u); }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            isSelected ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}>
                          {isSelected ? 'Close' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {searchTerm || roleFilter || statusFilter ? 'No users match the current filters.' : 'No users found.'}
                </p>
              </div>
            )}

            {/* Pagination footer */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
                <span>
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors font-semibold"
                  >
                    ← Prev
                  </button>
                  <span className="px-2 font-mono">{page + 1} / {pageCount}</span>
                  <button
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors font-semibold"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit panel */}
      {selected && (
        <EditPanel
          key={selected.userId}
          user={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Create user modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={async () => {
            setShowCreateModal(false);
            setLoading(true);
            await fetchUsers();
          }}
        />
      )}
    </div>
  );
}
