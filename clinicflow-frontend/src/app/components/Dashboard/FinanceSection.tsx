/* ─────────────────────────────────────────────────────────────────────────────
 * Dashboard/FinanceSection.tsx
 *
 * Visible to: Administrator, Manager, Finance
 *
 * Contains:
 *   RevenueClaims — donut chart + paid/pending invoice summary
 *   SideInvoices  — recent invoices list
 * ─────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from 'recharts';
import { hasAnyRole, fmtDate, type BackendInvoice } from './shared';
import { Modal } from './Modal';

/* ── RevenueClaims ── */

function RevenueClaims({ invoices, loading }: { invoices: BackendInvoice[]; loading: boolean }) {
  const [approvedModal, setApprovedModal] = useState(false);
  const [pendingModal,  setPendingModal]  = useState(false);

  const approved = invoices.filter(i => i.status === 'PAID');
  const pending  = invoices.filter(i => i.status === 'PENDING' || i.status === 'UNPAID');
  const approvedTotal = approved.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const pendingTotal  = pending.reduce((s, i)  => s + (Number(i.totalAmount) || 0), 0);

  const approvedPct = invoices.length ? Math.round((approved.length / invoices.length) * 100) : 60;
  const donutData   = [
    { name: 'Paid',    value: approved.length || 60, color: '#22c55e' },
    { name: 'Pending', value: pending.length  || 40, color: '#f59e0b' },
  ];

  const fmt = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toFixed(0)}`;

  return (
    <>
      <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Revenue and Claims</h3>

        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Total Paid Invoices</p>
            {loading
              ? <div className="h-7 w-24 bg-gray-100 animate-pulse rounded mt-1" />
              : <p className="text-xl font-bold text-gray-900">{fmt(approvedTotal)}</p>
            }
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Pending Claims</p>
            {loading
              ? <div className="h-7 w-16 bg-gray-100 animate-pulse rounded mt-1 ml-auto" />
              : <div className="flex items-baseline gap-2 justify-end">
                  <p className="text-xl font-bold text-gray-900">{pending.length}</p>
                  <span className="text-xs text-amber-500 font-semibold">{fmt(pendingTotal)}</span>
                </div>
            }
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} innerRadius={52} outerRadius={72} dataKey="value" startAngle={90} endAngle={-270}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-gray-900">{approvedPct}%</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Paid</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pending</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
                  <span className="text-xs font-semibold text-gray-700">Paid</span>
                </div>
                <p className="text-[11px] text-gray-400">{approved.length} invoice{approved.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{fmt(approvedTotal)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                  <span className="text-xs font-semibold text-gray-700">Pending</span>
                </div>
                <p className="text-[11px] text-gray-400">{pending.length} invoice{pending.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{fmt(pendingTotal)}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setApprovedModal(true)} className="text-blue-600 text-xs font-medium flex items-center gap-0.5 hover:underline">
                View paid <ChevronRight size={12} />
              </button>
              <button onClick={() => setPendingModal(true)} className="text-blue-600 text-xs font-medium flex items-center gap-0.5 hover:underline">
                View pending <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {approvedModal && (
        <Modal title="Paid Invoices" onClose={() => setApprovedModal(false)}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Invoice</th>
                <th className="text-left pb-2">Patient ID</th>
                <th className="text-left pb-2">Amount</th>
                <th className="text-left pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {approved.length === 0
                ? <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No paid invoices</td></tr>
                : approved.map((r, i) => (
                  <tr key={r.invoiceId ?? i} className="border-t border-gray-50">
                    <td className="py-2 text-gray-700 font-mono">INV-{r.invoiceId ?? r.id}</td>
                    <td className="py-2 text-gray-500">{r.patientId}</td>
                    <td className="py-2 text-gray-700 font-medium">₹{Number(r.totalAmount ?? 0).toFixed(2)}</td>
                    <td className="py-2 text-gray-400">{fmtDate(r.issuedAt ?? r.createdAt ?? r.issueDate)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Modal>
      )}

      {pendingModal && (
        <Modal title="Pending Invoices" onClose={() => setPendingModal(false)}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Invoice</th>
                <th className="text-left pb-2">Patient ID</th>
                <th className="text-left pb-2">Amount</th>
                <th className="text-left pb-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0
                ? <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No pending invoices</td></tr>
                : pending.map((r, i) => (
                  <tr key={r.invoiceId ?? i} className="border-t border-gray-50">
                    <td className="py-2 text-gray-700 font-mono">INV-{r.invoiceId ?? r.id}</td>
                    <td className="py-2 text-gray-500">{r.patientId}</td>
                    <td className="py-2 text-amber-600 font-medium">₹{Number(r.totalAmount ?? 0).toFixed(2)}</td>
                    <td className="py-2 text-gray-400">{fmtDate(r.dueDate ?? r.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

/* ── SideInvoices ── */

function SideInvoices({ invoices, loading }: { invoices: BackendInvoice[]; loading: boolean }) {
  const [modal, setModal] = useState(false);
  const rows = invoices.slice(0, 4);

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Recent Invoices</h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-7 bg-gray-100 animate-pulse rounded" />)}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Invoice</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={3} className="py-4 text-gray-400 text-center">No invoices yet</td></tr>
                : rows.map((r, i) => (
                  <tr key={r.invoiceId ?? i} className="border-t border-gray-50">
                    <td className="py-1.5 text-gray-700 font-mono text-[11px]">INV-{r.invoiceId ?? r.id}</td>
                    <td className="py-1.5 text-gray-500">{fmtDate(r.issuedAt ?? r.createdAt ?? r.issueDate)}</td>
                    <td className="py-1.5 text-gray-700 font-medium">₹{Number(r.totalAmount ?? 0).toFixed(2)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
        <button onClick={() => setModal(true)} className="mt-3 w-full text-right text-blue-600 text-xs font-medium hover:underline">
          View all →
        </button>
      </div>

      {modal && (
        <Modal title="All Invoices" onClose={() => setModal(false)}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide">
                <th className="text-left pb-2">Invoice</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Amount</th>
                <th className="text-left pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0
                ? <tr><td colSpan={4} className="py-4 text-gray-400 text-center">No invoices found</td></tr>
                : invoices.map((r, i) => (
                  <tr key={r.invoiceId ?? i} className="border-t border-gray-50">
                    <td className="py-2 text-gray-700 font-mono">INV-{r.invoiceId ?? r.id}</td>
                    <td className="py-2 text-gray-500">{fmtDate(r.issuedAt ?? r.createdAt ?? r.issueDate)}</td>
                    <td className="py-2 text-gray-700 font-medium">₹{Number(r.totalAmount ?? 0).toFixed(2)}</td>
                    <td className={`py-2 font-semibold ${r.status === 'PAID' ? 'text-green-500' : 'text-amber-500'}`}>{r.status ?? '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Modal>
      )}
    </>
  );
}

/* ── FinanceSection (exported) ── */

interface FinanceSectionProps {
  invoices: BackendInvoice[];
  loading: boolean;
}

export function FinanceSection({ invoices, loading }: FinanceSectionProps) {
  if (!hasAnyRole('Administrator', 'Manager', 'Finance')) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <RevenueClaims invoices={invoices} loading={loading} />
      <SideInvoices  invoices={invoices} loading={loading} />
    </div>
  );
}
