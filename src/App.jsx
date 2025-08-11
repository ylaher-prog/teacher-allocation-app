import React, { useEffect } from 'react';
import TopNav from './components/TopNav.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useAppStore } from './store.js';

export default function App() {
  const theme = useAppStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'navy');
  }, [theme]);

  return (
    <div className="min-h-screen bg-[color:var(--muted)] text-[color:var(--text)]">
      <TopNav />
      <Dashboard />
    </div>
  );
}
