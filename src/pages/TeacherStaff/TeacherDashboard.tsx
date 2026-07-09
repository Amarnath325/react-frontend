import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/* ────────────────────────────────────────────────────────────────
   TYPE DEFINITIONS
──────────────────────────────────────────────────────────────── */
interface DashboardStats {
  total_teachers: number;
  active_teachers: number;
  inactive_teachers: number;
  class_teachers: number;
  new_joinees: number;
  marks_this_month: number;
  pending_marks: number;
  attendance_today: number;
}

interface DepartmentItem { department: string; count: number }
interface TimetableSlot  { teacher_name: string; subject: string; class: string; start_time: string; end_time: string; room: string }
interface ExamItem       { id: number; name: string; start_date: string; end_date: string; status: string; days_left: number }
interface JoiningTrend   { month: string; count: number }
interface RecentTeacher  { id: number; name: string; email: string; department: string; specialization: string; experience_years: number; joining_date: string; is_class_teacher: boolean; is_active: boolean; employee_id: string }
interface SubjectCoverage{ subject: string; periods: number }

interface DashboardData {
  stats: DashboardStats;
  department_distribution: DepartmentItem[];
  experience_distribution: Record<string, number>;
  class_teacher_allocations: { teacher_name: string; class_name: string; section: string }[];
  today_schedule: TimetableSlot[];
  upcoming_exams: ExamItem[];
  joining_trend: JoiningTrend[];
  recent_teachers: RecentTeacher[];
  subject_coverage: SubjectCoverage[];
  academic_year: { id: number; name: string } | null;
  today: string;
  day_of_week: string;
}

/* ────────────────────────────────────────────────────────────────
   SAMPLE / FALLBACK DATA
──────────────────────────────────────────────────────────────── */
const SAMPLE_DATA: DashboardData = {
  stats: { total_teachers: 42, active_teachers: 39, inactive_teachers: 3, class_teachers: 18, new_joinees: 2, marks_this_month: 340, pending_marks: 12, attendance_today: 36 },
  department_distribution: [
    { department: 'Mathematics', count: 8 }, { department: 'Science', count: 7 },
    { department: 'English', count: 6 },     { department: 'Social Studies', count: 5 },
    { department: 'Hindi', count: 5 },       { department: 'Physical Education', count: 4 },
    { department: 'Arts', count: 4 },        { department: 'Computer Science', count: 3 },
  ],
  experience_distribution: { '0-2 yrs': 8, '3-5 yrs': 14, '6-10 yrs': 12, '11-20 yrs': 6, '20+ yrs': 2 },
  class_teacher_allocations: [
    { teacher_name: 'Ravi Sharma', class_name: 'Class 10', section: 'A' },
    { teacher_name: 'Priya Nair',  class_name: 'Class 9',  section: 'B' },
    { teacher_name: 'Amit Patel',  class_name: 'Class 8',  section: 'A' },
  ],
  today_schedule: [
    { teacher_name: 'Ravi Sharma', subject: 'Mathematics', class: 'Class 10-A', start_time: '08:00', end_time: '08:45', room: 'R101' },
    { teacher_name: 'Priya Nair',  subject: 'Physics',     class: 'Class 11-A', start_time: '08:45', end_time: '09:30', room: 'R205' },
    { teacher_name: 'Amit Patel',  subject: 'English',     class: 'Class 8-A',  start_time: '09:30', end_time: '10:15', room: 'R102' },
  ],
  upcoming_exams: [
    { id: 1, name: 'Quarterly Test', start_date: '2026-07-15', end_date: '2026-07-20', status: 'active',   days_left: 7 },
    { id: 2, name: 'Half Yearly',    start_date: '2026-08-10', end_date: '2026-08-20', status: 'inactive', days_left: 33 },
  ],
  joining_trend: [
    { month: 'Feb 2026', count: 1 }, { month: 'Mar 2026', count: 3 },
    { month: 'Apr 2026', count: 2 }, { month: 'May 2026', count: 0 },
    { month: 'Jun 2026', count: 4 }, { month: 'Jul 2026', count: 2 },
  ],
  recent_teachers: [
    { id: 1, name: 'Ravi Sharma', email: 'ravi@school.com', department: 'Mathematics', specialization: 'Algebra',    experience_years: 8,  joining_date: '2026-07-01', is_class_teacher: true,  is_active: true, employee_id: 'EMP001' },
    { id: 2, name: 'Priya Nair',  email: 'priya@school.com', department: 'Science',    specialization: 'Physics',    experience_years: 5,  joining_date: '2026-06-15', is_class_teacher: true,  is_active: true, employee_id: 'EMP002' },
    { id: 3, name: 'Amit Patel',  email: 'amit@school.com', department: 'English',     specialization: 'Literature', experience_years: 12, joining_date: '2026-06-01', is_class_teacher: false, is_active: true, employee_id: 'EMP003' },
  ],
  subject_coverage: [
    { subject: 'Mathematics', periods: 40 }, { subject: 'Science', periods: 35 },
    { subject: 'English', periods: 30 },     { subject: 'Hindi', periods: 28 },
    { subject: 'Social Studies', periods: 25 },{ subject: 'Computer Science', periods: 20 },
  ],
  academic_year: { id: 1, name: '2026-27' },
  today: new Date().toISOString().split('T')[0],
  day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
};

/* ────────────────────────────────────────────────────────────────
   CHART HELPERS
──────────────────────────────────────────────────────────────── */
const BAR_COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#7c3aed','#5b21b6','#4338ca'];

function MiniBarChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="tdb-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="tdb-bar-row">
          <span className="tdb-bar-label">{item[labelKey]}</span>
          <div className="tdb-bar-track">
            <div className="tdb-bar-fill" style={{ width: `${(item[valueKey] / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
          </div>
          <span className="tdb-bar-value">{item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

function ExperienceDonut({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const r = 40; const circ = 2 * Math.PI * r;
  let cumOffset = 0;
  const segments = entries.map(([label, val], i) => {
    const dashLen = (val / total) * circ;
    const seg = { label, val, dashLen, cumOffset, color: BAR_COLORS[i] };
    cumOffset += dashLen;
    return seg;
  });
  return (
    <div className="tdb-donut-wrap">
      <svg viewBox="0 0 100 100" className="tdb-donut-svg">
        {segments.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="10"
            strokeDasharray={`${s.dashLen} ${circ}`} strokeDashoffset={-s.cumOffset}
            transform="rotate(-90 50 50)" />
        ))}
        <text x="50" y="50" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="800" dy=".35em">{total}</text>
        <text x="50" y="62" textAnchor="middle" fill="#64748b" fontSize="5.5">Teachers</text>
      </svg>
      <div className="tdb-donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="tdb-legend-item">
            <span className="tdb-legend-dot" style={{ background: s.color }} />
            <span className="tdb-legend-label">{s.label}</span>
            <span className="tdb-legend-val">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklineBar({ trend }: { trend: JoiningTrend[] }) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="tdb-sparkline">
      {trend.map((t, i) => (
        <div key={i} className="tdb-spark-col">
          <div className="tdb-spark-bar-wrap">
            <div className="tdb-spark-bar" style={{ height: `${Math.max((t.count / max) * 100, 5)}%` }} title={`${t.month}: ${t.count}`} />
          </div>
          <span className="tdb-spark-label">{t.month.slice(0, 3)}</span>
          <span className="tdb-spark-count">{t.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   STAT CARD
──────────────────────────────────────────────────────────────── */
interface StatCardProps { icon: string; label: string; value: number | string; sub?: string; accent: string; trend?: string }
function StatCard({ icon, label, value, sub, accent, trend }: StatCardProps) {
  return (
    <div className="tdb-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="tdb-stat-glow" />
      <div className="tdb-stat-icon">{icon}</div>
      <div className="tdb-stat-body">
        <div className="tdb-stat-value">{value}</div>
        <div className="tdb-stat-label">{label}</div>
        {sub && <div className="tdb-stat-sub">{sub}</div>}
      </div>
      {trend && <div className="tdb-stat-trend">{trend}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   CSS
──────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  .tdb-root { font-family:'Inter',sans-serif; background:#0a0b0f; min-height:100vh; color:#e2e8f0; padding:24px; }

  /* ── Header ── */
  .tdb-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px; }
  .tdb-header-left h1 { font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0; }
  .tdb-header-left p  { color:#475569;font-size:.82rem;margin:5px 0 0; }
  .tdb-header-actions { display:flex;gap:8px;flex-wrap:wrap; }
  .tdb-btn { padding:9px 18px;border-radius:10px;border:none;cursor:pointer;font-size:.8rem;font-weight:600;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px; }
  .tdb-btn-primary { background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff; }
  .tdb-btn-primary:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,.4); }
  .tdb-btn-ghost { background:rgba(255,255,255,.06);color:#cbd5e1;border:1px solid rgba(255,255,255,.1); }
  .tdb-btn-ghost:hover { background:rgba(255,255,255,.1); }

  /* ── Banner ── */
  .tdb-sample-banner { background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(251,191,36,.06));border:1px solid rgba(245,158,11,.25);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;color:#fbbf24;font-size:.8rem; }

  /* ── Stats Grid ── */
  .tdb-stats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:14px;margin-bottom:22px; }
  .tdb-stat-card { position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:18px 16px;display:flex;gap:12px;align-items:flex-start;overflow:hidden;transition:transform .2s,box-shadow .25s; }
  .tdb-stat-card:hover { transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.5); }
  .tdb-stat-glow { position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent);border-radius:16px 16px 0 0; }
  .tdb-stat-icon { font-size:1.5rem;width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .tdb-stat-value { font-size:1.6rem;font-weight:800;color:#f1f5f9;line-height:1; }
  .tdb-stat-label { font-size:.73rem;color:#64748b;margin-top:4px;font-weight:500; }
  .tdb-stat-sub   { font-size:.68rem;color:#475569;margin-top:2px; }
  .tdb-stat-trend { margin-left:auto;font-size:.68rem;background:rgba(34,197,94,.12);color:#4ade80;border-radius:20px;padding:3px 8px;height:fit-content;white-space:nowrap; }

  /* ── Layout ── */
  .tdb-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px; }
  .tdb-grid-3 { display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px; }
  @media(max-width:900px){.tdb-grid-2,.tdb-grid-3{grid-template-columns:1fr;}}

  /* ── Panel ── */
  .tdb-panel { background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px; }
  .tdb-panel-title { font-size:.88rem;font-weight:700;color:#e2e8f0;margin:0 0 16px;display:flex;align-items:center;justify-content:space-between;gap:8px; }
  .tdb-panel-title-left { display:flex;align-items:center;gap:8px; }

  /* ── Bar Chart ── */
  .tdb-bar-chart { display:flex;flex-direction:column;gap:10px; }
  .tdb-bar-row { display:grid;grid-template-columns:110px 1fr 32px;gap:8px;align-items:center; }
  .tdb-bar-label { font-size:.7rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .tdb-bar-track { background:rgba(255,255,255,.06);border-radius:4px;height:8px;overflow:hidden; }
  .tdb-bar-fill  { height:100%;border-radius:4px;transition:width .7s ease; }
  .tdb-bar-value { font-size:.7rem;color:#64748b;text-align:right; }

  /* ── Donut ── */
  .tdb-donut-wrap   { display:flex;gap:20px;align-items:center;flex-wrap:wrap; }
  .tdb-donut-svg    { width:120px;height:120px;flex-shrink:0; }
  .tdb-donut-legend { flex:1;display:flex;flex-direction:column;gap:6px;min-width:120px; }
  .tdb-legend-item  { display:flex;align-items:center;gap:6px;font-size:.7rem; }
  .tdb-legend-dot   { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
  .tdb-legend-label { color:#94a3b8;flex:1; }
  .tdb-legend-val   { color:#e2e8f0;font-weight:600; }

  /* ── Sparkline ── */
  .tdb-sparkline   { display:flex;gap:8px;align-items:flex-end;height:90px;padding-bottom:4px; }
  .tdb-spark-col   { display:flex;flex-direction:column;align-items:center;gap:2px;flex:1; }
  .tdb-spark-bar-wrap{ flex:1;width:100%;display:flex;align-items:flex-end; }
  .tdb-spark-bar   { width:100%;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:4px 4px 0 0;min-height:4px;transition:height .6s ease; }
  .tdb-spark-label { font-size:.6rem;color:#475569; }
  .tdb-spark-count { font-size:.6rem;color:#6366f1;font-weight:600; }

  /* ── Timetable ── */
  .tdb-schedule      { display:flex;flex-direction:column;gap:8px; }
  .tdb-schedule-slot { background:rgba(255,255,255,.04);border-radius:10px;padding:11px 14px;display:grid;grid-template-columns:85px 1fr;gap:10px;align-items:center;border-left:3px solid #6366f1;transition:background .2s; }
  .tdb-schedule-slot:hover { background:rgba(255,255,255,.07); }
  .tdb-slot-time    { font-size:.7rem;color:#8b5cf6;font-weight:700; }
  .tdb-slot-teacher { font-size:.78rem;color:#e2e8f0;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
  .tdb-slot-badge   { display:inline-block;background:rgba(139,92,246,.2);color:#a78bfa;border-radius:6px;padding:1px 7px;font-size:.64rem;font-weight:600; }
  .tdb-slot-meta    { font-size:.68rem;color:#475569;margin-top:3px; }

  /* ── Exams ── */
  .tdb-exam-list { display:flex;flex-direction:column;gap:10px; }
  .tdb-exam-card { background:rgba(255,255,255,.04);border-radius:12px;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-left:3px solid;transition:background .2s; }
  .tdb-exam-card:hover { background:rgba(255,255,255,.07); }
  .tdb-exam-name  { font-size:.82rem;font-weight:600;color:#e2e8f0; }
  .tdb-exam-dates { font-size:.68rem;color:#64748b;margin-top:3px; }
  .tdb-exam-badge { border-radius:20px;padding:3px 12px;font-size:.68rem;font-weight:700;flex-shrink:0; }
  .tdb-badge-soon     { background:rgba(239,68,68,.2);color:#f87171; }
  .tdb-badge-upcoming { background:rgba(99,102,241,.2);color:#818cf8; }
  .tdb-badge-active   { background:rgba(34,197,94,.2);color:#4ade80; }

  /* ── Recent Teachers ── */
  .tdb-teacher-table { width:100%;border-collapse:collapse; }
  .tdb-teacher-table th { font-size:.68rem;color:#475569;font-weight:600;text-align:left;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.06);white-space:nowrap; }
  .tdb-teacher-table td { font-size:.74rem;color:#cbd5e1;padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.04); }
  .tdb-teacher-table tr:hover td { background:rgba(255,255,255,.03); }
  .tdb-td-name   { display:flex;align-items:center;gap:8px; }
  .tdb-avatar    { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;color:#fff;flex-shrink:0; }
  .tdb-status-dot{ width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:4px;vertical-align:middle; }

  /* ── Quick Actions ── */
  .tdb-quick-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:10px;margin-bottom:20px; }
  .tdb-qa-card  { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;text-align:center; }
  .tdb-qa-card:hover { background:rgba(99,102,241,.12);border-color:rgba(99,102,241,.35);transform:translateY(-2px); }
  .tdb-qa-icon  { font-size:1.4rem; }
  .tdb-qa-label { font-size:.68rem;color:#94a3b8;font-weight:500;line-height:1.2; }

  /* ── Tabs ── */
  .tdb-tabs { display:flex;gap:3px;margin-bottom:18px;background:rgba(255,255,255,.04);border-radius:12px;padding:4px;width:fit-content; }
  .tdb-tab  { padding:7px 20px;border-radius:9px;border:none;cursor:pointer;font-size:.78rem;font-weight:600;font-family:inherit;transition:all .2s;color:#64748b;background:transparent; }
  .tdb-tab.active { background:rgba(99,102,241,.25);color:#818cf8; }
  .tdb-tab:hover:not(.active){ color:#94a3b8; }

  /* ── Allocation ── */
  .tdb-alloc-list { display:flex;flex-direction:column;gap:8px; }
  .tdb-alloc-row  { background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px; }
  .tdb-alloc-name { font-size:.78rem;color:#e2e8f0;font-weight:600; }
  .tdb-alloc-cls  { font-size:.7rem;color:#a78bfa;background:rgba(139,92,246,.15);padding:2px 10px;border-radius:20px;font-weight:600; }

  /* ── Empty / Loading ── */
  .tdb-empty  { text-align:center;padding:32px;color:#475569;font-size:.8rem; }
  .tdb-loader { display:flex;align-items:center;justify-content:center;min-height:60vh; }
  .tdb-spin   { width:48px;height:48px;border:3px solid rgba(99,102,241,.2);border-top-color:#6366f1;border-radius:50%;animation:tdb-spin .8s linear infinite; }
  @keyframes tdb-spin{to{transform:rotate(360deg)}}

  /* ── Role chips ── */
  .chip-ct { background:rgba(139,92,246,.2);color:#a78bfa;padding:2px 8px;border-radius:6px;font-size:.64rem;font-weight:600; }
  .chip-st { background:rgba(100,116,139,.12);color:#94a3b8;padding:2px 8px;border-radius:6px;font-size:.64rem; }
`;

/* ────────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [usingSample, setUsingSample] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'exams'>('overview');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/teachers/dashboard');
      if (res.data.success) { setData(res.data.data); setUsingSample(false); }
      else throw new Error(res.data.message || 'Failed');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Network error');
      setData(SAMPLE_DATA); setUsingSample(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const QUICK_ACTIONS = [
    { icon: '➕', label: 'Add Teacher',       path: '/teachers/teachers-list' },
    { icon: '📋', label: 'Timetable',          path: '/teachers/timetable-allocation' },
    { icon: '🏫', label: 'Class Allocation',   path: '/teachers/class-allocation' },
    { icon: '📖', label: 'Subject Allocation', path: '/teachers/subject-allocation' },
    { icon: '📅', label: 'Attendance',         path: '/teachers/attendance' },
    { icon: '📈', label: 'Performance',        path: '/teachers/performance' },
    { icon: '🏖️', label: 'Leave Mgmt',        path: '/teachers/leave' },
    { icon: '💰', label: 'Payroll',            path: '/teachers/payroll' },
  ];

  if (loading) return (
    <><style>{CSS}</style><div className="tdb-root"><div className="tdb-loader"><div className="tdb-spin" /></div></div></>
  );

  const d = data!;
  const today = new Date(d.today);

  return (
    <>
      <style>{CSS}</style>
      <div className="tdb-root">

        {/* ── Header ── */}
        <div className="tdb-header">
          <div className="tdb-header-left">
            <h1>👩‍🏫 Teacher & Staff Dashboard</h1>
            <p>
              {d.day_of_week}, {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              &nbsp;·&nbsp; Academic Year: <strong style={{ color: '#8b5cf6' }}>{d.academic_year?.name ?? 'N/A'}</strong>
            </p>
          </div>
          <div className="tdb-header-actions">
            <button className="tdb-btn tdb-btn-ghost" onClick={load}>🔄 Refresh</button>
            <button className="tdb-btn tdb-btn-primary" onClick={() => navigate('/teachers/teachers-list')}>➕ Add Teacher</button>
          </div>
        </div>

        {/* ── Sample Banner ── */}
        {usingSample && (
          <div className="tdb-sample-banner">
            ⚠️ {error ? `API: ${error} — ` : ''}Showing sample data for preview.
          </div>
        )}

        {/* ── Stats ── */}
        <div className="tdb-stats-grid">
          <StatCard icon="👩‍🏫" label="Total Teachers"   value={d.stats.total_teachers}  accent="#6366f1" trend={`+${d.stats.new_joinees} this month`} />
          <StatCard icon="✅"   label="Active Teachers"  value={d.stats.active_teachers} accent="#22c55e" sub={`${d.stats.inactive_teachers} inactive`} />
          <StatCard icon="🏫"   label="Class Teachers"   value={d.stats.class_teachers}  accent="#8b5cf6" sub="Allocated this year" />
          <StatCard icon="🆕"   label="New Joinees"      value={d.stats.new_joinees}     accent="#f59e0b" sub="This month" />
          <StatCard icon="📝"   label="Marks Entered"    value={d.stats.marks_this_month} accent="#0ea5e9" sub="This month" />
          <StatCard icon="⏳"   label="Pending Marks"    value={d.stats.pending_marks}   accent="#ef4444" />
          <StatCard icon="📊"   label="Today's Attendance" value={d.stats.attendance_today} accent="#14b8a6" />
          <StatCard icon="🎯"   label="Active Rate"
            value={`${d.stats.total_teachers > 0 ? Math.round((d.stats.active_teachers / d.stats.total_teachers) * 100) : 0}%`}
            accent="#a855f7" sub="Active vs total" />
        </div>

        {/* ── Quick Actions ── */}
        <div className="tdb-quick-grid">
          {QUICK_ACTIONS.map((qa) => (
            <div key={qa.path} className="tdb-qa-card" onClick={() => navigate(qa.path)} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(qa.path)}>
              <div className="tdb-qa-icon">{qa.icon}</div>
              <div className="tdb-qa-label">{qa.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="tdb-tabs">
          {(['overview', 'schedule', 'exams'] as const).map((tab) => (
            <button key={tab} className={`tdb-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' ? '📊 Overview' : tab === 'schedule' ? "📅 Today's Schedule" : '📝 Exams'}
            </button>
          ))}
        </div>

        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {activeTab === 'overview' && (
          <>
            <div className="tdb-grid-2">
              {/* Department */}
              <div className="tdb-panel">
                <p className="tdb-panel-title"><span className="tdb-panel-title-left">🏢 Department Distribution</span></p>
                <MiniBarChart data={d.department_distribution} labelKey="department" valueKey="count" />
              </div>
              {/* Experience Donut */}
              <div className="tdb-panel">
                <p className="tdb-panel-title"><span className="tdb-panel-title-left">📈 Experience Distribution</span></p>
                <ExperienceDonut dist={d.experience_distribution} />
              </div>
            </div>

            <div className="tdb-grid-3">
              {/* Joining Trend */}
              <div className="tdb-panel">
                <p className="tdb-panel-title"><span className="tdb-panel-title-left">📅 Joining Trend (Last 6 Months)</span></p>
                <SparklineBar trend={d.joining_trend} />
              </div>
              {/* Class Allocations */}
              <div className="tdb-panel">
                <p className="tdb-panel-title"><span className="tdb-panel-title-left">🏫 Class Allocations</span></p>
                {d.class_teacher_allocations.length > 0 ? (
                  <div className="tdb-alloc-list">
                    {d.class_teacher_allocations.map((a, i) => (
                      <div key={i} className="tdb-alloc-row">
                        <span className="tdb-alloc-name">👤 {a.teacher_name}</span>
                        <span className="tdb-alloc-cls">{a.class_name} {a.section}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="tdb-empty">No allocations yet</div>}
              </div>
            </div>

            {/* Subject Coverage */}
            {d.subject_coverage.length > 0 && (
              <div className="tdb-panel" style={{ marginBottom: 16 }}>
                <p className="tdb-panel-title"><span className="tdb-panel-title-left">📚 Subject Period Coverage</span></p>
                <MiniBarChart data={d.subject_coverage} labelKey="subject" valueKey="periods" />
              </div>
            )}

            {/* Recent Teachers */}
            <div className="tdb-panel">
              <p className="tdb-panel-title">
                <span className="tdb-panel-title-left">👥 Recently Joined Teachers</span>
                <button className="tdb-btn tdb-btn-ghost" style={{ fontSize: '.72rem', padding: '4px 12px' }}
                  onClick={() => navigate('/teachers/teachers-list')}>View All →</button>
              </p>
              {d.recent_teachers.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="tdb-teacher-table">
                    <thead>
                      <tr>
                        <th>Teacher</th><th>Emp ID</th><th>Department</th>
                        <th>Specialization</th><th>Experience</th><th>Joining Date</th>
                        <th>Role</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recent_teachers.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div className="tdb-td-name">
                              <div className="tdb-avatar">{t.name.slice(0, 2).toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{t.name}</div>
                                <div style={{ fontSize: '.65rem', color: '#475569' }}>{t.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: '#6366f1', fontWeight: 600 }}>{t.employee_id}</td>
                          <td>{t.department}</td>
                          <td>{t.specialization}</td>
                          <td>{t.experience_years} yrs</td>
                          <td>{t.joining_date ? new Date(t.joining_date).toLocaleDateString('en-IN') : 'N/A'}</td>
                          <td>
                            {t.is_class_teacher
                              ? <span className="chip-ct">Class Teacher</span>
                              : <span className="chip-st">Subject Teacher</span>}
                          </td>
                          <td>
                            <span className="tdb-status-dot" style={{ background: t.is_active ? '#22c55e' : '#ef4444' }} />
                            <span style={{ color: t.is_active ? '#4ade80' : '#f87171' }}>
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="tdb-empty">No teachers added yet</div>}
            </div>
          </>
        )}

        {/* ═══════════════ SCHEDULE ═══════════════ */}
        {activeTab === 'schedule' && (
          <div className="tdb-panel">
            <p className="tdb-panel-title"><span className="tdb-panel-title-left">📅 Today's Schedule — {d.day_of_week}</span></p>
            {d.today_schedule.length > 0 ? (
              <div className="tdb-schedule">
                {d.today_schedule.map((slot, i) => (
                  <div key={i} className="tdb-schedule-slot">
                    <div className="tdb-slot-time">{slot.start_time} – {slot.end_time}</div>
                    <div>
                      <div className="tdb-slot-teacher">
                        👤 {slot.teacher_name} · <span className="tdb-slot-badge">{slot.subject}</span>
                      </div>
                      <div className="tdb-slot-meta">🏫 {slot.class} &nbsp;·&nbsp; 🚪 Room {slot.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tdb-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>😴</div>
                No periods scheduled for {d.day_of_week}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ EXAMS ═══════════════ */}
        {activeTab === 'exams' && (
          <div className="tdb-panel">
            <p className="tdb-panel-title"><span className="tdb-panel-title-left">📝 Upcoming Examinations</span></p>
            {d.upcoming_exams.length > 0 ? (
              <div className="tdb-exam-list">
                {d.upcoming_exams.map((exam) => {
                  const isUrgent = exam.days_left <= 7;
                  return (
                    <div key={exam.id} className="tdb-exam-card"
                      style={{ borderLeftColor: isUrgent ? '#ef4444' : exam.status === 'active' ? '#22c55e' : '#6366f1' }}>
                      <div>
                        <div className="tdb-exam-name">{exam.name}</div>
                        <div className="tdb-exam-dates">
                          📅 {new Date(exam.start_date).toLocaleDateString('en-IN')} — {new Date(exam.end_date).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <span className={`tdb-exam-badge ${isUrgent ? 'tdb-badge-soon' : exam.status === 'active' ? 'tdb-badge-active' : 'tdb-badge-upcoming'}`}>
                        {isUrgent ? `🔥 ${exam.days_left}d left` : `${exam.days_left} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="tdb-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                No upcoming exams scheduled
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
