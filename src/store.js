// src/store.js
import { create } from 'zustand';
import sample from './sampleData.js';

const STORAGE_KEY = 'alloc_v1';

// Safely load saved allocation from localStorage
function loadSavedAllocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch (e) {
    console.warn('Failed to load saved allocation:', e);
    return null;
  }
}

// Safely save allocation to localStorage
function saveAllocation(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to save allocation:', e);
  }
}

export const useAppStore = create((set, get) => {
  // In SSR/build environments, window/localStorage won't exist
  const saved = typeof window !== 'undefined' ? loadSavedAllocation() : null;

  return {
    // Static data (mock for now)
    teachers: sample.teachers,
    subjects: sample.subjects,
    classes: sample.classes,
    globals: sample.globals,

    // Allocation state (classId -> { subjectId -> teacherId })
    allocation: saved ?? sample.initialAllocation,

    // Update a single subject allocation and persist it
    setAllocation(classId, subjectId, teacherId) {
      set((state) => {
        const next = { ...state.allocation };
        next[classId] = next[classId] ? { ...next[classId] } : {};
        next[classId][subjectId] = teacherId;

        if (typeof window !== 'undefined') saveAllocation(next);
        return { allocation: next };
      });
    },

    // Reset allocations back to initial sample and persist
    resetAllocation() {
      const base = sample.initialAllocation;
      if (typeof window !== 'undefined') saveAllocation(base);
      set({ allocation: base });
    },

    // Replace entire allocation map at once and persist (useful for imports)
    replaceAllocation(next) {
      if (typeof window !== 'undefined') saveAllocation(next);
      set({ allocation: next });
    },
  };
});
