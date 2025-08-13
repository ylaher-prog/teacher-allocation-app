import React from 'react';
import { useAppStore } from '../appStore.js';

export default function FiltersBar(){
  const { classes, filters, setFilters, activeClassId, setActiveClass } = useAppStore();

  const curricula = ['All', ...Array.from(new Set(classes.map(c=>c.curriculum))).filter(Boolean)];
  const grades    = ['All', ...Array.from(new Set(classes.map(c=>c.grade))).filter(Boolean)];
  const modes     = ['All', ...Array.from(new Set(classes.map(c=>c.mode))).filter(Boolean)];

  const filtered = classes.filter(c =>
    (filters.curriculum==='All' || c.curriculum===filters.curriculum) &&
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode) &&
    (filters.query==='' || c.name.toLowerCase().includes(filters.query.toLowerCase()))
  );

  return (
    <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', margin:'6px 0 8px'}}>
      <label>Curriculum</label>
      <select value={filters.curriculum} onChange={e=>setFilters({ curriculum: e.target.value })} style={sel()}>{curricula.map(x => <option key={x} value={x}>{x}</option>)}</select>

      <label>Grade</label>
      <select value={filters.grade} onChange={e=>setFilters({ grade: e.target.value==='All'?'All':Number(e.target.value) })} style={sel()}>{grades.map(x => <option key={x} value={x}>{x}</option>)}</select>

      <label>Mode</label>
      <select value={filters.mode} onChange={e=>setFilters({ mode: e.target.value })} style={sel()}>{modes.map(x => <option key={x} value={x}>{x}</option>)}</select>

      <input placeholder="Search class…" value={filters.query} onChange={e=>setFilters({ query: e.target.value })} style={{...sel(), width:180}} />

      <div style={{marginLeft:'auto', display:'flex', gap:8, alignItems:'center'}}>
        <span>Class</span>
        <select value={activeClassId} onChange={e=>setActiveClass(e.target.value)} style={sel()}>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
}
const sel = () => ({ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 });
