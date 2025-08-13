// Client-side push using Apps Script webhook (write-back).
export async function pushToSheets(writeUrl){
  // Expect an Apps Script Web App URL that accepts POST JSON.
  // We just send a ping for now; extend to include your data as needed.
  const payload = { ok: true, ts: Date.now() };
  const res = await fetch(writeUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  return res.ok;
}
