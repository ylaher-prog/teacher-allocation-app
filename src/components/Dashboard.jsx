import React, { useMemo } from 'react';
import { useAppStore } from '../appStore.js';
import SettingsBar from './SettingsBar.jsx'; // sidebar uses compact, main keeps full
import FiltersBar from './FiltersBar.jsx';
import MatrixBuilder from './MatrixBuilder.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import TeacherStats from './TeacherStats.jsx';
import ImportExportBar from './ImportExportBar.jsx';

export default function Dashboard({ compact }){
  const { teachers, subjects, classes } = useAppStore();

  // subtle breakdown by class mode
  const modeCounts = useMemo(() => {
    const m = {};
    for(const c of classes){
      m[c.mode] = (m[c.mode] ?? 0) + 1;
    }
    return Object.entries(m).map(([k,v]) => ({ mode:k, count:v })).sort((a,b)=>a.mode.localeCompare(b.mode));
  }, [classes]);

  return (
    <div style={{ maxWidth: compact ? 'auto' : 980, margin: compact ? '0' : '0 auto', padding: compact ? 0 : '12px 0' }}>
      {/* Prominent row */}
      <div style={{ display:'grid', gridTemplateColumns: compact?'1fr':'repeat(3, 1fr)', gap:12 }}>
        <Card title="Teachers" value={teachers.length} />
        <Card title="Subjects" value={subjects.length} />
        <Card title="Classes" value={classes.length} />
      </div>

      {/* Subtle “by mode” row */}
      {modeCounts.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns: `repeat(${Math.min(4, modeCounts.length)}, 1fr)`, gap:10, marginTop:8 }}>
          {modeCounts.map(m => <SubtleCard key={m.mode} title={m.mode} value={m.count} />)}
        </div>
      )}
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
function SubtleCard({ title, value }){
  return (
    <div style={{ padding: 10, background: '#F8FAFC', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color:'#64748b' }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color:'#0B2042' }}>{value}</div>
    </div>
  );
}
