// src/store.js
import { create } from 'zustand';
import sample from './sampleData.js';

const hasWindow = () => typeof window !== 'undefined';

// keys
const KEY_ALLOC    = 'alloc_v1';
const KEY_SCEN     = 'scenarios_v1';
const KEY_THEME    = 'theme_v1';
const KEY_SHEETS   = 'sheet_config_v1';
const KEY_PERIODS  = 'periods_v1';

// safe storage
function load(key, fb){ try{ if(!hasWindow()) return fb; const r=localStorage.getItem(key); return r?JSON.parse(r):fb; }catch{ return fb; } }
function save(key, v){ try{ if(!hasWindow()) return; localStorage.setItem(key, JSON.stringify(v)); }catch{} }

// deep merge for sheet config
function mergeSheetConfig(base, patch){
  if(!patch) return base;
  const next = { ...base, ...patch };
  if (patch.sheetNames) next.sheetNames = { ...base.sheetNames, ...patch.sheetNames };
  return next;
}

const DEFAULT_SHEET_CONFIG = {
  sheetUrl: "", // <-- paste the full Google Sheet link here (in Settings)
  sheetNames: {
    teachers: "Teachers",
    subjects: "Subjects",
    classes: "Classes",
    allocation: "Allocation",
    periods: "Periods" // optional tab for per-class-subject periods
  },
  writeUrl: "",
  autoRefresh: false,
  pollMs: 60000,
};

export const useAppStore = create((set, get) => {
  const savedAlloc   = load(KEY_ALLOC,   null);
  const savedScen    = load(KEY_SCEN,    {});
  const savedTheme   = load(KEY_THEME,   'navy');
  const savedSheets  = load(KEY_SHEETS,  null);
  const savedPeriods = load(KEY_PERIODS, {});

  return {
    // data
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes:  sample.classes,
    globals:  sample.globals,

    // ui state
    filters: { grade: 'All', mode: 'All', curriculum: 'All' },
    activeClassId: sample.classes[0]?.id || '',
    theme: savedTheme,
    scenarios: savedScen,

    // sheets
    sheetConfig: savedSheets ? mergeSheetConfig(DEFAULT_SHEET_CONFIG, savedSheets)
                             : DEFAULT_SHEET_CONFIG,

    // allocation + periods
    allocation: savedAlloc ?? sample.initialAllocation,
    // periodsMap: { [classId]: { [subjectId]: number } }
    periodsMap: savedPeriods || {},

    // theme
    setTheme(theme){ save(KEY_THEME, theme); set({ theme }); },

    // filters
    setFilters(part){ set(s => ({ filters: { ...s.filters, ...part } })); },
    setActiveClass(id){ set({ activeClassId: id }); },

    // allocation updates
    setAllocation(classId, subjectId, teacherId){
      set((state) => {
        const next = { ...state.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || '';
        save(KEY_ALLOC, next);
        return { allocation: next };
      });
    },
    resetAllocation(){
      save(KEY_ALLOC, sample.initialAllocation);
      set({ allocation: sample.initialAllocation });
    },

    // periods updates (per class/subject)
    setPeriods(classId, subjectId, value){
      set((state) => {
        const next = { ...state.periodsMap };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        if (value === '' || value === null || value === undefined) {
          delete next[classId][subjectId];
        } else {
          next[classId][subjectId] = Number(value);
        }
        save(KEY_PERIODS, next);
        return { periodsMap: next };
      });
    },
    getPeriods(classId, subjectId){
      const p = get().periodsMap?.[classId]?.[subjectId];
      if (p === undefined || p === null || p === '') {
        const s = get().subjects.find(x=> x.id===subjectId);
        return s?.periods ?? 0;
      }
      return p;
    },

    // replace all (Sheets/CSV import)
    replaceAllData({ teachers, subjects, classes, globals, allocation, periodsMap }){
      const nextTeachers = teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects = subjects ?? get().subjects ?? sample.subjects;
      const nextClasses  = classes  ?? get().classes  ?? sample.classes;
      const nextGlobals  = globals  ?? get().globals  ?? sample.globals;
      const nextAlloc    = allocation ?? get().allocation ?? sample.initialAllocation;
      const nextPeriods  = periodsMap ?? get().periodsMap ?? {};

      const nextActive   = (classes && classes[0]?.id) ? classes[0].id : get().activeClassId;

      save(KEY_ALLOC, nextAlloc);
      save(KEY_PERIODS, nextPeriods);

      set({
        teachers: nextTeachers,
        subjects: nextSubjects,
        classes:  nextClasses,
        globals:  nextGlobals,
        allocation: nextAlloc,
        periodsMap: nextPeriods,
        activeClassId: nextActive,
      });
    },

    // scenarios
    saveScenario(name){
      if (!name || !name.trim()) return;
      const scen = { ...get().scenarios, [name]: get().allocation };
      save(KEY_SCEN, scen);
      set({ scenarios: scen });
    },
    loadScenario(name){
      const scen = get().scenarios?.[name];
      if (!scen) return;
      save(KEY_ALLOC, scen);
      set({ allocation: scen });
    },
    deleteScenario(name){
      const scen = { ...get().scenarios };
      delete scen[name];
      save(KEY_SCEN, scen);
      set({ scenarios: scen });
    },

    // sheets config
    setSheetConfig(part){
      set((state) => {
        const merged = mergeSheetConfig(state.sheetConfig, part);
        save(KEY_SHEETS, merged);
        return { sheetConfig: merged };
      });
    },
  };
});
