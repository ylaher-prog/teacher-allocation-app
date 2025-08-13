import React, { useState } from 'react';
import { useAppStore } from '../appStore.js';
import { pullFromSheets } from '../utils/sheets.js';

export default function SettingsBar(){
  const { sheetLink, setSheetLink, replaceAllData, saveScenario, loadScenario, deleteScenario, scenarios, readOnly } = useAppStore();
  const [name, setName] = useState('');

  async function syncNow(){
    if(!sheetLink) return alert('Paste your Google Sheet link first.');
    try{
      const data = await pullFromSheets(sheetLink);
      replaceAllData(data);
      alert('Synced from Google Sheets');
    }catch(err){
      console.error(err);
      alert('Sync failed: ' + err.message);
    }
  }

  return (
    <div style={{ maxWidth:980, margin:'12px auto 0', padding:'8px 16px', display:'flex', gap:12, alignItems:'center' }}>
      <input
        style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }}
        placeholder="Paste Google Sheet link (with sheets: Teachers, Subjects, Classes, Allocation, Periods)"
        value={sheetLink}
        onChange={e=>setSheetLink(e.target.value)}
        disabled={readOnly}
      />
      <button onClick={syncNow} disabled={readOnly} style={btn()}>
        Sync Now
      </button>

      {/* Scenarios */}
      <input style={{ width:160, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }} placeholder="Scenario name" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={()=>{ saveScenario(name); setName(''); }} style={btn()}>Save</button>
      <select onChange={e=>loadScenario(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }}>
        <option value="">Load scenario…</option>
        {Object.keys(scenarios).map(k => <option key={k} value={k}>{k}</option>)}
      </select>
      <button onClick={()=>{ if(name) deleteScenario(name); else alert('Type scenario name to delete.'); }} style={btn('warn')}>Delete</button>
    </div>
  );
}
function btn(kind){
  const base = { padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer', background:'#0B2042', color:'#fff' };
  if(kind==='warn') return { ...base, background:'#8D1D4B' };
  return base;
}
