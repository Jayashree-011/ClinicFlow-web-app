import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Mail, Lock, User, Eye, EyeOff,
  AtSign, Loader2, CheckCircle2, AlertCircle, XCircle,
} from 'lucide-react';
import { default as axios } from 'axios';
import { suggestUsername, registerUser } from './services/auth';
import { createPatient } from './services/patients';

// Derive a clean base name from a full name:
//   "John Smith" → "john.smith"
function deriveBase(fullName: string): string {
  return fullName
    .replace(/^Dr\.?\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');
}

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName:        '',
    username:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });

  // Track whether the user has manually edited the username field.
  // While false, we auto-fill from the fullName suggestion.
  const [usernameTouched,    setUsernameTouched]    = useState(false);
  // 'idle'   — not yet checked (or just typed, needs re-check)
  // 'loading' — API call in flight
  // 'ok'     — confirmed available
  // 'taken'  — taken; usernameSuggestion holds the next available alternative
  const [usernameState,      setUsernameState]      = useState<'idle' | 'loading' | 'ok' | 'taken'>('idle');
  const [usernameSuggestion, setUsernameSuggestion] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-suggest username whenever fullName changes (and user hasn't overridden) ──
  useEffect(() => {
    if (usernameTouched) return;

    const base = deriveBase(formData.fullName);
    if (!base) {
      setFormData(f => ({ ...f, username: '' }));
      setUsernameState('idle');
      return;
    }

    setUsernameState('loading');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const suggested = await suggestUsername(base);
        setFormData(f => ({ ...f, username: suggested }));
        setUsernameState('ok');
      } catch {
        // Silently fall back — user can still type manually
        setFormData(f => ({ ...f, username: base }));
        setUsernameState('idle');
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData.fullName, usernameTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setUsernameTouched(true);
      // Any edit invalidates the previous check result
      setUsernameState('idle');
      setUsernameSuggestion(null);
    }
    setFormData(f => ({ ...f, [name]: value }));
  };

  const checkUsername = async () => {
    const base = formData.username.trim();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (!formData.username.trim()) {
      setSubmitError('Username is required.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        username: formData.username.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email:    formData.email.trim(),
        role:     'Patient',
      });

      // Auto-login with the same credentials
      const { data } = await axios.post('/api/auth/login', {
        username: formData.username.trim(),
        password: formData.password,
      });
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `token=${encodeURIComponent(data.token)}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `role=${encodeURIComponent(data.role)}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `userId=${encodeURIComponent(data.id)}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `username=${encodeURIComponent(data.username)}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `name=${encodeURIComponent(data.fullName)}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `userEmail=${encodeURIComponent(data.email)}; path=/; expires=${expires}; SameSite=Lax`;

      await createPatient({
        userId: data.id,
        name: data.fullName,
        email: data.email,
      });
      navigate(`/${data.role.toLowerCase()}/dashboard`);

    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Registration failed. Please try again.';
      setSubmitError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop')`,
      }}
    >
      <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-sm" />

      <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 z-10">

        {/* ── Left panel — brand ── */}
        <div
          className="hidden md:flex flex-col justify-between p-12 text-white relative bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070')`,
          }}
        >
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="text-blue-600" size={26} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-white">
              Clinic<span className="font-light opacity-80">Flow</span>
            </h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Your health, <br />your care.
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Create your patient account to book appointments, view your health records, and stay connected with your care team.
            </p>
          </div>

          <div className="text-sm text-blue-200">
            © 2024 ClinicFlow Solutions. All rights reserved.
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="p-8 md:p-12 xl:p-16 flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create Account</h2>
            <p className="text-slate-600 text-lg">Sign up as a patient — it's free</p>
          </div>

          {submitError && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              <AlertCircle size={16} className="shrink-0" />
              {submitError}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Username — auto-suggested when not touched, manually validated when touched */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Username</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="jane.doe"
                  className="w-full pl-12 pr-28 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />

                {/* Right-side indicator / validate button */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {/* Auto-suggest indicators (user hasn't touched the field) */}
                  {!usernameTouched && usernameState === 'loading' && (
                    <Loader2 size={15} className="animate-spin text-slate-400" />
                  )}
                  {!usernameTouched && usernameState === 'ok' && (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  )}

                  {/* Manual validate button + result (user edited the field) */}
                  {usernameTouched && formData.username && usernameState === 'idle' && (
                    <button
                      type="button"
                      onClick={checkUsername}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition"
                    >
                      Check
                    </button>
                  )}
                  {usernameTouched && usernameState === 'loading' && (
                    <Loader2 size={15} className="animate-spin text-slate-400" />
                  )}
                  {usernameTouched && usernameState === 'ok' && (
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  )}
                  {usernameTouched && usernameState === 'taken' && (
                    <XCircle size={15} className="text-rose-500" />
                  )}
                </div>
              </div>

              {/* Hint text below the input */}
              {!usernameTouched && usernameState === 'ok' && formData.username && (
                <p className="text-[11px] text-emerald-600 mt-1.5 ml-1">
                  ✓ Available username suggested — you can change it
                </p>
              )}
              {usernameTouched && usernameState === 'ok' && (
                <p className="text-[11px] text-emerald-600 mt-1.5 ml-1">✓ Username is available</p>
              )}
              {usernameTouched && usernameState === 'taken' && usernameSuggestion && (
                <p className="text-[11px] text-rose-500 mt-1.5 ml-1">
                  Already taken — use{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(f => ({ ...f, username: usernameSuggestion }));
                      setUsernameState('ok');
                      setUsernameSuggestion(null);
                    }}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {usernameSuggestion}
                  </button>
                  {' '}instead?
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition shadow-sm placeholder:text-slate-400 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400'
                      : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1.5 ml-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin" /> Creating account…</>
                : 'Create Patient Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-800 text-sm transition"
            >
              ← Back to main page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
