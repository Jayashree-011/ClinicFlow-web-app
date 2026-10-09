import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Calendar, FlaskConical, DollarSign,
  Pill, FileText, RefreshCw, Trash2, CheckCheck, X, Settings,
} from 'lucide-react';
import {
  type Notification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notifications';

/* ── Category metadata ── */

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
  APPOINTMENT:  { label: 'Appointment',  icon: Calendar,    colour: 'bg-blue-100 text-blue-700' },
  PRESCRIPTION: { label: 'Prescription', icon: FileText,    colour: 'bg-purple-100 text-purple-700' },
  LAB:          { label: 'Lab',          icon: FlaskConical,colour: 'bg-teal-100 text-teal-700' },
  BILLING:      { label: 'Billing',      icon: DollarSign,  colour: 'bg-amber-100 text-amber-700' },
  PHARMACY:     { label: 'Pharmacy',     icon: Pill,        colour: 'bg-green-100 text-green-700' },
  SYSTEM:       { label: 'System',       icon: Settings,    colour: 'bg-slate-100 text-slate-600' },
};

const SEVERITY_COLOUR: Record<string, string> = {
  CRITICAL: 'border-l-4 border-red-500 bg-red-50',
  WARNING:  'border-l-4 border-amber-400 bg-amber-50',
  INFO:     '',
};

function fmtDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000)               return 'Just now';
  if (diff < 3_600_000)            return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)           return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Single notification row ── */

function NotificationRow({
  n, onRead, onDelete,
}: { n: Notification; onRead: (id: number) => void; onDelete: (id: number) => void }) {
  const meta     = CATEGORY_META[n.category?.toUpperCase()] ?? { label: n.category, icon: Bell, colour: 'bg-slate-100 text-slate-600' };
  const Icon     = meta.icon;
  const severity = SEVERITY_COLOUR[n.severity?.toUpperCase()] ?? '';
  const unread   = n.status === 'UNREAD';

  return (
    <div
      className={`relative flex gap-3 p-4 rounded-xl transition-all ${severity || 'bg-white'} ${unread ? 'ring-1 ring-blue-200' : 'opacity-80'}`}
    >
      {/* Unread dot */}
      {unread && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
      )}

      {/* Category icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm ${meta.colour}`}>
        <Icon size={16} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${meta.colour.split(' ')[1]}`}>
            {meta.label}
          </span>
          {n.severity === 'CRITICAL' && (
            <span className="text-[9px] font-bold bg-red-500 text-white rounded px-1 py-0.5">CRITICAL</span>
          )}
          {n.severity === 'WARNING' && (
            <span className="text-[9px] font-bold bg-amber-400 text-white rounded px-1 py-0.5">WARNING</span>
          )}
        </div>
        <p className="text-xs text-slate-800 leading-relaxed">{n.message}</p>
        <p className="text-[10px] text-slate-400 mt-1">{fmtDate(n.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {unread && (
          <button
            title="Mark as read"
            onClick={() => onRead(n.notificationId)}
            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <CheckCheck size={13} />
          </button>
        )}
        <button
          title="Delete"
          onClick={() => onDelete(n.notificationId)}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Filter tabs ── */
const FILTERS = ['All', 'Unread', 'Appointment', 'Lab', 'Billing', 'Prescription', 'Pharmacy', 'System'] as const;
type Filter = typeof FILTERS[number];

/* ── Main component ── */

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [filter,   setFilter]   = useState<Filter>('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyNotifications();
      // newest first
      setNotifications([...data].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }));
    } catch {
      setError('Could not load notifications. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, status: 'READ' } : n));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(notifications);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === 'All')    return true;
    if (filter === 'Unread') return n.status === 'UNREAD';
    return n.category?.toUpperCase() === filter.toUpperCase();
  });

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-sm">

      {/* Header */}
      <div className="bg-[#1a3a6e] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bell size={18} />
          <div>
            <h1 className="text-lg font-bold">Notifications</h1>
            <p className="text-[#a8c0e0] text-xs mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button
            onClick={load}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 pt-4 pb-2 overflow-x-auto flex-shrink-0">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={load} className="text-red-600 font-semibold hover:underline flex items-center gap-1">
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell size={40} className="mb-3 opacity-20" />
            <p className="font-semibold text-slate-500">No notifications</p>
            <p className="text-xs mt-1">
              {filter === 'All' ? "You're all caught up!" : `No ${filter.toLowerCase()} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {filtered.map(n => (
              <NotificationRow
                key={n.notificationId}
                n={n}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
