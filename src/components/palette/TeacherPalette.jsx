import React, { useMemo } from 'react';

export default function TeacherPalette({ teachers }){
  const list = useMemo(()=>teachers.map(t => ({
    id: t.id, name: t.name, caps: `${t.maxPeriods||'∞'}p / ${t.maxLearners||'∞'}L`
  })), [teachers]);

  return (
    <div>
      <div style={{fontWeight:600, margin:'8px 0'}}>Teachers</div>
      <div style={{display:'grid', gap:8, maxHeight:380, overflow:'auto', paddingRight:8}}>
        {list.map(t => <Chip key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function Chip({ t }){
  return (
    <div draggable onDragStart={(e)=>e.dataTransfer.setData('text/teacher', t.id)}
         title="Drag to a cell to assign"
         style={{
           display:'flex', alignItems:'center', justifyContent:'space-between',
           gap:8, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:999, background:'#fff', cursor:'grab'
         }}>
      <span>{t.name}</span>
      <span style={{fontSize:11, opacity:.7}}>{t.caps}</span>
    </div>
  );
}
