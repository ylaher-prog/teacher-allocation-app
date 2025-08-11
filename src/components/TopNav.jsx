import React from 'react';

export default function TopNav() {
  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Teacher Subject Allocation</div>
        <div className="text-sm text-gray-500">Demo · Mock Data</div>
      </div>
    </div>
  );
}
