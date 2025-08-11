import React from 'react';
import AllocationTable from './AllocationTable.jsx';
import TeacherLoad from './TeacherLoad.jsx';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2"><AllocationTable /></div>
        <div className=""><TeacherLoad /></div>
      </div>
    </div>
  );
}
