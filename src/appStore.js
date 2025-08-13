// src/appStore.js
import { create } from 'zustand';
import sample from './sampleData.js';

const hasWindow = () => typeof window !== 'undefined';
const load = (k, fb) => { try { if (!hasWindow()) return fb; const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v) => { try { if (!hasWindow()) return; localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// storage keys
const KEY_ALLOC='alloc_v1', KEY_THEME='theme_v1', KEY_PERIODS='periods_v1', KEY_SCEN='scenarios_v1', KEY_SHEET_LINK='sheet_link_v1';

export const useAppStore = create((set, get) => {
  return {
    // data
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes:  sample.classes,
    globals:  sample.globals,

    allocation: load(KEY_ALLOC, sample.initialAllocation),
    periodsMap: load(KEY_PERIODS, {}),

    // ui
    activeTab: 'dashboard',               // 'dashboard' | 'matrix'
    filters: { curriculum:'All', grade:'All', mode:'All' },
    activeClassId: sample.classes[0]?.id || '',
    theme: load(KEY_THEME, 'navy'),
    readOnly: false,

    // sheets
    sheetLink: load(KEY_SHEET_LINK, ''),  // single URL to spreadsheet

    // scenarios
    scenarios: load(KEY_SCEN, {}),        // { name: allocationSnapshot }

    // --- basic setters ---
    setTheme(theme){ save(KEY_THEME, theme); set({ theme }); },
    setActiveTab(tab){ set({ activeTab: tab }); },
    setFilters(part){ set(s => ({ filters: { ...s.filters, ...part } })); },
    setActiveClass(id){ set({ activeClassId: id }); },
    setSheetLink(link){ save(KEY_SHEET_LINK, link); set({ sheetLink: link }); },

    // --- allocation & periods ---
    setAllocation(classId, subjectId, teacherId){
      set(s => {
        const next = { ...s.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || '';
        save(KEY_ALLOC, next);
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

    // --- scenarios ---
    saveScenario(name){
      if(!name?.trim()) return;
      const scen = { ...get().scenarios, [name]: get().allocation };
      save(KEY_SCEN, scen);
      set({ scenarios: scen });
    },
    loadScenario(name){
      const snap = get().scenarios?.[name];
      if(!snap) return;
      save(KEY_ALLOC, snap);
      set({ allocation: snap });
    },
    deleteScenario(name){
      const s = { ...get().scenarios };
      delete s[name];
      save(KEY_SCEN, s);
      set({ scenarios: s });
    },

    // --- bulk replace from Sheets/imports ---
    replaceAllData({ teachers, subjects, classes, globals, allocation, periodsMap }){
      const nextTeachers = teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects = subjects ?? get().subjects ?? sample.subjects;
      const nextClasses  = classes  ?? get().classes  ?? sample.classes;
      const nextGlobals  = globals  ?? get().globals  ?? sample.globals;
      const nextAlloc    = allocation ?? get().allocation ?? sample.initialAllocation;
      const nextPeriods  = periodsMap ?? get().periodsMap ?? {};

      const nextActiveClass = nextClasses[0]?.id ?? get().activeClassId;
      save(KEY_ALLOC, nextAlloc);
      save(KEY_PERIODS, nextPeriods);

      set({
        teachers: nextTeachers,
        subjects: nextSubjects,
        classes : nextClasses,
        globals : nextGlobals,
        allocation: nextAlloc,
        periodsMap: nextPeriods,
        activeClassId: nextActiveClass,
      });
    },
  };
});
