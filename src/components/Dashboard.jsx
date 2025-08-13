import React from 'react';
import { useAppStore } from '../appStore.js';
import SettingsBar from './SettingsBar.jsx';
import FiltersBar from './FiltersBar.jsx';
import MatrixBuilder from './MatrixBuilder.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import TeacherStats from './TeacherStats.jsx';
import ImportExportBar from './ImportExportBar.jsx';

export default function Dashboard(){
  const { teachers, subjects, classes, activeTab, setActiveTab } = useAppStore();

  return (
    <div style={{ maxWidth:980, margin:'0 auto', padding:'12px 16px' }}>
      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
        <Card title="Teachers" value={teachers.length} />
        <Card title="Subjects" value={subjects.length} />
        <Card title="Classes" value={classes.length} />
      </div>

      <SettingsBar />
      <FiltersBar />
      <ImportExportBar />

      {/* Tabs could be expanded later; keep single dashboard for now */}
      <MatrixBuilder />
      <WarningsPanel />
      <TeacherStats />
    </div>
  );
}

function Card({ title, value }){
  return (
    <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
