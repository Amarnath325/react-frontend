import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BarChart2, Star, Download, Search, Filter, 
  AlertCircle, RefreshCw, X, Award, CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RankRow {
  rank: number;
  studentName: string;
  rollNo: string;
  totalObtained: number;
  percentage: number;
  gpa: number;
  status: 'Pass' | 'Fail';
}

const INITIAL_RANKS: RankRow[] = [
  { rank: 1, studentName: 'Neha Sharma', rollNo: '10-A-08', totalObtained: 485, percentage: 97.0, gpa: 10.0, status: 'Pass' },
  { rank: 2, studentName: 'Aditya Sen', rollNo: '10-A-01', totalObtained: 462, percentage: 92.4, gpa: 9.5, status: 'Pass' },
  { rank: 3, studentName: 'Aarav Gupta', rollNo: '10-A-05', totalObtained: 450, percentage: 90.0, gpa: 9.2, status: 'Pass' },
  { rank: 4, studentName: 'Rohan Joshi', rollNo: '10-A-12', totalObtained: 410, percentage: 82.0, gpa: 8.5, status: 'Pass' },
  { rank: 5, studentName: 'Rahul Verma', rollNo: '10-A-15', totalObtained: 380, percentage: 76.0, gpa: 7.8, status: 'Pass' }
];

const CLASSES = ['Class 10', 'Class 9', 'Class 8'];
const EXAMS = ['Half Yearly Examination', 'Final Annual Examination'];

import { useLocation } from 'react-router-dom';

export default function PerformanceRankReports() {
  const location = useLocation();
  const path = location.pathname;

  const isPerformance = path.includes('performance');
  const isRank = path.includes('rank-merit');
  const isReports = path.includes('reports');

  const [ranks, setRanks] = useState<RankRow[]>(INITIAL_RANKS);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = () => {
    try {
      const exportData = ranks.map(item => ({
        'Rank Index': item.rank,
        'Student Name': item.studentName,
        'Roll Number': item.rollNo,
        'Marks Obtained': item.totalObtained,
        'Percentage (%)': item.percentage,
        'GP Score': item.gpa,
        'Pass/Fail Status': item.status
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      const filename = isPerformance ? 'performance_summary' : isRank ? 'rank_sheet' : 'exam_reports';
      XLSX.utils.book_append_sheet(wb, ws, 'Data Sheet');
      XLSX.writeFile(wb, `${filename}_${selectedClass.replace(' ', '_')}_${selectedExam.replace(' ', '_')}.xlsx`);
      toast.success('Export successful!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const filteredRanks = ranks.filter(item => {
    return item.studentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Dynamic headers
  let pageTitle = 'Performance Analyzer & Rank Sheets';
  let pageDesc = 'Review merit distributions, subject toppers lists, and download spreadsheet sheets.';
  let exportLabel = 'Export Data';

  if (isPerformance) {
    pageTitle = 'Student Performance Analysis';
    pageDesc = 'Visualize class score distributions, subject averages, and aggregate student percentage parameters.';
    exportLabel = 'Export Performance Summary';
  } else if (isRank) {
    pageTitle = 'Rank & Merit Management';
    pageDesc = 'Review verified student term positions, class standings, GPA scores, and lock toppers tables.';
    exportLabel = 'Export Merit List';
  } else if (isReports) {
    pageTitle = 'Examination Reports Center';
    pageDesc = 'Download consolidated marks registers, failing summaries, subject grade metrics, and system report files.';
    exportLabel = 'Export Consolidated Report';
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-slate-500 mt-1 text-sm">{pageDesc}</p>
        </div>
      </div>

      {/* Custom KPI cards for Performance Analysis */}
      {isPerformance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">Class Average</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">85.5%</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">Pass Percentage</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">95.0%</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">Total Toppers</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">3 Students</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">GPA Threshold</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">&gt; 7.5 Avg</span>
          </div>
        </div>
      )}

      {/* Custom reports shortcuts list for Reports Center */}
      {isReports && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm mb-8 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Downloadable System Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center justify-between">
              <span>Consolidated Marks Ledger</span>
              <span className="text-blue-600">Download XLS</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center justify-between">
              <span>Subject-wise Grade Distribution</span>
              <span className="text-blue-600">Download XLS</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-3 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center justify-between">
              <span>Student Pass/Fail Summary</span>
              <span className="text-blue-600">Download XLS</span>
            </a>
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exam Name</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class/Grade</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-semibold text-slate-700"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-sm shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{exportLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ranks list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-24">Rank No</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6">Roll Code</th>
                <th className="py-4 px-6 text-center">Marks Obtained (Out of 500)</th>
                <th className="py-4 px-6 text-center">Percentage</th>
                <th className="py-4 px-6 text-center">GPA score</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
              {filteredRanks.map(item => (
                <tr key={item.rank} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
                      item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      item.rank === 2 ? 'bg-slate-100 text-slate-800 border border-slate-300' :
                      item.rank === 3 ? 'bg-orange-50 text-orange-850 border border-orange-200' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{item.studentName}</td>
                  <td className="py-4 px-6 font-mono text-slate-500">{item.rollNo}</td>
                  <td className="py-4 px-6 text-center font-bold text-slate-700">{item.totalObtained}</td>
                  <td className="py-4 px-6 text-center font-mono font-bold">{item.percentage.toFixed(1)}%</td>
                  <td className="py-4 px-6 text-center font-bold text-indigo-600">{item.gpa.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export { INITIAL_RANKS };
