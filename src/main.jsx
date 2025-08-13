import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  // Fail loudly if #root is missing
  const el = document.createElement('pre');
  el.textContent = 'FATAL: #root not found in index.html';
  document.body.appendChild(el);
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
