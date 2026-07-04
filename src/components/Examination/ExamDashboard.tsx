import React from 'react';
import { 
  Award, Calendar, Users, FileText, CheckCircle, TrendingUp, 
  Activity, AlertCircle, BarChart2, Star, CheckSquare, Clock
} from 'lucide-react';

const STATS = [
  { title: 'Upcoming Exams', value: '4', desc: 'Starting next week', icon: <Calendar className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50/70 border-blue-100' },
  { title: 'Students Registered', value: '420', desc: 'Across LKG-Class 12', icon: <Users className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50/70 border-indigo-100' },
  { title: 'Marks Evaluated', value: '78%', desc: 'Current term progress', icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50/70 border-emerald-100' },
  { title: 'Failed/Re-exam list', value: '14', desc: 'Eligible for Supplementary', icon: <AlertCircle className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50/70 border-rose-100' }
];

const RECENT_RESULTS = [
  { studentName: 'Neha Sharma', className: 'Class 10', subjectName: 'Mathematics', marks: '98/100', rank: 'Topper', percentage: 98 },
  { studentName: 'Aarav Gupta', className: 'Class 10', subjectName: 'Physics', marks: '95/100', rank: 'Topper', percentage: 95 },
  { studentName: 'Aditya Sen', className: 'Class 10', subjectName: 'Chemistry', marks: '92/100', rank: '#2 Rank', percentage: 92 },
  { studentName: 'Rahul Verma', className: 'Class 9', subjectName: 'English', marks: '88/100', rank: '#5 Rank', percentage: 88 }
];

const UPCOMING_SCHEDULE = [
  { examName: 'Unit Test - II', className: 'Class 10', subject: 'Mathematics', date: '2026-06-28', time: '09:00 AM - 10:30 AM', room: 'Hall A' },
  { examName: 'Unit Test - II', className: 'Class 10', subject: 'Physics', date: '2026-06-29', time: '09:00 AM - 10:30 AM', room: 'Hall B' },
  { examName: 'Mid Term Exam', className: 'Class 12', subject: 'Accountancy', date: '2026-07-02', time: '01:00 PM - 04:00 PM', room: 'Room 403' },
  { examName: 'Mid Term Exam', className: 'Class 11', subject: 'Chemistry', date: '2026-07-03', time: '01:00 PM - 04:00 PM', room: 'Chemistry Lab' }
];

export default function ExamDashboard() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Examinations & Results Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Overview of schedules, invigilators setup, marks evaluation pipelines and topper metrics.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((s, idx) => (
          <div key={idx} className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">{s.title}</span>
              <span className="text-2xl font-black text-slate-900 block">{s.value}</span>
              <span className="text-slate-400 text-[11px] font-medium block">{s.desc}</span>
            </div>
            <div className={`p-3 rounded-lg border ${s.bg}`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Upcoming Examination Calendar</h3>
            <p className="text-xs text-slate-400 mt-0.5">List of verified exam schedules and allocated rooms.</p>
          </div>

          <div className="space-y-3.5">
            {UPCOMING_SCHEDULE.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-655">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                      {item.className}
                    </span>
                    <span className="text-slate-800 font-bold text-sm">{item.subject}</span>
                  </div>
                  <div className="text-slate-400 font-medium">{item.examName}</div>
                </div>

                <div className="flex flex-wrap gap-4 text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-bold">
                    <span>{item.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toppers & Merit */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Class Toppers & Merit Lists</h3>
            <p className="text-xs text-slate-400 mt-0.5">Highest scores and evaluations from recent examinations.</p>
          </div>

          <div className="space-y-4">
            {RECENT_RESULTS.map((row, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/20">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-900">{row.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({row.className})</span>
                  </div>
                  <span className="text-slate-700">{row.marks}</span>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{row.subjectName}</span>
                  <span className="text-emerald-600 font-extrabold">{row.rank}</span>
                </div>
                
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${row.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
