// src/utils/constraints.js
export function evaluateConstraints(state){
  const { teachers, classes, subjects, allocation, globals, periodsMap } = state;
  const warnings = [];

  const teacherById = Object.fromEntries(teachers.map(t=>[t.id, t]));
  const subjectById = Object.fromEntries(subjects.map(s=>[s.id, s]));
  const classById   = Object.fromEntries(classes.map(c=>[c.id, c]));

  // Helper: get periods for class/subject (fallback to subject default)
  const getP = (cid, sid) => {
    const fromMap = periodsMap?.[cid]?.[sid];
    if (fromMap === '' || fromMap === undefined || fromMap === null) {
      return subjectById[sid]?.periods || 0;
    }
    const n = Number(fromMap);
    return Number.isFinite(n) ? n : (subjectById[sid]?.periods || 0);
  };

  // 1) Class capacity
  classes.forEach(cls=>{
    if (cls.learners > cls.maxLearners || cls.learners > globals.maxLearnersPerClass){
      warnings.push({
        type: 'capacity', level: 'error',
        message: `${cls.name}: learners (${cls.learners}) exceed max (${Math.min(cls.maxLearners, globals.maxLearnersPerClass)})`
      });
    }
  });

  // teacher loads
  const teacherLoads = {};
  classes.forEach(cls=>{
    const alloc = allocation[cls.id] || {};
    Object.entries(alloc).forEach(([sid, tid])=>{
      const subj = subjectById[sid];
      if (!subj || !tid) return;
      const P = getP(cls.id, sid);
      teacherLoads[tid] = teacherLoads[tid] || { periods:0, learners:0, classes:new Set() };
      teacherLoads[tid].periods += P;
      if (!teacherLoads[tid].classes.has(cls.id)){
        teacherLoads[tid].learners += cls.learners;
        teacherLoads[tid].classes.add(cls.id);
      }
    });
  });

  // 2) Qualification & Mode
  Object.entries(allocation).forEach(([classId, subMap])=>{
    const cls = classById[classId];
    Object.entries(subMap).forEach(([sid, tid])=>{
      const t = teacherById[tid];
      const s = subjectById[sid];
      if (!t || !s) return;
      if (s.requiredSpecialty && !(t.specialties||[]).includes(s.requiredSpecialty)){
        warnings.push({ type:'qualification', level:'warn',
          message: `${t.name} is not specialized for ${s.name} (${s.requiredSpecialty}) in ${cls.name}` });
      }
      const ok = (t.modes||[]).some(m => cls.mode.startsWith(m) || m===cls.mode);
      if (!ok){
        warnings.push({ type:'mode', level:'warn',
          message: `${t.name} mode ${JSON.stringify(t.modes)} may not match class mode "${cls.mode}" in ${cls.name}` });
      }
    });
  });

  // 3) Teacher caps
  Object.entries(teacherLoads).forEach(([tid, load])=>{
    const t = teacherById[tid];
    if (!t) return;
    if (load.periods > t.maxPeriods){
      warnings.push({ type:'periods', level:'error',
        message: `${t.name}: periods ${load.periods}/${t.maxPeriods} (exceeds)` });
    }
    if (load.learners > t.maxLearners || load.learners > (globals.maxLearnersPerTeacher || Infinity)){
      warnings.push({ type:'learners', level:'error',
        message: `${t.name}: learners ${load.learners}/${Math.min(t.maxLearners, globals.maxLearnersPerTeacher)}` });
    }
  });

  // 4) Unassigned subjects
  classes.forEach(cls=>{
    const alloc = allocation[cls.id] || {};
    (cls.subjectIds||[]).forEach(sid=>{
      if (!alloc[sid]){
        const s = subjectById[sid];
        warnings.push({ type:'unassigned', level:'warn', message: `${cls.name}: ${s?.name || sid} is unassigned` });
      }
    });
  });

  return warnings;
}
