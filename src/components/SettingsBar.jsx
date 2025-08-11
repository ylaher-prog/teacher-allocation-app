// src/components/SettingsBar.jsx
import React, { useState } from 'react';
import { useAppStore } from '../store.js';
import { pullFromSheetUrl } from '../utils/sheets.js';

export default function SettingsBar(){
  const {
    allocation, teachers, subjects, classes, periodsMap,
    replaceAllData, sheetConfig, setSheetConfig,
  } = useAppStore();

  const [status, setStatus] = useState('');

  const onConnect = async () => {
    try {
      if (!sheetConfig.sheetUrl) { setStatus('Paste a Google Sheet link first'); return; }
      setStatus('Connecting…');
      const data = await pullFromSheetUrl(sheetConfig.sheetUrl, sheetConfig.sheetNames);
      // data includes: teachers, subjects, classes, allocation, periodsMap
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
        <div className="flex i
