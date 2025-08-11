import React, { useState } from 'react';
import { useAppStore } from '../store.js';
import { exportToXLSX } from '../utils/xlsxExport.js';

export default function TopNav(){
  const {
    activeTab, setActiveTab, theme, setTheme,
    allocation, teachers, subjects, classes, periodsMap,
    scenarios, saveScenario, loadScenario, deleteScenario
  } = useAppStore();

  const [name, setName] = useState('Draft A');

  return (
    <div className="bg-[color:var(--surface)] border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-[color:var(--primary)]">Teacher Subject Allocation</div>
          <span className="badge hidden md:inline">Scenarios: {Object.keys(scenarios).length}</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {['dashboard','matrix','perclass','builder','settings'].map(tab=>(
            <button key={tab}
             
