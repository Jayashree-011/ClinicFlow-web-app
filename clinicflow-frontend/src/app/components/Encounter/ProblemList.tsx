import React, { useState, useEffect } from 'react';
import { Plus, X, RefreshCw, AlertCircle, ClipboardList, CheckCircle2, Pen } from 'lucide-react';
import type { ProblemDTO, ProblemStatus } from './types';
import { problemApi } from './api';
import { COMMON_ICD10, PROBLEM_STATUS_META, EMPTY_ADD_FORM } from './constants';
import { ProblemField } from './shared';

export function ProblemListSection({
  encounterId, patientId, readOnly,
}: {
  encounterId: number;
  patientId: number;
  readOnly: boolean;
}) {
  const [problems,    setProblems]   = useState<ProblemDTO[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState('');
  const [showAdd,     setShowAdd]    = useState(false);
  const [addForm,     setAddForm]    = useState(EMPTY_ADD_FORM);
  const [addLoading,  setAddLoading] = useState(false);
  const [addError,    setAddError]   = useState('');
  const [editingId,   setEditingId]  = useState<number | null>(null);
  const [editForm,    setEditForm]   = useState<Partial<ProblemDTO>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    problemApi.getByEncounter(encounterId)
      .then(data => { setProblems(data); setLoading(false); })
      .catch(() => { setError('Failed to load problem list.'); setLoading(false); });
  }, [encounterId]);

  const handleAdd = async () => {
    if (!addForm.code.trim()) { setAddError('Problem code is required.'); return; }
    setAddLoading(true); setAddError('');
    try {
      const created = await problemApi.create({
        patientId, encounterId,
        code:        addForm.code.trim(),
        icdCode:     addForm.icdCode.trim()     || undefined,
        description: addForm.description.trim() || undefined,
        onsetDate:   addForm.onsetDate          || undefined,
      });
      setProblems(prev => [created, ...prev]);
      setAddForm(EMPTY_ADD_FORM);
      setShowAdd(false);
    } catch { setAddError('Failed to add problem. Please try again.'); }
    finally  { setAddLoading(false); }
  };

  const handleResolve = async (p: ProblemDTO) => {
    setResolvingId(p.problemId);
    try {
      const updated = await problemApi.resolve(p.problemId);
      setProblems(prev => prev.map(x => x.problemId === p.problemId ? updated : x));
    } catch { setError('Failed to resolve problem.'); }
    finally  { setResolvingId(null); }
  };

  const startEdit = (p: ProblemDTO) => {
    setEditingId(p.problemId);
    setEditForm({
      code:        p.code,
      icdCode:     p.icdCode     ?? '',
      description: p.description ?? '',
      onsetDate:   p.onsetDate   ?? '',
      status:      p.status,
    });
  };

  const handleEditSave = async (p: ProblemDTO) => {
    setEditLoading(true);
    try {
      const updated = await problemApi.update(p.problemId, {
        ...p,
        code:        (editForm.code        as string).trim(),
        icdCode:     (editForm.icdCode     as string).trim() || null,
        description: (editForm.description as string).trim() || null,
        onsetDate:   (editForm.onsetDate   as string)        || null,
        status:      (editForm.status      as ProblemStatus),
      });
      setProblems(prev => prev.map(x => x.problemId === p.problemId ? updated : x));
      setEditingId(null);
    } catch { setError('Failed to update problem.'); }
    finally  { setEditLoading(false); }
  };

  const activeCount   = problems.filter(p => p.status === 'ACTIVE').length;
  const resolvedCount = problems.filter(p => p.status === 'RESOLVED').length;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">

      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Problem List</span>
          {!loading && problems.length > 0 && (
            <span className="text-xs text-slate-400 font-normal">
              {activeCount} active · {resolvedCount} resolved
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => { setShowAdd(v => !v); setAddError(''); setAddForm(EMPTY_ADD_FORM); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAdd ? 'Cancel' : 'Add Problem'}
          </button>
        )}
      </div>

      {/* Add-problem inline form */}
      {showAdd && !readOnly && (
        <div className="px-4 py-4 bg-blue-50/60 border-b border-blue-100 space-y-3">
          {addError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {addError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <ProblemField label="Problem Code *">
              <input
                value={addForm.code}
                onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
                placeholder="e.g. HYPERTENSION"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </ProblemField>
            <ProblemField label="ICD-10 Code">
              <input
                value={addForm.icdCode}
                onChange={e => setAddForm(f => ({ ...f, icdCode: e.target.value }))}
                placeholder="e.g. I10"
                list="icd10-suggestions"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </ProblemField>
          </div>
          <ProblemField label="Description">
            <input
              value={addForm.description}
              onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the problem"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
          </ProblemField>
          <ProblemField label="Onset Date">
            <input
              type="date"
              value={addForm.onsetDate}
              onChange={e => setAddForm(f => ({ ...f, onsetDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
          </ProblemField>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setShowAdd(false); setAddForm(EMPTY_ADD_FORM); setAddError(''); }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAdd} disabled={addLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60">
              {addLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Problem
            </button>
          </div>
        </div>
      )}

      {/* Section-level error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading problems…</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-1.5 text-center">
          <ClipboardList className="w-6 h-6 text-slate-200" />
          <p className="text-xs text-slate-400">No problems recorded for this encounter.</p>
          {!readOnly && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors mt-0.5">
              + Add first problem
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {problems.map(p => {
            const meta        = PROBLEM_STATUS_META[p.status];
            const isEditing   = editingId  === p.problemId;
            const isResolving = resolvingId === p.problemId;
            return (
              <li key={p.problemId} className="px-4 py-3">
                {isEditing ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <ProblemField label="Code *">
                        <input
                          value={editForm.code as string}
                          onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                      </ProblemField>
                      <ProblemField label="ICD-10 Code">
                        <input
                          value={editForm.icdCode as string}
                          onChange={e => setEditForm(f => ({ ...f, icdCode: e.target.value }))}
                          placeholder="e.g. I10"
                          list="icd10-suggestions"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                      </ProblemField>
                    </div>
                    <ProblemField label="Description">
                      <input
                        value={editForm.description as string}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                    </ProblemField>
                    <div className="grid grid-cols-2 gap-2">
                      <ProblemField label="Onset Date">
                        <input
                          type="date"
                          value={editForm.onsetDate as string}
                          onChange={e => setEditForm(f => ({ ...f, onsetDate: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
                      </ProblemField>
                      <ProblemField label="Status">
                        <select
                          value={editForm.status as string}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ProblemStatus }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </ProblemField>
                    </div>
                    <div className="flex justify-end gap-2 pt-0.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(p)} disabled={editLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60">
                        {editLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{p.code}</span>
                        {p.icdCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            {p.icdCode}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mb-1">{p.description}</p>
                      )}
                      {p.onsetDate && (
                        <p className="text-[10px] text-slate-400">
                          Onset:&nbsp;
                          {new Date(p.onsetDate + 'T00:00:00').toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(p)}
                          title="Edit problem"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pen className="w-3.5 h-3.5" />
                        </button>
                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleResolve(p)} disabled={isResolving}
                            title="Mark as Resolved"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-60">
                            {isResolving
                              ? <RefreshCw className="w-3 h-3 animate-spin" />
                              : <CheckCircle2 className="w-3 h-3" />}
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Shared ICD-10 datalist */}
      <datalist id="icd10-suggestions">
        {COMMON_ICD10.map(c => (
          <option key={c.code} value={c.code}>{c.desc}</option>
        ))}
      </datalist>
    </div>
  );
}
