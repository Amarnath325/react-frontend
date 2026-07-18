import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart2, Star, Download, Search,
  RefreshCw, Award, BookOpen, Loader2,
  CheckCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RankRow {
  id: number;
  class_rank: number;
  student_name: string;
  admission_no: string;
  roll_no: string;
  total_obtained: number;
  total_max: number;
  percentage: number;
  gpa: number;
  grade: string;
  status: string;
}

interface SubjectStat {
  subject_id: number;
  name: string;
  code: string;
  avg_score: number;
  max_marks: number;
  highest: number;
  lowest: number;
  pass_rate: number;
}

interface ResultStats {
  total_students: number;
  passed_count: number;
  promoted_count: number;
  failed_count: number;
  pass_rate: number;
  avg_percentage: number;
  topper: {
    name: string;
    percentage: number;
    grade: string;
  };
  subjects: SubjectStat[];
}

interface DropdownOption {
  value: string;
  label: string;
}

import { useLocation } from 'react-router-dom';

export default function PerformanceRankReports() {
  const location = useLocation();
  const path = location.pathname;

  const isPerformance = path.includes('performance');
  const isRank = path.includes('rank-merit');
  const isReports = path.includes('reports');

  // Master dropdowns
  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [examinations, setExaminations] = useState<DropdownOption[]>([]);

  // Selected filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Loaded data
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch masters
  const fetchMasters = useCallback(async () => {
    try {
      const [mastRes, examRes] = await Promise.all([
        api.get('/student-exams/masters'),
        api.get('/student-exams/exams', { params: { is_active: '1' } }),
      ]);
      if (mastRes.data.success) {
        const { academicYears: ay, classes: cl } = mastRes.data.data;
        setAcademicYears((ay || []).map((y: any) => ({ value: String(y.value), label: y.label })));
        setClasses((cl || []).map((c: any) => ({ value: String(c.value), label: c.label })));
        if (ay && ay.length > 0) setSelectedYear(String(ay[0].value));
        if (cl && cl.length > 0) setSelectedClass(String(cl[0].value));
      }
      if (examRes.data.success) {
        const examOpts = (examRes.data.data || []).map((e: any) => ({
          value: String(e.id),
          label: `${e.class_name} — ${e.name}`,
        }));
        setExaminations(examOpts);
        if (examOpts.length > 0) setSelectedExam(examOpts[0].value);
      }
    } catch {
      toast.error('Failed to load filter dropdowns');
    }
  }, []);

  // Fetch performance ranks and statistics
  const fetchPerformanceData = useCallback(async () => {
    if (!selectedExam || !selectedClass) return;
    setLoading(true);
    try {
      const [ranksRes, statsRes] = await Promise.all([
        api.get('/student-exams/results', {
          params: {
            academic_year_id: selectedYear || undefined,
            exam_id: selectedExam,
            class_id: selectedClass
          }
        }),
        api.get('/student-exams/results/stats', {
          params: {
            exam_id: selectedExam,
            class_id: selectedClass
          }
        })
      ]);

      if (ranksRes.data.success) {
        setRanks(ranksRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch {
      setRanks([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedExam, selectedClass]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Export to Excel sheet
  const handleExport = () => {
    try {
      if (ranks.length === 0) {
        toast.error('No rank merit list generated to export');
        return;
      }

      const exportData = ranks.map(item => ({
        'Class Rank': item.class_rank,
        'Student Name': item.student_name,
        'Admission Number': item.admission_no,
        'Roll Number': item.roll_no,
        'Marks Obtained': item.total_obtained,
        'Max Marks': item.total_max,
        'Percentage (%)': item.percentage,
        'GPA Score': item.gpa,
        'Grade Code': item.grade,
        'Overall Status': item.status
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      const filename = isPerformance ? 'performance_analysis' : isRank ? 'rank_merit_list' : 'examination_report';
      XLSX.utils.book_append_sheet(wb, ws, 'Ranks Sheet');
      XLSX.writeFile(wb, `${filename}_class_${selectedClass}_exam_${selectedExam}.xlsx`);
      toast.success('Excel sheet exported successfully!');
    } catch (error) {
      toast.error('Failed to compile data to Excel sheet');
    }
  };

  const filteredRanks = useMemo(() => {
    if (!searchTerm.trim()) return ranks;
    const q = searchTerm.toLowerCase();
    return ranks.filter(r =>
      r.student_name.toLowerCase().includes(q) ||
      r.admission_no.toLowerCase().includes(q)
    );
  }, [ranks, searchTerm]);

  // Dynamic headers
  let pageTitle = 'Performance Analyzer & Rank Sheets';
  let pageDesc = 'Review student standing positions, class averages, toppers summaries, and download reports.';
  let exportLabel = 'Export Report Desk';

  if (isPerformance) {
    pageTitle = 'Student Performance Analysis';
    pageDesc = 'Review class score distributions, subject averages, and aggregate student percentage parameters.';
    exportLabel = 'Export Performance Summary';
  } else if (isRank) {
    pageTitle = 'Rank & Merit Management';
    pageDesc = 'Review student examination ranks, class standings, GPA scores, and lock topper registers.';
    exportLabel = 'Export Class Merit List';
  } else if (isReports) {
    pageTitle = 'Examination Reports Center';
    pageDesc = 'Download consolidated marks registers, subject grade metrics, and performance summary files.';
    exportLabel = 'Export Consolidated Ledger';
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-650 animate-pulse" />
            {pageTitle}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">{pageDesc}</p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={fetchPerformanceData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-255 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Analysis
          </button>
        </div>
      </div>

      {/* KPI stats section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Processed Room</p>
              <p className="text-sm font-black text-slate-800">{stats.total_students} Students</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Passed Room</p>
              <p className="text-sm font-black text-slate-800">{stats.passed_count + stats.promoted_count} Students</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Failed Room</p>
              <p className="text-sm font-black text-slate-800">{stats.failed_count} Students</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Class Average</p>
              <p className="text-sm font-black text-slate-800">{stats.avg_percentage}%</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Award className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase truncate">Class Topper</p>
              <p className="text-xs font-black text-slate-850 truncate">{stats.topper.name}</p>
              <p className="text-[8px] text-slate-400 font-bold">{stats.topper.percentage.toFixed(1)}% ({stats.topper.grade})</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Center shortcuts */}
      {isReports && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wider text-slate-500">Downloadable System Registers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-650">
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-between transition shadow-sm">
              <span>Consolidated Marks Ledger</span>
              <span className="text-indigo-600 font-bold text-[10px]">Download XLSX</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-between transition shadow-sm">
              <span>Subject-wise Grade Distribution</span>
              <span className="text-indigo-600 font-bold text-[10px]">Download XLSX</span>
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleExport(); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-between transition shadow-sm">
              <span>Student Pass/Fail Summary</span>
              <span className="text-indigo-600 font-bold text-[10px]">Download XLSX</span>
            </a>
          </div>
        </div>
      )}

      {/* Top 3 Podium Visual (Only in Rank & Merit Mode) */}
      {isRank && ranks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-650" />
            Class Standing Podium — Top Performers
          </h3>
          <div className="flex items-end justify-center gap-6 md:gap-12 pt-6 max-w-lg mx-auto">
            {/* 2nd Place */}
            {ranks[1] && (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                  {ranks[1].student_name.charAt(0)}
                </div>
                <div className="text-center mt-2 max-w-[80px] md:max-w-[120px] truncate">
                  <p className="text-[10px] font-bold text-slate-700 truncate">{ranks[1].student_name}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{ranks[1].percentage.toFixed(1)}%</p>
                </div>
                <div className="w-16 md:w-20 bg-gradient-to-t from-slate-200 to-slate-100 border-t-4 border-slate-400 h-24 rounded-t-lg flex items-center justify-center font-black text-slate-500 text-xs shadow-md mt-2">
                  2nd
                </div>
              </div>
            )}

            {/* 1st Place */}
            {ranks[0] && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                    👑
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-800 text-sm shadow-md">
                    {ranks[0].student_name.charAt(0)}
                  </div>
                </div>
                <div className="text-center mt-2 max-w-[80px] md:max-w-[120px] truncate">
                  <p className="text-[10px] font-bold text-slate-800 truncate">{ranks[0].student_name}</p>
                  <p className="text-[9px] text-amber-600 font-black">{ranks[0].percentage.toFixed(1)}%</p>
                </div>
                <div className="w-16 md:w-20 bg-gradient-to-t from-amber-200 to-amber-50 border-t-4 border-amber-400 h-32 rounded-t-lg flex items-center justify-center font-black text-amber-700 text-sm shadow-md mt-2">
                  1st
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {ranks[2] && (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-750 text-xs shadow-sm">
                  {ranks[2].student_name.charAt(0)}
                </div>
                <div className="text-center mt-2 max-w-[80px] md:max-w-[120px] truncate">
                  <p className="text-[10px] font-bold text-slate-700 truncate">{ranks[2].student_name}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{ranks[2].percentage.toFixed(1)}%</p>
                </div>
                <div className="w-16 md:w-20 bg-gradient-to-t from-amber-100/30 to-amber-50/10 border-t-4 border-amber-300 h-16 rounded-t-lg flex items-center justify-center font-black text-amber-650 text-[10px] shadow-md mt-2">
                  3rd
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selectors and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              {academicYears.map(ay => <option key={ay.value} value={ay.value}>{ay.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class / Grade Room</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              <option value="">Select Class</option>
              {classes.map(cls => <option key={cls.value} value={cls.value}>{cls.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Examination Target</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-semibold text-slate-700"
            >
              <option value="">Select Exam</option>
              {examinations.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={ranks.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-xs shadow-sm transition disabled:opacity-55"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subject Stats Analysis block for Performance Screen */}
      {isPerformance && stats && stats.subjects && stats.subjects.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            Subject Performance Indexes Breakdown
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9px]">
                  <th className="py-2 px-4">Subject</th>
                  <th className="py-2 px-4 text-center">Avg Marks</th>
                  <th className="py-2 px-4 text-center">Max Marks</th>
                  <th className="py-2 px-4 text-center">Highest Marks</th>
                  <th className="py-2 px-4 text-center">Lowest Marks</th>
                  <th className="py-2 px-4 text-center">Subject Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {stats.subjects.map(s => (
                  <tr key={s.subject_id} className="hover:bg-slate-50/20">
                    <td className="py-2 px-4 font-bold text-slate-800">
                      {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.code})</span>
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-slate-700">{s.avg_score}</td>
                    <td className="py-2 px-4 text-center text-slate-500">{s.max_marks}</td>
                    <td className="py-2 px-4 text-center font-bold text-emerald-600">{s.highest}</td>
                    <td className="py-2 px-4 text-center font-bold text-rose-500">{s.lowest}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${s.pass_rate >= 80 ? 'bg-emerald-50 text-emerald-700' : s.pass_rate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {s.pass_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ranks list table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Rank standings sheet logs</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Summary registers of student position standings ranked in selected class.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-250 rounded-lg px-2.5 py-0.5 h-7">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-[10px] outline-none border-none bg-transparent w-40 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading merit stands lists...</p>
          </div>
        ) : filteredRanks.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/20 border border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No merit logs registered.</p>
            <p className="text-[10px] text-slate-300 mt-1">Select class criteria to load performance standings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9.5px]">
                  <th className="py-2.5 px-3 text-center w-12">Rank</th>
                  <th className="py-2.5 px-3">Adm No</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 text-right">Marks Obtained</th>
                  <th className="py-2.5 px-3 text-right">Percentage</th>
                  <th className="py-2.5 px-3 text-center">GPA</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {filteredRanks.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block font-extrabold text-[11px] rounded-full w-5 h-5 flex items-center justify-center
                        ${item.class_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm' :
                          item.class_rank === 2 ? 'bg-slate-150 text-slate-800 border border-slate-250' :
                          item.class_rank === 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {item.class_rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{item.admission_no}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{item.roll_no}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-850">{item.student_name}</td>
                    <td className="py-2.5 px-3 text-right font-black">
                      {item.total_obtained} <span className="text-[10px] text-slate-400 font-normal">/ {item.total_max}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-black ${item.percentage >= 33 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 bg-indigo-50/10">{item.gpa.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black font-mono text-[9px]">{item.grade}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border
                        ${item.status === 'Passed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                          : item.status === 'Promoted' ? 'bg-amber-50 text-amber-700 border-amber-250' : 'bg-rose-50 text-rose-700 border-rose-250'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
