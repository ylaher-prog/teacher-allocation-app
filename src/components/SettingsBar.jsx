import React, { useState } from 'react';
import { useAppStore } from '../appStore.js';
import { pullFromSheets } from '../utils/sheets.js';
import { pushToSheets } from '../utils/sheetsWrite.js';

export default function SettingsBar({ compact }){
  const { sheetLink, setSheetLink, replaceAllData, saveScenario, loadScenario, deleteScenario, scenarios, readOnly, constraints, setConstraints } = useAppStore();
  const [name, setName] = useState('');
  const [writeUrl, setWriteUrl] = useState(localStorage.getItem('write_url_v1') || '');

  async function syncNow(){
    if(!sheetLink) return alert('Paste your Google Sheet link first.');
    try{
      const data = await pullFromSheets(sheetLink);
      replaceAllData(data);
      alert('Synced from Google Sheets');
    }catch(err){ console.error(err); alert('Sync failed: ' + err.message); }
  }

  async function pushNow(){
    try{
      if(!writeUrl) return alert('Set Write URL (Apps Script) first.');
      const ok = await pushToSheets(writeUrl);
      alert(ok ? 'Pushed to Sheets (via Apps Script)' : 'Push failed');
    }catch(e){ alert('Push failed: '+e.message); }
  }

  return (
    <div style={{display:'grid', gap:8}}>
      <div style={{display:'flex', gap:8}}>
        <input style={inp(1)} placeholder="Paste Google Sheet link" value={sheetLink} onChange={e=>setSheetLink(e.target.value)} disabled={readOnly}/>
        <button onClick={syncNow} disabled={readOnly} style={btn()}>Sync</button>
      </div>

      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <input style={inp()} placeholder="Scenario name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={()=>{ saveScenario(name); setName(''); }} style={btn()}>Save</button>
        <select onChange={e=>loadScenario(e.target.value)} style={inp()} >
          <option value="">Load scenario…</option>
          {Object.keys(scenarios).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={()=>{ if(name) deleteScenario(name); else alert('Type scenario name to delete.'); }} style={btn('warn')}>Delete</button>
      </div>

      <fieldset style={{border:'1px solid #e5e7eb', borderRadius:8, padding:8}}>
        <legend style={{padding:'0 6px'}}>Hard Constraints</legend>
        <label style={lab()}><input type="checkbox" checked={constraints.blockSpecialty} onChange={e=>setConstraints({blockSpecialty:e.target.checked})}/> Block specialty mismatch</label>
        <label style={lab()}><input type="checkbox" checked={constraints.blockMode} onChange={e=>setConstraints({blockMode:e.target.checked})}/> Block mode mismatch</label>
        <label style={lab()}><input type="checkbox" checked={constraints.enforcePeriodCaps} onChange={e=>setConstraints({enforcePeriodCaps:e.target.checked})}/> Enforce period caps</label>
        <label style={lab()}><input type="checkbox" checked={constraints.enforceLearnerCaps} onChange={e=>setConstraints({enforceLearnerCaps:e.target.checked})}/> Enforce learner caps</label>
      </fieldset>

      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <input style={inp(1)} placeholder="Write URL (Apps Script web app)" value={writeUrl} onChange={e=>{ setWriteUrl(e.target.value); localStorage.setItem('write_url_v1', e.target.value); }} />
        <button onClick={pushNow} style={btn()}>Push</button>
      </div>
    </div>
  );
}
const inp = (grow) => ({ flexGrow: grow?1:0, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, minWidth:160 });
const btn = (kind) => ({ padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer', background: kind==='warn'?'#8D1D4B':'#0B2042', color:'#fff' });
const lab = () => ({ display:'block', margin:'4px 0' });
