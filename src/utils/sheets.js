// src/utils/sheets.js
// Read-only sync from a public Google Sheet by URL (no API key).
// Make the Sheet "Anyone with the link can view".

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

/** Core allocation tabs */
export async function pullFromSheetUrl(
  sheetUrl,
  sheetNames = {
    teachers: "Teachers",
    subjects: "Subjects",
    classes: "Classes",
    allocation: "Allocation",
    periods: "Periods",
    // Builder tabs (optional)
    curricula: "Curricula",
    grades: "Grades",
    gradeSubjects: "GradeSubjects",
    gradePeriods: "GradePeriods",
    gradeModes: "GradeModes",
    modeLearners: "ModeLearners"
  }
) {
  const sid = extractSheetIdFromUrl(sheetUrl);
  if (!sid) throw new Error("Could not extract Sheet ID from the URL.");

  const loaders = [
    fetchCSV(buildCsvUrl(sid, sheetNames.teachers)),
    fetchCSV(buildCsvUrl(sid, sheetNames.subjects)),
    fetchCSV(buildCsvUrl(sid, sheetNames.classes)),
    fetchCSV(buildCsvUrl(sid, sheetNames.allocation)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.periods)).catch(() => []),
    // Builder (optional)
    fetchCSV(buildCsvUrl(sid, sheetNames.curricula)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.grades)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.gradeSubjects)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.gradePeriods)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.gradeModes)).catch(() => []),
    fetchCSV(buildCsvUrl(sid, sheetNames.modeLearners)).catch(() => []),
  ];
  const [tRows, sRows, cRows, aRows, pRows, curRows, gRows, gsRows, gpRows, gmRows, mlRows] =
    await Promise.all(loaders);

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

  const allocation = {};
  aRows.forEach((r) => {
    const c = r.classId, s = r.subjectId, t = r.teacherId || "";
    if (!c || !s) return;
    allocation[c] = allocation[c] || {};
    allocation[c][s] = t;
  });

  const periodsMap = {};
  pRows.forEach((r) => {
    const c = r.classId, s = r.subjectId, p = Number(r.periods || "");
    if (!c || !s || !Number.isFinite(p)) return;
    periodsMap[c] = periodsMap[c] || {};
    periodsMap[c][s] = p;
  });

  // -------- Builder rows (optional) --------
  const curricula = curRows.map(r => ({ id: r.id, name: r.name }));
  const grades = gRows.map(r => ({ id: r.id, curriculumId: r.curriculumId, grade: r.grade ? Number(r.grade) : null, label: r.label || r.grade }));

  const gradeSubjects = {}; // { gradeId: [subjectId] }
  gsRows.forEach(r => {
    const gid = r.gradeId, sid = r.subjectId;
    if (!gid || !sid) return;
    gradeSubjects[gid] = gradeSubjects[gid] || [];
    if (!gradeSubjects[gid].includes(sid)) gradeSubjects[gid].push(sid);
  });

  const gradePeriods = {}; // { gradeId: { subjectId: periods } }
  gpRows.forEach(r => {
    const gid = r.gradeId, sid = r.subjectId, p = Number(r.periods || "");
    if (!gid || !sid || !Number.isFinite(p)) return;
    gradePeriods[gid] = gradePeriods[gid] || {};
    gradePeriods[gid][sid] = p;
  });

  const gradeModes = {}; // { gradeId: [mode] }
  gmRows.forEach(r => {
    const gid = r.gradeId, m = (r.mode || "").trim();
    if (!gid || !m) return;
    gradeModes[gid] = gradeModes[gid] || [];
    if (!gradeModes[gid].includes(m)) gradeModes[gid].push(m);
  });

  const modeLearners = {}; // { gradeId: { mode: learners } }
  mlRows.forEach(r => {
    const gid = r.gradeId, m = (r.mode || "").trim(), n = Number(r.learners || "");
    if (!gid || !m || !Number.isFinite(n)) return;
    modeLearners[gid] = modeLearners[gid] || {};
    modeLearners[gid][m] = n;
  });

  return {
    teachers, subjects, classes, allocation, periodsMap,
    // builder
    curricula, grades, gradeSubjects, gradePeriods, gradeModes, modeLearners
  };
}

// ---------- Compatibility shims (for older imports) ----------

// Old signature: pullFromSheets({ sheetId, sheetNames, sheetUrl })
export async function pullFromSheets(args = {}) {
  const { sheetId, sheetNames, sheetUrl } = args || {};
  const url =
    sheetUrl ||
    (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : '');
  if (!url) throw new Error('pullFromSheets needs sheetId or sheetUrl');

  // If your file already exports pullFromSheetUrl, this will work:
  if (typeof pullFromSheetUrl === 'function') {
    return pullFromSheetUrl(url, sheetNames);
  }

  // If you DON'T have pullFromSheetUrl in this file, either import it here
  // or paste its implementation above these shims.
  throw new Error('pullFromSheetUrl is not defined in utils/sheets.js');
}

// Old push function — keep as no-op unless you’ve added your Apps Script write-back
export async function pushToSheets() {
  return { ok: true };
}

