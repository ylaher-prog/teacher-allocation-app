// src/appStore.js
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
    addTeacher(t){ set(s => ({ teachers: [...s.teachers, {...t, id: t.id || auto('t', s.teachers)}] })); },
    addSubject(sub){ set(s => ({ subjects: [...s.subjects, {...sub, id: sub.id || auto('s', s.subjects)}] })); },
    addClass(c){ set(s => ({ classes: [...s.classes, {...c, id: c.id || auto('c', s.classes)}] })); },

    // -------- allocation + periods ----------
    setAllocation(classId, subjectId, teacherId){
      const { constraints } = get();
      if(teacherId){
        const ok = canAssign({ classId, subjectId, teacherId }, get(), constraints);
        if(ok.block){ alert(ok.reason); return; }
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

    // -------- AUTO ALLOCATE (fill or rebalance) ----------
    autoAllocate({ overwrite=false } = {}){
      const s = get();
      const { constraints } = s;

      // snapshot current loads
      const { periodLoad, learnerLoad } = computeLoads(s);

      // start from either a blank slate (rebalance) or existing allocation (fill)
      const baseAlloc = overwrite ? {} : JSON.parse(JSON.stringify(s.allocation || {}));
      const nextAlloc = JSON.parse(JSON.stringify(baseAlloc));

      // helper lookups
      const subjById = Object.fromEntries(s.subjects.map(x=>[x.id, x]));
      const teacherById = Object.fromEntries(s.teachers.map(x=>[x.id, x]));

      // iterate class -> subject
      for(const c of s.classes){
        // ensure class node
        nextAlloc[c.id] = nextAlloc[c.id] || {};
        for(const subj of s.subjects){
          const already = nextAlloc[c.id][subj.id];
          const needAssign = overwrite ? true : !already;
          if(!needAssign) continue;

          // build candidate set
          const candidates = s.teachers
            .map(t => ({ t, ok: !canAssign({ classId:c.id, subjectId:subj.id, teacherId:t.id }, s, constraints).block }))
            .filter(x => x.ok)
            .map(({t}) => {
              // scoring
              const specialty = subj.requiredSpecialty && t.specialties?.includes(subj.requiredSpecialty) ? 1 : 0;
              const modeOK = c.mode && t.modes?.includes(c.mode) ? 1 : 0;
              const pLoad = periodLoad[t.id] ?? 0;
              const pCap = t.maxPeriods ?? 999999;
              const normLoad = pCap ? (pLoad / pCap) : 0; // 0..1

              const priority = Number(t.priority || 0);
              const score = (specialty * 3) + (modeOK * 2) + priority - normLoad; // higher better
              return { t, specialty, modeOK, score };
            })
            .sort((a,b) => b.score - a.score);

          // choose best candidate that still fits caps after adding this subject
          let chosen = null;
          for(const cand of candidates){
            const t = cand.t;
            const addPeriods = s.getPeriods(c.id, subj.id) || 0;

            const futurePeriods = (periodLoad[t.id] ?? 0) + addPeriods;
            const futureLearners = (learnerLoad[t.id] ?? 0) + ( (nextAlloc[c.id] && Object.values(nextAlloc[c.id]).includes(t.id)) ? 0 : (c.learners || 0) );

            const overP = (t.maxPeriods != null) && (futurePeriods > t.maxPeriods);
            const overL = (t.maxLearners != null) && (futureLearners > t.maxLearners);

            if(constraints.enforcePeriodCaps && overP) continue;
            if(constraints.enforceLearnerCaps && overL) continue;

            chosen = t; // pick first feasible (highest score)
            // update loads immediately (greedy)
            periodLoad[t.id] = futurePeriods;
            learnerLoad[t.id] = futureLearners;
            break;
          }

          if(chosen){
            nextAlloc[c.id][subj.id] = chosen.id;
          } else {
            // leave unassigned if no feasible candidate
            nextAlloc[c.id][subj.id] = '';
          }
        }
      }

      save(KEY_ALLOC, nextAlloc);
      set({ allocation: nextAlloc });
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

function computeLoads(s){
  // periods + unique learners per teacher from current allocation
  const periodLoad = {};
  const learnerLoad = {};
  for(const c of s.classes){
    const a = s.allocation[c.id] || {};
    const counted = new Set();
    for(const sid of Object.keys(a)){
      const tId = a[sid]; if(!tId) continue;
      periodLoad[tId] = (periodLoad[tId] ?? 0) + (s.getPeriods(c.id, sid) || 0);
      if(!counted.has(tId)){ learnerLoad[tId] = (learnerLoad[tId] ?? 0) + (c.learners || 0); counted.add(tId); }
    }
  }
  return { periodLoad, learnerLoad };
}

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

  if(c.enforceLearnerCaps){
    const { learnerLoad } = computeLoads(s);
    const future = (learnerLoad[t.id] ?? 0) + (s.allocation?.[classId] && Object.values(s.allocation[classId]).includes(t.id) ? 0 : (cls.learners || 0));
    if(t.maxLearners && future > t.maxLearners){
      return { block:true, reason:`${t.name} exceeds learner cap (${future} > ${t.maxLearners})` };
    }
  }
  if(c.enforcePeriodCaps){
    const { periodLoad } = computeLoads(s);
    const add = s.getPeriods(classId, subjectId) || 0;
    const future = (periodLoad[t.id] ?? 0) + add;
    if(t.maxPeriods && future > t.maxPeriods){
      return { block:true, reason:`${t.name} exceeds period cap` };
    }
  }
  return { block:false };
}

// -------- realtime stub (optional) ----------
function getRealtime(){
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if(!url || !key) return {};
  return {};
}
