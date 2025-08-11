import { create } from 'zustand';
import sample from './sampleData.js';

export const useAppStore = create((set) => ({
  teachers: sample.teachers,
  subjects: sample.subjects,
  classes: sample.classes,
  globals: sample.globals,
  // allocation: classId -> { subjectId -> teacherId }
  allocation: sample.initialAllocation,
  setAllocation(classId, subjectId, teacherId) {
    set((state) => {
      const next = { ...state.allocation };
      next[classId] = next[classId] ? { ...next[classId] } : {};
      next[classId][subjectId] = teacherId;
      return { allocation: next };
    });
  }
}));
