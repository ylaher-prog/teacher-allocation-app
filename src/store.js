// src/store.js
import { create } from 'zustand';
import sample from './sampleData.js';

const hasWindow = () => typeof window !== 'undefined';
const load = (k, fb)=>{ try{ if(!hasWindow())return fb; const r=localStorage.getItem(k); return r?JSON.parse(r):fb;}catch{return fb;} };
const save = (k,v)=>{ try{ if(!hasWindow())return; localStorage.setItem(k, JSON.stringify(v)); }catch{} };

const KEY_ALLOC='alloc_v1', KEY_SCEN='scenarios_v1', KEY_THEME='theme_v1', KEY_SHEETS='sheet_config_v1', KEY_PERIODS='periods_v1', KEY_SECT='section_themes_v1', KEY_BUILDER='builder_v1';

const DEFAULT_SHEET_CONFIG = {
  sheetUrl: "",
  sheetNames: {
    teachers:"Teachers", subjects:"Subjects", classes:"Classes", allocation:"Allocation", periods:"Periods",
    curricula:"Curricula", grades:"Grades", gradeSubjects:"GradeSubjects", gradePeriods:"GradePeriods", gradeModes:"GradeModes", modeLearners:"ModeLearners"
  },
  writeUrl: "", autoRefresh:false, pollMs:60000,
};

export const useAppStore = create((set, get) => {
  const savedAlloc   = load(KEY_ALLOC,   null);
  const savedScen    = load(KEY_SCEN,    {});
  const savedTheme   = load(KEY_THEME,   'navy');
  const savedSheets  = load(KEY_SHEETS,  null);
  const savedPeriods = load(KEY_PERIODS, {});
  const savedSect    = load(KEY_SECT,    {});   // per-section colors
  const savedBuilder = load(KEY_BUILDER, null); // builder model

  return {
    // core data
    teachers: sample.teachers,
    subjects: sample.subjects,           // catalog
    classes:  sample.classes,
    globals:  sample.globals,

    // allocation & periods
    allocation: savedAlloc ?? sample.initialAllocation,
    periodsMap: savedPeriods || {},

    // ui state
    activeTab: 'dashboard', // 'dashboard' | 'matrix' | 'perclass' | 'builder' | 'settings'
    filters: { curriculum:'All', grade:'All', mode:'All' },
    activeClassId: sample.classes[0]?.id || '',
    theme: savedTheme,

    // section themes (per block)
    sectionThemes: savedSect, // { [section]: { primary, accent, warn, text, surface, muted } }
    setSectionTheme(section, patch){
      set((s)=>{
        const next = { ...(s.sectionThemes||{}) , [section]: { ...(s.sectionThemes?.[section]||{}), ...patch } };
        save(KEY_SECT, next);
        return { sectionThemes: next };
      });
    },
    getSectionStyle(section){
      const cfg = get().sectionThemes?.[section] || {};
      // Return inline CSS vars to apply to a section wrapper
      const style = {};
      Object.entries(cfg).forEach(([k,v])=>{ style[`--${k}`]=v; });
      return style;
    },

    // sheet config
    sheetConfig: savedSheets || DEFAULT_SHEET_CONFIG,
    setSheetConfig(part){
      set((s)=>{
        const merged = { ...s.sheetConfig, ...part };
        if (part.sheetNames) merged.sheetNames = { ...s.sheetConfig.sheetNames, ...part.sheetNames };
        save(KEY_SHEETS, merged);
        return { sheetConfig: merged };
      });
    },

    // scenarios
    scenarios: savedScen,
    saveScenario(name){ if(!name?.trim())return; const scen={...get().scenarios,[name]:get().allocation}; save(KEY_SCEN,scen); set({scenarios:scen}); },
    loadScenario(name){ const scen=get().scenarios?.[name]; if(!scen)return; save(KEY_ALLOC,scen); set({allocation:scen}); },
    deleteScenario(name){ const s={...get().scenarios}; delete s[name]; save(KEY_SCEN,s); set({scenarios:s}); },

    // navigation & filters
    setActiveTab(tab){ set({activeTab:tab}); },
    setFilters(part){ set((s)=>({filters:{...s.filters, ...part}})); },
    setActiveClass(id){ set({activeClassId:id}); },

    // allocation updates
    setAllocation(classId, subjectId, teacherId){
      set((s)=>{
        const next={...s.allocation};
        next[classId]=next[classId]?{...next[classId]}:{};
        next[classId][subjectId]=teacherId||'';
        save(KEY_ALLOC,next);
        return { allocation: next };
      });
    },
    resetAllocation(){ save(KEY_ALLOC, sample.initialAllocation); set({allocation: sample.initialAllocation}); },

    // periods updates (per class/subject)
    setPeriods(classId, subjectId, value){
      set((s)=>{
        const next={...s.periodsMap};
        next[classId]=next[classId]?{...next[classId]}:{};
        if (value===''||value===null||value===undefined){ delete next[classId][subjectId]; }
        else { next[classId][subjectId]=Number(value); }
        save(KEY_PERIODS, next);
        return { periodsMap: next };
      });
    },
    getPeriods(classId, subjectId){
      const p=get().periodsMap?.[classId]?.[subjectId];
      if (p===undefined||p===null||p===''){ const subj=get().subjects.find(x=>x.id===subjectId); return subj?.periods ?? 0; }
      return p;
    },

    // replace all (Sheets/CSV import)
    replaceAllData({ teachers, subjects, classes, globals, allocation, periodsMap,
      curricula, grades, gradeSubjects, gradePeriods, gradeModes, modeLearners }){
      const nextTeachers = teachers ?? get().teachers ?? sample.teachers;
      const nextSubjects = subjects ?? get().subjects ?? sample.subjects;
      const nextClasses  = classes  ?? get().classes  ?? sample.classes;
      const nextGlobals  = globals  ?? get().globals  ?? sample.globals;
      const nextAlloc    = allocation ?? get().allocation ?? sample.initialAllocation;
      const nextPeriods  = periodsMap ?? get().periodsMap ?? {};
      const nextActive   = (classes && classes[0]?.id) ? classes[0].id : get().activeClassId;

      save(KEY_ALLOC, nextAlloc); save(KEY_PERIODS,nextPeriods);

      set({
        teachers: nextTeachers, subjects: nextSubjects, classes: nextClasses, globals: nextGlobals,
        allocation: nextAlloc, periodsMap: nextPeriods, activeClassId: nextActive,
      });

      // builder if provided
      if (curricula || grades || gradeSubjects || gradePeriods || gradeModes || modeLearners) {
        const builder = {
          curricula: curricula || [],
          grades: grades || [],
          gradeSubjects: gradeSubjects || {},
          gradePeriods: gradePeriods || {},
          gradeModes: gradeModes || {},
          modeLearners: modeLearners || {}
        };
        save(KEY_BUILDER, builder);
        set({ builder });
      }
    },

    // ---------- Builder model ----------
    builder: savedBuilder || {
      curricula: [],         // [{id,name}]
      grades: [],            // [{id,curriculumId,grade,label}]
      gradeSubjects: {},     // {gradeId:[subjectId]}
      gradePeriods: {},      // {gradeId:{subjectId:periods}}
      gradeModes: {},        // {gradeId:[mode]}
      modeLearners: {}       // {gradeId:{mode:learners}}
    },

    // Builder actions
    addCurriculum(name){
      const id = 'cur_' + cryptoRandom();
      set((s)=> {
        const b={...s.builder, curricula:[...s.builder.curricula, {id,name}]};
        save(KEY_BUILDER,b); return { builder:b };
      });
    },
    addGrade(curriculumId, grade, label){
      const id = 'g_' + cryptoRandom();
      set((s)=> {
        const b={...s.builder, grades:[...s.builder.grades, {id,curriculumId,grade,label:label||grade}]};
        save(KEY_BUILDER,b); return { builder:b };
      });
    },
    addSubjectToGrade(gradeId, subjectId){
      set((s)=>{
        const gs={...s.builder.gradeSubjects};
        gs[gradeId]=gs[gradeId]?[...new Set([...gs[gradeId], subjectId])]:[subjectId];
        const b={...s.builder, gradeSubjects:gs}; save(KEY_BUILDER,b); return { builder:b };
      });
    },
    setGradeSubjectPeriods(gradeId, subjectId, periods){
      set((s)=>{
        const gp={...s.builder.gradePeriods};
        gp[gradeId]=gp[gradeId]?{...gp[gradeId]}:{};
        gp[gradeId
