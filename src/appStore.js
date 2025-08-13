import { create } from 'zustand';
import sample from './sampleData.js';

// ---------- utils + workspace-aware storage ----------
const hasWindow = () => typeof window !== 'undefined';
let WS = ''; // workspace suffix
const key = (k) => (WS ? `${WS}::${k}` : k);

const load = (k, fb) => { try { if(!hasWindow()) return fb; const raw = localStorage.getItem(key(k)); return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
const save = (k, v) => { try { if(!hasWindow()) return; localStorage.setItem(key(k), JSON.stringify(v)); } catch {} };

// -------- keys ----------
const KEY_ALLOC='alloc_v1', KEY_THEME='theme_v1', KEY_PERIODS='periods_v1', KEY_SCEN='scenarios_v1', KEY_SHEET_LINK='sheet_link_v1', KEY_CONSTRAINTS='constraints_v1';

// -------- defaults ----------
const DEFAULT_CONSTRAINTS = {
  blockMode: false,
  blockSpecialty: false,
  enforcePeriodCaps: false,
  enforceLearnerCaps: false,
};

export const useAppStore = create((set, get) => {
  // workspace bootstrap (read ?workspace=abc)
  if (hasWindow()) {
    const p = new URLSearchParams(window.location.search);
    const w = p.get('workspace');
    if (w) WS = w.trim();
  }

  // realtime/collab stubs (disabled unless env set)
  const rt = getRealtime();

  const initial = {
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes:  sample.classes,
    globals:  sample.globals,

    allocation: load(KEY_ALLOC, sample.initialAllocation),
    periodsMap: load(KEY_PERIODS, {}),

    // ui
    activeTab: 'dashboard',
    filters: { curriculum:'All', grade:'All', mode:'All', subject:'All', query:'' },
    activeClassId: sample.classes[0]?.id || '',
    theme: load(KEY_THEME, 'navy'),
    readOnly: false,

    sheetLink: load(KEY_SHEET_LINK, ''),
    scenarios: load(KEY_SCEN, {}),

    constraints: load(KEY_CONSTRAINTS, DEFAULT_CONSTRAINTS),
  };

  return {
    ...initial,

    // -------- theme + tabs + filters ----------
    setTheme(theme){ save(KEY_THEME, theme); set({ theme }); },
    setActiveTab(tab){ set({ activeTab: tab }); },
    setFilters(part){ set(s => ({ filters: { ...s.filters, ...part } })); },
    setActiveClass(id){ set({ activeClassId: id }); },

    // -------- workspace ----------
    setWorkspace(ws){
      WS = (ws || '').trim();
      // nothing else required; keys will be different from now
    },

    // -------- constraints ----------
    setConstraints(part){
      set(s => {
        const c = { ...s.constraints, ...part };
        save(KEY_CONSTRAINTS, c);
        return { constraints: c };
      });
    },

    // -------- CRUD: create/edit ----------
    addTeacher(t){
      set(s => ({ teachers: [...s.teachers, {...t, id: t.id || auto('t', s.teachers)}] }));
    },
    addSubject(sub){
      set(s => ({ subjects: [...s.subjects, {...sub, id: sub.id || auto('s', s.subjects)}] }));
    },
    addClass(c){
      set(s => ({ classes: [...s.classes, {...c, id: c.id || auto('c', s.classes)}] }));
    },

    // -------- allocation + periods ----------
    setAllocation(classId, subjectId, teacherId){
      // hard constraints
      const { constraints } = get();
      if(teacherId){
        const ok = canAssign({ classId, subjectId, teacherId }, get(), constraints);
        if(!ok.block){ /* pass */ }
        else { alert(ok.reason); return; }
      }

      set(s => {
        const next = { ...s.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || '';
        save(KEY_ALLOC, next);
        rt.emit && rt.emit('alloc', { classId, subjectId, teacherId }); // realtime
        return { allocation: next };
      });
    },
    resetAllocation(){ save(KEY_ALLOC, sample.initialAllocation); set({ allocation: sample.initialAllocation }); },

    setPeriods(classId, subjectId, value){
      set(s => {
        const next = { ...s.periodsMap };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        if (value === '' || value == null) delete next[classId][subjectId];
        else next[classId][subjectId] = Number(value);
        save(KEY_PERIODS, next);
        rt.emit && rt.emit('periods', { classId, subjectId, value: Number(value) });
        return { periodsMap: next };
      });
    },
    getPeriods(classId, subjectId){
      const p = get().periodsMap?.[classId]?.[subjectId];
      if (p === undefined || p === null || p === '') {
        const subj = get().subjects.find(x=>x.id===subjectId);
        return subj?.periods ?? 0;
      }
      return p;
    },

    // scenarios
    saveScenario(name){
      if(!name?.trim()) return;
      const scen = { ...get().scenarios, [name]: get().allocation };
      save(KEY_SCEN, scen); set({ scenarios: scen });
    },
    loadScenario(name){
      const snap = get().scenarios?.[name]; if(!snap) return;
      save(KEY_ALLOC, snap); set({ allocation: snap });
    },
    deleteScenario(name){
      const s = { ...get().scenarios }; delete s[name];
      save(KEY_SCEN, s); set({ scenarios: s });
    },

    // bulk replace (Sheets)
    replaceAllData({ teachers, subjects, classes, globals, allocation, periodsMap }){
      const nextTeachers = teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects = subjects ?? get().subjects ?? sample.subjects;
      const nextClasses  = classes  ?? get().classes  ?? sample.classes;
      const nextGlobals  = globals  ?? get().globals  ?? sample.globals;
      const nextAlloc    = allocation ?? get().allocation ?? sample.initialAllocation;
      const nextPeriods  = periodsMap ?? get().periodsMap ?? {};
      const nextActiveClass = nextClasses[0]?.id ?? get().activeClassId;

      save(KEY_ALLOC,nextAlloc); save(KEY_PERIODS,nextPeriods);
      set({ teachers:nextTeachers, subjects:nextSubjects, classes:nextClasses, globals:nextGlobals, allocation:nextAlloc, periodsMap:nextPeriods, activeClassId:nextActiveClass });
    },

    // sheets link
    sheetLink: load(KEY_SHEET_LINK, ''),
    setSheetLink(link){ save(KEY_SHEET_LINK, link); set({ sheetLink: link }); },
  };
});

// ------ helpers ------
function auto(prefix, arr){ let n=arr.length+1; let id; do{ id = `${prefix}${n++}`; }while(arr.some(x=>x.id===id)); return id; }

function canAssign({ classId, subjectId, teacherId }, s, c){
  const cls = s.classes.find(x=>x.id===classId);
  const subj = s.subjects.find(x=>x.id===subjectId);
  const t = s.teachers.find(x=>x.id===teacherId);
  if(!t) return { block:false };

  if(c.blockSpecialty && subj?.requiredSpecialty && !t.specialties?.includes(subj.requiredSpecialty)){
    return { block:true, reason:`${t.name} is not specialized for ${subj?.name}` };
  }
  if(c.blockMode && cls?.mode && t.modes && !t.modes.includes(cls.mode)){
    return { block:true, reason:`${t.name} is not configured for ${cls.mode}` };
  }

  // caps (soft block unless enforce true)
  if(c.enforceLearnerCaps){
    const learners = uniqueLearnersForTeacher(teacherId, s);
    if(t.maxLearners && learners > t.maxLearners){
      return { block:true, reason:`${t.name} exceeds learner cap (${learners} > ${t.maxLearners})` };
    }
  }
  if(c.enforcePeriodCaps){
    const periods = totalPeriodsForTeacher(teacherId, s);
    const add = s.getPeriods ? s.getPeriods(classId, subjectId) : 0;
    if(t.maxPeriods && (periods + add) > t.maxPeriods){
      return { block:true, reason:`${t.name} exceeds period cap` };
    }
  }
  return { block:false };
}

function uniqueLearnersForTeacher(tId, s){
  const seen = new Set(); let total = 0;
  for(const c of s.classes){
    const a = s.allocation[c.id] || {};
    if(Object.values(a).includes(tId) && !seen.has(c.id)){ total += c.learners || 0; seen.add(c.id); }
  }
  return total;
}
function totalPeriodsForTeacher(tId, s){
  let total = 0;
  for(const c of s.classes){
    const a = s.allocation[c.id] || {};
    for(const sid of Object.keys(a)){
      if(a[sid]===tId) total += s.getPeriods(c.id, sid) || 0;
    }
  }
  return total;
}

// -------- realtime stub (optional) ----------
function getRealtime(){
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if(!url || !key) return {};
  // you can initialize Supabase client here and return { emit, subscribe } for allocations/periods
  return {};
}
