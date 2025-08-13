import React from 'react';
import TopNav from './components/TopNav.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useAppStore } from './appStore.js';

export default function App() {
  const { theme } = useAppStore();
  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--muted)', color: 'var(--text)' }}>
      <TopNav />
      <Dashboard />
    </div>
  );
}
