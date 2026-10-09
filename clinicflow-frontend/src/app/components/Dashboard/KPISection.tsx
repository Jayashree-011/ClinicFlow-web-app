/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/KPISection.tsx
 *
 * Stat-card row with per-card role visibility:
 *   Total Patients     → Administrator, Manager, Receptionist, Auditor
 *   Appointments Today → Administrator, Manager, Receptionist, Clinician
 *   Available Doctors  → Administrator, Manager, Receptionist
 *   Monthly Revenue    → Administrator, Manager, Finance
 *
 * Returns null when the current user cannot see any card.
 * ─────────────────────────────────────────────────────────────────────────── */

import { Users, Calendar, UserCheck, DollarSign, ArrowUpRight } from 'lucide-react';
import { getRole, hasAnyRole } from './shared';

/* ── StatCard ── */

function StatCard({ title, value, sub, icon, bg, loading, onClick }: {
  title: string; value: string; sub: string; icon: React.ReactNode; bg: string;
  loading?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm flex items-center justify-between transition-all duration-150
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] hover:ring-2 hover:ring-blue-200 select-none' : ''}`}
    >
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        {loading
          ? <div className="h-7 w-20 bg-gray-100 animate-pulse rounded mt-1 mb-1" />
          : <p className="text-xl font-bold text-gray-900 my-1">{value}</p>
        }
        <p className="text-xs text-green-500 font-semibold">{sub}</p>
        {onClick && !loading && (
          <p className="text-[10px] text-blue-400 font-medium mt-0.5 flex items-center gap-0.5">
            View module <ArrowUpRight size={10} />
          </p>
        )}
      </div>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  );
}

/* ── KPISection ── */

interface KPISectionProps {
  stats: { patients: number; todayAppts: number; doctors: number; revenue: number };
  loading: boolean;
  onNavigate?: (tab: string) => void;
}

export function KPISection({ stats, loading, onNavigate }: KPISectionProps) {
  const role = getRole();
  const fmt      = (n: number) => n.toLocaleString();
  const fmtMoney = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toFixed(0)}`;

  // Per-card visibility rules
  const showPatients     = hasAnyRole('Administrator', 'Manager', 'Receptionist', 'Auditor');
  const showAppts        = hasAnyRole('Administrator', 'Manager', 'Receptionist', 'Clinician');
  const showDoctors      = hasAnyRole('Administrator', 'Manager', 'Receptionist');
  const showRevenue      = hasAnyRole('Administrator', 'Manager', 'Finance');

  const cards = [
    showPatients && {
      key: 'patients',
      title: 'Total Patients',     value: fmt(stats.patients),      sub: 'Registered patients',
      icon: <Users size={20} />,       bg: 'bg-blue-500',
      onClick: onNavigate ? () => onNavigate('patients') : undefined,
    },
    showAppts && {
      key: 'appts',
      title: 'Appointments Today', value: fmt(stats.todayAppts),    sub: 'Scheduled for today',
      icon: <Calendar size={20} />,    bg: 'bg-green-500',
      onClick: onNavigate ? () => onNavigate('appointments') : undefined,
    },
    showDoctors && {
      key: 'doctors',
      title: 'Available Doctors',  value: fmt(stats.doctors),       sub: 'Status = Active',
      icon: <UserCheck size={20} />,   bg: 'bg-purple-500',
      onClick: onNavigate ? () => onNavigate('staff') : undefined,
    },
    showRevenue && {
      key: 'revenue',
      title: 'Monthly Revenue',    value: fmtMoney(stats.revenue),  sub: 'Paid invoices this month',
      icon: <DollarSign size={20} />,  bg: 'bg-amber-500',
      onClick: onNavigate ? () => onNavigate('billing') : undefined,
    },
  ].filter(Boolean) as {
    key: string; title: string; value: string; sub: string;
    icon: React.ReactNode; bg: string; onClick?: () => void;
  }[];

  if (cards.length === 0) return null;

  const colClass =
    cards.length === 4 ? 'grid-cols-4' :
    cards.length === 3 ? 'grid-cols-3' :
    cards.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={`grid ${colClass} gap-4`}>
      {cards.map(c => (
        <StatCard
          key={c.key}
          title={c.title} value={c.value} sub={c.sub}
          icon={c.icon}   bg={c.bg}        loading={loading}
          onClick={c.onClick}
        />
      ))}
    </div>
  );
}
