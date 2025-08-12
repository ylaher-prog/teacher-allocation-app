import React from 'react';
import { useAppStore } from '../appStore.js';

export default function Dashboard(){
  const { teachers, subjects, classes } = useAppStore();
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded border">
          <div className="text-sm text-gray-500">Teachers</div>
          <div className="text-2xl font-semibold">{teachers.length}</div>
        </div>
        <div className="p-4 rounded border">
          <div className="text-sm text-gray-500">Subjects</div>
          <div className="text-2xl font-semibold">{subjects.length}</div>
        </div>
        <div className="p-4 rounded border">
          <div className="text-sm text-gray-500">Classes</div>
          <div className="text-2xl font-semibold">{classes.length}</div>
        </div>
      </div>
      <p className="mt-6 text-gray-600">
        If you can see this, the app builds correctly. We’ll add Sheets + Matrix next.
      </p>
    </div>
  );
}
