// src/components/SettingsBar.jsx
import React, { useState } from 'react';
import { useAppStore } from '../store.js';
import { pullFromSheetUrl } from '../utils/sheets.js';

export default function SettingsBar(){
  const {
    replaceAllData, sheetConfig, setSheetConfig,
  } = useAppStore();

  const [status, setStatus] = useState('');

  const onConnect = async () => {
    try {
      if (!sheetConfig.sheetUrl) { setStatus('Paste a Google Sheet link first'); return; }
      setStatus('Connecting…');
      const data = await pullFromSheetUrl(sheetConfig.sheetUrl, sheetConfig.sheetNames);
      replaceAllData({ ...data, allocation: data.allocation, periodsMap: data.periodsMap });
      setStatus('Connected ✓ (Pulled)');
      setTimeout(()=> setStatus(''), 1500);
    } catch (e) {
      setStatus('Connect failed: ' + e.message);
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      <div className="text-lg font-semibold">Live Sync (Google Sheets)</div>

      <div className="grid md:grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm text-gray-500">Google Sheet Link</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="Paste the full Sheet URL (Anyone with the link can view)"
            value={sheetConfig.sheetUrl}
            onChange={(e)=> setSheetConfig({ sheetUrl: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button className="btn w-full" onClick={onConnect}>Connect</button>
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-gray-600">Advanced (tab names)</summary>
        <div className="grid md:grid-cols-5 gap-2 mt-2">
          {['teachers','subjects','classes','allocation','periods'].map((k)=> (
            <div key={k} className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Tab: {k}</label>
              <input className="border rounded px-2 py-1"
                     value={sheetConfig.sheetNames[k]}
                     onChange={(e)=> setSheetConfig({ sheetNames: { ...sheetConfig.sheetNames, [k]: e.target.value }})} />
            </div>
          ))}
        </div>
      </details>

      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
