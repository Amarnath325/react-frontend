import { useState, useEffect, useCallback } from 'react';
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
   CHART HELPERS (LIGHT THEME COLORS)
──────────────────────────────────────────────────────────────── */
const BAR_COLORS = ['#2563eb','#3b82f6','#60a5fa','#93c5fd','#1d4ed8','#1e40af','#0284c7','#0ea5e9'];

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

function DonutChart({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const r = 40; const circ = 2 * Math.PI * r;
  let cumOffset = 0;
  const segments = entries.map(([label, val], i) => {
    const dashLen = (val / total) * circ;
    const seg = { label, val, dashLen, cumOffset, color: BAR_COLORS[i % BAR_COLORS.length] };
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
        <text x="50" y="50" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="800" dy=".35em">{total}</text>
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
            <div className="tdb-spark-bar" style={{ height: `${Math.max((t.count / max) * 100, 6)}%` }} title={`${t.month}: ${t.count}`} />
          </div>
          <span className="tdb-spark-label">{t.month.slice(0, 3)}</span>
          <span className="tdb-spark-count">{t.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   STAT CARD (LIGHT THEME)
──────────────────────────────────────────────────────────────── */
interface StatCardProps { icon: string; label: string; value: number | string; sub?: string; accentBg: string; accentText: string; trend?: string }
function StatCard({ icon, label, value, sub, accentBg, accentText, trend }: StatCardProps) {
  return (
    <div className="tdb-stat-card">
      <div className={`tdb-stat-icon ${accentBg} ${accentText}`}>{icon}</div>
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
   CSS - EXACT LIGHT THEME ACCORDING TO OTHER MODULES
──────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .tdb-root { font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; color:#1e293b; padding:24px; }

  /* ── Header ── */
  .tdb-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
  .tdb-header-left h1 { font-size:1.65rem;font-weight:800;color:#0f172a;margin:0; }
  .tdb-header-left p  { color:#64748b;font-size:.82rem;margin:4px 0 0; }
  .tdb-header-actions { display:flex;gap:10px;flex-wrap:wrap; }
  .tdb-btn { padding:9px 18px;border-radius:8px;border:none;cursor:pointer;font-size:.82rem;font-weight:600;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px; }
  .tdb-btn-primary { background:#2563eb;color:#fff;box-shadow:0 1px 2px 0 rgba(0,0,0,.05); }
  .tdb-btn-primary:hover { background:#1d4ed8; }
  .tdb-btn-ghost { background:#fff;color:#334155;border:1px solid #cbd5e1; }
  .tdb-btn-ghost:hover { background:#f1f5f9; }

  /* ── Banner ── */
  .tdb-sample-banner { background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;color:#b45309;font-size:.82rem;font-weight:500; }

  /* ── Stats Grid ── */
  .tdb-stats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:24px; }
  .tdb-stat-card { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:flex;gap:14px;align-items:center;box-shadow:0 1px 3px 0 rgba(0,0,0,.04);transition:all .2s; }
  .tdb-stat-card:hover { box-shadow:0 4px 12px rgba(0,0,0,.06);transform:translateY(-2px); }
  .tdb-stat-icon { font-size:1.4rem;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .bg-blue-100 { background:#eff6ff; } .text-blue-600 { color:#2563eb; }
  .bg-green-100{ background:#f0fdf4; } .text-green-600{ color:#16a34a; }
  .bg-purple-100{ background:#faf5ff; } .text-purple-600{ color:#9333ea; }
  .bg-amber-100{ background:#fffbeb; } .text-amber-600{ color:#d97706; }
  .tdb-stat-value { font-size:1.55rem;font-weight:800;color:#0f172a;line-height:1.1; }
  .tdb-stat-label { font-size:.76rem;color:#64748b;margin-top:4px;font-weight:600; }
  .tdb-stat-sub   { font-size:.68rem;color:#94a3b8;margin-top:2px; }
  .tdb-stat-trend { margin-left:auto;font-size:.68rem;background:#dcfce7;color:#166534;border-radius:20px;padding:3px 8px;font-weight:600; }

  /* ── Layout ── */
  .tdb-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px; }
  .tdb-grid-3 { display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px; }
  @media(max-width:900px){.tdb-grid-2,.tdb-grid-3{grid-template-columns:1fr;}}

  /* ── Panel ── */
  .tdb-panel { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 1px 3px 0 rgba(0,0,0,.04); }
  .tdb-panel-title { font-size:.92rem;font-weight:700;color:#0f172a;margin:0 0 16px;display:flex;align-items:center;justify-content:space-between;gap:8px; }
  .tdb-panel-title-left { display:flex;align-items:center;gap:8px; }

  /* ── Bar Chart ── */
  .tdb-bar-chart { display:flex;flex-direction:column;gap:12px; }
  .tdb-bar-row { display:grid;grid-template-columns:120px 1fr 36px;gap:10px;align-items:center; }
  .tdb-bar-label { font-size:.76rem;color:#475569;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .tdb-bar-track { background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden; }
  .tdb-bar-fill  { height:100%;border-radius:4px;transition:width .7s ease; }
  .tdb-bar-value { font-size:.76rem;color:#64748b;font-weight:600;text-align:right; }

  /* ── Donut ── */
  .tdb-donut-wrap   { display:flex;gap:20px;align-items:center;flex-wrap:wrap; }
  .tdb-donut-svg    { width:120px;height:120px;flex-shrink:0; }
  .tdb-donut-legend { flex:1;display:flex;flex-direction:column;gap:8px;min-width:130px; }
  .tdb-legend-item  { display:flex;align-items:center;gap:8px;font-size:.76rem; }
  .tdb-legend-dot   { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
  .tdb-legend-label { color:#475569;flex:1; }
  .tdb-legend-val   { color:#0f172a;font-weight:700; }

  /* ── Sparkline ── */
  .tdb-sparkline   { display:flex;gap:10px;align-items:flex-end;height:100px;padding-bottom:4px; }
  .tdb-spark-col   { display:flex;flex-direction:column;align-items:center;gap:4px;flex:1; }
  .tdb-spark-bar-wrap{ flex:1;width:100%;display:flex;align-items:flex-end; }
  .tdb-spark-bar   { width:100%;background:#3b82f6;border-radius:4px 4px 0 0;min-height:4px;transition:height .6s ease; }
  .tdb-spark-label { font-size:.68rem;color:#64748b;font-weight:500; }
  .tdb-spark-count { font-size:.7rem;color:#1e40af;font-weight:700; }

  /* ── Timetable ── */
  .tdb-schedule      { display:flex;flex-direction:column;gap:10px; }
  .tdb-schedule-slot { background:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:12px 14px;display:grid;grid-template-columns:85px 1fr;gap:12px;align-items:center;border-left:3px solid #2563eb;transition:background .2s; }
  .tdb-schedule-slot:hover { background:#f1f5f9; }
  .tdb-slot-time    { font-size:.74rem;color:#2563eb;font-weight:700; }
  .tdb-slot-teacher { font-size:.82rem;color:#0f172a;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
  .tdb-slot-badge   { display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:600; }
  .tdb-slot-meta    { font-size:.72rem;color:#64748b;margin-top:4px; }

  /* ── Exams ── */
  .tdb-exam-list { display:flex;flex-direction:column;gap:10px; }
  .tdb-exam-card { background:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-left:3px solid #3b82f6;transition:background .2s; }
  .tdb-exam-card:hover { background:#f1f5f9; }
  .tdb-exam-name  { font-size:.84rem;font-weight:600;color:#0f172a; }
  .tdb-exam-dates { font-size:.72rem;color:#64748b;margin-top:3px; }
  .tdb-exam-badge { border-radius:9999px;padding:3px 12px;font-size:.7rem;font-weight:700;flex-shrink:0; }
  .tdb-badge-soon     { background:#fee2e2;color:#991b1b; }
  .tdb-badge-upcoming { background:#eff6ff;color:#1e40af; }
  .tdb-badge-active   { background:#dcfce7;color:#166534; }

  /* ── Recent Teachers Table ── */
  .tdb-teacher-table { width:100%;border-collapse:collapse; }
  .tdb-teacher-table th { font-size:.72rem;color:#64748b;font-weight:600;text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;white-space:nowrap;text-transform:uppercase;letter-spacing:.03em;background:#f8fafc; }
  .tdb-teacher-table td { font-size:.82rem;color:#334155;padding:12px;border-bottom:1px solid #f1f5f9; }
  .tdb-teacher-table tr:hover td { background:#f8fafc; }
  .tdb-td-name   { display:flex;align-items:center;gap:10px; }
  .tdb-avatar    { width:34px;height:34px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0; }
  .tdb-status-dot{ width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:middle; }

  /* ── Quick Actions ── */
  .tdb-quick-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-bottom:24px; }
  .tdb-qa-card  { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .2s;text-align:center;box-shadow:0 1px 2px 0 rgba(0,0,0,.03); }
  .tdb-qa-card:hover { background:#eff6ff;border-color:#bfdbfe;transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,.05); }
  .tdb-qa-icon  { font-size:1.5rem; }
  .tdb-qa-label { font-size:.76rem;color:#334155;font-weight:600;line-height:1.3; }

  /* ── Tabs ── */
  .tdb-tabs { display:flex;gap:6px;margin-bottom:20px;background:#f1f5f9;border-radius:10px;padding:4px;width:fit-content; }
  .tdb-tab  { padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-size:.8rem;font-weight:600;font-family:inherit;transition:all .2s;color:#64748b;background:transparent; }
  .tdb-tab.active { background:#fff;color:#2563eb;box-shadow:0 1px 2px rgba(0,0,0,.06); }
  .tdb-tab:hover:not(.active){ color:#1e293b; }

  /* ── Allocation ── */
  .tdb-alloc-list { display:flex;flex-direction:column;gap:10px; }
  .tdb-alloc-row  { background:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px; }
  .tdb-alloc-name { font-size:.82rem;color:#0f172a;font-weight:600; }
  .tdb-alloc-cls  { font-size:.74rem;color:#7c3aed;background:#f3e8ff;padding:3px 12px;border-radius:20px;font-weight:600; }

  /* ── Empty / Loading ── */
  .tdb-empty  { text-align:center;padding:40px;color:#64748b;font-size:.85rem; }
  .tdb-loader { display:flex;align-items:center;justify-content:center;min-height:60vh; }
  .tdb-spin   { width:48px;height:48px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:tdb-spin .8s linear infinite; }
  @keyframes tdb-spin{to{transform:rotate(360deg)}}

  /* ── Role chips ── */
  .chip-ct { background:#f3e8ff;color:#6b21a8;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:600; }
  .chip-st { background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:500; }
  .chip-dept{ background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:600; }
`;

/* ────────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<DashboardData>(SAMPLE_DATA);
  const [isSample, setIsSample] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'teachers'>('overview');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dbRes, tListRes] = await Promise.allSettled([
        api.get('/teachers/dashboard'),
        api.get('/school/teachers'),
      ]);

      let backendData: any = null;
      if (dbRes.status === 'fulfilled' && dbRes.value?.data?.success) {
        backendData = dbRes.value.data.data;
      }

      let realTeachers: RecentTeacher[] = [];
      if (tListRes.status === 'fulfilled' && tListRes.value?.data?.success) {
        const rawList = tListRes.value.data.data || [];
        realTeachers = rawList.map((t: any) => ({
          id: t.id,
          name: `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim() || 'Staff Member',
          email: t.user?.email ?? '',
          department: t.department ?? 'General',
          specialization: t.specialization ?? '—',
          experience_years: t.experience_years ?? 0,
          joining_date: t.joining_date ?? '',
          is_class_teacher: t.is_class_teacher ?? false,
          is_active: t.is_active ?? true,
          employee_id: t.employee_id ?? `EMP${t.id}`,
        }));
      }

      if (backendData || realTeachers.length > 0) {
        const total    = realTeachers.length || backendData?.stats?.total_teachers || 0;
        const active   = realTeachers.filter(t => t.is_active).length || backendData?.stats?.active_teachers || 0;
        const inactive = realTeachers.filter(t => !t.is_active).length || backendData?.stats?.inactive_teachers || 0;
        const ctCount  = realTeachers.filter(t => t.is_class_teacher).length || backendData?.stats?.class_teachers || 0;

        // Dept distribution from real list
        const deptMap: Record<string, number> = {};
        realTeachers.forEach(t => {
          const d = t.department || 'Other';
          deptMap[d] = (deptMap[d] || 0) + 1;
        });
        const deptDist = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

        setData({
          stats: {
            total_teachers:   total,
            active_teachers:  active,
            inactive_teachers: inactive,
            class_teachers:   ctCount,
            new_joinees:      backendData?.stats?.new_joinees      ?? SAMPLE_DATA.stats.new_joinees,
            marks_this_month: backendData?.stats?.marks_this_month ?? SAMPLE_DATA.stats.marks_this_month,
            pending_marks:    backendData?.stats?.pending_marks    ?? SAMPLE_DATA.stats.pending_marks,
            attendance_today: backendData?.stats?.attendance_today ?? active,
          },
          department_distribution: deptDist.length > 0 ? deptDist : SAMPLE_DATA.department_distribution,
          experience_distribution: backendData?.experience_distribution ?? SAMPLE_DATA.experience_distribution,
          class_teacher_allocations: backendData?.class_teacher_allocations ?? SAMPLE_DATA.class_teacher_allocations,
          today_schedule: backendData?.today_schedule ?? SAMPLE_DATA.today_schedule,
          upcoming_exams: backendData?.upcoming_exams ?? SAMPLE_DATA.upcoming_exams,
          joining_trend:  backendData?.joining_trend  ?? SAMPLE_DATA.joining_trend,
          recent_teachers: realTeachers.length > 0 ? realTeachers.slice(0, 8) : SAMPLE_DATA.recent_teachers,
          subject_coverage: backendData?.subject_coverage ?? SAMPLE_DATA.subject_coverage,
          academic_year: backendData?.academic_year ?? SAMPLE_DATA.academic_year,
          today: new Date().toISOString().split('T')[0],
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        });
        setIsSample(false);
      } else {
        setData(SAMPLE_DATA);
        setIsSample(true);
      }
    } catch {
      setData(SAMPLE_DATA);
      setIsSample(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="tdb-root tdb-loader"><div className="tdb-spin" /></div>
      </>
    );
  }

  const { stats, department_distribution, experience_distribution, class_teacher_allocations,
          today_schedule, upcoming_exams, joining_trend, recent_teachers } = data;

  return (
    <>
      <style>{CSS}</style>
      <div className="tdb-root">

        {/* ── Header ── */}
        <div className="tdb-header">
          <div className="tdb-header-left">
            <h1>👨‍🏫 Teachers & Staff Dashboard</h1>
            <p>Academic year {data.academic_year?.name ?? '2026-27'} · {data.day_of_week}, {data.today}</p>
          </div>
          <div className="tdb-header-actions">
            <button className="tdb-btn tdb-btn-ghost" onClick={fetchDashboard}>🔄 Refresh Data</button>
            <button className="tdb-btn tdb-btn-primary" onClick={() => navigate('/teachers/employee-master/add')}>➕ Add New Staff</button>
          </div>
        </div>

        {/* ── Sample Data Warning Banner ── */}
        {isSample && (
          <div className="tdb-sample-banner">
            <span>⚠️</span>
            <span>Showing sample data preview because backend API is unreachable or returned empty. Add staff records to populate live metrics.</span>
          </div>
        )}

        {/* ── Quick Actions Grid ── */}
        <div className="tdb-quick-grid">
          {[
            { icon:'👨‍💼', label:'Employee Master',   route:'/teachers/employee-master' },
            { icon:'➕',  label:'Add New Staff',     route:'/teachers/employee-master/add' },
            { icon:'👥',  label:'Teaching Staff',    route:'/teachers/teachers-list' },
            { icon:'🛠️', label:'Non-Teaching',      route:'/teachers/non-teaching' },
            { icon:'🏢',  label:'Departments',       route:'/teachers/departments' },
            { icon:'🏷️', label:'Designations',      route:'/teachers/designations' },
            { icon:'🎓',  label:'Qualifications',    route:'/teachers/qualifications' },
            { icon:'📄',  label:'Documents',          route:'/teachers/documents' },
            { icon:'🗂️', label:'Experience',          route:'/teachers/experience' },
            { icon:'🚀',  label:'Joining & Onboarding', route:'/teachers/joining' },
            { icon:'🔄',  label:'Transfers',             route:'/teachers/transfers' },
            { icon:'🚪',  label:'Exit & Resignation',    route:'/teachers/exits' },
            { icon:'🎓',  label:'Class Teacher',          route:'/teachers/class-allocation' },
            { icon:'📚',  label:'Subject Allocation',      route:'/teachers/subject-allocation' },
            { icon:'📅',  label:'Timetable Scheduling',     route:'/teachers/timetable-allocation' },
            { icon:'🕐',  label:'Employee Attendance',       route:'/teachers/employee-attendance' },
            { icon:'📝',  label:'Leave Management',          route:'/teachers/leave-management' },
            { icon:'🔄',  label:'Substitute Allocation',     route:'/teachers/substitute-teacher' },
            { icon:'📈',  label:'Workload Monitor',           route:'/teachers/workload' },
            { icon:'⭐',  label:'Performance Management',     route:'/teachers/performance' },
            { icon:'🎓',  label:'Training & Workshops',        route:'/teachers/training' },
            { icon:'🛡️',  label:'Grievance Desk',              route:'/teachers/grievance' },
            { icon:'🪪',  label:'ID Card Allocation',           route:'/teachers/id-card' },
            { icon:'✉️',  label:'Employee Communication',      route:'/teachers/communication' },
          ].map(qa => (
            <div key={qa.label} className="tdb-qa-card" onClick={() => navigate(qa.route)}>
              <div className="tdb-qa-icon">{qa.icon}</div>
              <div className="tdb-qa-label">{qa.label}</div>
            </div>
          ))}
        </div>

        {/* ── KPI Stat Cards ── */}
        <div className="tdb-stats-grid">
          <StatCard icon="👥" label="Total Staff Members" value={stats.total_teachers} sub={`${stats.active_teachers} active`} accentBg="bg-blue-100" accentText="text-blue-600" />
          <StatCard icon="✅" label="Active Teaching Staff" value={stats.active_teachers} sub={`${stats.inactive_teachers} inactive`} accentBg="bg-green-100" accentText="text-green-600" trend="+2 this month" />
          <StatCard icon="🏫" label="Class Teachers Assigned" value={stats.class_teachers} sub="Assigned to primary classes" accentBg="bg-purple-100" accentText="text-purple-600" />
          <StatCard icon="📅" label="Today's Attendance" value={`${stats.attendance_today} / ${stats.active_teachers}`} sub="Staff present today" accentBg="bg-amber-100" accentText="text-amber-600" />
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="tdb-tabs">
          <button className={`tdb-tab ${activeTab === 'overview'  ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview & Distribution</button>
          <button className={`tdb-tab ${activeTab === 'academics' ? 'active' : ''}`} onClick={() => setActiveTab('academics')}>🗓️ Schedule & Exams</button>
          <button className={`tdb-tab ${activeTab === 'teachers'  ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>👥 Recent Staff Directory</button>
        </div>

        {/* ════════ TAB 1: OVERVIEW ════════ */}
        {activeTab === 'overview' && (
          <>
            <div className="tdb-grid-2">
              {/* Department Distribution */}
              <div className="tdb-panel">
                <div className="tdb-panel-title">
                  <div className="tdb-panel-title-left"><span>🏢</span> Department Distribution</div>
                  <span style={{ fontSize:'.75rem', color:'#64748b' }}>{department_distribution.length} Depts</span>
                </div>
                <MiniBarChart data={department_distribution} labelKey="department" valueKey="count" />
              </div>

              {/* Experience Distribution */}
              <div className="tdb-panel">
                <div className="tdb-panel-title">
                  <div className="tdb-panel-title-left"><span>🎖️</span> Experience Breakdown</div>
                  <span style={{ fontSize:'.75rem', color:'#64748b' }}>By years served</span>
                </div>
                <DonutChart dist={experience_distribution} />
              </div>
            </div>

            <div className="tdb-grid-3">
              {/* Monthly Joining Trend */}
              <div className="tdb-panel">
                <div className="tdb-panel-title">
                  <div className="tdb-panel-title-left"><span>📈</span> Staff Onboarding Trend</div>
                  <span style={{ fontSize:'.75rem', color:'#64748b' }}>Last 6 months</span>
                </div>
                <SparklineBar trend={joining_trend} />
              </div>

              {/* Class Teacher Allocation */}
              <div className="tdb-panel">
                <div className="tdb-panel-title">
                  <div className="tdb-panel-title-left"><span>🏫</span> Class Teacher Allocation</div>
                  <button className="tdb-btn tdb-btn-ghost" style={{ padding:'3px 8px', fontSize:'.7rem' }} onClick={() => navigate('/teachers/employee-master')}>View All</button>
                </div>
                <div className="tdb-alloc-list">
                  {class_teacher_allocations.slice(0, 4).map((item, i) => (
                    <div key={i} className="tdb-alloc-row">
                      <span className="tdb-alloc-name">👤 {item.teacher_name}</span>
                      <span className="tdb-alloc-cls">{item.class_name}-{item.section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════ TAB 2: ACADEMICS & SCHEDULE ════════ */}
        {activeTab === 'academics' && (
          <div className="tdb-grid-2">
            {/* Today's Schedule */}
            <div className="tdb-panel">
              <div className="tdb-panel-title">
                <div className="tdb-panel-title-left"><span>🗓️</span> Today's Teaching Schedule</div>
                <span style={{ fontSize:'.75rem', color:'#64748b' }}>{today_schedule.length} slots today</span>
              </div>
              {today_schedule.length === 0 ? (
                <div className="tdb-empty">No classes scheduled for today.</div>
              ) : (
                <div className="tdb-schedule">
                  {today_schedule.map((slot, i) => (
                    <div key={i} className="tdb-schedule-slot">
                      <div>
                        <div className="tdb-slot-time">{slot.start_time} – {slot.end_time}</div>
                        <div style={{ fontSize:'.68rem', color:'#64748b' }}>Room {slot.room}</div>
                      </div>
                      <div>
                        <div className="tdb-slot-teacher">
                          <span>{slot.teacher_name}</span>
                          <span className="tdb-slot-badge">{slot.subject}</span>
                        </div>
                        <div className="tdb-slot-meta">Assigned Class: {slot.class}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Exams */}
            <div className="tdb-panel">
              <div className="tdb-panel-title">
                <div className="tdb-panel-title-left"><span>📝</span> Upcoming Examination Schedule</div>
                <span style={{ fontSize:'.75rem', color:'#64748b' }}>{upcoming_exams.length} upcoming</span>
              </div>
              {upcoming_exams.length === 0 ? (
                <div className="tdb-empty">No upcoming examinations found.</div>
              ) : (
                <div className="tdb-exam-list">
                  {upcoming_exams.map((exam) => (
                    <div key={exam.id} className="tdb-exam-card">
                      <div>
                        <div className="tdb-exam-name">📋 {exam.name}</div>
                        <div className="tdb-exam-dates">📅 {exam.start_date} to {exam.end_date}</div>
                      </div>
                      <span className={`tdb-exam-badge ${exam.days_left <= 7 ? 'tdb-badge-soon' : 'tdb-badge-upcoming'}`}>
                        {exam.days_left === 0 ? 'Starts Today' : `In ${exam.days_left} days`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ TAB 3: RECENT TEACHERS ════════ */}
        {activeTab === 'teachers' && (
          <div className="tdb-panel">
            <div className="tdb-panel-title">
              <div className="tdb-panel-title-left"><span>👥</span> Recently Onboarded & Active Staff Directory</div>
              <button className="tdb-btn tdb-btn-primary" style={{ padding:'6px 14px', fontSize:'.76rem' }} onClick={() => navigate('/teachers/employee-master')}>
                View Full Employee Master →
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tdb-teacher-table">
                <thead>
                  <tr>
                    <th>Staff Name & Email</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_teachers.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="tdb-td-name">
                          <div className="tdb-avatar">{t.name.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                            <div style={{ fontSize: '.72rem', color: '#64748b' }}>{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{t.employee_id}</td>
                      <td>{t.department ? <span className="chip-dept">{t.department}</span> : '—'}</td>
                      <td style={{ color: '#475569' }}>{t.specialization}</td>
                      <td>{t.experience_years} yrs</td>
                      <td>
                        <span className={t.is_class_teacher ? 'chip-ct' : 'chip-st'}>
                          {t.is_class_teacher ? '🏫 Class Teacher' : '📖 Subject Teacher'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: t.is_active ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '.76rem' }}>
                          <span className="tdb-status-dot" style={{ background: t.is_active ? '#22c55e' : '#ef4444' }} />
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
