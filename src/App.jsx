import React, { useEffect } from 'react';
import TopNav from './components/TopNav.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useAppStore } from './store.js';
import { pullFromSheetUrl } from './utils/sheets.js';

function parseQuery(){
  const q = new URLSearchParams(window.location.search);
  const params = {};
  for (const [k,v] of q.entries()) params[k] = v;
  return params;
}

export default function App() {
  const s = useAppStore();
  const theme = s.theme;

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme || 'navy'); }, [theme]);

  // 1) Apply query params once
  useEffect(() => {
    const params = parseQuery();
    if (Object.keys(params).length) {
      s.applyQueryParams({
        sheet: params.sheet,
        tab: params.tab,
        theme: params.theme,
        curriculum: params.curriculum,
        grade: params.grade,
        mode: params.mode,
        readonly: params.readonly
      });
      // 2) Auto-connect if ?sheet=
      if (params.sheet) {
        pullFromSheetUrl(params.sheet, s.sheetConfig.sheetNames)
          .then(data => s.replaceAllData({ ...data, allocation: data.allocation, periodsMap: data.periodsMap }))
          .catch(()=>{ /* ignore */ });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--muted)] text-[color:var(--text)]">
      <TopNav />
      <Dashboard />
    </div>
  );
}
