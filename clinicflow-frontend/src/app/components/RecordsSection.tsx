import React, { useState, useEffect } from "react";
import {
  FileText, Stethoscope, Pill, FlaskConical,
  Search, Clock, User, ClipboardList, RefreshCw, AlertCircle, X,
} from "lucide-react";
import axiosInstance from "../services/api";
import { getCookie } from "../services/client";
import { getIssuedPrescriptions, getPatients } from "../services/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type EncounterStatus = "IN_PROGRESS" | "COMPLETED" | "SIGNED" | "CANCELLED";

interface EncounterRecord {
  encounterId: number;
  patientId: number;
  doctorId: number;
  visitType: string;
  chiefComplaint: string;
  status: EncounterStatus;
  startAt: string;
}

interface RxRecord {
  rxId: number;
  encounterId: number | null;
  patientId: number;
  doctorId: number | null;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  status: string;
  issuedAt: string | null;
}

interface LabOrder {
  labOrderId: number;
  patientId: number | null;
  orderedBy: number | null;
  testsJson: string | null;
  status: string;
  collectedAt: string | null;
  sampleId: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

function parseTests(json: string | null): string {
  if (!json) return "—";
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join(", ") : String(arr);
  } catch { return json; }
}

const ENC_STATUS_META: Record<EncounterStatus, { label: string; color: string; bg: string; dot: string }> = {
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-400"   },
  COMPLETED:   { label: "Completed",   color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",      dot: "bg-blue-400"    },
  SIGNED:      { label: "Signed",      color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-500" },
  CANCELLED:   { label: "Cancelled",   color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",      dot: "bg-rose-400"    },
};

const RX_STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  ISSUED:    { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500" },
  DRAFT:     { color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",     dot: "bg-amber-500"   },
  DISPENSED: { color: "text-blue-700",    bg: "bg-blue-50 border-blue-100",       dot: "bg-blue-500"    },
  CANCELLED: { color: "text-rose-700",    bg: "bg-rose-50 border-rose-100",       dot: "bg-rose-500"    },
};

const LAB_STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ORDERED:    { label: "Ordered",    color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200",   dot: "bg-yellow-400"  },
  COLLECTED:  { label: "Collected",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       dot: "bg-blue-400"    },
  PROCESSING: { label: "Processing", color: "text-purple-700",  bg: "bg-purple-50 border-purple-200",   dot: "bg-purple-400"  },
  COMPLETED:  { label: "Completed",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

function StatusPill({ status, meta }: { status: string; meta: Record<string, { label?: string; color: string; bg: string; dot: string }> }) {
  const m = meta[status] ?? { label: status, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label ?? status}
    </span>
  );
}

function AvatarCell({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <User className="w-3.5 h-3.5 text-current opacity-60" />
      </div>
      <span className="text-sm font-semibold text-slate-900">{name}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{message}</p>
      <p className="text-xs text-slate-400">Records will appear here once they are created.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading records…</span>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-4">
      <AlertCircle className="w-4 h-4 shrink-0" /> {message}
      <button onClick={onDismiss} className="ml-auto text-rose-400 hover:text-rose-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function TableFooter({ shown, total, label }: { shown: number; total: number; label: string }) {
  return (
    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
      Showing{" "}
      <span className="font-semibold text-slate-700">{shown}</span> of{" "}
      <span className="font-semibold text-slate-700">{total}</span>{" "}
      {label}{total !== 1 ? "s" : ""}
    </div>
  );
}

const TH_CLS = "px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left";

// ── Main ───────────────────────────────────────────────────────────────────────

type Tab = "encounters" | "prescriptions" | "lab";

export function RecordsSection() {
  const [tab, setTab]       = useState<Tab>("encounters");
  const [search, setSearch] = useState("");

  const doctorId = parseInt(getCookie("userId") || "1", 10);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [encounters,     setEncounters]     = useState<EncounterRecord[]>([]);
  const [prescriptions,  setPrescriptions]  = useState<RxRecord[]>([]);
  const [labOrders,      setLabOrders]      = useState<LabOrder[]>([]);
  const [patientNames,   setPatientNames]   = useState<Record<number, string>>({});

  const [encLoading,  setEncLoading]  = useState(true);
  const [rxLoading,   setRxLoading]   = useState(true);
  const [labLoading,  setLabLoading]  = useState(true);

  const [encError,  setEncError]  = useState("");
  const [rxError,   setRxError]   = useState("");
  const [labError,  setLabError]  = useState("");

  // ── Fetch patient names ──────────────────────────────────────────────────────
  useEffect(() => {
    getPatients()
      .then((pts: any[]) => {
        const map: Record<number, string> = {};
        pts.forEach(p => { map[p.id] = p.name; });
        setPatientNames(map);
      })
      .catch(() => {});
  }, []);

  // ── Fetch encounters (all statuses for current doctor) ───────────────────────
  useEffect(() => {
    setEncLoading(true);
    const statuses = ["IN_PROGRESS", "COMPLETED", "SIGNED", "CANCELLED"] as const;
    Promise.all(
      statuses.map(s =>
        axiosInstance
          .get<EncounterRecord[]>(`/encounter/doctor/${doctorId}/status/${s}`)
          .then(r => r.data)
          .catch(() => [] as EncounterRecord[])
      )
    )
      .then(results => {
        const all = results.flat().sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        );
        setEncounters(all);
        setEncError("");
      })
      .catch(() => setEncError("Failed to load encounters."))
      .finally(() => setEncLoading(false));
  }, [doctorId]);

  // ── Fetch prescriptions ──────────────────────────────────────────────────────
  useEffect(() => {
    setRxLoading(true);
    getIssuedPrescriptions()
      .then((data: RxRecord[]) => {
        setPrescriptions(data ?? []);
        setRxError("");
      })
      .catch(() => setRxError("Failed to load prescriptions."))
      .finally(() => setRxLoading(false));
  }, []);

  // ── Fetch lab orders ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLabLoading(true);
    axiosInstance
      .get<LabOrder[]>("/lab/orders")
      .then(r => {
        setLabOrders(r.data ?? []);
        setLabError("");
      })
      .catch(() => setLabError("Lab orders could not be loaded. The lab service may be unavailable."))
      .finally(() => setLabLoading(false));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const patientName = (id: number | null) =>
    id ? (patientNames[id] ?? `Patient #${id}`) : "—";

  // ── Filtered lists ───────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();

  const filteredEnc = encounters.filter(e =>
    !q ||
    patientName(e.patientId).toLowerCase().includes(q) ||
    e.chiefComplaint?.toLowerCase().includes(q) ||
    e.visitType?.toLowerCase().includes(q) ||
    e.status.toLowerCase().includes(q)
  );

  const filteredRx = prescriptions.filter(r =>
    !q ||
    patientName(r.patientId).toLowerCase().includes(q) ||
    (r.medicationName ?? "").toLowerCase().includes(q) ||
    (r.status ?? "").toLowerCase().includes(q)
  );

  const filteredLab = labOrders.filter(l =>
    !q ||
    patientName(l.patientId).toLowerCase().includes(q) ||
    parseTests(l.testsJson).toLowerCase().includes(q) ||
    (l.status ?? "").toLowerCase().includes(q) ||
    String(l.labOrderId ?? "").includes(q)
  );

  // ── Tab definitions ──────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ElementType; count: number; loading: boolean }[] = [
    { id: "encounters",    label: "Encounters",    icon: Stethoscope,  count: encounters.length,    loading: encLoading    },
    { id: "prescriptions", label: "Prescriptions", icon: Pill,         count: prescriptions.length, loading: rxLoading     },
    { id: "lab",           label: "Laboratory",    icon: FlaskConical, count: labOrders.length,     loading: labLoading    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap');
        .font-display { font-family: 'Sora', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">Records</h1>
            <p className="text-sm text-slate-500">Read-only overview of your clinical data</p>
          </div>
        </div>

        {/* ── Sub-tabs ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(({ id, label, icon: Icon, count, loading }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                tab === id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {loading
                ? <RefreshCw className={`w-3 h-3 animate-spin ${tab === id ? 'text-white/70' : 'text-slate-400'}`} />
                : (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    tab === id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                )
              }
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              tab === "encounters"    ? "Search by patient, visit type, complaint or status…" :
              tab === "prescriptions" ? "Search by patient, medication or status…"             :
                                       "Search by patient, tests or order ID…"
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* ─── ENCOUNTERS ─── */}
          {tab === "encounters" && (
            encError ? (
              <div className="p-4">
                <ErrorBanner message={encError} onDismiss={() => setEncError("")} />
              </div>
            ) : encLoading ? (
              <LoadingState />
            ) : filteredEnc.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No encounters recorded yet." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Date", "Patient", "Visit Type", "Chief Complaint", "Status"].map(h => (
                          <th key={h} className={TH_CLS}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnc.map((enc, i) => (
                        <tr key={enc.encounterId} className={`border-b border-slate-50 ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                          <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {fmtDate(enc.startAt)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <AvatarCell name={patientName(enc.patientId)} color="bg-blue-50 text-blue-500" />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-700">{enc.visitType}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[260px] truncate">{enc.chiefComplaint || "—"}</td>
                          <td className="px-5 py-3.5">
                            <StatusPill status={enc.status} meta={ENC_STATUS_META} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TableFooter shown={filteredEnc.length} total={encounters.length} label="encounter" />
              </>
            )
          )}

          {/* ─── PRESCRIPTIONS ─── */}
          {tab === "prescriptions" && (
            rxError ? (
              <div className="p-4">
                <ErrorBanner message={rxError} onDismiss={() => setRxError("")} />
              </div>
            ) : rxLoading ? (
              <LoadingState />
            ) : filteredRx.length === 0 ? (
              <EmptyState icon={Pill} message="No prescriptions found." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Date", "Patient", "Medication", "Dosage · Frequency · Duration", "Status"].map(h => (
                          <th key={h} className={TH_CLS}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRx.map((rx, i) => {
                        const details = [rx.dosage, rx.frequency, rx.durationDays ? `${rx.durationDays} days` : null]
                          .filter(Boolean).join(" · ") || "—";
                        return (
                          <tr key={rx.rxId} className={`border-b border-slate-50 ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                            <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {fmtDate(rx.issuedAt)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <AvatarCell name={patientName(rx.patientId)} color="bg-violet-50 text-violet-500" />
                            </td>
                            <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{rx.medicationName || "—"}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600">{details}</td>
                            <td className="px-5 py-3.5">
                              <StatusPill status={rx.status} meta={RX_STATUS_META} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TableFooter shown={filteredRx.length} total={prescriptions.length} label="prescription" />
              </>
            )
          )}

          {/* ─── LABORATORY ─── */}
          {tab === "lab" && (
            labError ? (
              <div className="p-4">
                <ErrorBanner message={labError} onDismiss={() => setLabError("")} />
              </div>
            ) : labLoading ? (
              <LoadingState />
            ) : filteredLab.length === 0 ? (
              <EmptyState icon={FlaskConical} message="No lab orders found." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Order ID", "Patient", "Tests", "Status", "Date"].map(h => (
                          <th key={h} className={TH_CLS}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLab.map((lab, i) => (
                        <tr key={lab.labOrderId} className={`border-b border-slate-50 ${i % 2 !== 0 ? "bg-slate-50/30" : ""}`}>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                            LAB-{String(lab.labOrderId ?? 0).padStart(4, "0")}
                          </td>
                          <td className="px-5 py-3.5">
                            <AvatarCell name={patientName(lab.patientId)} color="bg-teal-50 text-teal-500" />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-700">{parseTests(lab.testsJson)}</td>
                          <td className="px-5 py-3.5">
                            <StatusPill status={lab.status} meta={LAB_STATUS_META} />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {fmtDate(lab.collectedAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TableFooter shown={filteredLab.length} total={labOrders.length} label="lab order" />
              </>
            )
          )}

        </div>
      </div>
    </div>
  );
}
