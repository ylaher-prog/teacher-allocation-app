// src/utils/sheets.js
// Read-only sync from a public Google Sheet by URL. No API key needed.
// Make sure your Sheet is "Anyone with the link can view".

function extractSheetIdFromUrl(url) {
  const m = String(url).match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : "";
}

function buildCsvUrl(sheetId, sheetName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCSV(text) {
  const lines = String(text).trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines.shift().split(",").map((s) => s.trim());
  return lines.map((line) => {
    const cells = line.split(",").map((s) => s.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return parseCSV(await res.text());
}

export async function pullFromSheetUrl(sheetUrl, sheetNames = {
  teachers: "Teachers",
  subjects: "Subjects",
  classes: "Classes",
  allocation: "Allocation",
  periods: "Periods"
}) {
  const sid = extractSheetIdFromUrl(sheetUrl);
  if (!sid) throw new Error("Could not extract Sheet ID from the URL.");

  const [tRows, sRows, cRows, aRows, pRows] = await Promise.all([
    fetchCSV(buildCsvUrl(sid, sheetNames.teachers)),
    fetchCSV(buildCsvUrl(sid, sheetNames.subjects)),
    fetchCSV(buildCsvUrl(sid, sheetNames.classes)),
    fetchCSV(buildCsvUrl(sid, sheetNames.allocation)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames
