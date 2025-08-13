import React from 'react';
import TopNav from './TopNav.jsx';
import Sidebar from './Sidebar.jsx';
import MainArea from './MainArea.jsx';

export default function ShellLayout(){
  return (
    <div style={{display:'flex', flexDirection:'column', minHeight:'100vh'}}>
      <TopNav />
      <div style={{display:'grid', gridTemplateColumns:'340px 1fr', gap:0, flex:1, minHeight:0}}>
        <Sidebar />
        <MainArea />
      </div>
    </div>
  );
}
