import React from 'react';
import { useAppStore } from '../appStore.js';

export default function Dashboard(){
  const { teachers, subjects, classes } = useAppStore();
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <Card title="Teachers" value={teachers.length} />
        <Card title="Subjects" value={subjects.length} />
        <Card title="Classes" value={classes.length} />
      </div>
      <p style={{ marginTop: 24, opacity: 0.8 }}>
        If you can see this, the app is mounted correctly. Next we can plug in Sheets + Matrix.
      </p>
    </main>
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
