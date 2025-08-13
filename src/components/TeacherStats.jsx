import React, { useMemo } from 'react';
import { useAppStore } from '../appStore.js';

export default function TeacherStats(){
  const { classes, subjects, teachers, allocation, getPeriods } = useAppStore();

  const rows = useMemo(() => {
    const per = {}, learners = {}, classesSet = {}, subjSet = {};
    for(const c of classes){
      const a = allocation[c.id] || {};
      const counted = new Set();
      for(const sId of Object.keys(a)){
        const tId = a[sId]; if(!tId) continue;
        per[tId] = (per[tId] ?? 0) + (getPeriods(c.id, sId) || 0);

        if(!counted.has(tId)){
          learners[tId] = (learners[tId] ?? 0) + (c.learners || 0);
          counted.add(tId);
        }
        (classesSet[tId] = classesSet[tId] || new Set()).add(c.id);
        (subjSet[tId] = subjSet[tId] || new Set()).add(sId);
      }
    }
    return teachers.map(t => {
      const P = per[t.id] ?? 0;
      const L = learners[t.id] ?? 0;
      const C = classesSet[t.id]?.size ?? 0;
      const S = subjSet[t.id]?.size ?? 0;
      const status = (t.maxPeriods && P > t.maxPeriods) || (t.maxLearners && L > t.maxLearners)
        ? 'Overload' : P === 0 ? 'Underload' : 'OK';
      return { id:t.id, name:t.name, periods:P, learners:L, classes:C, subjects:S, status };
    });
  }, [classes, teachers, allocation, getPeriods]);

  return (
    <section style={{ maxWidth:980, margin:'8px auto', padding:'8px 16px' }}>
      <h3 style={{ margin:'8px 0' }}>Teacher Stats</h3>
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead>
            <tr>
              {['Teacher','Periods','Learners','Classes','Subjects','Status'].map(h => <th key={h} style={th()}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td()}>{r.name}</td>
                <td style={td()}>{r.periods}</td>
                <td style={td()}>{r.learners}</td>
                <td style={td()}>{r.classes}</td>
                <td style={td()}>{r.subjects}</td>
                <td style={{...td(), color: r.status==='Overload'?'#8D1D4B': r.status==='Underload'?'#AD9040':'#0B2042' }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
const th = () => ({ textAlign:'left', padding:'8px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' });
const td = () => ({ padding:'8px', borderBottom:'1px solid #f1f5f9' });
