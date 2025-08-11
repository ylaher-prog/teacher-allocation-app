// src/utils/sheets.js
// Read-only sync from a public Google Sheet by URL (no API key).
// Make sure the Sheet is "Anyone with the link can view".

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
    fetchCSV(buildCsvUrl(sid, sheetNames.periods)).catch(() => []),
  ]);

  const teachers = tRows.map((r) => ({
    id: r.id, name: r.name,
    maxPeriods: Number(r.maxPeriods || 0),
    maxLearners: Number(r.maxLearners || 0),
    modes: (r.modes || "").split(/;|\||,/).map(s=>s.trim()).filter(Boolean),
    specialties: (r.specialties || "").split(/;|\||,/).map(s=>s.trim()).filter(Boolean),
  }));

  const subjects = sRows.map((r) => ({
    id: r.id, name: r.name,
    periods: Number(r.periods || 0),
    requiredSpecialty: r.requiredSpecialty || "",
  }));

  const classes = cRows.map((r) => ({
    id: r.id, name: r.name,
    grade: r.grade ? Number(r.grade) : null,
    mode: r.mode, curriculum: r.curriculum,
    learners: Number(r.learners || 0),
    maxLearners: Number(r.maxLearners || 0),
    subjectIds: (r.subjectIds || "").split(/;|\||,/).map(s=>s.trim()).filter(Boolean),
  }));

  // Allocation rows: classId,subjectId,teacherId
  const allocation = {};
  aRows.forEach((r) => {
    const c = r.classId, s = r.subjectId, t = r.teacherId || "";
    if (!c || !s) return;
    allocation[c] = allocation[c] || {};
    allocation[c][s] = t;
  });

  // Periods rows (optional): classId,subjectId,periods
  const periodsMap = {};
  pRows.forEach((r) => {
    const c = r.classId, s = r.subjectId, p = Number(r.periods || "");
    if (!c || !s || !Number.isFinite(p)) return;
    periodsMap[c] = periodsMap[c] || {};
    periodsMap[c][s] = p;
  });

  return { teachers, subjects, classes, allocation, periodsMap };
}

// ---------- Compatibility shims (so old imports don't break) ----------

// Old signature: pullFromSheets({ sheetId, sheetNames, sheetUrl })
export async function pullFromSheets(args = {}) {
  const { sheetId, sheetNames, sheetUrl } = args || {};
  const url = sheetUrl || (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : '');
  if (!url) throw new Error('pullFromSheets needs sheetId or sheetUrl');
  return pullFromSheetUrl(u
