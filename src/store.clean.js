// src/store.clean.js
import { create } from 'zustand';
import sample from './sampleData.js';

const hasWindow = () => typeof window !== 'undefined';
const load = (k, fb) => { try { if (!hasWindow()) return fb; const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const save = (k, v) => { try { if (!hasWindow()) return; localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const KEY_ALLOC='alloc_v1', KEY_SCEN='scenarios_v1', KEY_THEME='theme_v1', KEY_SHEETS='sheet_config_v1', KEY_PERIODS='periods_v1', KEY_SECT='section_themes_v1';

const DEFAULT_SHEET_CONFIG = {
  sheetUrl: '',
  sheetNames: { teachers:'Teachers', subjects:'Subjects', classes:'Classes', allocation:'Allocation', periods:'Periods' },
  writeUrl: '',
  autoRefresh: false,
  pollMs: 60000,
};

export const useAppStore = create((set, get) => {
  const savedAlloc=load(KEY_ALLOC,null);
  const savedScen=load(KEY_SCEN,{});
  const savedTheme=load(KEY_THEME,'navy');
  const savedSheets=load(KEY_SHEETS,null);
  const savedPeriods=load(KEY_PERIODS,{});
  const savedSect=load(KEY_SECT,{});

  return {
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes:  sample.classes,
    globals:  sample.globals,

    allocation: savedAlloc ?? sample.initialAllocation,
    periodsMap: savedPeriods || {},

    activeTab: 'dashboard',
    filters: { curriculum:'All', grade:'All', mode:'All' },
    activeClassId: sample.classes[0]?.id || '',
    theme: savedTheme,
    readOnly: false,

    sectionThemes: savedSect,
    setSectionTheme(section, patch) {
      set(s => {
        const next = { ...(s.sectionThemes||{}), [section]: { ...(s.sectionThemes?.[section]||{}), ...patch } };
        save(KEY_SECT,next);
        return { sectionThemes: next };
      });
    },
    getSectionStyle(section) {
      const cfg = get().sectionThemes?.[section] || {};
      const style = {};
      Object.entries(cfg).forEach(([k,v]) => style[`--${k}`] = v);
      return style;
    },

    sheetConfig: savedSheets || DEFAULT_SHEET_CONFIG,
    setSheetConfig(part) {
      set(s => {
        const merged = { ...s.sheetConfig, ...part };
        if (part && part.sheetNames) merged.sheetNames = { ...s.sheetConfig.sheetNames, ...part.sheetNames };
        save(KEY_SHEETS, merged);
        return { sheetConfig: merged };
      });
    },

    scenarios: savedScen,
    saveScenario(name){
      if(!name?.trim()) return;
      const scen = { ...get().scenarios, [name]: get().allocation };
      save(KEY_SCEN,scen);
      set({ scenarios:scen });
    },
    loadScenario(name){
      const scen=get().scenarios?.[name];
      if(!scen) return;
      save(KEY_ALLOC,scen);
      set({ allocation:scen });
    },
    deleteScenario(name){
      const s={ ...get().scenarios }; delete s[name];
      save(KEY_SCEN,s);
      set({ scenarios:s });
    },

    setActiveTab(tab){ set({ activeTab:tab }); },
    setFilters(part){ set(s => ({ filters:{ ...s.filters, ...part } })); },
    setActiveClass(id){ set({ activeClassId:id }); },

    setAllocation(classId, subjectId, teacherId){
      set(s => {
        const next={ ...s.allocation };
        next[classId]=next[classId]?{ ...next[classId] }:{};
        next[classId][subjectId]=teacherId||'';
        save(KEY_ALLOC,next);
        return { allocation: next };
      });
    },
    resetAllocation(){ save(KEY_ALLOC, sample.initialAllocation); set({ allocation: sample.initialAllocation }); },
    setPeriods(classId, subjectId, value){
      set(s => {
        const next={ ...s.periodsMap };
        next[classId]=next[classId]?{ ...next[classId] }:{};
        if(value===''||value==null){ delete next[classId][subjectId]; } else { next[classId][subjectId]=Number(value); }
        save(KEY_PERIODS,next);
        return { periodsMap: next };
      });
    },
    getPeriods(classId, subjectId){
      const p=get().periodsMap?.[classId]?.[subjectId];
      if(p===undefined||p===null||p===''){ const subj=get().subjects.find(x=>x.id===subjectId); return subj?.periods ?? 0; }
      return p;
    },

    replaceAllData({ teachers, subjects, classes, globals, allocation, periodsMap }){
      const nextTeachers=teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects=subjects ?? get().subjects ?? sample.subjects;
      const nextClasses= classes ?? get().classes ?? sample.classes;
      const nextGlobals= globals ?? get().globals ?? sample.globals;
      const nextAlloc= allocation ?? get().allocation ?? sample.initialAllocation;
      const nextPeriods=periodsMap ?? get().periodsMap ?? {};
      const nextActiveClass = classes && classes[0]?.id ? classes[0].id : get().activeClassId;

      save(KEY_ALLOC,nextAlloc);
      save(KEY_PERIODS,nextPeriods);

      set({ teachers:nextTeachers, subjects:nextSubjects, classes:nextClasses, globals:nextGlobals,
            allocation:nextAlloc, periodsMap:nextPeriods, activeClassId: nextActiveClass });
    },

    setReadOnly(flag){ set({ readOnly: !!flag }); },

    applyQueryParams(params){
      if(params.theme){ save(KEY_THEME, params.theme); set({ theme: params.theme }); }
      if(params.tab) set({ activeTab: params.tab });

      const f={};
      if(params.curriculum) f.curriculum=params.curriculum;
      if(params.grade) f.grade = isNaN(Number(params.grade)) ? params.grade : Number(params.grade);
      if(params.mode) f.mode=params.mode;
      if(Object.keys(f).length) set(s => ({ filters:{ ...s.filters, ...f } }));

      if(params.sheet) set(s => {
        const merged={ ...s.sheetConfig, sheetUrl: params.sheet };
        save(KEY_SHEETS, merged);
        return { sheetConfig: merged };
      });

      if(params.readonly==='true') set({ readOnly:true });
    },

    setTheme(theme){
      save(KEY_THEME, theme);
      set({ theme });
    },
  };
});
