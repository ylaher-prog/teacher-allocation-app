// src/store.js
import { create } from 'zustand';
import sample from './sampleData.js';

// ---- Persistence keys ----
const KEY_ALLOC   = 'alloc_v1';
const KEY_SCEN    = 'scenarios_v1';
const KEY_THEME   = 'theme_v1';
const KEY_SHEETS  = 'sheet_config_v1';

// ---- Safe JSON load/save helpers ----
const hasWindow = () => typeof window !== 'undefined';

function load(key, fallback) {
  try {
    if (!hasWindow()) return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    if (!hasWindow()) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors, etc. */
  }
}

// ---- Merge helpers for sheetConfig ----
function mergeSheetConfig(base, patch) {
  if (!patch) return base;
  const next = { ...base, ...patch };
  if (patch.sheetNames) {
    next.sheetNames = { ...base.sheetNames, ...patch.sheetNames };
  }
  return next;
}

// ---- Defaults for sheetConfig (read from localStorage if present) ----
const DEFAULT_SHEET_CONFIG = {
  sheetId: '', // paste your Google Sheet ID in the UI Settings
  sheetNames: {
    teachers: 'Teachers',
    subjects: 'Subjects',
    classes: 'Classes',
    allocation: 'Allocation',
  },
  writeUrl: '',     // Apps Script Web App URL (optional, for push)
  autoRefresh: false,
  pollMs: 60000,
};

export const useAppStore = create((set, get) => {
  // Load persisted state up-front (once)
  const savedAlloc   = load(KEY_ALLOC,   null);
  const savedScen    = load(KEY_SCEN,    {});
  const savedTheme   = load(KEY_THEME,   'navy');
  const savedSheets  = load(KEY_SHEETS,  null);

  return {
    // ---------------------------
    // DATA (initially mock/sample; can be replaced via Sheets/CSV)
    // ---------------------------
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes:  sample.classes,
    globals:  sample.globals,

    // ---------------------------
    // UI STATE
    // ---------------------------
    filters: { grade: 'All', mode: 'All', curriculum: 'All' },
    activeClassId: sample.classes[0]?.id || '',
    theme: savedTheme,
    scenarios: savedScen, // { [name]: allocationMap }

    // Live sync (Google Sheets) settings
    sheetConfig: savedSheets ? mergeSheetConfig(DEFAULT_SHEET_CONFIG, savedSheets)
                             : DEFAULT_SHEET_CONFIG,

    // ---------------------------
    // ALLOCATION STATE
    // ---------------------------
    // Map: { [classId]: { [subjectId]: teacherId } }
    allocation: savedAlloc ?? sample.initialAllocation,

    // ---------------------------
    // ACTIONS — UI helpers
    // ---------------------------
    setTheme(theme) {
      save(KEY_THEME, theme);
      set({ theme });
    },

    setFilters(part) {
      set((state) => ({ filters: { ...state.filters, ...part } }));
    },

    setActiveClass(classId) {
      set({ activeClassId: classId });
    },

    // ---------------------------
    // ACTIONS — Allocation updates
    // ---------------------------
    setAllocation(classId, subjectId, teacherId) {
      set((state) => {
        const next = { ...state.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || '';
        save(KEY_ALLOC, next);
        return { allocation: next };
      });
    },

    resetAllocation() {
      save(KEY_ALLOC, sample.initialAllocation);
      set({ allocation: sample.initialAllocation });
    },

    // Replace data wholesale (used by CSV/Sheets import)
    // Accepts any subset: { teachers?, subjects?, classes?, globals?, allocation? }
    replaceAllData({ teachers, subjects, classes, globals, allocation }) {
      const nextTeachers = teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects = subjects ?? get().subjects ?? sample.subjects;
      const nextClasses  = classes  ?? get().classes  ?? sample.classes;
      const nextGlobals  = globals  ?? get().globals  ?? sample.globals;

      // Keep current allocation unless a new one was provided
      const nextAlloc    = allocation ?? get().allocation ?? sample.initialAllocation;

      // If class list changed, select first class by default
      const nextActiveClassId = (classes && classes[0]?.id) ? classes[0].id : get().activeClassId;

      save(KEY_ALLOC, nextAlloc);

      set({
        teachers: nextTeachers,
        subjects: nextSubjects,
        classes:  nextClasses,
        globals:  nextGlobals,
        allocation: nextAlloc,
        activeClassId: nextActiveClassId,
      });
    },

    // ---------------------------
    // ACTIONS — Scenarios (versioning)
    // ---------------------------
    saveScenario(name) {
      if (!name || !name.trim()) return;
      const scen = { ...get().scenarios, [name]: get().allocation };
      save(KEY_SCEN, scen);
      set({ scenarios: scen });
    },

    loadScenario(name) {
      const scen = get().scenarios?.[name];
      if (!scen) return;
      save(KEY_ALLOC, scen);
      set({ allocation: scen });
    },

    deleteScenario(name) {
      const scen = { ...get().scenarios };
      delete scen[name];
      save(KEY_SCEN, scen);
      set({ scenarios: scen });
    },

    // ---------------------------
    // ACTIONS — Google Sheets config
    // ---------------------------
    setSheetConfig(part) {
      set((state) => {
        const merged = mergeSheetConfig(state.sheetConfig, part);
        save(KEY_SHEETS, merged);
        return { sheetConfig: merged };
      });
    },
  };
});
