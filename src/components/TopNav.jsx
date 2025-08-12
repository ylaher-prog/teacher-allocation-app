import React, { useState } from 'react';
import { useAppStore } from '../store.clean.js';
import { exportToXLSX } from '../utils/xlsxExport.js';
import SharePanel from './share/SharePanel.jsx';

export default function TopNav(){
  const {
    activeTab, setActiveTab, theme, setTheme, readOnly,
    allocation, teachers, subjects, classes, periodsMap,
    scenarios, saveScenario, loadScenario, deleteScenario
  } = useAppStore();

  const [name, setName] = useState('Draft A');
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <div className="bg-[color:var(--surface)] border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-[color:var(--primary)]">Teacher Subject Allocation</div>
            {readOnly && <span className="badge">Read-only</span>}
            <span className="badge hidden md:inline">Scenarios: {Object.keys(scenarios).length}</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {['dashboard','matrix','perclass','builder','settings'].map(tab=>(
              <button key={tab}
                className={`btn-ghost ${activeTab===tab?'bg-[color:var(--muted)]':''}`}
                onClick={()=> setActiveTab(tab)}>
                {tab[0].toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select className="input" value={theme} onChange={e=> setTheme(e.target.value)}>
              <option value="navy">Navy</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <input className="input" placeholder="Scenario name" value={name} onChange={e=> setName(e.target.value)} />
            <button className="btn-secondary" onClick={()=> saveScenario(name)}>Save</button>

            <select className="input" onChange={e=> e.target.value && loadScenario(e.target.value)}>
              <option value="">Load…</option>
              {Object.keys(scenarios).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="input" onChange={e=> { if(e.target.value){ deleteScenario(e.target.value); e.target.value=''; }}}>
              <option value="">Delete…</option>
              {Object.keys(scenarios).map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <button className="btn" onClick={()=> exportToXLSX({ allocation, teachers, subjects, classes, periodsMap })}>Export XLSX</button>
            <button className="btn-secondary" onClick={()=> setShowShare(v=>!v)}>Share</button>
          </div>
        </div>
      </div>

      {showShare && <SharePanel onClose={()=> setShowShare(false)} />}
    </>
  );
}
