const teachers = [
  { id: 't1', name: 'Tahira Muhammad', maxPeriods: 38, maxLearners: 120, modes: ['Live','Flipped'], specialties: ['English'] },
  { id: 't2', name: 'Nabeelah Abrahams', maxPeriods: 36, maxLearners: 125, modes: ['Live'], specialties: ['Maths'] },
  { id: 't3', name: 'Aaisha Laher', maxPeriods: 34, maxLearners: 110, modes: ['Live','Flipped','Self-Paced'], specialties: ['Science'] },
  { id: 't4', name: 'Yusuf Khan', maxPeriods: 30, maxLearners: 100, modes: ['Self-Paced','Flipped'], specialties: ['English','Science'] },
];

const subjects = [
  { id: 's1', name: 'English', periods: 8, requiredSpecialty: 'English' },
  { id: 's2', name: 'Maths', periods: 8, requiredSpecialty: 'Maths' },
  { id: 's3', name: 'Combined Science', periods: 6, requiredSpecialty: 'Science' },
];

const classes = [
  { id: 'c1', grade: 5, name: 'Grade 5 Live M1',    mode: 'Live',             curriculum: 'British', learners: 32, maxLearners: 36, subjectIds: ['s1','s2','s3'] },
  { id: 'c2', grade: 5, name: 'Grade 5 Flipped AM', mode: 'Flipped Morning',  curriculum: 'British', learners: 28, maxLearners: 36, subjectIds: ['s1','s2','s3'] },
  { id: 'c3', grade: 4, name: 'Grade 4 Self-Paced', mode: 'Self-Paced',       curriculum: 'British', learners: 20, maxLearners: 36, subjectIds: ['s1','s2']      },
  { id: 'c4', grade: 6, name: 'Grade 6 Live M2',    mode: 'Live',             curriculum: 'British', learners: 30, maxLearners: 36, subjectIds: ['s1','s2','s3'] },
];

const globals = { maxLearnersPerTeacher: 130, maxPeriodsPerTeacher: 38, maxLearnersPerClass: 36 };

const initialAllocation = {
  c1: { s1: 't1', s2: 't2', s3: 't3' },
  c2: { },
  c3: { },
  c4: { }
};

export default { teachers, subjects, classes, globals, initialAllocation };
