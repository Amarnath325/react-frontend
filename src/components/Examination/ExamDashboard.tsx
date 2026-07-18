import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, FileText, CheckCircle, TrendingUp, 
  AlertCircle, BarChart2, Star, CheckSquare, RefreshCw, Layout, Layers
} from 'lucide-react';
import api from '../../services/api';

interface Stats {
  total_exams: number;
  active_exams: number;
  upcoming_exams: number;
  total_marks: number;
  passed_marks: number;
  failed_marks: number;
  trashed_marks: number;
  avg_percentage: number;
  pass_rate: number;
}

interface ExamItem {
  id: number;
  name: string;
  className: string;
  subjectName?: string;
  start_date: string;
  end_date: string;
  max_marks: number;
  passing_marks: number;
  is_active: boolean;
}

interface MarkItem {
  id: number;
  studentName: string;
  className: string;
  subjectName: string;
  obtained_marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
}

export default function ExamDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    total_exams: 0,
    active_exams: 0,
    upcoming_exams: 0,
    total_marks: 0,
    passed_marks: 0,
    failed_marks: 0,
    trashed_marks: 0,
    avg_percentage: 0,
    pass_rate: 0
  });

  const [upcomingExams, setUpcomingExams] = useState<ExamItem[]>([]);
  const [recentMarks, setRecentMarks] = useState<MarkItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, examsRes, marksRes] = await Promise.all([
        api.get('/student-exams/stats'),
        api.get('/student-exams/exams', { params: { is_active: 1 } }),
        api.get('/student-exams/marks', { params: { per_page: 5 } })
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (examsRes.data?.success) {
        setUpcomingExams((examsRes.data.data || []).slice(0, 4));
      }
      if (marksRes.data?.success) {
        // Map raw marks into clean structure
        const mapped = (marksRes.data.data || []).map((m: any) => ({
          id: m.id,
          studentName: m.student_name || `Student #${m.student_id}`,
          className: m.class_name || '—',
          subjectName: m.subject_name || '—',
          obtained_marks: m.obtained_marks,
          max_marks: m.max_marks || 100,
          percentage: m.percentage || 0,
          grade: m.grade || '—'
        }));
        setRecentMarks(mapped);
      }
    } catch (err) {
      console.error('Failed to load exam cockpit metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { title: 'Exam Setup & Schedule', desc: 'Configure dates, pass limits, marks weights and terms.', path: '/exams/setup', icon: <Calendar className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-150' },
    { title: 'Subject Mapping', desc: 'Map academic subjects to exams with max/pass scores.', path: '/exams/subjects', icon: <BarChart2 className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-150' },
    { title: 'Room Seating Allocation', desc: 'Assign classrooms, seat layouts and grid capacities.', path: '/exams/seating', icon: <Layers className="w-4 h-4" />, color: 'text-teal-600 bg-teal-50 border-teal-150' },
    { title: 'Admit Cards & Invigilators', desc: 'Manage exam halls duties and print student admit cards.', path: '/exams/invigilators', icon: <Users className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-150' },
    { title: 'Marks Entry Desk', desc: 'Input, import and verify subject marks and verification logs.', path: '/exams/marks', icon: <CheckSquare className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-150' },
    { title: 'Result Processing Engine', desc: 'Compile total scores, pass/fail thresholds and class ranks.', path: '/exams/results', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-150' },
    { title: 'Report Cards & Certificates', desc: 'Generate reports, transfer certificates and logs.', path: '/exams/certificates', icon: <FileText className="w-4 h-4" />, color: 'text-cyan-600 bg-cyan-50 border-cyan-150' },
    { title: 'Performance Analysis & Merit', desc: 'Check consolidated marks register, toppers list and standings.', path: '/exams/reports', icon: <Star className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50 border-violet-150' },
    { title: 'Re-Exam & Supplementary', desc: 'Register fail candidates, schedule improvement tests and clear grades.', path: '/exams/re-exams', icon: <AlertCircle className="w-4 h-4" />, color: 'text-rose-600 bg-rose-50 border-rose-150' },
  ];

  return (
    <div className="p-4 space-y-3 text-xs bg-slate-50/50 min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Layout className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Examinations & Results Cockpit</h1>
            <p className="text-[10px] text-gray-500">Overview of exam schedules, mapping schemes, seating arrangements, marks, and result compilation desks.</p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-medium">Refresh</span>
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-blue-50 border-blue-100 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500 text-white flex-shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Total Exams</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.total_exams}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-amber-50 border-amber-100 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-500 text-white flex-shrink-0">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Evaluated Marks</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.total_marks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-100 min-w-0">
          <div className="p-1.5 rounded-md bg-green-500 text-white flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Passing Rate</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.pass_rate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-rose-50 border-rose-100 min-w-0">
          <div className="p-1.5 rounded-md bg-rose-500 text-white flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">Avg Class Percentage</p>
            <p className="text-lg font-bold text-gray-800 leading-tight">{stats.avg_percentage}%</p>
          </div>
        </div>
      </div>

      {/* ── Quick Navigation Shortcuts ── */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2.5">
        <div>
          <h3 className="font-bold text-gray-900 text-xs">Examination Workspaces</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Quick access shortcuts to configure, record and process academic metrics.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {modules.map((m, idx) => (
            <div 
              key={idx}
              onClick={() => navigate(m.path)}
              className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-150 hover:bg-gray-50/70 hover:border-gray-300 transition cursor-pointer select-none"
            >
              <div className={`p-1.5 rounded-md ${m.color.split(' ')[0]} ${m.color.split(' ')[1]} flex-shrink-0`}>
                {m.icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="text-[11px] font-bold text-gray-800 leading-tight">{m.title}</h4>
                <p className="text-[10px] text-gray-500 leading-snug">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Details Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Upcoming Exam Schedules */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2 space-y-3.5 shadow-sm">
          <div>
            <h3 className="font-bold text-gray-900 text-xs">Active Examination Schedules</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">List of verified upcoming and active examination schedules.</p>
          </div>

          <div className="space-y-2">
            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No active examinations schedules found.</div>
            ) : (
              upcomingExams.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-semibold">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100">
                        {item.className}
                      </span>
                      <span className="text-gray-800 font-bold">{item.name}</span>
                    </div>
                    <div className="text-gray-400 font-medium">Max Marks: {item.max_marks} | Pass: {item.passing_marks}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{item.start_date} to {item.end_date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Marks Evaluation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3.5 shadow-sm">
          <div>
            <h3 className="font-bold text-gray-900 text-xs">Recent Marks Entry Feed</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Recently recorded marks logs from verification registers.</p>
          </div>

          <div className="space-y-2">
            {recentMarks.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No recent marks entry records.</div>
            ) : (
              recentMarks.map((row, idx) => (
                <div key={idx} className="space-y-1 p-2 rounded-lg border border-gray-100 bg-gray-50/20">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-800 truncate max-w-[120px]">{row.studentName}</span>
                      <span className="text-[9px] text-gray-400 font-medium">({row.className})</span>
                    </div>
                    <span className="text-gray-700 font-bold">{row.obtained_marks}/{row.max_marks}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>{row.subjectName}</span>
                    <span className={`font-extrabold ${row.grade === 'F' ? 'text-rose-600' : 'text-emerald-600'}`}>Grade {row.grade}</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${row.percentage >= 33 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                      style={{ width: `${row.percentage}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
