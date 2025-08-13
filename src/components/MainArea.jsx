import React from 'react';
import FiltersBar from './FiltersBar.jsx';
import ImportExportBar from './ImportExportBar.jsx';
import MatrixBuilder from './MatrixBuilder.jsx';
import WarningsPanel from './WarningsPanel.jsx';
import TeacherStats from './TeacherStats.jsx';
import Timetable from './timetable/Timetable.jsx';

export default function MainArea(){
  return (
    <main style={{overflow:'auto', height:'calc(100vh - 56px)'}}>
      <div style={{padding:'10px 16px'}}>
        <FiltersBar />
        <ImportExportBar />
        <MatrixBuilder />
        <WarningsPanel />
        <TeacherStats />
        <Timetable />
      </div>
    </main>
  );
}
