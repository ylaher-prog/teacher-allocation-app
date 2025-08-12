import React from 'react';
import { useAppStore } from '../appStore.js';

export default function TopNav(){
  const { activeTab, setActiveTab, theme, setTheme } = useAppStore();
  return (
    <div className="w-full border-b bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Teacher Allocation</span>
          <nav className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded ${activeTab==='dashboard'?'bg-black text-white':'bg-gray-100'}`}
              onClick={()=>setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={theme} onChange={e=>setTheme(e.target.value)}>
            <option value="navy">Navy</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
}
