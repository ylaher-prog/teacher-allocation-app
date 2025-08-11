import React from 'react';
import { useAppStore } from '../store.js';

export default function FiltersBar(){
  const { classes, filters, setFilters, activeClassId, setActiveClass } = useAppStore();

  const gradeSet = new Set(classes.map(c=> c.grade || ''));
  const grades = ['All', ...Array.from(gradeSet).filter(Boolean).sort((a,b)=> (a||0)-(b||0))];
  const modes = ['All', ...Array.from(new Set(classes.map(c=> c.mode)))];
  const curricula = ['All', ...Array.from(new Set(classes.map(c=> c.curriculum)))];

  const filtered = classes.filter(c =>
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode) &&
    (filters.curriculum==='All' || c.curriculum===filters.curriculum)
  );

  return (
    <div className="card flex flex-wrap items-center gap-3">
      <div className="font-medium">Filters</div>
      <select className="border rounded px-2 py-1" value={filters.grade}
              onChange={e=> setFilters({ grade: e.target.value==='All' ? 'All' : Number(e.target.value) })}>
        {grades.map(g=> <option key={g} value={g}>{g}</option>)}
      </select>
      <select className="border rounded px-2 py-1" value={filters.mode} onChange={e=> setFilters({ mode: e.target.value })}>
        {modes.map(m=> <option key={m} value={m}>{m}</option>)}
      </select>
      <select className="border rounded px-2 py-1" value={filters.curriculum} onChange={e=> setFilters({ curriculum: e.target.value })}>
        {curricula.map(cur=> <option key={cur} value={cur}>{cur}</option>)}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-gray-500">Classes:</span>
        <select className="border rounded px-2 py-1" value={activeClassId} onChange={e=> setActiveClass(e.target.value)}>
          {filtered.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
}
