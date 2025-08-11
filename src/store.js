import { create } from 'zustand';
import sample from './sampleData.js';

const KEY_ALLOC = 'alloc_v1';
const KEY_SCEN  = 'scenarios_v1';
const KEY_THEME = 'theme_v1';

function load(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch{ return fallback; }
}
function save(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const useAppStore = create((set, get) => {
  const savedAlloc = typeof window !== 'undefined' ? load(KEY_ALLOC, null) : null;
  const savedScen  = typeof window !== 'undefined' ? load(KEY_SCEN, {}) : {};
  const savedTheme = typeof window !== 'undefined' ? load(KEY_THEME, 'navy') : 'navy';

  return {
    // data
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes: sample.classes,
    globals: sample.globals,

    // ui state
    filters: { grade: 'All', mode: 'All', curriculum: 'All' },
    activeClassId: sample.classes[0].id,
    theme: savedTheme,
    scenarios: savedScen, // { name: allocationMap }

    // allocation
    allocation: savedAlloc ?? sample.initialAllocation,

    // actions
    setTheme(theme){ save(KEY_THEME, theme); set({ theme }); },
    setFilters(part){ set(state => ({ filters: { ...state.filters, ...part } })); },
    setActiveClass(id){ set({ activeClassId: id }); },

    setAllocation(classId, subjectId, teacherId){
      set((state) => {
        const next = { ...state.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || null;
        save(KEY_ALLOC, next);
        return { allocation: next };
      });
    },

    resetAllocation(){
      save(KEY_ALLOC, sample.initialAllocation);
      set({ allocation: sample.initialAllocation });
    },

    replaceAllData({ teachers, subjects, classes, globals, allocation }){
      const nextAlloc = allocation || {};
      save(KEY_ALLOC, nextAlloc);
      set({
        teachers: teachers ?? sample.teachers,
        subjects: subjects ?? sample.subjects,
        classes: classes ?? sample.classes,
        globals: globals ?? sample.globals,
        allocation: nextAlloc,
        activeClassId: (classes && classes[0]?.id) || get().activeClassId
      });
    },

    // scenarios (versioning)
    saveScenario(name){
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
    }
  };
});
