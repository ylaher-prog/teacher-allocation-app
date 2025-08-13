// src/utils/sheets.js
// Single-link Google Sheets import using gviz CSV endpoints.
// Required sheet names: Teachers, Subjects, Classes, Allocation, Periods

const DEFAULT_SHEETS = ['Teachers','Subjects','Classes','Allocation','Periods'];

export async function pullFromSheets(spreadsheetUrl, sheetNames = DEFAULT_SHEETS){
  const id = extractSheetId(spreadsheetUrl);
  if(!id) throw new Error('Invalid Google Sheets URL. Expect /spreadsheets/d/<ID>/...');

  const [teachersCSV, subjectsCSV, classesCSV, allocationCSV, periodsCSV] = await Promise.all([
    fetchCSV(csvByName(id, sheetNames[0])),
    fetchCSV(csvByName(id, sheetNames[1])),
    fetchCSV(csvByName(id, sheetNames[2])),
    fetchCSV(csvByName(id, sheetNames[3])),
    fetchCSV(csvByName(id, sheetNames[4])),
  ]);

  const teachers = parseTeachers(teachersCSV);
  const subjects = parseSubjects(subjectsCSV);
  const classes  = parseClasses(classesCSV);
  const allocation = parseAllocation(allocationCSV);
  const periodsMap = parsePeriods(periodsCSV);

  return { teachers, subjects, classes, allocation, periodsMap, globals: {} };
}

function extractSheetId(url){
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

function csvByName(id, name){
  const n = encodeURIComponent(name);
  // gviz by sheet name (no gid needed)
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${n}`;
}

async function fetchCSV(url){
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error(`Fetch failed: ${url}`);
  return await res.text();
}

// --- tiny csv parser (handles quotes) ---
function parseCSV(text){
  const rows = [];
  let i=0, field='', row=[], inQ=false;
  while(i<text.length){
    const c=text[i];
    if(inQ){
      if(c === '"'){
        if(text[i+1] === '"'){ field+='"'; i++; }
        else inQ=false;
      } else field+=c;
    }else{
      if(c === '"') inQ=true;
      else if(c === ','){ row.push(field); field=''; }
      else if(c === '\n' || c === '\r'){
        if(field!=='' || row.length) { row.push(field); rows.push(row); row=[]; field=''; }
        // swallow CRLF
        if(c === '\r' && text[i+1] === '\n') i++;
      } else field+=c;
    }
    i++;
  }
  if(field!=='' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseTeachers(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  const idx = indexOfCols(h);
  return data.filter(r=>r.length>0).map((r, n) => ({
    id: r[idx.id] || `t${n+1}`,
    name: r[idx.name] || '',
    maxPeriods: num(r[idx.maxPeriods], 999),
    maxLearners: num(r[idx.maxLearners], 9999),
    modes: splitList(r[idx.modes] || 'Live,Flipped,Self-Paced'),
    specialties: splitList(r[idx.specialties] || ''),
  }));
}

function parseSubjects(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  const idx = indexOfCols(h);
  return data.filter(r=>r.length>0).map((r, n) => ({
    id: r[idx.id] || `s${n+1}`,
    name: r[idx.name] || '',
    periods: num(r[idx.periods], 0),
    requiredSpecialty: r[idx.requiredSpecialty] || '',
  }));
}

function parseClasses(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  const idx = indexOfCols(h);
  return data.filter(r=>r.length>0).map((r, n) => ({
    id: r[idx.id] || `c${n+1}`,
    name: r[idx.name] || '',
    grade: num(r[idx.grade], ''),
    mode: r[idx.mode] || 'Live',
    curriculum: r[idx.curriculum] || '',
    learners: num(r[idx.learners], 0),
    maxLearners: num(r[idx.maxLearners], 999),
    subjectIds: splitList(r[idx.subjectIds] || ''),
  }));
}

function parseAllocation(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  const idx = indexOfCols(h);
  const alloc = {};
  for(const r of data){
    const c = r[idx.classId]; const s = r[idx.subjectId]; const t = r[idx.teacherId] || '';
    if(!c || !s) continue;
    alloc[c] = alloc[c] || {};
    alloc[c][s] = t;
  }
  return alloc;
}

function parsePeriods(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  const idx = indexOfCols(h);
  const map = {};
  for(const r of data){
    const c=r[idx.classId]; const s=r[idx.subjectId]; const p=num(r[idx.periods], null);
    if(!c || !s || p==null) continue;
    map[c] = map[c] || {};
    map[c][s] = p;
  }
  return map;
}

// helpers
function indexOfCols(header){
  const norm = header.map(x=>x?.trim().toLowerCase());
  const idx = (name) => norm.indexOf(name.toLowerCase());
  return {
    // common
    id: idx('id'), name: idx('name'),
    // teachers
    maxPeriods: idx('maxperiods'), maxLearners: idx('maxlearners'), modes: idx('modes'), specialties: idx('specialties'),
    // subjects
    periods: idx('periods'), requiredSpecialty: idx('requiredqualification') >= 0 ? idx('requiredqualification') : idx('requiredspecialisation') >= 0 ? idx('requiredspecialisation') : idx('requiredspecialty'),
    // classes
    grade: idx('grade'), mode: idx('mode'), curriculum: idx('curriculum'), learners: idx('learners'), maxLearners: idx('maxlearnersperclass') >= 0 ? idx('maxlearnersperclass') : idx('maxlearners'), subjectIds: idx('subjects') >= 0 ? idx('subjects') : idx('subjectids'),
    // allocation/periods
    classId: idx('classid'), subjectId: idx('subjectid'), teacherId: idx('teacherid'),
  };
}
function splitList(s){ return s ? s.split(/[;,]/).map(x=>x.trim()).filter(Boolean) : []; }
function num(v, fb){ const n = Number(v); return Number.isFinite(n) ? n : fb; }
