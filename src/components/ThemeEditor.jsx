import React, { useState } from 'react';
import { useAppStore } from '../store.js';

const SECTIONS = ['dashboard','teacherStats','matrix','perclass','builder'];

export default function ThemeEditor(){
  const { sectionThemes, setSectionTheme } = useAppStore();
  const [section, setSection] = useState(SECTIONS[0]);

  const current = sectionThemes?.[section] || {};

  const fields = [
    {key:'primary', label:'Primary'}, {key:'accent', label:'Accent'},
    {key:'warn', label:'Warn'}, {key:'text', label:'Text'},
    {key:'surface', label:'Surface'}, {key:'muted', label:'Muted'}
  ];

  return (
    <div className="card">
      <div className="title mb-2">Theme & Colors by Section</div>
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <select className="input" value={section} onChange={e=> setSection(e.target.value)}>
          {SECTIONS.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-600">Set CSS colors (hex) to override only this section.</span>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {fields.map(f=>(
          <div key={f.key} className="flex items-center gap-2">
            <label className="w-24">{f.label}</label>
            <input className="input flex-1" placeholder={`e.g. #0B2042`} value={current[f.key]||''}
                   onChange={e=> setSectionTheme(section, {[f.key]: e.target.value})}/>
          </div>
        ))}
      </div>
    </div>
  );
}
