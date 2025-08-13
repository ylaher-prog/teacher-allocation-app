import React from 'react';
import Dashboard from './Dashboard.jsx';
import SettingsBar from './SettingsBar.jsx';
import CreatePanel from './create/CreatePanel.jsx';

export default function Sidebar(){
  return (
    <aside style={{
      borderRight:'1px solid #e5e7eb', background:'var(--surface)',
      minWidth:280, maxWidth:360, height:'calc(100vh - 56px)', overflow:'auto'
    }}>
      <div style={{padding:'12px 12px 4px'}}> <Dashboard compact /> </div>
      <div style={{padding:'8px 12px'}}> <SettingsBar compact /> </div>
      <div style={{padding:'8px 12px'}}> <CreatePanel /> </div>
      <div style={{height:24}}/>
    </aside>
  );
}
