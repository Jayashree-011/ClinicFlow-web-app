import React from 'react';
import {
  Plus, X, Search, InboxIcon, AlertCircle, User, RefreshCw, Trash2,
} from 'lucide-react';
import {
  pageCls, pageInnerCls, pageTitleCls,
  btnPrimary, btnSecondary,
  cardCls, tableHeadRowCls, tableThCls, tableBodyCls, tableRowCls, tableTdCls,
  tablePaginationCls,
  searchInputCls, errorBannerCls, badgeCls,
  tabBarCls, tabActiveCls, tabInactiveCls,
} from '../ui/design';
import { statusBg, statusDot } from './statusHelpers';
import type { Prescription } from './types';

// ─── Prescription Table (header + search bar + table) ────────────────────────

export interface PrescriptionTableProps {
  prescriptions: Prescription[];
  searchMode: 'patient' | 'encounter' | 'drug';
  searchValue: string;
  onSearchValueChange: (v: string) => void;
  searchedPatientName: string;
  searchLoading: boolean;
  searchError: string;
  onClearSearchError: () => void;
  onSearch: () => void;
  onSwitchMode: (mode: 'patient' | 'encounter' | 'drug') => void;
  onOpenCreate: () => void;
  getPatientName: (id: number) => string;
  onView: (rx: Prescription) => void;
  onIssue: (rxId: number) => void;
  onCancel: (rxId: number) => void;
  onDelete: (rxId: number) => void;
}

export function PrescriptionTable({
  prescriptions,
  searchMode,
  searchValue,
  onSearchValueChange,
  searchedPatientName,
  searchLoading,
  searchError,
  onClearSearchError,
  onSearch,
  onSwitchMode,
  onOpenCreate,
  getPatientName,
  onView,
  onIssue,
  onCancel,
  onDelete,
}: PrescriptionTableProps) {
  return (
    <div className={pageCls}>
      <div className={pageInnerCls}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className={pageTitleCls}>Prescriptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">Issue and manage patient prescriptions</p>
          </div>
          <button onClick={onOpenCreate} className={btnPrimary}>
            <Plus className="w-4 h-4" /> New Prescription
          </button>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className={`${tabBarCls} flex-shrink-0`}>
            <button
              onClick={() => onSwitchMode('patient')}
              className={searchMode === 'patient' ? tabActiveCls : tabInactiveCls}
            >
              By Patient
            </button>
            <button
              onClick={() => onSwitchMode('encounter')}
              className={searchMode === 'encounter' ? tabActiveCls : tabInactiveCls}
            >
              By Encounter
            </button>
            <button
              onClick={() => onSwitchMode('drug')}
              className={searchMode === 'drug' ? tabActiveCls : tabInactiveCls}
            >
              By Drug
            </button>
          </div>
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={searchMode === 'drug' ? 'text' : 'number'}
                placeholder={
                  searchMode === 'patient'   ? 'Enter Patient ID...'   :
                  searchMode === 'encounter' ? 'Enter Encounter ID...' :
                                               'Search drug name…'
                }
                value={searchValue}
                onChange={e => onSearchValueChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                className={searchInputCls}
              />
            </div>
            <button onClick={onSearch} disabled={searchLoading} className={btnSecondary}>
              {searchLoading
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-1" />Loading…</>
                : 'Search'}
            </button>
          </div>
          {searchMode === 'patient' && searchedPatientName && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-700">
              <User className="w-3.5 h-3.5" />
              <span className="font-semibold">{searchedPatientName}</span>
            </div>
          )}
        </div>

        {/* Search error */}
        {searchError && (
          <div className={`${errorBannerCls} mb-4`}>
            <AlertCircle className="w-4 h-4 shrink-0" /> {searchError}
            <button onClick={onClearSearchError} className="ml-auto opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className={tableHeadRowCls}>
                  {['Rx ID', 'Patient', 'Encounter', 'Medication', 'Dosage', 'Freq.', 'Qty', 'Status', 'Issued At', 'Actions'].map(h => (
                    <th key={h} className={tableThCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={tableBodyCls}>
                {prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <InboxIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No prescriptions found.</p>
                        <p className="text-xs text-slate-400">
                          Search by patient ID, encounter ID, or drug name above, or create one with "New Prescription".
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : prescriptions.map(p => {
                  const pName = getPatientName(p.patientId);
                  return (
                    <tr key={p.rxId} onClick={() => onView(p)} className={`${tableRowCls} cursor-pointer`}>
                      <td className={`${tableTdCls} font-semibold text-slate-900`}>#{p.rxId}</td>
                      <td className={tableTdCls}>
                        <div className="font-semibold text-slate-800 text-sm leading-tight">
                          {pName || <span className="text-slate-400 font-normal text-xs">—</span>}
                        </div>
                        <div className="text-xs text-slate-400">#{p.patientId}</div>
                      </td>
                      <td className={`${tableTdCls} text-slate-500`}>{p.encounterId ? `#${p.encounterId}` : '—'}</td>
                      <td className={`${tableTdCls} font-semibold text-slate-800`}>{p.medicationName || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>{p.dosage || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>{p.frequency || '—'}</td>
                      <td className={`${tableTdCls} text-slate-600`}>{p.quantity ?? '—'}</td>
                      <td className={tableTdCls}>
                        <span className={`${badgeCls} border ${statusBg(p.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(p.status)}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className={`${tableTdCls} text-slate-500 text-xs`}>
                        {p.issuedAt ? new Date(p.issuedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className={tableTdCls} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => onIssue(p.rxId)}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                            >
                              Issue
                            </button>
                          )}
                          {p.status !== 'CANCELLED' && p.status !== 'DISPENSED' && (
                            <button
                              onClick={() => onCancel(p.rxId)}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(p.rxId)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                            title="Permanently delete this prescription"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {prescriptions.length > 0 && (
            <div className={tablePaginationCls}>
              <span>
                Showing <span className="text-slate-900 font-bold">{prescriptions.length}</span>{' '}
                prescription{prescriptions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
