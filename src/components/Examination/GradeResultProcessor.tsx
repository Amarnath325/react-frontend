import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Award, Play, Plus, Search, Trash2, Edit3,
  Settings, RefreshCw, X, AlertCircle,
  CheckSquare, Loader2, BookOpen
} from 'lucide-react';

interface GradeScale {
  id: number;
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  gradePoints: number;
  remarks: string;
}

interface ProcessedResult {
  id: number;
  student_name: string;
  admission_no: string;
  roll_no: string;
  exam_name: string;
  class_name: string;
  total_obtained: number;
  total_max: number;
  percentage: number;
  gpa: number;
  grade: string;
  status: string;
  class_rank: number;
  subjects_passed: number;
  subjects_failed: number;
  processed_at: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

import { useLocation } from 'react-router-dom';

export default function GradeResultProcessor() {
  const location = useLocation();
  const isResultProc = location.pathname.includes('result-processing');

  const [grades, setGrades] = useState<GradeScale[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Dropdown options
  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [examinations, setExaminations] = useState<DropdownOption[]>([]);

  // Selected filters for result processing
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);

  // Processed results
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultStatusFilter, setResultStatusFilter] = useState('');
  const [resultSearchTerm, setResultSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeScale | null>(null);

  // Form State for Grade Range
  const [formData, setFormData] = useState({
    gradeName: '',
    minPercent: 50,
    maxPercent: 60,
    gradePoints: 6.0,
    remarks: ''
  });

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
      toast.error('Failed to load metadata dropdowns');
    }
  }, []);

  // Fetch grades
  const fetchGrades = useCallback(async () => {
    setLoadingGrades(true);
    try {
      const res = await api.get('/student-exams/grade-scales');
      if (res.data.success) {
        setGrades(res.data.data);
      }
    } catch {
      toast.error('Failed to load grade scales');
    } finally {
      setLoadingGrades(false);
    }
  }, []);

  // Fetch processed results
  const fetchResults = useCallback(async () => {
    if (!selectedExam || !selectedClass) return;
    setLoadingResults(true);
    try {
      const res = await api.get('/student-exams/results', {
        params: {
          academic_year_id: selectedYear || undefined,
          exam_id: selectedExam || undefined,
          class_id: selectedClass || undefined,
          status: resultStatusFilter || undefined
        }
      });
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch {
      toast.error('Failed to load processed results');
    } finally {
      setLoadingResults(false);
    }
  }, [selectedYear, selectedExam, selectedClass, resultStatusFilter]);

  useEffect(() => {
    fetchMasters();
    fetchGrades();
  }, [fetchMasters, fetchGrades]);

  useEffect(() => {
    if (isResultProc) {
      fetchResults();
    }
  }, [isResultProc, fetchResults]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      gradeName: '',
      minPercent: 50,
      maxPercent: 60,
      gradePoints: 6.0,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GradeScale) => {
    setEditingItem(item);
    setFormData({
      gradeName: item.gradeName,
      minPercent: item.minPercent,
      maxPercent: item.maxPercent,
      gradePoints: item.gradePoints,
      remarks: item.remarks
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this grade range?')) return;
    try {
      const res = await api.delete(`/student-exams/grade-scales/${id}`);
      if (res.data.success) {
        toast.success('Grade range removed');
        fetchGrades();
      }
    } catch {
      toast.error('Failed to delete grade range');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gradeName.trim()) {
      toast.error('Grade name is required');
      return;
    }

    if (formData.minPercent >= formData.maxPercent) {
      toast.error('Minimum percentage must be less than maximum percentage');
      return;
    }

    try {
      if (editingItem) {
        const res = await api.put(`/student-exams/grade-scales/${editingItem.id}`, formData);
        if (res.data.success) {
          toast.success('Grade range updated successfully');
          fetchGrades();
        }
      } else {
        const res = await api.post('/student-exams/grade-scales', formData);
        if (res.data.success) {
          toast.success('Grade range created successfully');
          fetchGrades();
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save grade range');
    }
  };

  const handleTriggerResultProcessing = async () => {
    if (!selectedExam) {
      toast.error('Please select an examination');
      return;
    }
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    setIsProcessing(true);
    setProcessingLogs([`Initializing compilation engine for Class ${classes.find(c => c.value === selectedClass)?.label || ''}...`]);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Fetching registered student rolls...']);
    }, 500);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Verifying marks locks and validation boundaries...']);
    }, 1000);

    setTimeout(async () => {
      try {
        setProcessingLogs(prev => [...prev, 'Connecting with core database engine...']);
        const res = await api.post('/student-exams/results/process', {
          exam_id: selectedExam,
          class_id: selectedClass
        });
        if (res.data.success) {
          setProcessingLogs(prev => [
            ...prev,
            'Computing cumulative scores and GPAs based on grading scales...',
            'Calculating student ranks in class...',
            `Success: ${res.data.message}`
          ]);
          toast.success(res.data.message);
          fetchResults();
        } else {
          setProcessingLogs(prev => [...prev, `Error: ${res.data.message}`]);
          toast.error(res.data.message);
        }
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Result processing failed';
        setProcessingLogs(prev => [...prev, `Execution stopped: ${errMsg}`]);
        toast.error(errMsg);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!resultSearchTerm.trim()) return results;
    const q = resultSearchTerm.toLowerCase();
    return results.filter(r =>
      r.student_name.toLowerCase().includes(q) ||
      r.admission_no.toLowerCase().includes(q) ||
      r.grade.toLowerCase().includes(q)
    );
  }, [results, resultSearchTerm]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            {isResultProc ? 'Result Processing Engine' : 'Grade Management Desk'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isResultProc
              ? 'Compile cumulative exam percentage, award class ranks, and calculate GPA parameters.'
              : 'Configure letter grading scale parameters, min/max percent constraints, and GPA values.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {!isResultProc ? (
          /* ── Grade Scales Mode ── */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Grading Scales Configuration</h3>
                <p className="text-[10px] text-slate-400">Define percentages to grade code bindings.</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Grade Range</span>
              </button>
            </div>

            {loadingGrades ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading grade scales...</p>
              </div>
            ) : grades.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No custom grade scales found.</p>
                <p className="text-[10px] text-slate-400 mt-1">Default scales will seed automatically on refresh or first request.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Grade Code</th>
                      <th className="py-2.5 px-3 text-center">Min Percent</th>
                      <th className="py-2.5 px-3 text-center">Max Percent</th>
                      <th className="py-2.5 px-3 text-center">GPA Point</th>
                      <th className="py-2.5 px-3">Description / Remarks</th>
                      <th className="py-2.5 px-3 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {grades.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-black">{g.gradeName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{g.minPercent}%</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">{g.maxPercent}%</td>
                        <td className="py-2.5 px-3 text-center font-black text-indigo-600 bg-indigo-50/20">{g.gradePoints.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-500">{g.remarks || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(g)}
                              className="p-1 hover:bg-slate-150 rounded text-slate-400 hover:text-indigo-600 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(g.id)}
                              className="p-1 hover:bg-slate-150 rounded text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ── Result Processing Engine Mode ── */
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Trigger Processing Workspace</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(ay => <option key={ay.value} value={ay.value}>{ay.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class / Grade Room</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cl => <option key={cl.value} value={cl.value}>{cl.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Examination Target</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                  >
                    <option value="">Select Exam</option>
                    {examinations.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={fetchResults}
                  className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-[11px] border border-slate-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Fetch Processed</span>
                </button>
                <button
                  onClick={handleTriggerResultProcessing}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm disabled:opacity-50 text-[11px] transition"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white text-transparent" />
                  )}
                  <span>{isProcessing ? 'Processing Engine...' : 'Run Result Processor'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Console Logs */}
            {processingLogs.length > 0 && (
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[10px] font-mono text-emerald-400 space-y-1.5 max-h-40 overflow-y-auto shadow-inner">
                <span className="text-slate-400 block font-bold border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">Execution Console Logs</span>
                {processingLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start">
                    <span className="text-indigo-400 select-none">&gt;&gt;</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Results Grid View Desk */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Processed Class Merit Lists</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Students ranked by calculated cumulative performance indexes.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-350 rounded-lg px-2 py-0.5 h-7">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={resultSearchTerm}
                      onChange={(e) => setResultSearchTerm(e.target.value)}
                      className="text-[10px] outline-none border-none bg-transparent w-36 placeholder-slate-400"
                    />
                  </div>
                  <select
                    value={resultStatusFilter}
                    onChange={(e) => setResultStatusFilter(e.target.value)}
                    className="h-7 px-2 border border-slate-350 bg-white rounded-lg text-[10px] font-bold text-slate-600"
                  >
                    <option value="">All Statuses</option>
                    <option value="Passed">Passed</option>
                    <option value="Promoted">Promoted</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              {loadingResults ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading processed merit lists...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                  <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No results found for selected workspace.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Select class parameters and click "Run Result Processor" or "Fetch Processed".</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3 text-center w-12">Rank</th>
                        <th className="py-2 px-3">Adm No</th>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3 text-right">Cumulative Score</th>
                        <th className="py-2 px-3 text-right">Percentage</th>
                        <th className="py-2 px-3 text-center">GPA</th>
                        <th className="py-2 px-3 text-center">Grade</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                      {filteredResults.map((r) => {
                        const statusColors: Record<string, string> = {
                          Passed: 'bg-emerald-55 text-emerald-700 border-emerald-200',
                          Promoted: 'bg-amber-55 text-amber-700 border-amber-200',
                          Failed: 'bg-rose-55 text-rose-700 border-rose-200'
                        };
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block font-extrabold text-[11px] rounded-full w-5 h-5 flex items-center justify-center
                                ${r.class_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                  r.class_rank === 2 ? 'bg-slate-200 text-slate-800' :
                                  r.class_rank === 3 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}
                              >
                                {r.class_rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{r.admission_no}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{r.roll_no}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-850">{r.student_name}</td>
                            <td className="py-2.5 px-3 text-right font-black">
                              {r.total_obtained} <span className="text-[10px] text-slate-400 font-normal">/ {r.total_max}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-black ${r.percentage >= 33 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {r.percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{r.gpa.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold font-mono text-[10px]">{r.grade}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColors[r.status] || 'bg-slate-100'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Grade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{editingItem ? 'Edit Grade Scheme' : 'Add Grade Scheme'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Grade Name</label>
                <input
                  type="text"
                  placeholder="e.g. A1 or B+"
                  value={formData.gradeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, gradeName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Min %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.minPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, minPercent: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxPercent: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GPA Point</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.gradePoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradePoints: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Remarks / Criteria</label>
                <input
                  type="text"
                  placeholder="e.g. Excellent progress"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md font-semibold text-xs hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingItem ? 'Save Changes' : 'Add Range'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
