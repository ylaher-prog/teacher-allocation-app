import React, { useState } from 'react';
import FiltersBar from './FiltersBar.jsx';
import AllocationTable from './AllocationTable.jsx';
import TeacherLoad from './TeacherLoad.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import ImportExportBar from './ImportExportBar.jsx';
import SettingsBar from './SettingsBar.jsx';
import MatrixBuilder from './MatrixBuilder.jsx';

export default function Dashboard(){
  const [tab, setTab] = useState('matrix'); // 'matrix' | 'perclass'

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <FiltersBar />

      <div className="card">
        <div className="flex gap-2">
          <button className={`btn-secondary ${tab==='matrix' ? 'bg-[color:var(--muted)]' : ''}`} onClick={()=> setTab('matrix')}>Matrix (Classes × Subjects)</button>
          <button className={`btn-secondary ${tab==='perclass' ? 'bg-[color:var(--muted)]' : ''}`} onClick={()=> setTab('perclass')}>Per-Class Editor</button>
        </div>
      </div>

      {tab==='matrix' ? (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <MatrixBuilder />
            <WarningsPanel />
          </div>
          <div className="space-y-4">
            <TeacherLoad />
            <ImportExportBar />
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <AllocationTable />
            <WarningsPanel />
          </div>
          <div className="space-y-4">
            <TeacherLoad />
            <ImportExportBar />
          </div>
        </div>
      )}

      <SettingsBar />
    </div>
  );
}
