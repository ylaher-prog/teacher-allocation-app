import React from 'react';
import TopNav from './components/TopNav.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Dashboard />
    </div>
  );
}
