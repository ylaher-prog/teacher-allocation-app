import React from 'react';
import { useAppStore } from '../appStore.js';

export default function MatrixBuilder(){
  const { classes, subjects, teachers, allocation, getPeriods, setPeriods, setAllocation, filters } = useAppStore();

  const filteredClasses = classes.filter(c =>
    (filters.curriculum==='All' || c.curriculum===filters.curriculum) &&
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode)
  );
  const subjectById = Object.fromEntries(subjects.map(s=>[s.id, s]));
  const teacherById = Object.fromEntries(teachers.map(t=>[t.id, t]));

  return (
    <section style={{ maxWidth:980, margin:'8px auto', padding:'8px 16px' }}>
      <h3 style={{ margin:'8px 0' }}>Matrix Builder</h3>
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead>
            <tr>
              <th style={th()}>Class</th>
              {subjects.map(s => <th key={s.id} style={th()}>{s.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(c => (
              <tr key={c.id}>
                <td style={td('head')}>{c.name}</td>
                {subjects.map(s => {
                  const assign = allocation[c.id]?.[s.id] || '';
                  const per = getPeriods(c.id, s.id);
                  const warn = warnCell(teacherById[assign], subjectById[s.id], c);
                  return (
                    <td key={s.id} style={td()}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6 }}>
                        <select value={assign} onChange={e=>setAllocation(c.id, s.id, e.target.value)} style={sel(warn)}>
                          <option value="">—</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <input type="number" min="0" value={per} onChange={e=>setPeriods(c.id, s.id, e.target.value)} title="Periods" style={num()} />
                      </div>
                      {warn && <small style={{ color:'#8D1D4B' }}>{warn}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function warnCell(t, s, c){
  if(!t) return '';
  if(s?.requiredSpecialty && !t.specialties?.includes(s.requiredSpecialty)) return 'Specialty mismatch';
  if(c?.mode && t.modes && !t.modes.includes(c.mode)) return 'Mode not in teacher preferences';
  return '';
}
const th = () => ({ textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', position:'sticky', top:0 });
const td = (kind) => ({ padding:'8px', borderBottom:'1px solid #f1f5f9', background: kind==='head'? '#fbfdff':'#fff' });
const sel = (warn) => ({ padding:'6px 8px', border:'1px solid '+(warn?'#8D1D4B':'#e5e7eb'), borderRadius:6 });
const num = () => ({ width:70, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 });
