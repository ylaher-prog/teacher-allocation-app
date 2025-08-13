import React, { useMemo } from 'react';
import { useAppStore } from '../appStore.js';

export default function WarningsPanel(){
  const { classes, subjects, teachers, allocation, getPeriods, globals } = useAppStore();

  const warnings = useMemo(() => {
    const warn = [];

    // per-class: max learners
    for(const c of classes){
      if(c.learners > (c.maxLearners ?? globals.maxLearnersPerClass ?? Infinity)){
        warn.push({ type:'class', id:c.id, msg:`${c.name}: learners ${c.learners} > max ${c.maxLearners}` });
      }
    }

    // build teacher load
    const teacherLoads = {};
    const learnersByTeacher = {};
    for(const c of classes){
      const subjectsForClass = allocation[c.id] || {};
      const uniqueCounted = new Set(); // avoid counting same class learners twice per teacher
      for(const sId of Object.keys(subjectsForClass)){
        const tId = subjectsForClass[sId];
        if(!tId) continue;
        const periods = getPeriods(c.id, sId);
        teacherLoads[tId] = (teacherLoads[tId] ?? 0) + (periods || 0);

        if(!uniqueCounted.has(tId)){
          learnersByTeacher[tId] = (learnersByTeacher[tId] ?? 0) + (c.learners || 0);
          uniqueCounted.add(tId);
        }
      }
    }

    for(const t of teachers){
      const p = teacherLoads[t.id] ?? 0;
      const L = learnersByTeacher[t.id] ?? 0;
      if(t.maxPeriods != null && p > t.maxPeriods) warn.push({ type:'teacher', id:t.id, msg:`${t.name}: periods ${p} > max ${t.maxPeriods}` });
      if(t.maxLearners != null && L > t.maxLearners) warn.push({ type:'teacher', id:t.id, msg:`${t.name}: learners ${L} > max ${t.maxLearners}` });
    }

    // mode/specialty soft checks
    const subjById = Object.fromEntries(subjects.map(s=>[s.id,s]));
    const tById = Object.fromEntries(teachers.map(t=>[t.id,t]));
    for(const c of classes){
      for(const sId of Object.keys(allocation[c.id] || {})){
        const tId = allocation[c.id][sId];
        if(!tId) continue;
        const t = tById[tId], s = subjById[sId];
        if(s?.requiredSpecialty && !t?.specialties?.includes(s.requiredSpecialty)){
          warn.push({ type:'qual', id:`${c.id}/${sId}/${tId}`, msg:`${t?.name} not specialized for ${s?.name} in ${c?.name}` });
        }
        if(c?.mode && t?.modes && !t.modes.includes(c.mode)){
          warn.push({ type:'mode', id:`${c.id}/${sId}/${tId}`, msg:`${t?.name} not configured for ${c?.mode} in ${c?.name}` });
        }
      }
    }
    return warn;
  }, [classes, subjects, teachers, allocation, getPeriods, globals]);

  if(!warnings.length) return null;

  return (
    <section style={{ maxWidth:980, margin:'8px auto', padding:'8px 16px' }}>
      <h3 style={{ margin:'8px 0' }}>Warnings</h3>
      <ul style={{ margin:0, padding:0, listStyle:'none', display:'grid', gap:6 }}>
        {warnings.map((w, i) => (
          <li key={i} style={{ padding:'8px 10px', background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:8, color:'#7F1D1D' }}>
            {w.msg}
          </li>
        ))}
      </ul>
    </section>
  );
}
