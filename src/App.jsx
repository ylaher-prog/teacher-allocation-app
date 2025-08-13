import React from 'react';
import { useAppStore } from './appStore.js';
import ShellLayout from './components/ShellLayout.jsx';

export default function App(){
  const { theme } = useAppStore();
  return (
    <div data-theme={theme} style={{minHeight:'100vh', background:'var(--muted)', color:'var(--text)'}}>
      <ShellLayout />
    </div>
  );
}
