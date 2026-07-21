import React from 'react';
import FeeStructureManager from '../../components/FeeStructureManager';

export default function FeeStructureManagement() {
  return (
    <div className="p-4 space-y-3 text-xs bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-indigo-100 rounded-lg">
          <svg className="w-4 h-4 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">Fee Structure Management</h1>
          <p className="text-[10px] text-gray-500">Configure academic class-wise fee schedules, amounts, billing frequencies, due dates and options.</p>
        </div>
      </div>
      <FeeStructureManager />
    </div>
  );
}
