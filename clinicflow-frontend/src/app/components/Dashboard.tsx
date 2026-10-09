import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { fetchUserProfile } from "../services/auth";

import { ClinicianSection }   from "./Dashboard/Clinician";
import { KPISection }         from "./Dashboard/KPISection";
import { AppointmentsSection } from "./Dashboard/AppointmentsSection";
import { ScheduleSection }    from "./Dashboard/ScheduleSection";
import { FinanceSection }     from "./Dashboard/FinanceSection";
import { AdminSection }       from "./Dashboard/AdminSection";

import { parseStartAt, type BackendAppt, type BackendInvoice, type BackendPatient } from "./Dashboard/shared";

/* ─────────────────────── HELPERS ─────────────────────── */

function getToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/* ─────────────────────── TOPBAR ─────────────────────── */

function Topbar({ user }: { user?: { fullName: string; role: string } | null }) {
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <header className="bg-[#1a3a6e] text-white px-6 py-4 flex items-center flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold">Dashboard Overview</h1>
        <p className="text-[#a8c0e0] text-xs mt-0.5">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'} — here's the latest clinic metrics
        </p>
      </div>
    </header>
  );
}

/* ─────────────────────── MAIN DASHBOARD ─────────────────────── */

export default function Dashboard({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, doctors: 0, revenue: 0 });
  const [appointments, setAppointments] = useState<BackendAppt[]>([]);
  const [invoices,     setInvoices]     = useState<BackendInvoice[]>([]);
  const [patients,     setPatients]     = useState<BackendPatient[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<{ fullName: string; role: string } | null>(null);

  const fetchAll = () => {
    setLoading(true);
    setError(null);

    const hdrs: HeadersInit = {
      Authorization:  `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    };

    const today     = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);

    Promise.allSettled([
      fetch("/api/consultation/patient/patients",         { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch("/api/consultation/appointment/appointments", { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch("/api/consultation/doctor/list",              { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch("/api/billing/invoices",                      { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetchUserProfile(),
    ]).then(([pRes, aRes, dRes, iRes, profRes]) => {
      const rawPatients: any[] = pRes.status === "fulfilled" ? (pRes.value ?? []) : [];
      const appts:       any[] = aRes.status === "fulfilled" ? (aRes.value ?? []) : [];
      const doctors:     any[] = dRes.status === "fulfilled" ? (dRes.value ?? []) : [];
      const allInvoices: any[] = iRes.status === "fulfilled" ? (iRes.value ?? []) : [];

      if (profRes.status === "fulfilled" && profRes.value) {
        const p = profRes.value as any;
        setAdminProfile({ fullName: p.fullName ?? "", role: p.role ?? "" });
      }

      const todayCount = appts.filter(a => {
        const s = a.startAt;
        if (!s) return false;
        if (Array.isArray(s)) {
          const [y, mo, d] = s as number[];
          return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` === today;
        }
        return String(s).startsWith(today);
      }).length;

      const revenue = allInvoices
        .filter(inv => {
          if (inv.status !== "PAID") return false;
          const dt = inv.issuedAt ?? inv.createdAt ?? inv.issueDate;
          if (!dt) return false;
          if (Array.isArray(dt)) {
            const [y, mo] = dt as number[];
            return `${y}-${String(mo).padStart(2, "0")}` === thisMonth;
          }
          return String(dt).startsWith(thisMonth);
        })
        .reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);

      setStats({
        patients:   rawPatients.length,
        todayAppts: todayCount,
        doctors:    doctors.filter((d: any) => d.status === 'Active').length,
        revenue,
      });

      setPatients([...rawPatients].sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0)));

      setAppointments([...appts].sort((a, b) => {
        const da = parseStartAt(a.startAt)?.getTime() ?? 0;
        const db = parseStartAt(b.startAt)?.getTime() ?? 0;
        return db - da;
      }));

      setInvoices([...allInvoices].sort((a, b) => {
        const da = parseStartAt(a.issuedAt ?? a.createdAt ?? a.issueDate)?.getTime() ?? 0;
        const db = parseStartAt(b.issuedAt ?? b.createdAt ?? b.issueDate)?.getTime() ?? 0;
        return db - da;
      }));
    }).catch(() => {
      setError("Failed to load dashboard data. Check your connection.");
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-sm overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        <Topbar user={adminProfile} />

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchAll}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold border border-red-300 px-2 py-1 rounded-lg hover:bg-red-100 transition text-xs"
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Clinician workload — self-guards to Clinician role only */}
          <ClinicianSection
            appointments={appointments}
            loading={loading}
            onNavigate={onNavigate}
          />

          {/* KPI stat cards — per-card role guards inside */}
          <KPISection stats={stats} loading={loading} onNavigate={onNavigate} />

          {/* Recent appointments + today's status breakdown */}
          <AppointmentsSection appointments={appointments} loading={loading} />

          {/* Today's schedule + recent patients */}
          <ScheduleSection
            appointments={appointments}
            patients={patients}
            loading={loading}
            onNavigate={onNavigate}
          />

          {/* Revenue & claims + recent invoices */}
          <FinanceSection invoices={invoices} loading={loading} />

          {/* Service health + admin audit log */}
          <AdminSection />

        </main>
      </div>
    </div>
  );
}
