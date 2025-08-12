// src/appStore.js
import { create } from 'zustand';
import sample from './sampleData.js';

const hasWindow = () => typeof window !== 'undefined';
const load = (k, fb) => { try { if (!hasWindow()) return fb; const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
const save = (k, v) => { try { if (!hasWindow()) return; localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const KEY_ALLOC='alloc_v1', KEY_THEME='theme_v1', KEY_PERIODS='periods_v1';

export const useAppStore = create((set, get) => {
  return {
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes: sample.classes,
    allocation: load(KEY_ALLOC, sample.initialAllocation),
    periodsMap: load(KEY_PERIODS, {}),
    theme: load(KEY_THEME, 'navy'),
    activeTab: 'dashboard',

    setTheme(theme){ save(KEY_THEME, theme); set({ theme }); },
    setActiveTab(tab){ set({ activeTab: tab }); },

    setAllocation(classId, subjectId, teacherId){
      set(s => {
        const next = { ...s.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId || '';
        save(KEY_ALLOC, next);
        return { allocation: next };
      });
    },
    setPeriods(classId, subjectId, value){
      set(s => {
        const next = { ...s.periodsMap };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        if (value === '' || value == null) { delete next[classId][subjectId]; }
        else { next[classId][subjectId] = Number(value); }
        save(KEY_PERIODS, next);
        return { periodsMap: next };
      });
    },
  };
});
