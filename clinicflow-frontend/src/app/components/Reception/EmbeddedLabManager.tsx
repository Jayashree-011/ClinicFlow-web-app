import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Plus, ChevronDown, ChevronUp, Trash2,
  Search, User, Stethoscope, ClipboardList,
  TestTube2, CheckCircle2, Microscope, BeakerIcon,
  ScanLine, FileText, AlertTriangle, ArrowDown, ArrowUp,
  ShieldCheck, X, RefreshCw, Printer,
} from "lucide-react";
import {
  LabOrder, LabResult, LabOrderStatus, ResultFlag,
  STATUS_ORDER, generateSampleId, localDateTimeNow,
  getTestMeta, parseTestCodes,
} from "./LabTestDictionary";
import { OrderFormModal, ResultFormModal } from "./LabModals";

// ── API ───────────────────────────────────────────────────────────────────────

const API = "/api";

const getToken = (): string => {
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
};

const hdrs = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization:  `Bearer ${getToken()}`,
});

const getLoggedInUserId = (): number => {
  const m = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
  return m ? (parseInt(decodeURIComponent(m[1]), 10) || 1) : 1;
};

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { ...hdrs(), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ""}`);
  }
  return res;
}

// ── Doctor map (orderedBy is Long in DTO, 1-indexed here) ────────────────────

// ── Doctor type ───────────────────────────────────────────────────────────────
type Doctor = { id: number; name: string; specialty: string };

// ── Encounter type ────────────────────────────────────────────────────────────
type Encounter = { id: number; label: string };

// ── Status display ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<LabOrderStatus, { bg: string; icon: React.ReactNode }> = {
  ORDERED:    { bg: "bg-yellow-100 text-yellow-800", icon: <ClipboardList size={12} /> },
  COLLECTED:  { bg: "bg-blue-100 text-blue-800",     icon: <TestTube2     size={12} /> },
  PROCESSING: { bg: "bg-purple-100 text-purple-800", icon: <Microscope    size={12} /> },
  COMPLETED:  { bg: "bg-green-100 text-green-800",   icon: <CheckCircle2  size={12} /> },
};

const StatusBadge = ({ s }: { s: LabOrderStatus }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[s].bg}`}>
    {STATUS_STYLE[s].icon} {s}
  </span>
);

// ── Flag display (uppercase keys match backend LabResult.Flag enum) ───────────

const FLAG_STYLE: Record<ResultFlag, { label: string; pill: string; card: string; icon: React.ReactNode }> = {
  NORMAL:   { label: "Normal",   pill: "bg-green-100 text-green-700",   card: "bg-green-50 border-green-200 text-green-700",                icon: <ShieldCheck   size={13} /> },
  LOW:      { label: "Low",      pill: "bg-blue-100 text-blue-700",     card: "bg-blue-50 border-blue-200 text-blue-700",                   icon: <ArrowDown     size={13} /> },
  HIGH:     { label: "High",     pill: "bg-orange-100 text-orange-700", card: "bg-orange-50 border-orange-200 text-orange-700",             icon: <ArrowUp       size={13} /> },
  CRITICAL: { label: "Critical", pill: "bg-red-100 text-red-700",       card: "bg-red-50 border-red-300 text-red-700 font-bold",            icon: <AlertTriangle size={13} /> },
};

const FlagPill = ({ flag }: { flag: ResultFlag }) => {
  const s = FLAG_STYLE[flag];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.pill}`}>
      {s.icon} {s.label}
    </span>
  );
};

// ── Patient type ──────────────────────────────────────────────────────────────

type Patient = { id: number; name: string };

const FALLBACK_PATIENTS: Patient[] = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Roe" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Print / Download report helper
// ─────────────────────────────────────────────────────────────────────────────

function printLabReport(
  order: LabOrder,
  results: LabResult[],
  patientName: string,
  doctorName: string,
) {
  const codes = parseTestCodes(order.testsJson);
  const fmt   = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

  const flagColor: Record<string, string> = {
    NORMAL:   "#059669",
    HIGH:     "#ea580c",
    LOW:      "#2563eb",
    CRITICAL: "#dc2626",
  };

  const refRangeLabel = (code: string): string => {
    const meta = getTestMeta(code);
    return meta?.range ?? "—";
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Lab Report — LAB-${String(order.labOrderId ?? 0).padStart(4, "0")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .brand  { font-size: 22px; font-weight: 700; color: #2563eb; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .report-label { text-align: right; }
    .report-label h2 { font-size: 16px; margin: 0; color: #1e293b; }
    .report-label p  { font-size: 11px; color: #64748b; margin: 2px 0 0; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; }
    .meta-item strong { display: block; font-size: 13px; color: #0f172a; }
    .meta-item span   { font-size: 11px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .flag { font-weight: 700; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; }
    .critical-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #dc2626; font-weight: 600; }
    @media print { @page { margin: 20mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ClinicFlow</div>
      <div class="brand-sub">Laboratory Information System</div>
    </div>
    <div class="report-label">
      <h2>Laboratory Report</h2>
      <p>LAB-${String(order.labOrderId ?? 0).padStart(4, "0")}</p>
      <p>Printed: ${new Date().toLocaleString("en-US")}</p>
    </div>
  </div>

  ${results.some(r => r.flag === "CRITICAL") ? `
  <div class="critical-banner">
    ⚠ This report contains CRITICAL values. Immediate clinical review required.
  </div>` : ""}

  <div class="meta">
    <div class="meta-item"><strong>${patientName}</strong><span>Patient</span></div>
    <div class="meta-item"><strong>${doctorName}</strong><span>Ordered By</span></div>
    <div class="meta-item"><strong>${order.status}</strong><span>Status</span></div>
    <div class="meta-item"><strong>${codes.join(", ") || "—"}</strong><span>Tests Ordered</span></div>
    <div class="meta-item"><strong>${order.sampleId ?? "—"}</strong><span>Sample ID</span></div>
    <div class="meta-item"><strong>${fmt(order.collectedAt)}</strong><span>Collection Date</span></div>
  </div>

  ${results.length === 0
    ? `<p style="color:#94a3b8;font-style:italic;padding:16px 0">No individual result values recorded for this order.</p>`
    : `<table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Units</th>
            <th>Reference Range</th>
            <th>Flag</th>
            <th>Reported</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
          <tr>
            <td><strong>${getTestMeta(r.testCode)?.name ?? r.testCode}</strong></td>
            <td><strong>${r.resultValue ?? "—"}</strong></td>
            <td>${r.units || "—"}</td>
            <td>${refRangeLabel(r.testCode)}</td>
            <td class="flag" style="color:${flagColor[r.flag] ?? "#1e293b"}">${r.flag || "—"}</td>
            <td>${r.reportedAt ? new Date(r.reportedAt).toLocaleDateString("en-US") : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}

  <div class="footer">
    <span>This report is for authorised clinical use only. Verify critical values directly with the laboratory.</span>
    <span>ClinicFlow LIS &bull; Confidential</span>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const EmbeddedLabManager: React.FC = () => {

  // ── Core state ──────────────────────────────────────────────────────────────
  const [patients, setPatients]                   = useState<Patient[]>(FALLBACK_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(FALLBACK_PATIENTS[0].id);
  const [doctors, setDoctors]                     = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId]   = useState<number>(0);

  const [encounters, setEncounters]                         = useState<Encounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId]       = useState<number>(0);

  const [orders, setOrders]         = useState<LabOrder[]>([]);
  const [allResults, setAllResults] = useState<LabResult[]>([]);

  const [filterStatus, setFilterStatus] = useState<LabOrderStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchType, setSearchType]     = useState<"order" | "patient">("order");

  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [resultTarget, setResultTarget]     = useState<LabOrder | null>(null);
  const [editMode, setEditMode]             = useState(false);
  const [viewingOrder, setViewingOrder]     = useState<LabOrder | null>(null);

  // ── Load patients from API, fall back to localStorage ─────────────────────
  useEffect(() => {
    fetch(`${API}/consultation/patient/patients`, { headers: hdrs() })
      .then(r => r.ok ? r.json() : Promise.reject("non-ok"))
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped = data.map((p: any): Patient => ({
          id:   p.patientId ?? p.id,
          name: p.name ?? (`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `Patient #${p.patientId ?? p.id}`),
        }));
        setPatients(mapped);
        setSelectedPatientId(mapped[0].id);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("clinicflow_patients");
          if (!raw) return;
          const parsed: { id: number; name: string }[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPatients(parsed.map(p => ({ id: p.id, name: p.name })));
            setSelectedPatientId(parsed[0].id);
          }
        } catch {}
      });
  }, []);

  // ── Load doctors from consultation-service API ─────────────────────────────
  useEffect(() => {
    fetch(`${API}/consultation/doctor/list`, { headers: hdrs() })
      .then(r => r.ok ? r.json() : Promise.reject("non-ok"))
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped: Doctor[] = data.map((d: any, idx: number) => ({
          id:        Number(d.doctorId ?? d.id ?? (idx + 1)),
          name:      d.name ?? `Doctor #${idx + 1}`,
          specialty: d.specialty ?? "",
        }));
        setDoctors(mapped);
        setSelectedDoctorId(mapped[0].id);
      })
      .catch(() => { /* doctors stay empty; dropdown shows placeholder */ });
  }, []);

  // ── Load encounters when selected patient changes ─────────────────────────
  useEffect(() => {
    if (!selectedPatientId) return;
    setEncounters([]);
    setSelectedEncounterId(0);
    fetch(`${API}/encounter/patient/${selectedPatientId}`, { headers: hdrs() })
      .then(r => r.ok ? r.json() : Promise.reject("non-ok"))
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped: Encounter[] = data.map((e: any) => ({
          id:    Number(e.encounterId ?? e.id),
          label: `#${e.encounterId ?? e.id}${e.chiefComplaint ? ` — ${e.chiefComplaint}` : e.visitType ? ` — ${e.visitType}` : ""}`,
        }));
        setEncounters(mapped);
        setSelectedEncounterId(mapped[0].id);
      })
      .catch(() => { /* no encounters available — will fall back to patientId */ });
  }, [selectedPatientId]);

  // ── Load orders and results from backend ───────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [oRes, rRes] = await Promise.all([
        apiFetch(`${API}/lab/orders`),
        apiFetch(`${API}/lab/results`),
      ]);
      const [orders, results]: [LabOrder[], LabResult[]] = await Promise.all([
        oRes.json(),
        rRes.json(),
      ]);
      setOrders(orders);
      setAllResults(results);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to load lab data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedPatient    = patients.find(p => p.id === selectedPatientId) ?? patients[0];
  const selectedDoctor     = doctors.find(d => d.id === selectedDoctorId) ?? doctors[0];
  const displayEncounterId = selectedEncounterId
    ? `ENC-${String(selectedEncounterId).padStart(4, "0")}`
    : encounters.length === 0 ? "No encounter" : "Select encounter";

  const patientName = (id: number) =>
    patients.find(p => p.id === id)?.name ?? `Patient #${id}`;
  const doctorName  = (id: number) =>
    doctors.find(d => d.id === id)?.name  ?? `Doctor #${id}`;

  // ── Create order ───────────────────────────────────────────────────────────
  const handleCreateOrder = async (data: { orderedBy: string; tests: string[] }) => {
    const payload: LabOrder = {
      // Use the selected encounter; fall back to patientId if no encounters loaded
      encounterId: selectedEncounterId || (selectedPatient?.id ?? 1),
      patientId:   selectedPatient?.id ?? 1,
      orderedBy:   selectedDoctorId || (doctors[0]?.id ?? 1),
      testsJson:   JSON.stringify(data.tests),
      status:      "ORDERED",
    };
    setLoading(true);
    try {
      await apiFetch(`${API}/lab/orders`, {
        method: "POST",
        body:   JSON.stringify(payload),
      });
      setShowOrderModal(false);
      await loadData();
    } catch (err) {
      setApiError(`Create order failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Advance status ─────────────────────────────────────────────────────────
  const advanceStatus = async (order: LabOrder) => {
    const idx  = STATUS_ORDER.indexOf(order.status);
    if (idx >= STATUS_ORDER.length - 1) return;
    const next = STATUS_ORDER[idx + 1];

    // PROCESSING → COMPLETED: open result entry modal instead
    if (next === "COMPLETED") {
      setResultTarget(order);
      setEditMode(false);
      return;
    }

    const updated: LabOrder = {
      ...order,
      status: next,
      // localDateTimeNow() produces "yyyy-MM-ddTHH:mm:ss" — no Z, compatible with LocalDateTime
      ...(next === "COLLECTED" ? {
        sampleId:    generateSampleId(order.labOrderId!),
        collectedAt: localDateTimeNow(),
      } : {}),
    };

    setLoading(true);
    try {
      await apiFetch(`${API}/lab/orders/${order.labOrderId}`, {
        method: "PUT",
        body:   JSON.stringify(updated),
      });
      await loadData();
    } catch (err) {
      setApiError(`Status update failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Save results ───────────────────────────────────────────────────────────
  const handleSaveResults = async (results: LabResult[]) => {
    if (!resultTarget) return;
    setLoading(true);
    try {
      const now = localDateTimeNow();

      // POST or PUT each result
      for (const r of results) {
        const payload = {
          ...r,
          labOrderId: resultTarget.labOrderId,
          reportedAt: now,
          reportedBy: getLoggedInUserId(),
        };
        if (r.resultId) {
          await apiFetch(`${API}/lab/results/${r.resultId}`, {
            method: "PUT",
            body:   JSON.stringify(payload),
          });
        } else {
          await apiFetch(`${API}/lab/results`, {
            method: "POST",
            body:   JSON.stringify(payload),
          });
        }
      }

      // Mark order as COMPLETED
      await apiFetch(`${API}/lab/orders/${resultTarget.labOrderId}`, {
        method: "PUT",
        body:   JSON.stringify({ ...resultTarget, status: "COMPLETED" }),
      });

      setResultTarget(null);
      await loadData();
    } catch (err) {
      setApiError(`Save results failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete order ───────────────────────────────────────────────────────────
  const handleDeleteOrder = async (order: LabOrder) => {
    if (!window.confirm(`Delete order LAB-${String(order.labOrderId).padStart(4, "0")}? This cannot be undone.`))
      return;
    setLoading(true);
    try {
      await apiFetch(`${API}/lab/orders/${order.labOrderId}`, { method: "DELETE" });
      if (viewingOrder?.labOrderId === order.labOrderId) setViewingOrder(null);
      await loadData();
    } catch (err) {
      setApiError(`Delete failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Action label ───────────────────────────────────────────────────────────
  const nextLabel = (s: LabOrderStatus) =>
    ({ ORDERED: "Mark Collected", COLLECTED: "Start Processing", PROCESSING: "Enter Results", COMPLETED: "Edit Results" }[s]);

  // ── Search & filter ────────────────────────────────────────────────────────
  const visible = orders.filter(o => {
    if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
    const q  = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const id = String(o.labOrderId ?? 0).padStart(4, "0");
    if (searchType === "order")
      return id.includes(q.replace(/^lab-/i, "")) || `lab-${id}` === q;
    return String(o.patientId) === q || patientName(o.patientId).toLowerCase().includes(q);
  });

  // ── Flag counts — only results belonging to an existing order ────────────
  const existingOrderIds = new Set(orders.map(o => o.labOrderId));
  const activeResults    = allResults.filter(r => existingOrderIds.has(r.labOrderId));
  const flagCounts       = activeResults.reduce<Record<string, number>>(
    (acc, r) => { acc[r.flag] = (acc[r.flag] ?? 0) + 1; return acc; }, {}
  );

  const orderResultsFor = (order: LabOrder) =>
    allResults.filter(r => r.labOrderId === order.labOrderId);

  const viewingResults = viewingOrder ? orderResultsFor(viewingOrder) : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Error banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">{apiError}</span>
          <button
            onClick={() => { setApiError(null); loadData(); }}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium text-xs border border-red-300 rounded-lg px-2 py-1 hover:bg-red-100 transition"
          >
            <RefreshCw size={11} /> Retry
          </button>
          <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 ml-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Section 1: Search + Filters + Context ───────────────────────── */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">

        {/* Search bar */}
        <div className="flex">
          <select
            value={searchType}
            onChange={e => { setSearchType(e.target.value as "order" | "patient"); setSearchQuery(""); }}
            className="border border-r-0 rounded-l-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            <option value="order">Order ID</option>
            <option value="patient">Patient</option>
          </select>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchType === "order" ? "LAB-0001 or 0001…" : "Patient name or ID…"}
              className="w-full border rounded-r-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...STATUS_ORDER] as const).map(s => {
            const icons: Record<string, React.ReactNode> = {
              ALL: <ScanLine size={12} />, ORDERED: <ClipboardList size={12} />,
              COLLECTED: <TestTube2 size={12} />, PROCESSING: <Microscope size={12} />, COMPLETED: <CheckCircle2 size={12} />,
            };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  filterStatus === s ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {icons[s]} {s}
              </button>
            );
          })}
        </div>

        <hr className="border-gray-100" />

        {/* Context selectors */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <FlaskConical size={13} className="text-blue-600" /> Select Context for New Order
          </p>
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <User size={11} /> Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Stethoscope size={11} /> Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={doctors.length === 0}
              >
                {doctors.length === 0
                  ? <option value={0}>Loading doctors…</option>
                  : doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}{d.specialty ? ` — ${d.specialty}` : ""}
                      </option>
                    ))
                }
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <FileText size={11} /> Encounter
              </label>
              <select
                value={selectedEncounterId}
                onChange={e => setSelectedEncounterId(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={encounters.length === 0}
              >
                {encounters.length === 0
                  ? <option value={0}>No encounters (uses patient ID)</option>
                  : encounters.map(enc => (
                      <option key={enc.id} value={enc.id}>{enc.label}</option>
                    ))
                }
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <User size={10} /> {selectedPatient?.name}
            </span>
            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <FileText size={10} /> {displayEncounterId}
            </span>
            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Stethoscope size={10} /> {selectedDoctor?.name ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Orders Table ──────────────────────────────────────── */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <BeakerIcon size={16} className="text-blue-600" />
            Lab Orders
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {visible.length}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowOrderModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={14} /> New Order
            </button>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex justify-center items-center py-14 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading orders…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm gap-2">
            <FlaskConical size={30} className="text-gray-300" />
            {orders.length === 0 ? "No lab orders yet. Click New Order to create one." : "No orders match the current filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left">Order ID</th>
                  <th className="px-4 py-2.5 text-left">Patient</th>
                  <th className="px-4 py-2.5 text-left">Tests</th>
                  <th className="px-4 py-2.5 text-left">Sample ID</th>
                  <th className="px-4 py-2.5 text-left">Ordered By</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map(order => {
                  const results     = orderResultsFor(order);
                  const hasCritical = results.some(r => r.flag === "CRITICAL");
                  const isViewing   = viewingOrder?.labOrderId === order.labOrderId;
                  const codes       = parseTestCodes(order.testsJson);

                  return (
                    <tr
                      key={order.labOrderId}
                      className={`transition-colors ${hasCritical ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 font-semibold">
                        LAB-{String(order.labOrderId ?? 0).padStart(4, "0")}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">{patientName(order.patientId)}</p>
                        <p className="text-gray-400 text-xs">ID: {order.patientId}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {codes.map(c => (
                            <span key={c} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                              {getTestMeta(c)?.name ?? c}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {order.sampleId ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-700">
                        {doctorName(order.orderedBy)}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge s={order.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              order.status === "COMPLETED"
                                ? (() => { setResultTarget(order); setEditMode(true); })()
                                : advanceStatus(order)
                            }
                            className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                              order.status === "COMPLETED"
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {nextLabel(order.status)}
                          </button>

                          {order.status === "COMPLETED" && results.length > 0 && (
                            <button
                              onClick={() => setViewingOrder(isViewing ? null : order)}
                              className={`p-1 rounded-lg transition ${
                                isViewing ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              }`}
                              title={isViewing ? "Hide Results" : "View Results"}
                            >
                              {isViewing ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          )}

                          {order.status === "COMPLETED" && results.length > 0 && (
                            <button
                              onClick={() => printLabReport(
                                order,
                                results,
                                patientName(order.patientId),
                                doctorName(order.orderedBy)
                              )}
                              className="p-1 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                              title="Print / Download Report"
                            >
                              <Printer size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: Results Viewer ────────────────────────────────────── */}
      {viewingOrder && viewingResults.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm flex-wrap">
              <FileText size={15} className="text-green-600" />
              Results — LAB-{String(viewingOrder.labOrderId ?? 0).padStart(4, "0")}
              <span className="text-xs text-gray-400 font-normal">
                · {patientName(viewingOrder.patientId)}
                · {doctorName(viewingOrder.orderedBy)}
                {viewingOrder.sampleId && ` · ${viewingOrder.sampleId}`}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printLabReport(
                  viewingOrder,
                  viewingResults,
                  patientName(viewingOrder.patientId),
                  doctorName(viewingOrder.orderedBy)
                )}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium transition border border-green-200 rounded-lg px-2 py-1 hover:bg-green-50"
                title="Print / Download Report"
              >
                <Printer size={12} /> Print Report
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
              >
                <ChevronUp size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {viewingResults.map(r => (
              <div
                key={r.resultId ?? r.testCode}
                className={`rounded-xl border p-3 ${
                  r.flag === "CRITICAL" ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TestTube2 size={12} className="text-blue-500 shrink-0" />
                  <p className="font-semibold text-gray-700 text-xs truncate">
                    {getTestMeta(r.testCode)?.name ?? r.testCode}
                  </p>
                </div>
                <p className="text-gray-900 text-lg font-bold leading-tight">
                  {r.resultValue}
                  <span className="text-gray-400 text-xs font-normal ml-1">{r.units}</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Ref: {getTestMeta(r.testCode)?.range ?? "—"}
                </p>
                <div className="mt-1.5">
                  <FlagPill flag={r.flag} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showOrderModal && (
        <OrderFormModal
          patientId={String(selectedPatient?.id ?? 1)}
          patientName={selectedPatient?.name ?? "Unknown"}
          encounterId={displayEncounterId}
          defaultOrderedBy={selectedDoctor?.name ?? ""}
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {resultTarget && (
        <ResultFormModal
          order={resultTarget}
          existingResults={allResults.filter(r => r.labOrderId === resultTarget.labOrderId)}
          isEditMode={editMode}
          onClose={() => setResultTarget(null)}
          onSave={handleSaveResults}
        />
      )}
    </div>
  );
};
