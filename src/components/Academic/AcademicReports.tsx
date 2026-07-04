import React from 'react';
import { 
  BarChart2, Layers, BookOpen, Users, Clock, CheckCircle, 
  TrendingUp, Award, Activity, AlertCircle, FileText, CheckSquare
} from 'lucide-react';

interface ProgressRow {
  className: string;
  subjectName: string;
  teacherName: string;
  totalChapters: number;
  completedChapters: number;
  percent: number;
}

const SYLLABUS_PROGRESS: ProgressRow[] = [
  { className: 'Class 10', subjectName: 'Mathematics', teacherName: 'Mr. Rajesh Sharma', totalChapters: 12, completedChapters: 8, percent: 67 },
  { className: 'Class 10', subjectName: 'Physics', teacherName: 'Dr. Sunita Verma', totalChapters: 8, completedChapters: 6, percent: 75 },
  { className: 'Class 9', subjectName: 'English Literature', teacherName: 'Mrs. Emily D\'souza', totalChapters: 15, completedChapters: 12, percent: 80 },
  { className: 'Class 8', subjectName: 'General Science', teacherName: 'Mr. Amit Patel', totalChapters: 10, completedChapters: 3, percent: 30 },
  { className: 'Class 11', subjectName: 'Chemistry', teacherName: 'Dr. Sunita Verma', totalChapters: 14, completedChapters: 4, percent: 29 }
];

const STATS = [
  { title: 'Active Classes', value: '18', desc: 'LKG to Class 12', icon: <Layers className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50/70 border-blue-100' },
  { title: 'Total Subjects', value: '42', desc: 'Core & Electives', icon: <BookOpen className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50/70 border-indigo-100' },
  { title: 'Allocations Active', value: '38', desc: 'Teacher-subject maps', icon: <Users className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50/70 border-emerald-100' },
  { title: 'Pending Review Plans', value: '9', desc: 'Needs approval', icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50/70 border-amber-100' }
];

export default function AcademicReports() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Analytics & Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor school-wide syllabus coverage ratios, teacher allocation indexes, and homework submission summaries.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((s, idx) => (
          <div key={idx} className={`p-5 rounded-xl border bg-white shadow-sm flex items-center justify-between`}>
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

      {/* Chart & Syllabus coverage list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Syllabus Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Curriculum & Syllabus Coverage</h3>
            <p className="text-xs text-slate-400 mt-0.5">Estimated completion percentages based on evaluated syllabus chapters.</p>
          </div>

          <div className="space-y-4">
            {SYLLABUS_PROGRESS.map((row, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{row.className} — {row.subjectName}</span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">by {row.teacherName}</span>
                  </div>
                  
                  <span className="text-slate-700">{row.completedChapters} of {row.totalChapters} chapters ({row.percent}%)</span>
                </div>
                
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      row.percent >= 75 ? 'bg-green-500' :
                      row.percent >= 50 ? 'bg-blue-500' :
                      row.percent >= 30 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning metrics breakdown */}
        <div className="space-y-6">
          {/* Homework Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              <span>Homework Compliance</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Daily Submission Rate</span>
                <span className="font-bold text-slate-800">84% Average</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Late/Delayed Hand-ins</span>
                <span className="font-bold text-slate-800 text-rose-500">6% Rate</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Evaluated logs checklist</span>
                <span className="font-bold text-slate-800 text-green-600">92% Marked</span>
              </div>
            </div>
          </div>

          {/* Assignments metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Grades Distribution (Projects)</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 font-bold block text-sm">45%</span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">High (A/B)</span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-bold block text-sm">42%</span>
                <span className="text-[9px] text-blue-600 font-bold uppercase mt-0.5">Average (C)</span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                <span className="text-rose-700 font-bold block text-sm">13%</span>
                <span className="text-[9px] text-rose-600 font-bold uppercase mt-0.5">Low (D/F)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
