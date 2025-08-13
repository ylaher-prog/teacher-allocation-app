import React from 'react';
import { useAppStore } from '../appStore.js';
import TeacherPalette from './palette/TeacherPalette.jsx';

export default function MatrixBuilder(){
  const { classes, subjects, teachers, allocation, getPeriods, setPeriods, setAllocation, filters } = useAppStore();

  const filteredClasses = classes.filter(c =>
    (filters.curriculum==='All' || c.curriculum===filters.curriculum) &&
    (filters.grade==='All' || c.grade===filters.grade) &&
    (filters.mode==='All' || c.mode===filters.mode)
  );

  const subjById = Object.fromEntries(subjects.map(s=>[s.id, s]));

  return (
    <section style={{ marginTop:8 }}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <h3 style={{ margin:'8px 0' }}>Matrix Builder</h3>
        <span style={{opacity:.6}}>Drag a teacher pill onto a cell, or use the dropdown</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:8}}>
        {/* Left column: palette */}
        <TeacherPalette teachers={teachers} />

        {/* Right column: table */}
        <div style={{ overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff' }}>
          <table style={{ borderCollapse:'separate', borderSpacing:0, width:'100%', minWidth: subjects.length*220 + 220 }}>
            <thead>
              <tr>
                <th style={thFirst()}>Class</th>
                {subjects.map(s => <th key={s.id} style={th()}>{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(c => (
                <tr key={c.id}>
                  <td style={tdFirst()}>{c.name}</td>
                  {subjects.map(s => {
                    const assign = allocation[c.id]?.[s.id] || '';
                    const per = getPeriods(c.id, s.id);
                    return (
                      <td key={s.id}
                          onDragOver={e=>e.preventDefault()}
                          onDrop={e=>{
                            const tId = e.dataTransfer.getData('text/teacher');
                            if(tId) setAllocation(c.id, s.id, tId);
                          }}
                          style={td()}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:6 }}>
                          <select value={assign} onChange={e=>setAllocation(c.id, s.id, e.target.value)} style={sel()}>
                            <option value="">—</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <input type="number" min="0" value={per} onChange={e=>setPeriods(c.id, s.id, e.target.value)} title="Periods" style={num()} />
                        </div>
                        <div style={{fontSize:11, opacity:.6, marginTop:4}}>
                          {subjById[s.id]?.requiredSpecialty ? `Req: ${subjById[s.id].requiredSpecialty}` : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const thFirst = () => ({ position:'sticky', left:0, zIndex:2, background:'#f9fafb', textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb' });
const th = () => ({ textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' });
const tdFirst = () => ({ position:'sticky', left:0, background:'#fbfdff', padding:'8px', borderBottom:'1px solid #f1f5f9', zIndex:1 });
const td = () => ({ padding:'8px', borderBottom:'1px solid #f1f5f9', minWidth:220 });
const sel = () => ({ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, width:'100%' });
const num = () => ({ width:70, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 });
