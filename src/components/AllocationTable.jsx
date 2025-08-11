import React from 'react';
import { useAppStore } from '../store.js';

export default function AllocationTable(){
  const { classes, subjects, teachers, allocation, setAllocation, activeClassId } = useAppStore();
  const cls = classes.find(c=> c.id===activeClassId) || classes[0];

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-3">
        {cls.name} · <span className="text-sm text-gray-500">{cls.mode} · {cls.learners} learners</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Subject</th>
            <th className="py-2">Periods</th>
            <th className="py-2">Assigned Teacher</th>
          </tr>
        </thead>
        <tbody>
          {cls.subjectIds.map(sid => {
            const s = subjects.find(x=> x.id===sid);
            const assignedId = (allocation[cls.id] || {})[sid] || '';
            return (
              <tr key={sid} className="border-b last:border-0">
                <td className="py-2">{s?.name || sid}</td>
                <td className="py-2">{s?.periods || '-'}</td>
                <td className="py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={assignedId}
                    onChange={(e)=> setAllocation(cls.id, sid, e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
