import React from 'react';
import { useAppStore } from '../store.js';

export default function AllocationTable() {
  const { classes, subjects, teachers, allocation, setAllocation } = useAppStore();
  const cls = classes[0];

  return (
    <div className="bg-white rounded-2xl shadow p-4">
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
          {subjects.map(s => {
            const assignedId = allocation[cls.id]?.[s.id] || '';
            return (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">{s.name}</td>
                <td className="py-2">{s.periods}</td>
                <td className="py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={assignedId}
                    onChange={(e)=> setAllocation(cls.id, s.id, e.target.value)}
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
