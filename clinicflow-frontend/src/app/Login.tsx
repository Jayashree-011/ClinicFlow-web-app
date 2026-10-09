import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { default as axios } from 'axios';



// --- API Utility Function ---
async function userCheck(username: string, password: string) {
  // Axios automatically throws an error if status is not 2xx
  const response = await axios.post("/api/auth/login", { username, password });
  if(response.status != 200) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }
  const data = response.data;

  // Store auth data in cookies
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `token=${encodeURIComponent(data.token)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `role=${encodeURIComponent(data.role)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `userId=${encodeURIComponent(data.id)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `username=${encodeURIComponent(data.username)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `name=${encodeURIComponent(data.fullName)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `userEmail=${encodeURIComponent(data.email)}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `password=${encodeURIComponent(password)}; path=/; expires=${expires}; SameSite=Lax`; // Store password for demo purposes only

  return data;
}

// --- Main Login Component ---
export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const user = await userCheck(username, password);
      if (user?.role) {
        // Map every known role to its dashboard route.
        // Roles without a dedicated dashboard fall back to /administrator/dashboard.
        const roleRouteMap: Record<string, string> = {
          patient:       '/patient/dashboard',
          receptionist:  '/receptionist/dashboard',
          clinician:     '/clinician/dashboard',
          administrator: '/administrator/dashboard',
          pharmacy:      '/pharmacy/dashboard',
          finance:       '/finance/dashboard',
          manager:       '/manager/dashboard',
          auditor:       '/auditor/dashboard',
        };
        const route = roleRouteMap[user.role.toLowerCase()] ?? '/administrator/dashboard';
        navigate(route);
      } else {
        setErrorMessage('Login succeeded but your account role could not be determined. Please contact support.');
      }
    } catch (error: any) {
      console.error('Login error details:', error);

      if (error.response) {
        // The server responded with a non-2xx status code
        const status = error.response.status;
        if (status === 401 || status === 400) {
          setErrorMessage('Invalid username or password.');
        } else if (status === 500) {
          setErrorMessage('Server error. Please try again later.');
        } else {
          setErrorMessage(error.response.data?.message || 'An unexpected error occurred.');
        }
      } else if (error.request) {
        // The request was made but no response was received (e.g., network down / CORS error)
        setErrorMessage('Cannot connect to the server. Please check your network connection.');
      } else {
        // Something went wrong setting up the request itself
        setErrorMessage('An error occurred while sending the request.');
      }
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop')` 
      }}
    >
      {/* Background Overlay for Contrast */}
      <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-sm"></div>

      <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 z-10">
        
        {/* --- Left Side: Medical Aesthetic --- */}
        <div 
          className="hidden md:flex flex-col justify-between p-12 bg-blue-600 text-white relative bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 0.8)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070')` 
          }}
        >
          <div>
            <div className="inline-flex items-center gap-3 mb-10">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="text-blue-600" size={26} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-white">
                Clinic<span className="font-light opacity-80">Flow</span>
              </h1>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Streamline your <br />medical practice.
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Access the central hub for patient management, scheduling, and clinic logistics.
            </p>
          </div>

          <div className="text-sm text-blue-200 mt-auto">
            © 2024 ClinicFlow Solutions. All rights reserved.
          </div>
        </div>

        {/* --- Right Side: Login Form --- */}
        <div className="p-8 md:p-12 xl:p-16 flex flex-col justify-center">
          <div className="text-center md:text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-600 text-lg">Sign in to access your dashboard</p>
          </div>

          {/* Conditional Error Alert Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-fadeIn">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" id="remember" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <label htmlFor="remember" className="ml-2.5 text-sm text-slate-700">Keep me signed in</label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? "Signing In..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
          
          <div className="text-center mt-8">
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