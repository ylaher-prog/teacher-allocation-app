// src/utils/sheets.js

// ---------- helpers ----------
export function extractSheetIdFromUrl(url) {
  const m = String(url).match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : "";
}

export function buildCsvUrl(id, name) {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    name
  )}`;
}

export function parseCSV(text) {
  const lines = String(text).trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines.shift().split(",").map((s) => s.trim());
  return lines
    .filter((ln) => ln.trim().length > 0)
    .map((line) => {
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

// ---------- primary reader ----------
export async function pullFromSheetUrl(
  sheetUrl,
  sheetNames = {
    teachers: "Teachers",
    subjects: "Subjects",
    classes: "Classes",
    allocation: "Allocation",
    periods: "Periods",
  }
) {
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
    id: r.id,
    name: r.name,
    maxPeriods: Number(r.maxPeriods || 0),
    maxLearners: Number(r.maxLearners || 0),
    modes: (r.modes || "")
      .split(/;|\||,/)
      .map((s) => s.trim())
      .filter(Boolean),
    specialties: (r.specialties || "")
      .split(/;|\||,/)
      .map((s) => s.trim())
      .filter(Boolean),
  }));

  const subjects = sRows.map((r) => ({
    id: r.id,
    name: r.name,
    periods: Number(r.periods || 0),
    requiredSpecialty: r.requiredSpecialty || "",
  }));

  const classes = cRows.map((r) => ({
    id: r.id,
    name: r.name,
    grade: r.grade ? Number(r.grade) : null,
    mode: r.mode,
    curriculum: r.curriculum,
    learners: Number(r.learners || 0),
    maxLearners: Number(r.maxLearners || 0),
    subjectIds: (r.subjectIds || "")
      .split(/;|\||,/)
      .map((s) => s.trim())
      .filter(Boolean),
  }));

  const allocation = {};
  aRows.forEach((r) => {
    const c = r.classId,
      s = r.subjectId,
      t = r.teacherId || "";
    if (!c || !s) return;
    allocation[c] = allocation[c] || {};
    allocation[c][s] = t;
  });

  const periodsMap = {};
  pRows.forEach((r) => {
    const c = r.classId,
      s = r.subjectId,
      p = Number(r.periods || "");
    if (!c || !s || !Number.isFinite(p)) return;
    periodsMap[c] = periodsMap[c] || {};
    periodsMap[c][s] = p;
  });

  return { teachers, subjects, classes, allocation, periodsMap };
}

// ---------- compatibility shims (for older imports) ----------
export async function pullFromSheets(args = {}) {
  const { sheetId, sheetNames, sheetUrl } = args || {};
  const url =
    sheetUrl ||
    (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : "");
  if (!url) throw new Error("pullFromSheets needs sheetId or sheetUrl");
  return pullFromSheetUrl(url, sheetNames);
}

// Writer stub. To enable real write-back, provide a Google Apps Script URL.
export async function pushToSheets(payload, { writeUrl } = {}) {
  if (!writeUrl) return { ok: false, reason: "No writeUrl configured" };
  const res = await fetch(writeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return { ok: res.ok, status: res.status };
}
