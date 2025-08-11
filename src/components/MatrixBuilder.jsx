import React, { useMemo } from 'react';
import { useAppStore } from '../store.js';
import { evaluateConstraints } from '../utils/constraints.js';

export default function MatrixBuilder(){
  const { classes, subjects, teachers, allocation, setAllocation, filters } = useAppStore();

  // Filtered classes
  const visibleClasses = classes.filter(c =>
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode) &&
    (filters.curriculum==='All' || c.curriculum===filters.curriculum)
  );

  // Unique subject set across visible classes (or keep global subjects order)
  const subjectColumns = useMemo(() => {
    const ids = new Set();
    visibleClasses.forEach(c => (c.subjectIds||[]).forEach(sid => ids.add(sid)));
    return subjects.filter(s => ids.has(s.id));
  }, [visibleClasses, subjects]);

  // Constraints for icons
  const state = useAppStore();
  const warnings = useMemo(()=> evaluateConstraints(state), [state.allocation, state.filters, state.activeClassId]);
  const cellIssues = useMemo(()=>{
    const out = {};
    warnings.forEach(w => {
      // parse class and subject names from message (best-effort), or map by allocation later
      // For simplicity: we’ll just highlight the whole row if class has any warnings.
      const match = /^(.*?):/.exec(w.message);
      if (match) { out[match[1]] = true; }
    });
    return out;
  }, [warnings]);

  return (
    <div className="card overflow-auto">
      <div className="min-w-[900px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[color:var(--surface)]">
            <tr className="border-b">
              <th className="py-2 px-2">Class</th>
              <th className="py-2 px-2">Mode</th>
              <th className="py-2 px-2">Learners</th>
              {subjectColumns.map(col => (
                <th key={col.id} className="py-2 px-2">{col.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleClasses.map(cls => {
              const rowWarn = cellIssues[cls.name];
              return (
                <tr key={cls.id} className={`border-b ${rowWarn ? 'bg-red-50' : ''}`}>
                  <td className="py-2 px-2 font-medium">{cls.name}</td>
                  <td className="py-2 px-2">{cls.mode}</td>
                  <td className="py-2 px-2">{cls.learners}</td>
                  {subjectColumns.map(s => {
                    const isInClass = (cls.subjectIds||[]).includes(s.id);
                    if (!isInClass) return <td key={s.id} className="py-2 px-2 text-gray-300">—</td>;
                    const value = (allocation[cls.id] || {})[s.id] || '';
                    return (
                      <td key={s.id} className="py-2 px-2">
                        <select
                          className={`border rounded px-2 py-1 w-full ${rowWarn ? 'border-[color:var(--warn)]' : ''}`}
                          value={value}
                          onChange={(e)=> setAllocation(cls.id, s.id, e.target.value)}
                        >
                          <option value="">— Select —</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
