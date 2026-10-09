import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  return null;
};

/** Wipe every auth cookie the login page sets. */
function clearAuthCookies() {
  const AUTH_COOKIES = ['token', 'userId', 'role', 'username', 'name', 'userEmail', 'password'];
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  AUTH_COOKIES.forEach(name => {
    document.cookie = `${name}=; ${expired}`;
  });
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 once ────────────────────────────────────
// Guard flag prevents multiple concurrent 401 responses (e.g. a dashboard that
// fires 4 API calls at once) from each triggering a separate redirect.
let redirectingToLogin = false;

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && !redirectingToLogin) {
      redirectingToLogin = true;
      console.warn('Session expired or unauthorised — redirecting to login.');
      clearAuthCookies();
      // Small delay lets any in-flight state updates finish before the hard nav
      setTimeout(() => {
        redirectingToLogin = false;
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  },
);

export async function handleResponse(res: AxiosResponse) {
  if (res.status !== 200) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.data;
  try { return JSON.parse(data); } catch { return data; }
}

export default axiosInstance;
