import React, { useState } from 'react';
import { useAppStore } from '../../appStore.js';

export default function CreatePanel(){
  return (
    <div>
      <h4 style={{margin:'8px 0'}}>Create</h4>
      <CreateTeacher />
      <CreateSubject />
      <CreateClass />
    </div>
  );
}

function CreateTeacher(){
  const { addTeacher } = useAppStore();
  const [f, set] = useState({ name:'', maxPeriods:38, maxLearners:120, modes:'Live,Flipped', specialties:'English' });
  return (
    <div style={box()}>
      <strong>Teacher</strong>
      <input value={f.name} onChange={e=>set({...f,name:e.target.value})} placeholder="Full name" style={inp()} />
      <div style={{display:'flex', gap:8}}>
        <input type="number" value={f.maxPeriods} onChange={e=>set({...f,maxPeriods:Number(e.target.value)})} placeholder="Max periods" style={inp()} />
        <input type="number" value={f.maxLearners} onChange={e=>set({...f,maxLearners:Number(e.target.value)})} placeholder="Max learners" style={inp()} />
      </div>
      <input value={f.modes} onChange={e=>set({...f,modes:e.target.value})} placeholder="Modes (comma)" style={inp()} />
      <input value={f.specialties} onChange={e=>set({...f,specialties:e.target.value})} placeholder="Specialties (comma)" style={inp()} />
      <button onClick={()=>{ addTeacher({ ...f, modes: split(f.modes), specialties: split(f.specialties) }); set({ name:'',maxPeriods:38,maxLearners:120,modes:'Live',specialties:'' }); }} style={btn()}>Add Teacher</button>
    </div>
  );
}

function CreateSubject(){
  const { addSubject } = useAppStore();
  const [f, set] = useState({ name:'', periods:6, requiredSpecialty:'' });
  return (
    <div style={box()}>
      <strong>Subject</strong>
      <input value={f.name} onChange={e=>set({...f,name:e.target.value})} placeholder="Name" style={inp()} />
      <input type="number" value={f.periods} onChange={e=>set({...f,periods:Number(e.target.value)})} placeholder="Periods" style={inp()} />
      <input value={f.requiredSpecialty} onChange={e=>set({...f,requiredSpecialty:e.target.value})} placeholder="Required specialty" style={inp()} />
      <button onClick={()=>{ addSubject(f); set({ name:'',periods:6,requiredSpecialty:'' }); }} style={btn()}>Add Subject</button>
    </div>
  );
}

function CreateClass(){
  const { subjects, addClass } = useAppStore();
  const [f, set] = useState({ name:'', grade:'', mode:'Live', curriculum:'CAPS', learners:0, maxLearners:40, subjectIds:[] });
  return (
    <div style={box()}>
      <strong>Class</strong>
      <input value={f.name} onChange={e=>set({...f,name:e.target.value})} placeholder="Class name" style={inp()} />
      <div style={{display:'flex', gap:8}}>
        <input value={f.curriculum} onChange={e=>set({...f,curriculum:e.target.value})} placeholder="Curriculum" style={inp()} />
        <input value={f.mode} onChange={e=>set({...f,mode:e.target.value})} placeholder="Mode" style={inp()} />
        <input value={f.grade} onChange={e=>set({...f,grade:e.target.value})} placeholder="Grade" style={inp()} />
      </div>
      <div style={{display:'flex', gap:8}}>
        <input type="number" value={f.learners} onChange={e=>set({...f,learners:Number(e.target.value)})} placeholder="Learners" style={inp()} />
        <input type="number" value={f.maxLearners} onChange={e=>set({...f,maxLearners:Number(e.target.value)})} placeholder="Max learners" style={inp()} />
      </div>
      <label style={{fontSize:12, opacity:.7}}>Subjects</label>
      <div style={{display:'grid', gap:4, maxHeight:120, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:6, padding:6, background:'#fff'}}>
        {subjects.map(s =>
          <label key={s.id} style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={f.subjectIds.includes(s.id)} onChange={e=>{
              const next = new Set(f.subjectIds);
              e.target.checked ? next.add(s.id) : next.delete(s.id);
              set({...f, subjectIds: [...next] });
            }} />
            {s.name}
          </label>
        )}
      </div>
      <button onClick={()=>{ addClass(f); set({ name:'', grade:'', mode:'Live', curriculum:'CAPS', learners:0, maxLearners:40, subjectIds:[] }); }} style={btn()}>Add Class</button>
    </div>
  );
}

const box = () => ({ border:'1px solid #e5e7eb', borderRadius:8, padding:10, marginBottom:10, background:'#fff' });
const inp = () => ({ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, margin:'4px 0' });
const btn = () => ({ padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer', background:'#0B2042', color:'#fff', marginTop:6 });
const split = s => s.split(/[;,]/).map(x=>x.trim()).filter(Boolean);
