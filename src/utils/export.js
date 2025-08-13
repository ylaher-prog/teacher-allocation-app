// src/utils/export.js
export function downloadCSV(filename, rows){
  const csv = rows.map(r => r.map(cell => wrap(cell)).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display='none';
  document.body.appendChild(a); a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function wrap(v){
  if(v==null) return '';
  const s = String(v);
  if(/[",\n\r]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}

