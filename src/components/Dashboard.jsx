import React from 'react';
import FiltersBar from './FiltersBar.jsx';
import MatrixBuilder from './MatrixBuilder.jsx';
import AllocationTable from './AllocationTable.jsx';
import TeacherLoad from './TeacherLoad.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import ImportExportBar from './ImportExportBar.jsx';
import SettingsBar from './SettingsBar.jsx';
import StatsDashboard from './StatsDashboard.jsx';
import TeacherStats from './TeacherStats.jsx';
import BuilderWizard from './BuilderWizard.jsx';
import { useAppStore } from '../store.js';

export default function Dashboard(){
  const { activeTab } = useAppStore();

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <FiltersBar />

      {activeTab==='dashboard' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <StatsDashboard />
            <WarningsPanel />
          </div>
          <div className="space-y-4">
            <TeacherStats />
            <ImportExportBar />
          </div>
        </div>
      )}

      {activeTab==='matrix' && (
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
      )}

      {activeTab==='perclass' && (
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

      {activeTab==='builder' && (
        <BuilderWizard />
      )}

      {activeTab==='settings' && (
        <SettingsBar />
      )}
    </div>
  );
}
