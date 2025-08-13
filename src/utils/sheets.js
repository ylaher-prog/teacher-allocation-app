// src/utils/sheets.js
export async function pullFromSheets(spreadsheetUrl){
  const url = `/api/sheets?url=${encodeURIComponent(spreadsheetUrl)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error(`API error ${res.status}`);
  return await res.json();
}
