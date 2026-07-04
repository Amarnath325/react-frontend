import React from 'react';
import AcademicYearManager from '../components/Academic/AcademicYearManager';

const AcademicCalendarPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Academic Calendar</h3>
          <p className="text-xs text-gray-500">Configure academic years and sessions for the school</p>
        </div>
      </div>

      {/* Main Content Card matching the admin settings card layout */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-[#4e74b1] to-[#93a6d0] text-white">
          <h2 className="text-[14px] font-semibold">Academic Years</h2>
        </div>
        <div className="p-3 overflow-visible">
          <AcademicYearManager onClose={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendarPage;
