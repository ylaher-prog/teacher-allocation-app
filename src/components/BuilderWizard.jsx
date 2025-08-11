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

        <div className="card">
          <div className="font-medium mb-2">3) Add Subjects to Grades</div>
          <div className="flex flex-col gap-2">
            <select className="input" id="gradeSel">
              {s.builder.grades.map(g=> <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <select className="input" id="subSel">
              {addSubjectChoices.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn" onClick={()=>{
              const gid=document.getElementById('gradeSel').value; const sid=document.getElementById('subSel').value;
              if (!gid || !sid) return; s.addSubjectToGrade(gid, sid);
            }}>Add Subject</button>
          </div>
          <div className="mt-2 text-sm">
            {s.builder.grades.map(g=>(
              <div key={g.id}><b>{g.label}</b>: {(s.builder.gradeSubjects[g.id]||[]).map(sid=> (s.subjects.find(x=>x.id===sid)?.name || sid)).join(', ') || '—'}</div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-2">4) Add Periods to Subjects (per Grade)</div>
          <div className="flex flex-col gap-2">
            <select className="input" id="gradeSelP">
              {s.builder.grades.map(g=> <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <select className="input" id="subSelP">
              {(s.builder.gradeSubjects[document.getElementById('gradeSelP')?.value]||s.builder.grades[0]&&s.builder.gradeSubjects[s.builder.grades[0].id]||[]).map(sid=>(
                <option key={sid} value={sid}>{s.subjects.find(x=>x.id===sid)?.name||sid}</option>
              ))}
            </select>
            <input className="input" type="number" placeholder="Periods" id="perInput"/>
            <button className="btn" onClick={()=>{
              const gid=document.getElementById('gradeSelP').value; const sid=document.getElementById('subSelP').value;
              const p=Number(document.getElementById('perInput').value||''); if(!gid||!sid||!Number.isFinite(p)) return;
              s.setGradeSubjectPeriods(gid, sid, p); document.getElementById('perInput').value='';
            }}>Set Periods</button>
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-2">5) Add Modes to Grade</div>
          <div className="flex flex-col gap-2">
            <select className="input" id="gradeSelM">
              {s.builder.grades.map(g=> <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <input className="input" placeholder="Comma-separated modes e.g. Live, Flipped AM" id="modesInput"/>
            <button className="btn" onClick={()=>{
              const gid=document.getElementById('gradeSelM').value;
              const list=(document.getElementById('modesInput').value||'').split(',').map(x=>x.trim()).filter(Boolean);
              if(!gid||!list.length) return; s.setGradeModes(gid, list); document.getElementById('modesInput').value='';
            }}>Set Modes</button>
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-2">6) Add Learners to Modes</div>
          <div className="flex flex-col gap-2">
            <select className="input" id="gradeSelL">
              {s.builder.grades.map(g=> <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <input className="input" placeholder="Mode name (must match step 5)" id="modeName"/>
            <input className="input" type="number" placeholder="Learners count" id="modeLearners"/>
            <button className="btn" onClick={()=>{
              const gid=document.getElementById('gradeSelL').value;
              const mode=document.getElementById('modeName').value.trim();
              const n=Number(document.getElementById('modeLearners').value||'');
              if(!gid||!mode||!Number.isFinite(n)) return;
              s.setModeLearners(gid, mode, n);
              document.getElementById('modeName').value=''; document.getElementById('modeLearners').value='';
            }}>Set Learners</button>
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-2">7) Generate Classes</div>
          <div className="text-sm text-gray-600 mb-2">Creates classes for each Grade×Mode with the chosen subjects & learners. You can then allocate teachers in the Matrix.</div>
          <button className="btn" onClick={build}>Generate Classes</button>
        </div>
      </div>
    </div>
  );
}
