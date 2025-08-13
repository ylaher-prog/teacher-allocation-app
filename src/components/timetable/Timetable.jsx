import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../appStore.js';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
const PERIODS = [1,2,3,4,5,6,7,8];

export default function Timetable(){
  const { teachers } = useAppStore();
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');

  const grid = useMemo(()=>{
    // blank grid; real linkage can come from allocation later
    return DAYS.map(d => PERIODS.map(()=>null));
  }, [teacherId]);

  return (
    <section style={{marginTop:12}}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <h3 style={{margin:'8px 0'}}>Timetable (Base)</h3>
        <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6}}>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span style={{opacity:.6}}>Mark availability and we’ll warn on clashes when we connect allocations → slots.</span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{borderCollapse:'collapse', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, width:'100%', minWidth:700}}>
          <thead>
            <tr>
              <th style={th()}>Period</th>
              {DAYS.map(d => <th key={d} style={th()}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(p => (
              <tr key={p}>
                <td style={tdHead()}>{p}</td>
                {DAYS.map(d => <td key={d} style={td()}><AvailCell/></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AvailCell(){
  const [on, setOn] = useState(true);
  return (
    <button onClick={()=>setOn(!on)} title={on?'Available':'Unavailable'}
      style={{
        width:'100%', height:32, borderRadius:6, border:'1px solid #e5e7eb',
        background: on ? '#ECFDF5' : '#FEE2E2', color: on ? '#065F46' : '#991B1B'
      }}>
      {on ? '✓' : '×'}
    </button>
  );
}
const th = () => ({ textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' });
const tdHead = () => ({ padding:'8px', borderBottom:'1px solid #f1f5f9', background:'#fbfdff' });
const td = () => ({ padding:6, borderBottom:'1px solid #f1f5f9' });
