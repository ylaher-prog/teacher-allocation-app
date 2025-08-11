import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store.js';
import { POLL_MS, DEFAULT_SHEET_ID, DEFAULT_SHEETS } from '../config.js';
import { pullFromSheets, pushToSheets } from '../utils/sheets.js';

export default function SettingsBar(){
  const {
    allocation, teachers, subjects, classes,
    replaceAllData,
    sheetConfig, setSheetConfig,
  } = useAppStore();

  const [status, setStatus] = useState('');
  const pollRef = useRef(null);

  const onPull = async () => {
    try {
      setStatus('Pulling…');
      const data = await pullFromSheets({
        sheetId: sheetConfig.sheetId,
        sheetNames: sheetConfig.sheetNames,
      });
      replaceAllData({ ...data, allocation: data.allocation });
      setStatus('Pulled ✓');
      setTimeout(()=> setStatus(''), 1200);
    } catch (e) {
      setStatus('Pull failed: ' + e.message);
    }
  };

  const onPush = async () => {
    try {
      if (!sheetConfig.writeUrl) { setStatus('Add Write URL first'); return; }
      setStatus('Pushing…');
      await pushToSheets(sheetConfig.writeUrl, { allocation, teachers, subjects, classes });
      setStatus('Pushed ✓');
      setTimeout(()=> setStatus(''), 1200);
    } catch (e) {
      setStatus('Push failed: ' + e.message);
    }
  };

  // Auto refresh polling
  useEffect(() => {
    if (sheetConfig.autoRefresh) {
      pollRef.current = setInterval(() => {
        onPull();
      }, sheetConfig.pollMs || POLL_MS);
      return () => clearInterval(pollRef.current);
    }
  }, [sheetConfig.autoRefresh, sheetConfig.pollMs, sheetConfig.sheetId, sheetConfig.sheetNames]);

  return (
    <div className="card flex flex-col gap-3">
      <div className="text-lg font-semibold">Live Sync (Google Sheets)</div>

      <div className="grid md:grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">Google Sheet ID</label>
          <input className="border rounded px-2 py-1"
                 placeholder="1A2b3C… (from the Sheet URL)"
                 value={sheetConfig.sheetId}
                 onChange={(e)=> setSheetConfig({ sheetId: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">Write URL (Apps Script)</label>
          <input className="border rounded px-2 py-1"
                 placeholder="https://script.google.com/macros/s/…/exec"
                 value={sheetConfig.writeUrl}
                 onChange={(e)=> setSheetConfig({ writeUrl: e.target.value })} />
        </div>

        <div className="flex items-end gap-2">
          <button className="btn" onClick={onPull}>Pull</button>
          <button className="btn-secondary" onClick={onPush}>Push</button>
          <span className="text-sm text-gray-600">{status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-2">
        {['teachers','subjects','classes','allocation'].map((k)=> (
          <div key={k} className="flex flex-col gap-1">
            <label className="text-sm text-gray-500">Sheet: {k}</label>
            <input className="border rounded px-2 py-1"
                   value={sheetConfig.sheetNames[k]}
                   onChange={(e)=> setSheetConfig({ sheetNames: { ...sheetConfig.sheetNames, [k]: e.target.value }})} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox"
                 checked={!!sheetConfig.autoRefresh}
                 onChange={(e)=> setSheetConfig({ autoRefresh: e.target.checked })} />
          <span>Auto Refresh every {sheetConfig.pollMs || POLL_MS} ms</span>
        </label>
        <input type="number" min="10000" step="5000" className="border rounded px-2 py-1 w-40"
               value={sheetConfig.pollMs}
               onChange={(e)=> setSheetConfig({ pollMs: Number(e.target.value || POLL_MS) })} />
      </div>

      <div className="text-sm text-gray-600">
        <b>Read</b>: The app fetches CSV from your public sheet tabs.<br/>
        <b>Write</b>: Create an Apps Script Web App (below) and paste the URL to enable push.
      </div>
    </div>
  );
}
