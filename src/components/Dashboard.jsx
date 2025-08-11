import React from 'react';
import FiltersBar from './FiltersBar.jsx';
import AllocationTable from './AllocationTable.jsx';
import TeacherLoad from './TeacherLoad.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import ImportExportBar from './ImportExportBar.jsx';

export default function Dashboard(){
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <FiltersBar />
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
    </div>
  );
}
