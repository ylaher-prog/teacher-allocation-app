import React, { useState } from 'react';
import { useAppStore } from '../store.js';
import { exportToXLSX } from '../utils/xlsxExport.js';

export default function TopNav(){
  const { theme, setTheme, allocation, teachers, subjects, classes, scenarios, saveScenario, loadScenario, deleteScenario } = useAppStore();
  const [name, setName] = useState('Draft A');

  const handleExport = () => {
    exportToXLSX({ allocation, teachers, subjects, classes });
  };

  return (
    <div className="bg-[color:var(--surface)] border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-[color:var(--primary)]">Teacher Subject Allocation</div>
          <span className="badge">Scenarios: {Object.keys(scenarios).length}</span>
        </div>

        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={theme} onChange={e=> setTheme(e.target.value)}>
            <option value="navy">Navy</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <input className="border rounded px-2 py-1" placeholder="Scenario name" value={name} onChange={e=> setName(e.target.value)} />
          <button className="btn-secondary" onClick={()=> saveScenario(name)}>Save</button>

          <select className="border rounded px-2 py-1" onChange={e=> e.target.value && loadScenario(e.target.value)}>
            <option value="">Load…</option>
            {Object.keys(scenarios).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="border rounded px-2 py-1" onChange={e=> { if(e.target.value){ deleteScenario(e.target.value); e.target.value=''; }}}>
            <option value="">Delete…</option>
            {Object.keys(scenarios).map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <button className="btn" onClick={handleExport}>Export XLSX</button>
        </div>
      </div>
    </div>
  );
}
