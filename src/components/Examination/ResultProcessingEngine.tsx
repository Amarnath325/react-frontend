import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Award, Play, Search, Settings, RefreshCw, X,
  CheckSquare, Loader2, BookOpen, Download, Eye,
  TrendingUp, AlertTriangle, CheckCircle, Lock, Unlock,
  BarChart2
} from 'lucide-react';

interface ProcessedResult {
  id: number;
  student_id: number;
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
  is_published: boolean;
  class_rank: number;
  subjects_passed: number;
  subjects_failed: number;
  processed_at: string;
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
  is_published: boolean;
  topper: {
    name: string;
    percentage: number;
    grade: string;
  };
  subjects: SubjectStat[];
}

interface StudentDetailMark {
  id: number;
  exam_name: string;
  subject_name: string;
  subject_code: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  status: string;
  remarks: string | null;
}

interface StudentDetailData {
  student: {
    id: number;
    name: string;
    admission_no: string;
    roll_no: string;
    class: string;
  };
  marks: StudentDetailMark[];
}

interface DropdownOption {
  value: string;
  label: string;
}

export default function ResultProcessingEngine() {
  const [academicYears, setAcademicYears] = useState<DropdownOption[]>([]);
  const [classes, setClasses] = useState<DropdownOption[]>([]);
  const [examinations, setExaminations] = useState<DropdownOption[]>([]);

  // Selected filters for result processing workspace
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // Stats for the processed exam
  const [stats, setStats] = useState<ResultStats | null>(null);

  // Merit List
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [resultStatusFilter, setResultStatusFilter] = useState('');

  // Processing logs terminal
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Student Report Card Modal
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailData | null>(null);

  // Subject Stats panel
  const [showSubjectStats, setShowSubjectStats] = useState(true);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch masters list
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
      toast.error('Failed to load dropdown assets');
    }
  }, []);

  // Fetch stats and lists for class results
  const fetchProcessedData = useCallback(async () => {
    if (!selectedExam || !selectedClass) return;
    setLoadingResults(true);
    try {
      const [resultsRes, statsRes] = await Promise.all([
        api.get('/student-exams/results', {
          params: {
            academic_year_id: selectedYear || undefined,
            exam_id: selectedExam,
            class_id: selectedClass,
            status: resultStatusFilter || undefined
          }
        }),
        api.get('/student-exams/results/stats', {
          params: {
            exam_id: selectedExam,
            class_id: selectedClass
          }
        })
      ]);

      if (resultsRes.data.success) {
        setResults(resultsRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch {
      toast.error('No result data generated for this exam yet');
      setResults([]);
      setStats(null);
    } finally {
      setLoadingResults(false);
    }
  }, [selectedYear, selectedExam, selectedClass, resultStatusFilter]);

  // Load student detail for report card drawer
  const fetchStudentDetail = useCallback(async (studentId: number) => {
    setSelectedStudentId(studentId);
    try {
      const res = await api.get(`/student-exams/students/${studentId}/result`);
      if (res.data.success) {
        setStudentDetail(res.data.data);
      }
    } catch {
      toast.error('Failed to retrieve student marks details');
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchProcessedData();
  }, [fetchProcessedData]);

  // Trigger result compilation
  const handleTriggerProcessing = async () => {
    if (!selectedExam || !selectedClass) {
      toast.error('Select target exam and class workspace');
      return;
    }

    setIsProcessing(true);
    setShowLogs(true);
    setProcessingLogs([`Initializing compilation engine for Class ${classes.find(c => c.value === selectedClass)?.label || ''}...`]);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Fetching registered student rolls...']);
    }, 400);

    setTimeout(() => {
      setProcessingLogs(prev => [...prev, 'Verifying marks locks and validation boundaries...']);
    }, 800);

    setTimeout(async () => {
      try {
        setProcessingLogs(prev => [...prev, 'Connecting with database compilation engine...']);
        const res = await api.post('/student-exams/results/process', {
          exam_id: selectedExam,
          class_id: selectedClass
        });
        if (res.data.success) {
          setProcessingLogs(prev => [
            ...prev,
            'Computing cumulative percentage and GPA boundaries...',
            'Calculating student ranks based on cumulative marks index...',
            `Success: ${res.data.message}`
          ]);
          toast.success(res.data.message);
          fetchProcessedData();
        }
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Processing engine encountered an error';
        setProcessingLogs(prev => [...prev, `Execution stopped: ${errMsg}`]);
        toast.error(errMsg);
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  // Publish toggle
  const handlePublishToggle = async (publishState: boolean) => {
    if (!selectedExam || !selectedClass) return;
    setIsPublishing(true);
    try {
      const res = await api.post('/student-exams/results/publish', {
        exam_id: selectedExam,
        class_id: selectedClass,
        publish: publishState
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchProcessedData();
      }
    } catch {
      toast.error('Failed to change publish status');
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered lists
  const filteredResults = useMemo(() => {
    if (!resultSearchTerm.trim()) return results;
    const q = resultSearchTerm.toLowerCase();
    return results.filter(r =>
      r.student_name.toLowerCase().includes(q) ||
      r.admission_no.toLowerCase().includes(q) ||
      r.grade.toLowerCase().includes(q)
    );
  }, [results, resultSearchTerm]);

  // CSV Export
  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Rank', 'Admission No', 'Roll No', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage %', 'GPA', 'Grade', 'Status'];
    const csvRows = [headers.join(',')];

    results.forEach(r => {
      const row = [
        r.class_rank,
        `"${r.admission_no}"`,
        `"${r.roll_no}"`,
        `"${r.student_name}"`,
        r.total_obtained,
        r.total_max,
        r.percentage.toFixed(2),
        r.gpa.toFixed(2),
        r.grade,
        r.status
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `merit_list_${selectedClass}_exam_${selectedExam}.csv`);
    a.click();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 animate-pulse" />
            Result Processing Engine
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            ERP compilation desk: execute class GPA averages, generate student ranks, and publish class marks cards.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={() => { fetchMasters(); fetchProcessedData(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Desk
          </button>
        </div>
      </div>

      {/* Target parameters Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Select Workspace Target Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(ay => <option key={ay.value} value={ay.value}>{ay.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class / Grade Room</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
            >
              <option value="">Select Exam</option>
              {examinations.map(ex => <option key={ex.value} value={ex.value}>{ex.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setShowLogs(v => !v)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
          >
            {showLogs ? 'Hide Engine Logs' : 'View Engine Logs'}
          </button>

          <div className="flex gap-2">
            {stats && (
              <button
                onClick={() => handlePublishToggle(!stats.is_published)}
                disabled={isPublishing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border
                  ${stats.is_published
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  }`}
              >
                {stats.is_published ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{stats.is_published ? 'Unpublish Results' : 'Publish to Student Portals'}</span>
              </button>
            )}

            <button
              onClick={handleTriggerProcessing}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-sm transition disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-transparent" />
              )}
              <span>Run Result Processor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Logs View */}
      {showLogs && processingLogs.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[10px] font-mono text-emerald-400 space-y-1 max-h-40 overflow-y-auto shadow-inner relative">
          <button
            onClick={() => setProcessingLogs([])}
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            Clear
          </button>
          <span className="text-slate-400 block font-bold border-b border-slate-800 pb-1 uppercase tracking-wider text-[9px]">Execution Logs Console</span>
          {processingLogs.map((log, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-indigo-400 select-none">&gt;&gt;</span>
              <span className="leading-relaxed">{log}</span>
            </div>
          ))}
        </div>
      )}

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

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Class Pass Rate</p>
              <p className="text-sm font-black text-slate-800">{stats.pass_rate}%</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Award className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase truncate">Class Topper</p>
              <p className="text-xs font-black text-slate-800 truncate" title={stats.topper.name}>{stats.topper.name}</p>
              <p className="text-[8px] text-slate-400 font-bold">{stats.topper.percentage.toFixed(1)}% ({stats.topper.grade})</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Subject analysis */}
      {stats && stats.subjects && stats.subjects.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowSubjectStats(v => !v)}
            className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition"
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              Detailed Subject Performance Analysis
            </span>
            <span>{showSubjectStats ? 'Collapse' : 'Expand'}</span>
          </button>

          {showSubjectStats && (
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
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {stats.subjects.map(s => (
                    <tr key={s.subject_id} className="hover:bg-slate-50/20">
                      <td className="py-2 px-4 font-bold text-slate-800">
                        {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.code})</span>
                      </td>
                      <td className="py-2 px-4 text-center font-bold">{s.avg_score}</td>
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
          )}
        </div>
      )}

      {/* Ranks Merit table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Rank Merit desk lists</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Students list ranked sorted by compiled percentage performance index.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-250 rounded-lg px-2.5 py-0.5 h-7">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={resultSearchTerm}
                onChange={(e) => setResultSearchTerm(e.target.value)}
                className="text-[10px] outline-none border-none bg-transparent w-40 placeholder-slate-400"
              />
            </div>
            <select
              value={resultStatusFilter}
              onChange={(e) => setResultStatusFilter(e.target.value)}
              className="h-7 px-2 border border-slate-250 bg-white rounded-lg text-[10px] font-bold text-slate-600"
            >
              <option value="">All Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Promoted">Promoted</option>
              <option value="Failed">Failed</option>
            </select>
            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="flex items-center gap-1 h-7 px-2.5 border border-slate-350 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-650 rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {loadingResults ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading processed ranks...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/20 rounded-xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No ranks compiled.</p>
            <p className="text-[10px] text-slate-300 mt-1">Make sure you have processed results for selected examination class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[9.5px]">
                  <th className="py-2.5 px-3 text-center w-12">Rank</th>
                  <th className="py-2.5 px-3">Adm No</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 text-right">Cumulative Marks</th>
                  <th className="py-2.5 px-3 text-right">Percentage</th>
                  <th className="py-2.5 px-3 text-center">GPA</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                {filteredResults.map(r => {
                  const statusColors: Record<string, string> = {
                    Passed: 'bg-emerald-50 text-emerald-700 border-emerald-250',
                    Promoted: 'bg-amber-50 text-amber-700 border-amber-250',
                    Failed: 'bg-rose-50 text-rose-700 border-rose-250'
                  };
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block font-extrabold text-[11px] rounded-full w-5 h-5 flex items-center justify-center
                          ${r.class_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm' :
                            r.class_rank === 2 ? 'bg-slate-150 text-slate-800 border border-slate-250' :
                            r.class_rank === 3 ? 'bg-amber-50 text-amber-750' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {r.class_rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{r.admission_no}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{r.roll_no}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{r.student_name}</td>
                      <td className="py-2.5 px-3 text-right font-black">
                        {r.total_obtained} <span className="text-[10px] text-slate-400 font-normal">/ {r.total_max}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-black ${r.percentage >= 33 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.percentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-indigo-600 bg-indigo-50/10">{r.gpa.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black font-mono text-[9px]">{r.grade}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColors[r.status] || 'bg-slate-100'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => fetchStudentDetail(r.student_id)}
                          className="p-1 hover:bg-slate-100 rounded text-indigo-500 hover:text-indigo-700 transition"
                          title="View Marks Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student detail popup card modal */}
      {selectedStudentId && studentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden transform transition-all">
            {/* Header info */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-black">Student Examination Progress Report Card</h3>
                <p className="text-[10px] text-indigo-200">Name: {studentDetail.student.name} · Class: {studentDetail.student.class}</p>
              </div>
              <button
                onClick={() => { setSelectedStudentId(null); setStudentDetail(null); }}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Top details cards */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Admission Number</span>
                  <p className="font-bold text-slate-700 mt-0.5">{studentDetail.student.admission_no}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Roll Number</span>
                  <p className="font-bold text-slate-700 mt-0.5">{studentDetail.student.roll_no || '—'}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Class Room</span>
                  <p className="font-bold text-slate-700 mt-0.5">{studentDetail.student.class}</p>
                </div>
              </div>

              {/* Subject list detailed table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b text-slate-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3 text-right">Obtained Marks</th>
                      <th className="py-2 px-3 text-right">Max Marks</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3">Remarks / Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                    {studentDetail.marks.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/30">
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {m.subject_name} <span className="text-[9px] text-slate-400 font-normal">({m.subject_code})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-750">{m.marks_obtained}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{m.total_marks}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black font-mono text-[9px]">{m.grade}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border
                            ${m.marks_obtained >= (m.total_marks * 0.33)
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {m.marks_obtained >= (m.total_marks * 0.33) ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic max-w-xs truncate">{m.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setSelectedStudentId(null); setStudentDetail(null); }}
                className="px-5 py-1.5 bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
