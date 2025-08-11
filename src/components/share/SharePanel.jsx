// src/components/share/SharePanel.jsx
import React, { useMemo } from 'react';
import { useAppStore } from '../../store.js';

function buildLink(base, opts){
  const url = new URL(base);
  const set = (k,v)=> { if (v!==undefined && v!==null && v!=='') url.searchParams.set(k,String(v)); };
  set('sheet', opts.sheet);
  set('tab', opts.tab);
  set('theme', opts.theme);
  set('curriculum', opts.curriculum);
  set('grade', opts.grade);
  set('mode', opts.mode);
  if (opts.readonly) set('readonly','true');
  return url.toString();
}

export default function SharePanel({ onClose }){
  const { sheetConfig, filters, theme, activeTab } = useAppStore();

  const base = window.location.origin + window.location.pathname;

  const viewer = useMemo(()=> buildLink(base, {
    sheet: sheetConfig.sheetUrl, tab: activeTab, theme, curriculum:filters.curriculum, grade:filters.grade, mode:filters.mode, readonly:true
  }), [base, sheetConfig, filters, theme, activeTab]);

  const editor = useMemo(()=> buildLink(base, {
    sheet: sheetConfig.sheetUrl, tab: activeTab, theme, curriculum:filters.curriculum, grade:filters.grade, mode:filters.mode, readonly:false
  }), [base, sheetConfig, filters, theme, activeTab]);

  const copy = (txt)=> { navigator.clipboard.writeText(txt).then(()=> alert('Link copied!')); };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="title">Share this app</div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          Anyone with the link can open your app preloaded with your Google Sheet. Use <b>Viewer</b> for safe read-only sharing.
        </div>

        <div className="mb-3">
          <label className="label">Viewer (read-only)</label>
          <div className="flex gap-2">
            <input className="input flex-1" readOnly value={viewer}/>
            <button className="btn-secondary" onClick={()=> copy(viewer)}>Copy</button>
          </div>
        </div>

        <div>
          <label className="label">Editor (can change allocations locally)</label>
          <div className="flex gap-2">
            <input className="input flex-1" readOnly value={editor}/>
            <button className="btn-secondary" onClick={()=> copy(editor)}>Copy</button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Note: Editor link does not grant write-back to your Google Sheet (that requires your private Apps Script URL). Changes are saved in the user’s browser.
        </div>
      </div>
    </div>
  );
}
