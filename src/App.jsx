// src/sampleData.js
const teachers = [
  { id: 't1', name: 'Tahira Muhammad',  maxPeriods: 38, maxLearners: 120, modes: ['Live','Flipped'],             specialties: ['English'] },
  { id: 't2', name: 'Nabeelah Abrahams', maxPeriods: 36, maxLearners: 125, modes: ['Live'],                      specialties: ['Maths'] },
  { id: 't3', name: 'Aaisha Laher',      maxPeriods: 34, maxLearners: 110, modes: ['Live','Flipped','Self-Paced'], specialties: ['Science'] },
];

const subjects = [
  { id: 's1', name: 'English',           periods: 8, requiredSpecialty: 'English' },
  { id: 's2', name: 'Maths',             periods: 8, requiredSpecialty: 'Maths'   },
  { id: 's3', name: 'Combined Science',  periods: 6, requiredSpecialty: 'Science' },
];

const classes = [
  { id: 'c1', name: 'Grade 5 Live M1',    grade: 5, mode: 'Live',    curriculum: 'CAPS', learners: 32, maxLearners: 40, subjectIds: ['s1','s2','s3'] },
  { id: 'c2', name: 'Grade 5 Flipped AM', grade: 5, mode: 'Flipped', curriculum: 'CAPS', learners: 28, maxLearners: 40, subjectIds: ['s1','s2','s3'] },
];

const initialAllocation = {
  c1: { s1: 't1', s2: 't2', s3: 't3' },
  c2: { s1: 't1', s2: 't2', s3: ''  },
};

const globals = {
  maxLearnersPerTeacher: 120,
  maxPeriodsPerTeacher: 38,
  maxLearnersPerClass: 40,
};

export default { teachers, subjects, classes, initialAllocation, globals };
