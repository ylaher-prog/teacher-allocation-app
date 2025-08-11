// src/utils/sheets.js
// NOTE: This uses public Google Sheets via the "gviz CSV" endpoint (no auth).
// Make your sheet "Anyone with the link can view".

function buildCsvUrl(sheetId, sheetName) {
  // Public CSV endpoint
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCSV(text) {
  // Simple CSV parser (no quoted commas). For complex CSV, swap to PapaParse later.
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

// Map CSV rows to app data shapes
export async function pullFromSheets({ sheetId, sheetNames }) {
  const { teachers, subjects, classes, allocation } = sheetNames;

  const [tRows, sRows, cRows, aRows] = await Promise.all([
    fetchCSV(buildCsvUrl(sheetId, teachers)),
    fetchCSV(buildCsvUrl(sheetId, subjects)),
    fetchCSV(buildCsvUrl(sheetId, classes)),
    fetchCSV(buildCsvUrl(sheetId, allocation)),
  ]);

  const teachersData = tRows.map((r) => ({
    id: r.id,
    name: r.name,
    maxPeriods: Number(r.maxPeriods || 0),
    maxLearners: Number(r.maxLearners || 0),
    modes: (r.modes || "").split(/;|\||,/).map((x) => x.trim()).filter(Boolean),
    specialties: (r.specialties || "").split(/;|\||,/).map((x) => x.trim()).filter(Boolean),
  }));

  const subjectsData = sRows.map((r) => ({
    id: r.id,
    name: r.name,
    periods: Number(r.periods || 0),
    requiredSpecialty: r.requiredSpecialty || "",
  }));

  const classesData = cRows.map((r) => ({
    id: r.id,
    name: r.name,
    grade: r.grade ? Number(r.grade) : null,
    mode: r.mode,
    curriculum: r.curriculum,
    learners: Number(r.learners || 0),
    maxLearners: Number(r.maxLearners || 0),
    subjectIds: (r.subjectIds || "").split(/;|\||,/).map((x) => x.trim()).filter(Boolean),
  }));

  const allocationMap = {};
  aRows.forEach((r) => {
    const cId = r.classId, sId = r.subjectId, tId = r.teacherId || "";
    if (!cId || !sId) return;
    allocationMap[cId] = allocationMap[cId] || {};
    allocationMap[cId][sId] = tId;
  });

  return {
    teachers: teachersData,
    subjects: subjectsData,
    classes: classesData,
    allocation: allocationMap,
  };
}

// Write-back: use a Google Apps Script Web App URL you deploy (receives JSON)
// See instructions below to create the Apps Script endpoint and paste URL into Settings.
export async function pushToSheets(writeUrl, payload) {
  const res = await fetch(writeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
  return res.json().catch(() => ({}));
}

