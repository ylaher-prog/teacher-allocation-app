// src/utils/xlsxExport.js
import * as XLSX from 'xlsx';

export function exportToXLSX({ allocation, teachers, subjects, classes, periodsMap }){
  const teachersSheet = teachers.map(t => ({
    id: t.id, name: t.name, maxPeriods: t.maxPeriods, maxLearners: t.maxLearners,
    modes: (t.modes||[]).join('; '), specialties: (t.specialties||[]).join('; ')
  }));

  const subjectsSheet = subjects.map(s => ({
    id: s.id, name: s.name, periods: s.periods, requiredSpecialty: s.requiredSpecialty || ''
  }));

  const classesSheet = classes.map(c => ({
    id: c.id, name: c.name, grade: c.grade || '', mode: c.mode, curriculum: c.curriculum,
    learners: c.learners, maxLearners: c.maxLearners, subjectIds: (c.subjectIds||[]).join('; ')
  }));

  const allocRows = [['Class','Subject','Teacher','Periods']];
  classes.forEach(cls=>{
    const alloc = allocation[cls.id] || {};
    (cls.subjectIds||[]).forEach(sid=>{
      const subj = subjects.find(s=> s.id===sid);
      const tid  = alloc[sid] || '';
      const t    = teachers.find(x=> x.id===tid);
      const per  = (periodsMap?.[cls.id]?.[sid] ?? subj?.periods ?? '');
      allocRows.push([cls.name, subj?.name || sid, t?.name || '', per]);
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teachersSheet), 'Teachers');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subjectsSheet), 'Subjects');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classesSheet),  'Classes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allocRows),      'Allocation');

  XLSX.writeFile(wb, 'teacher_allocation.xlsx');
}
