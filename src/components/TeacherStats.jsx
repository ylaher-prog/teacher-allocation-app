import React, { useMemo } from 'react';
import { useAppStore } from '../store.js';

export default function TeacherStats(){
  const { teachers, classes, subjects, allocation, getPeriods, getSectionStyle } = useAppStore();
  const style = getSectionStyle('teacherStats');

  const rows = useMemo(()=>{
    return teachers.map(t=>{
      let periods=0, learners=0, classCount=0, subjectSet=new Set();
      const touched = new Set();
      classes.forEach(cls=>{
        const row = allocation[cls.id] || {};
        Object.entries(row).forEach(([sid, tid])=>{
          if (tid===t.id) {
            periods += getPeriods(cls.id, sid);
            subjectSet.add(sid);
            if (!touched.has(cls.id)){ learners += cls.learners; classCount++; touched.add(cls.id); }
          }
        });
      });
      return {
        id:t.id, name:t.name,
        periods, learners, classes: classCount,
        maxPeriods: t.maxPeriods, maxLearners: t.maxLearners,
        subjects: Array.from(subjectSet).map(sid=> subjects.find(s=>s.id===sid)?.name || sid).join(', ')
      };
    });
  }, [teachers, classes, subjects, allocation]);

  return (
    <div className="card" style={style}>
      <div className="title mb-2">Teacher Stats</div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Teacher</th>
            <th className="py-2">Periods</th>
            <th className="py-2">Learners</th>
            <th className="py-2">Classes</th>
            <th className="py-2">Subjects</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2">{r.name}</td>
              <td className="py-2">{r.periods}/{r.maxPeriods}</td>
              <td className="py-2">{r.learners}/{r.maxLearners}</td>
              <td className="py-2">{r.classes}</td>
              <td className="py-2">{r.subjects}</td>
              <td className={`py-2 ${r.periods>r.maxPeriods?'text-[color:var(--warn)]':'text-emerald-600'}`}>
                {r.periods>r.maxPeriods?'Overload':'OK'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
