// api/sheets.js
// Vercel Serverless Function: fetch Google Sheets CSV server-side and return JSON.
// Accepts: ?url=<GoogleSheetURL>
// Sheet names expected: Teachers, Subjects, Classes, Allocation, Periods

export default async function handler(req, res) {
  try {
    const url = (req.query?.url || '').toString();
    if (!url) {
      res.status(400).json({ error: 'Missing ?url=' });
      return;
    }
    const id = extractSheetId(url);
    if (!id) {
      res.status(400).json({ error: 'Invalid Google Sheets URL (expected /spreadsheets/d/<ID>/...)' });
      return;
    }

    const names = ['Teachers', 'Subjects', 'Classes', 'Allocation', 'Periods'];
    const [teachersCSV, subjectsCSV, classesCSV, allocationCSV, periodsCSV] = await Promise.all(
      names.map(n => fetchCSV(csvByName(id, n)))
    );

    const teachers   = parseTeachers(teachersCSV);
    const subjects   = parseSubjects(subjectsCSV);
    const classes    = parseClasses(classesCSV);
    const allocation = parseAllocation(allocationCSV);
    const periodsMap = parsePeriods(periodsCSV);

    // Allow the browser to call this from your origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ teachers, subjects, classes, allocation, periodsMap, globals: {} });
  } catch (err) {
    console.error('API /api/sheets error:', err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}

// ---- helpers ----
function extractSheetId(url){
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}
function csvByName(id, name){
  // gviz endpoint by sheet name (no gid needed)
  const n = encodeURIComponent(name);
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${n}`;
}
async function fetchCSV(url){
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Fetch failed: ${url} (${r.status})`);
  return await r.text();
}

// very small CSV parser that respects quoted cells
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
        if(field!=='' || row.length){ row.push(field); rows.push(row); row=[]; field=''; }
        if(c === '\r' && text[i+1] === '\n') i++;
      } else field+=c;
    }
    i++;
  }
  if(field!=='' || row.length){ row.push(field); rows.push(row); }
  return rows;
}

function indexOfCols(header){
  const norm = header.map(x=>x?.trim().toLowerCase());
  const idx  = (name) => norm.indexOf(name.toLowerCase());
  return {
    // common
    id: idx('id'), name: idx('name'),
    // teachers
    maxPeriods: idx('maxperiods'),
    maxLearners: idx('maxlearners'),
    modes: idx('modes'),
    specialties: idx('specialties'),
    // subjects
    periods: idx('periods'),
    requiredSpecialty: idx('requiredqualification') >= 0 ? idx('requiredqualification')
                        : idx('requiredspecialisation') >= 0 ? idx('requiredspecialisation')
                        : idx('requiredspecialty'),
    // classes
    grade: idx('grade'),
    mode: idx('mode'),
    curriculum: idx('curriculum'),
    learners: idx('learners'),
    maxLearnersClass: idx('maxlearnersperclass') >= 0 ? idx('maxlearnersperclass') : idx('maxlearners'),
    subjectIds: idx('subjects') >= 0 ? idx('subjects') : idx('subjectids'),
    // allocation & periods
    classId: idx('classid'),
    subjectId: idx('subjectid'),
    teacherId: idx('teacherid'),
  };
}
function splitList(s){ return s ? s.split(/[;,]/).map(x=>x.trim()).filter(Boolean) : []; }
function num(v, fb){ const n = Number(v); return Number.isFinite(n) ? n : fb; }

function parseTeachers(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  if(!h) return [];
  const idx = indexOfCols(h);
  return data.filter(r=>r?.length).map((r, n) => ({
    id: r[idx.id] || `t${n+1}`,
    name: r[idx.name] || '',
    maxPeriods: num(r[idx.maxPeriods], 999),
    maxLearners: num(r[idx.maxLearners], 99999),
    modes: splitList(r[idx.modes] || 'Live,Flipped,Self-Paced'),
    specialties: splitList(r[idx.specialties] || ''),
  }));
}
function parseSubjects(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  if(!h) return [];
  const idx = indexOfCols(h);
  return data.filter(r=>r?.length).map((r, n) => ({
    id: r[idx.id] || `s${n+1}`,
    name: r[idx.name] || '',
    periods: num(r[idx.periods], 0),
    requiredSpecialty: r[idx.requiredSpecialty] || '',
  }));
}
function parseClasses(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  if(!h) return [];
  const idx = indexOfCols(h);
  return data.filter(r=>r?.length).map((r, n) => ({
    id: r[idx.id] || `c${n+1}`,
    name: r[idx.name] || '',
    grade: num(r[idx.grade], ''),
    mode: r[idx.mode] || 'Live',
    curriculum: r[idx.curriculum] || '',
    learners: num(r[idx.learners], 0),
    maxLearners: num(r[idx.maxLearnersClass], 999),
    subjectIds: splitList(r[idx.subjectIds] || ''),
  }));
}
function parseAllocation(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  if(!h) return {};
  const idx = indexOfCols(h);
  const alloc = {};
  for(const r of data){
    const c=r[idx.classId], s=r[idx.subjectId], t=r[idx.teacherId] || '';
    if(!c || !s) continue;
    (alloc[c] ||= {})[s] = t;
  }
  return alloc;
}
function parsePeriods(csv){
  const rows = parseCSV(csv);
  const [h, ...data] = rows;
  if(!h) return {};
  const idx = indexOfCols(h);
  const map = {};
  for(const r of data){
    const c=r[idx.classId], s=r[idx.subjectId], p=num(r[idx.periods], null);
    if(!c || !s || p==null) continue;
    (map[c] ||= {})[s] = p;
  }
  return map;
}
