// src/components/MatrixBuilder.jsx
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.js';
import { evaluateConstraints } from '../utils/constraints.js';

export default function MatrixBuilder(){
  const {
    classes, subjects, teachers, allocation, setAllocation,
    filters, periodsMap, setPeriods, getPeriods
  } = useAppStore();

  const [edit, setEdit] = useState(true);          // Edit Mode ON by default
  const [autoBySpecialty, setAutoBySpecialty] = useState(false);

  const visibleClasses = classes.filter(c =>
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode) &&
    (filters.curriculum==='All' || c.curriculum===filters.curriculum)
  );

  const subjectColumns = useMemo(() => {
    const ids = new Set();
    visibleClasses.forEach(c => (c.subjectIds||[]).forEach(sid => ids.add(sid)));
    return subjects.filter(s => ids.has(s.id));
  }, [visibleClasses, subjects]);

  const state = useAppStore();
  const warnings = useMemo(()=> evaluateConstraints(state), [state.allocation, state.periodsMap, state.filters]);

  // Auto-fill (simple) by specialty: choose the first teacher whose specialties include the subject
  const runAutoFill = () => {
    const next = {};
    visibleClasses.forEach(cls => {
      const row = next[cls.id] = { ...(allocation[cls.id] || {}) };
      subjectColumns.forEach(s => {
        if (!(cls.subjectIds||[]).includes(s.id)) return;
        const already = row[s.id];
        if (already) return;
        const candidate = teachers.find(t =>
          (t.specialties||[]).includes(s.requiredSpecialty || s.name) &&
          (t.modes||[]).some(m => cls.mode.startsWith(m) || m === cls.mode)
        );
        if (candidate) row[s.id] = candidate.id;
      });
    });
    // commit
    Object.keys(next).forEach(cid => {
      const row = next[cid];
      Object.keys(row).forEach(sid => setAllocation(cid, sid, row[sid]));
    });
  };

  return (
    <div className="card overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Matrix Builder (Classes × Subjects)</div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={edit} onChange={(e)=> setEdit(e.target.checked)} />
            <span>Edit Mode</span>
          </label>
          <button className="btn-secondary" onClick={runAutoFill}>Auto-fill by Specialty</button>
        </div>
      </div>

      <div className="min-w-[1000px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[color:var(--surface)]">
            <tr className="border-b">
              <th className="py-2 px-2">Class</th>
              <th className="py-2 px-2">Mode</th>
              <th className="py-2 px-2">Learners</th>
              {subjectColumns.map(col => (
                <th key={col.id} className="py-2 px-2">
                  <div className="font-medium">{col.name}</div>
                  <div className="text-xs text-gray-500">Default periods: {col.periods}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleClasses.map(cls => (
              <tr key={cls.id} className="border-b">
                <td className="py-2 px-2 font-medium">{cls.name}</td>
                <td className="py-2 px-2">{cls.mode}</td>
                <td className="py-2 px-2">{cls.learners}</td>

                {subjectColumns.map(s => {
                  if (!(cls.subjectIds||[]).includes(s.id)) {
                    return <td key={s.id} className="py-2 px-2 text-gray-300">—</td>;
                  }
                  const value = (allocation[cls.id] || {})[s.id] || '';
                  const periods = getPeriods(cls.id, s.id) ?? s.periods ?? '';
                  return (
                    <td key={s.id} className="py-2 px-2">
                      <div className="flex gap-2 items-center">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={value}
                          disabled={!edit}
                          onChange={(e)=> setAllocation(cls.id, s.id, e.target.value)}
                        >
                          <option value="">— Select —</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <input
                          type="number"
                          min="0"
                          className="border rounded px-2 py-1 w-20"
                          disabled={!edit}
                          value={periods}
                          onChange={(e)=> {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setPeriods(cls.id, s.id, v);
                          }}
                          title="Periods for this class/subject"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline warnings summary */}
      <div className="mt-3 text-sm">
        {warnings.length === 0 ? (
          <span className="text-emerald-600">All good. No issues detected.</span>
        ) : (
          <span className="text-[color:var(--warn)]">{warnings.length} issues detected — see “Constraints & Warnings”.</span>
        )}
      </div>
    </div>
  );
}
