// src/components/FiltersBar.jsx
import React from 'react';
import { useAppStore } from '../store.js';

export default function FiltersBar() {
  const { classes, filters, setFilters, activeClassId, setActiveClass } =
    useAppStore();

  const curricula = ['All', ...Array.from(new Set(classes.map(c => c.curriculum))).filter(Boolean)];
  const grades = ['All', ...Array.from(new Set(classes.map(c => c.grade)))
    .filter(Boolean)
    .sort((a, b) => (a || 0) - (b || 0))];
  const modes = ['All', ...Array.from(new Set(classes.map(c => c.mode))).filter(Boolean)];

  const filtered = classes.filter(c =>
    (filters.curriculum === 'All' || c.curriculum === filters.curriculum) &&
    (filters.grade === 'All' || c.grade === filters.grade) &&
    (filters.mode === 'All' || c.mode === filters.mode)
  );

  return (
    <div className="card flex flex-wrap items-center gap-3">
      <div className="font-medium">Filters</div>

      {/* Curriculum filter */}
      <select
        className="input"
        value={filters.curriculum}
        onChange={e => setFilters({ curriculum: e.target.value })}
      >
        {curricula.map(x => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>

      {/* Grade filter */}
      <select
        className="input"
        value={filters.grade}
        onChange={e =>
          setFilters({
            grade: e.target.value === 'All' ? 'All' : Number(e.target.value),
          })
        }
      >
        {grades.map(x => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>

      {/* Mode filter */}
      <select
        className="input"
        value={filters.mode}
        onChange={e => setFilters({ mode: e.target.value })}
      >
        {modes.map(x => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>

      {/* Class selector (filtered) */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-gray-500">Classes:</span>
        <select
          className="input"
          value={activeClassId}
          onChange={e => setActiveClass(e.target.value)}
        >
          {filtered.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
