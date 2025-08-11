import React from 'react';
import { useAppStore } from '../store.js';

export default function TeacherLoad() {
  const { teachers, classes, subjects, allocation } = useAppStore();
  const cls = classes[0];

  const rows = teachers.map(t => {
    let periods = 0;
    let learners = 0;
    const alloc = allocation[cls.id] || {};
    Object.entries(alloc).forEach(([sid, tid]) => {
      if (tid === t.id) {
        const subj = subjects.find(s => s.id === sid);
        periods += subj?.periods || 0;
        learners = cls.learners;
      }
    });
    const status = periods === 0 ? 'Underload' : (periods <= t.maxPeriods ? 'Balanced' : 'Overload');
    return { ...t, periods, learners, status };
  });

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-lg font-semibold mb-3">Teacher Load</div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Teacher</th>
            <th className="py-2">Periods</th>
            <th className="py-2">Learners</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2">{r.name}</td>
              <td className="py-2">{r.periods}/{r.maxPeriods}</td>
              <td className="py-2">{r.learners}/{r.maxLearners}</td>
              <td className={`py-2 ${r.status==='Overload'?'text-red-600': r.status==='Underload'?'text-amber-600':'text-emerald-600'}`}>
                {r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
