import React, { useMemo, useState } from 'react';
import {
  RefreshCw, FlaskConical, Clock, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, ArrowUp, ArrowDown,
  Download, TrendingUp,
} from 'lucide-react';
import { LabOrder, LabResult } from './types';
import { fmtDate, Empty } from './utils';

// ─── Props (unchanged) ────────────────────────────────────────────────────────
interface Props {
  labOrders:         LabOrder[];
  labResults:        Record<number, LabResult[]>;
  labResultLoading:  Record<number, boolean>;
  expandedOrder:     number | null;
  handleToggleOrder: (orderId: number) => void;
  onRefresh:         () => void;
}

// ─── Status journey ───────────────────────────────────────────────────────────
// Matches the actual values used in EmbeddedLabManager / LabTestDictionary
const JOURNEY = [
  { key: 'ORDERED',    label: 'Order Placed'    },
  { key: 'COLLECTED',  label: 'Sample Collected'},
  { key: 'PROCESSING', label: 'Processing'      },
  { key: 'COMPLETED',  label: 'Results Ready'   },
] as const;

function journeyStep(status: string): number {
  const idx = JOURNEY.findIndex(s => s.key === status?.toUpperCase());
  return idx === -1 ? 0 : idx;
}

// ─── Flag display config ──────────────────────────────────────────────────────
function flagCfg(flag: string) {
  if (flag === 'CRITICAL') return {
    icon:    <AlertTriangle className="w-3.5 h-3.5" />,
    cardCls: 'bg-rose-50 border-rose-200',
    badge:   'bg-rose-100 text-rose-700 border border-rose-200',
    msg:     'Critical value — contact your doctor immediately',
  };
  if (flag === 'HIGH') return {
    icon:    <ArrowUp className="w-3.5 h-3.5" />,
    cardCls: 'bg-orange-50 border-orange-200',
    badge:   'bg-orange-100 text-orange-700 border border-orange-200',
    msg:     'Above normal range — consult your doctor',
  };
  if (flag === 'LOW') return {
    icon:    <ArrowDown className="w-3.5 h-3.5" />,
    cardCls: 'bg-blue-50 border-blue-200',
    badge:   'bg-blue-100 text-blue-700 border border-blue-200',
    msg:     'Below normal range — consult your doctor',
  };
  return {
    icon:    <CheckCircle2 className="w-3.5 h-3.5" />,
    cardCls: 'bg-emerald-50 border-emerald-200',
    badge:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
    msg:     'Within normal range',
  };
}

// ─── Reference range helpers ──────────────────────────────────────────────────
function parseRefRange(json: string): { min?: number; max?: number } {
  try { const r = JSON.parse(json); return { min: r.min, max: r.max }; }
  catch { return {}; }
}

function refRangeLabel(json: string): string {
  if (!json) return '—';
  const { min, max } = parseRefRange(json);
  if (min !== undefined && max !== undefined) return `${min} – ${max}`;
  if (min !== undefined) return `≥ ${min}`;
  if (max !== undefined) return `≤ ${max}`;
  return json;
}

function parseTests(testsJson: string): string[] {
  try {
    const p = JSON.parse(testsJson);
    return Array.isArray(p) ? p : [testsJson];
  } catch { return testsJson ? [testsJson] : []; }
}

// ─── Download / Print report ──────────────────────────────────────────────────
function downloadReport(order: LabOrder, results: LabResult[], tests: string[]) {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Lab Report — Order #${order.labOrderId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; font-size: 14px; }
    h1   { color: #2563eb; margin: 0 0 4px; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 28px; }
    .meta { display: flex; flex-wrap: wrap; gap: 20px; padding: 14px 16px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; }
    .meta-item strong { display: block; font-size: 13px; color: #0f172a; }
    .meta-item span   { font-size: 11px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 9px 12px; text-align: left; font-size: 11px;
         text-transform: uppercase; letter-spacing: .06em; color: #475569;
         border-bottom: 2px solid #e2e8f0; }
    td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    .NORMAL   { color: #059669; font-weight: 600; }
    .HIGH     { color: #ea580c; font-weight: 600; }
    .LOW      { color: #2563eb; font-weight: 600; }
    .CRITICAL { color: #dc2626; font-weight: 700; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8;
              border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>ClinicFlow &mdash; Lab Report</h1>
  <p class="sub">Generated from ClinicFlow Patient Portal</p>
  <div class="meta">
    <div class="meta-item"><strong>Order #${order.labOrderId}</strong><span>Reference ID</span></div>
    <div class="meta-item"><strong>${tests.join(', ') || '—'}</strong><span>Tests</span></div>
    <div class="meta-item"><strong>${order.status}</strong><span>Status</span></div>
    ${order.collectedAt ? `<div class="meta-item"><strong>${fmt(order.collectedAt)}</strong><span>Collection Date</span></div>` : ''}
    ${order.sampleId    ? `<div class="meta-item"><strong>${order.sampleId}</strong><span>Sample ID</span></div>` : ''}
  </div>
  ${results.length === 0
    ? '<p style="color:#94a3b8;font-style:italic">No individual test values recorded for this order.</p>'
    : `<table>
        <thead>
          <tr><th>Test</th><th>Result</th><th>Units</th><th>Reference Range</th><th>Flag</th><th>Reported</th></tr>
        </thead>
        <tbody>
          ${results.map(r => `
          <tr>
            <td><strong>${r.testCode}</strong></td>
            <td><strong>${r.resultValue ?? '—'}</strong></td>
            <td>${r.units || '—'}</td>
            <td>${refRangeLabel(r.referenceRangeJson)}</td>
            <td class="${r.flag}">${r.flag || '—'}</td>
            <td>${r.reportedAt ? new Date(r.reportedAt).toLocaleDateString('en-US') : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`}
  <div class="footer">
    This report is for informational purposes only. Please consult your healthcare provider for medical advice.<br/>
    Printed: ${new Date().toLocaleString('en-US')}
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Trend chart (pure SVG, no extra dependencies) ───────────────────────────
interface TrendPoint  { date: Date; value: number; }
interface TrendSeries { testCode: string; units: string; min?: number; max?: number; points: TrendPoint[]; }

function TrendChart({ s }: { s: TrendSeries }) {
  const W = 480, H = 160;
  const P = { t: 24, r: 16, b: 32, l: 44 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;

  const vals  = s.points.map(p => p.value);
  const times = s.points.map(p => p.date.getTime());

  const minV = Math.min(...vals,  s.min ?? Infinity)  * (s.min !== undefined ? 1 : 0.9);
  const maxV = Math.max(...vals,  s.max ?? -Infinity) * (s.max !== undefined ? 1 : 1.1);
  const rV   = maxV - minV || 1;
  const minT = Math.min(...times);
  const rT   = (Math.max(...times) - minT) || 1;

  const xS = (t: number) => P.l + ((t - minT) / rT) * iW;
  const yS = (v: number) => P.t + iH - ((v - minV) / rV) * iH;

  const pts  = s.points.map(p => ({ x: xS(p.date.getTime()), y: yS(p.value), v: p.value, d: p.date }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const ticks = [minV, (minV + maxV) / 2, maxV];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
      {/* Reference range band */}
      {s.min !== undefined && s.max !== undefined && (
        <rect x={P.l} y={yS(s.max)} width={iW} height={yS(s.min) - yS(s.max)}
          fill="#10b981" fillOpacity={0.10} />
      )}
      {/* Grid + Y-axis labels */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={P.l} y1={yS(v)} x2={P.l + iW} y2={yS(v)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={P.l - 4} y={yS(v) + 3.5} textAnchor="end" fontSize={9} fill="#94a3b8">{v.toFixed(1)}</text>
        </g>
      ))}
      {/* X-axis date labels */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
          {p.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
      {/* Line */}
      <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + value labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5} fill="white" stroke="#2563eb" strokeWidth={2} />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={9} fontWeight="600" fill="#1d4ed8">{p.v}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LabResultsTab({
  labOrders, labResults, labResultLoading, expandedOrder, handleToggleOrder, onRefresh,
}: Props) {
  const [showTrends, setShowTrends] = useState(false);

  // Summary counts
  const completedCount = labOrders.filter(o => o.status === 'COMPLETED').length;
  const allResults     = useMemo(() => Object.values(labResults).flat(), [labResults]);
  const abnormalCount  = allResults.filter(r => r.flag && r.flag !== 'NORMAL').length;
  const criticalCount  = allResults.filter(r => r.flag === 'CRITICAL').length;

  // Trend series: same testCode appearing in ≥2 loaded result sets
  const trendSeries = useMemo<TrendSeries[]>(() => {
    const byTest: Record<string, { r: LabResult; o: LabOrder }[]> = {};
    labOrders.forEach(o => {
      (labResults[o.labOrderId] ?? []).forEach(r => {
        if (!r.testCode) return;
        (byTest[r.testCode] ??= []).push({ r, o });
      });
    });
    return Object.entries(byTest)
      .filter(([, items]) => items.length >= 2)
      .map(([testCode, items]) => {
        const sorted = [...items].sort((a, b) =>
          new Date(a.r.reportedAt || a.o.collectedAt || 0).getTime() -
          new Date(b.r.reportedAt || b.o.collectedAt || 0).getTime()
        );
        const { min, max } = parseRefRange(sorted[0]?.r.referenceRangeJson ?? '');
        return {
          testCode,
          units:  sorted[0]?.r.units ?? '',
          min, max,
          points: sorted
            .filter(e => !isNaN(parseFloat(e.r.resultValue)))
            .map(e => ({
              date:  new Date(e.r.reportedAt || e.o.collectedAt || Date.now()),
              value: parseFloat(e.r.resultValue),
            })),
        };
      })
      .filter(s => s.points.length >= 2);
  }, [labResults, labOrders]);

  // Sort orders: most recent collection first
  const sortedOrders = useMemo(() =>
    [...labOrders].sort((a, b) =>
      new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime()
    ), [labOrders]);

  return (
    <div className="p-8 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Lab Results</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {labOrders.length} order{labOrders.length !== 1 ? 's' : ''} on record
          </p>
        </div>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      {labOrders.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{labOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Results Ready</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
          </div>
          <div className={`rounded-2xl border shadow-sm p-4 ${
            criticalCount > 0 ? 'bg-rose-50 border-rose-200' :
            abnormalCount > 0 ? 'bg-orange-50 border-orange-100' :
            'bg-white border-slate-100'
          }`}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Abnormal Results</p>
            <p className={`text-2xl font-bold mt-1 ${
              criticalCount > 0 ? 'text-rose-600' :
              abnormalCount > 0 ? 'text-orange-600' : 'text-slate-300'
            }`}>{abnormalCount}</p>
            {criticalCount > 0 && (
              <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                {criticalCount} critical — contact your doctor
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Trend chart section ── */}
      {trendSeries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setShowTrends(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Result Trends</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {trendSeries.length} test{trendSeries.length !== 1 ? 's' : ''} with multiple readings
                </p>
              </div>
            </div>
            {showTrends
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showTrends && (
            <div className="border-t border-slate-100 px-6 py-5 space-y-8">
              {trendSeries.map(s => (
                <div key={s.testCode}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-slate-800">
                      {s.testCode}
                      {s.units && <span className="text-slate-400 font-normal ml-1.5">({s.units})</span>}
                    </p>
                    {s.min !== undefined && s.max !== undefined && (
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                        Normal: {s.min} – {s.max} {s.units}
                      </span>
                    )}
                  </div>
                  <TrendChart s={s} />
                  <p className="text-[10px] text-slate-400 mt-1 text-center">
                    {s.points.length} readings · shaded band = normal range
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {labOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Empty
            message="No lab orders found"
            sub="Lab test orders placed by your clinician will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOrders.map(order => {
            const tests      = parseTests(order.testsJson);
            const isExpanded = expandedOrder === order.labOrderId;
            const results    = labResults[order.labOrderId];
            const isLoading  = labResultLoading[order.labOrderId];
            const step       = journeyStep(order.status);
            const cancelled  = order.status?.toUpperCase() === 'CANCELLED';

            return (
              <div key={order.labOrderId}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* ── Card header ── */}
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">

                    {/* Left: icon + test names + meta */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                          {tests.length > 0 ? tests.join(', ') : `Order #${order.labOrderId}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {order.collectedAt && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {fmtDate(order.collectedAt)}
                            </span>
                          )}
                          {order.sampleId && (
                            <span className="text-[11px] text-slate-400">Sample: {order.sampleId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: download + expand buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'COMPLETED' && results && results.length > 0 && (
                        <button
                          onClick={() => downloadReport(order, results, tests)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleOrder(order.labOrderId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        {isExpanded
                          ? <><ChevronUp   className="w-3 h-3" /> Hide</>
                          : <><ChevronDown className="w-3 h-3" /> View Results</>}
                      </button>
                    </div>
                  </div>

                  {/* ── Status journey stepper ── */}
                  {cancelled ? (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-semibold text-rose-500">
                        Order Cancelled
                      </span>
                    </div>
                  ) : (
                    <div className="mt-5 flex items-center">
                      {JOURNEY.map((j, i) => {
                        const done    = i <= step;
                        const current = i === step;
                        return (
                          <React.Fragment key={j.key}>
                            <div className="flex flex-col items-center gap-1" style={{ flex: '0 0 auto', minWidth: 68 }}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                                current
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                  : done
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-white border-slate-200 text-slate-300'
                              }`}>
                                {done && !current ? '✓' : i + 1}
                              </div>
                              <span className={`text-[10px] font-medium text-center leading-tight ${
                                current ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-300'
                              }`}>
                                {j.label}
                              </span>
                            </div>
                            {i < JOURNEY.length - 1 && (
                              <div className={`h-0.5 flex-1 mb-4 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Results panel ── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading your results…
                      </div>

                    ) : !results || results.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 italic">
                        {order.status === 'COMPLETED'
                          ? 'Results recorded — no individual test values available for this order.'
                          : 'Your results will appear here once the lab has finished processing your sample.'}
                      </p>

                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {results.map(r => {
                          const cfg   = flagCfg(r.flag);
                          const range = refRangeLabel(r.referenceRangeJson);
                          return (
                            <div key={r.resultId}
                              className={`rounded-xl border p-4 ${cfg.cardCls}`}>

                              {/* Test name */}
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {r.testCode}
                              </p>

                              {/* Result value + units */}
                              <div className="flex items-end gap-1.5 mb-1">
                                <span className="text-2xl font-bold text-slate-900 leading-none">
                                  {r.resultValue ?? '—'}
                                </span>
                                {r.units && (
                                  <span className="text-sm text-slate-500 mb-0.5">{r.units}</span>
                                )}
                              </div>

                              {/* Normal range context */}
                              {range !== '—' && (
                                <p className="text-[11px] text-slate-400 mb-3">
                                  Normal range: {range}{r.units ? ` ${r.units}` : ''}
                                </p>
                              )}

                              {/* Flag badge */}
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
                                {cfg.icon}
                                <span>{cfg.msg}</span>
                              </div>

                              {/* Reported date */}
                              {r.reportedAt && (
                                <p className="text-[10px] text-slate-400 mt-2">
                                  Reported {fmtDate(r.reportedAt)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
