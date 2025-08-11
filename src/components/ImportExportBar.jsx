import React, { useRef, useState } from 'react';
import { useAppStore } from '../store.js';
import { exportToXLSX } from '../utils/xlsxExport.js';

export default function ImportExportBar(){
  const fileRef = useRef(null);
  const { teachers, subjects, classes, allocation, replaceAllData } = useAppStore();
  const [csvUrl, setCsvUrl] = useState('');

  const handleExportCSV = () => {
    const rows = [];
    rows.push(['Class','Subject','Teacher'].join(','));
    classes.forEach(cls=>{
      const alloc = allocation[cls.id] || {};
      cls.subjectIds.forEach(sid=>{
        const s = subjects.find(x=> x.id===sid);
        const tid = alloc[sid] || '';
        const t = teachers.find(x=> x.id===tid);
        rows.push([cls.name, s?.name || sid, t?.name || ''].join(','));
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'allocation.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const applyCsvText = (text) => {
    const lines = String(text).trim().split(/\r?\n/);
    lines.shift(); // header
    const nameToClass   = Object.fromEntries(classes.map(c=>[c.name, c]));
    const nameToSubject = Object.fromEntries(subjects.map(s=>[s.name, s]));
    const nameToTeacher = Object.fromEntries(teachers.map(t=>[t.name, t]));
    const nextAlloc = {};
    for (const line of lines){
      const [cName, sName, tName] = line.split(',').map(x=> x.trim());
      const c = nameToClass[cName]; const s = nameToSubject[sName]; const t = nameToTeacher[tName];
      if (!c || !s) continue;
      nextAlloc[c.id] = nextAlloc[c.id] || {};
      nextAlloc[c.id][s.id] = t ? t.id : '';
    }
    replaceAllData({ allocation: nextAlloc });
    alert('Allocation imported from CSV');
  };

  const handleImportFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { applyCsvText(reader.result); e.target.value = ''; };
    reader.readAsText(f);
  };

  const handleFetchCsvUrl = async () => {
    try{
      const res = await fetch(csvUrl);
      const text = await res.text();
      applyCsvText(text);
    }catch(err){ alert('Failed to fetch CSV: ' + err.message); }
  };

  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">Import / Export</div>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={()=> exportToXLSX({ allocation, teachers, subjects, classes })}>Export XLSX</button>
        <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600">Import Allocation from CSV (columns: Class, Subject, Teacher)</div>
        <input type="file" accept=".csv" ref={fileRef} onChange={handleImportFile} />
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1 flex-1" placeholder="Paste CSV URL (e.g., Google Sheet published as CSV)" value={csvUrl} onChange={e=> setCsvUrl(e.target.value)} />
          <button className="btn-secondary" onClick={handleFetchCsvUrl}>Fetch</button>
        </div>
      </div>
    </div>
  );
}
