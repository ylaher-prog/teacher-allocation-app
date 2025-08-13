import React from 'react';
import { useAppStore } from '../appStore.js';

export default function TopNav(){
  const { activeTab, setActiveTab, theme, setTheme } = useAppStore();
  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong>Teacher Allocation</strong>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === 'dashboard' ? 'var(--primary)' : '#f3f4f6',
              color: activeTab === 'dashboard' ? '#fff' : '#111827',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
        </div>
        <div>
          <label style={{ marginRight: 8 }}>Theme</label>
          <select value={theme} onChange={e=>setTheme(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
            <option value="navy">Navy</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </header>
  );
}
