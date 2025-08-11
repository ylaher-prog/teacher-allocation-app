import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.js';
import { pullFromSheetUrl } from '../utils/sheets.js';

export default function BuilderWizard(){
  const s = useAppStore();
  const [sheet, setSheet] = useState(s.sheetConfig.sheetUrl || '');
  const [status, setStatus] = useState('');

  const addSubjectChoices = useMemo(()=> s.subjects.map(x=>({value:x.id,label:x.name})), [s.subjects]);
  const [step, setStep] = useState(1);

  const next = ()=> setStep(x=> Math.min(7, x+1));
  const back = ()=> setStep(x=> Math.max(1, x-1));

  const build = ()=> { s.buildClassesFromBuilder(); setStatus('Classes generated from builder ✓'); setTimeout(()=> setStatus(''),1500); };

  const onSync = async ()=>{
    try{
      setStatus('Syncing…');
      const data = await pullFromSheetUrl(sheet, s.sheetConfig.sheetNames);
      s.replaceAllData(data); // this will persist builder too
      setStatus('Synced ✓');
    }catch(e){ setStatus('Sync failed: '+e.message); }
  };

  return (
    <div className="card">
      <div className="title mb-2">Builder (methodical)</div>
      <div className="text-sm text-gray-600 mb-3">Manually add items or sync in bulk from Google Sheets. Then click <b>Generate Classes</b>.</div>

      <div className="flex items-center gap-2 mb-4">
        <input className="input flex-1" placeholder="Google Sheet URL (optional)" value={sheet} onChange={e=> setSheet(e.target.value)} />
        <button className="btn-secondary" onClick={onSync}>Bulk Sync</button>
        <span className="text-sm">{status}</span>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="font-medium mb-2">1) Add Curriculum</div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Curriculum name" id="curName"/>
            <button className="btn" onClick={()=>{
              const v=document.getElementById('curName').value.trim(); if(!v) return;
              s.addCurriculum(v); document.getElementById('curName').value='';
            }}>Add</button>
          </div>
          <ul className="mt-2 text-sm list-disc pl-5">
            {s.builder.curricula.map(c=> <li key={c.id}>{c.name}</li>)}
          </ul>
        </div>

        <div className="card">
          <div className="font-medium mb-2">2) Add Grades</div>
          <div className="flex flex-col gap-2">
            <select className="input" id="curSel">
              {s.builder.curricula.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Grade number or label" id="gradeLabel"/>
            <button className="btn" onClick={()=>{
              const cid=document.getElementById('curSel').value; const label=document.getElementById('gradeLabel').value.trim();
              if(!cid||!label) return; const num=Number(label)||null; s.addGrade(cid, num, label); document.getElementById('gradeLabel').value='';
            }}>Add Grade</button>
          </div>
          <ul className="mt-2 text-sm list-disc pl-5">
            {s.builder.grades.map(g=> <li key={g.id}>{g.label} — {s.builder.curricula.find(c=>c.id===g.curriculumId)?.name}</li>)}
          </ul>
        </div>

        <div class
