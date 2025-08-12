import React, { useMemo } from 'react';
import { useAppStore } from '../store.clean.js';
import { evaluateConstraints } from '../utils/constraints.js';

export default function WarningsPanel(){
  const state = useAppStore();
  const warnings = useMemo(()=> evaluateConstraints(state), [state.allocation, state.filters, state.activeClassId]);

  const grouped = warnings.reduce((acc, w)=>{
    acc[w.level] = acc[w.level] || [];
    acc[w.level].push(w);
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="text-lg font-semibold mb-3">Constraints & Warnings</div>
      {warnings.length===0 ? <div className="text-emerald-600">All good. No issues detected.</div> : (
        <div className="space-y-3">
          {Object.entries(grouped).sort((a,b)=> (a[0]==='error'? -1:1)).map(([level, items])=> (
            <div key={level}>
              <div className={`font-medium ${level==='error'?'text-[color:var(--warn)]':'text-[color:var(--accent)]'}`}>{level.toUpperCase()} · {items.length}</div>
              <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                {items.map((w, i)=> <li key={i}>{w.message}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
