import React, { useMemo } from 'react';
import { useAppStore } from '../store.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function StatsDashboard(){
  const { teachers, classes, subjects, allocation, periodsMap, getPeriods, getSectionStyle } = useAppStore();
  const style = getSectionStyle('dashboard');

  const teacherLoad = useMemo(()=>{
    return teachers.map(t=>{
      let periods = 0, learners = 0; const touched = new Set();
      classes.forEach(cls=>{
        const row = allocation[cls.id] || {};
        Object.entries(row).forEach(([sid, tid])=>{
          if(tid===t.id){ periods += getPeriods(cls.id, sid); if(!touched.has(cls.id)){ learners += cls.learners; touched.add(cls.id);} }
        });
      });
      return { name: t.name, periods, learners, maxPeriods: t.maxPeriods };
    });
  }, [teachers, classes, allocation, periodsMap]);

  const subjectDist = useMemo(()=>{
    const map = {};
    classes.forEach(cls=>{
      (cls.subjectIds||[]).forEach(sid=>{
        const tid = (allocation[cls.id]||{})[sid];
        if (tid) map[sid] = (map[sid]||0)+1;
      });
    });
    return Object.entries(map).map(([sid,count])=>{
      const s = subjects.find(x=> x.id===sid);
      return { name: s?.name || sid, value: count };
    });
  }, [classes, allocation, subjects]);

  const COLORS = ['#0B2042','#8D1D4B','#AD9040','#2563eb','#10b981','#f59e0b'];

  const totals = {
    teachers: teachers.length,
    classes: classes.length,
    subjects: subjects.length,
    allocations: Object.values(allocation).reduce((acc,row)=> acc + Object.values(row).filter(Boolean).length, 0),
  };

  return (
    <div className="space-y-4" style={style}>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="kpi"><div className="label">Teachers</div><div className="text-2xl font-bold">{totals.teachers}</div></div>
        <div className="kpi"><div className="label">Classes</div><div className="text-2xl font-bold">{totals.classes}</div></div>
        <div className="kpi"><div className="label">Subjects</div><div className="text-2xl font-bold">{totals.subjects}</div></div>
        <div className="kpi"><div className="label">Assigned (cells)</div><div className="text-2xl font-bold">{totals.allocations}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="title mb-2">Periods per Teacher</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherLoad}>
                <XAxis dataKey="name" tick={{fontSize:12}} interval={0} angle={-20} textAnchor="end" height={60}/>
                <YAxis />
                <Tooltip />
                <Bar dataKey="periods" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="title mb-2">Allocations by Subject</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={subjectDist} outerRadius={100} fill="#8884d8" label>
                  {subjectDist.map((entry, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </Pie
