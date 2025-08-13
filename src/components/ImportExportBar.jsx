import React from 'react';
import { useAppStore } from '../appStore.js';
import { downloadCSV } from '../utils/export.js';

export default function ImportExportBar(){
  const { allocation, periodsMap, teachers, classes, subjects } = useAppStore();

  function exportAlloc(){
    const rows = [['classId','subjectId','teacherId']];
    for(const cid of Object.keys(allocation)){
      for(const sid of Object.keys(allocation[cid] || {})){
        rows.push([cid, sid, allocation[cid][sid] || '']);
      }
    }
    downloadCSV('allocation.csv', rows);
  }
  function exportPeriods(){
    const rows = [['classId','subjectId','periods']];
    for(const cid of Object.keys(periodsMap)){
      for(const sid of Object.keys(periodsMap[cid] || {})){
        rows.push([cid, sid, periodsMap[cid][sid]]);
      }
    }
    downloadCSV('periods.csv', rows);
  }
  function exportTeacherStats(){
    // simple rollup like in TeacherStats
    const per={}, learners={}, classesSet={}, subjSet={};
    for(const c of classes){
      const a = allocation[c.id] || {};
      const counted = new Set();
      for(const sId of Object.keys(a)){
        const tId = a[sId]; if(!tId) continue;
        per[tId] = (per[tId] ?? 0) + (periodsMap?.[c.id]?.[sId] ?? subjects.find(s=>s.id===sId)?.periods ?? 0);
        if(!counted.has(tId)){ learners[tId]=(learners[tId]??0)+(c.learners||0); counted.add(tId); }
        (classesSet[tId]=classesSet[tId]||new Set()).add(c.id);
        (subjSet[tId]=subjSet[tId]||new Set()).add(sId);
      }
    }
    const rows = [['teacher','periods','learners','classes','subjects']];
    for(const t of teachers){
      rows.push([t.name, per[t.id]??0, learners[t.id]??0, classesSet[t.id]?.size??0, subjSet[t.id]?.size??0]);
    }
    downloadCSV('teacher-stats.csv', rows);
  }

  return (
    <div style={{ maxWidth:980, margin:'8px auto', padding:'8px 16px', display:'flex', gap:8 }}>
      <button onClick={exportAlloc}  style={btn()}>Export Allocation</button>
      <button onClick={exportPeriods} style={btn()}>Export Periods</button>
      <button onClick={exportTeacherStats} style={btn()}>Export Teacher Stats</button>
    </div>
  );
}
const btn = () => ({ padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer', background:'#0B2042', color:'#fff' });
