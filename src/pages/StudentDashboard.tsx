import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, UserX, TrendingUp, IndianRupee, Calendar,
  BookOpen, BarChart3, Clock, ArrowUpRight, ArrowDownRight,
  GraduationCap, AlertCircle, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, Award, Target, Activity, Layers,
} from 'lucide-react';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Summary {
  total_students: number;
  active_students: number;
  male_students: number;
  female_students: number;
  new_this_month: number;
  present_today: number;
  absent_today: number;
  attendance_percent: number;
}

interface Fees {
  collected_this_month: number;
  pending_total: number;
  defaulters: number;
  monthly_trend: { month: string; amount: number }[];
}

interface UpcomingExam {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  days_left: number;
}

interface RecentStudent {
  id: number;
  name: string;
  class: string;
  section: string;
  roll: string;
  admission_no: string;
  enrolled_at: string;
  status: string;
}

interface ClassDist {
  class: string;
  section: string;
  count: number;
}

interface WeeklyAttendance {
  day: string;
  date: string;
  present: number;
  absent: number;
}

interface DashboardData {
  summary: Summary;
  fees: Fees;
  exams: { upcoming: UpcomingExam[] };
  recent_students: RecentStudent[];
  class_distribution: ClassDist[];
  weekly_attendance: WeeklyAttendance[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number): string =>
  n >= 10_00_000
    ? `${(n / 10_00_000).toFixed(1)}L`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : String(n);

const fmtRupee = (n: number) => {
  if (n >= 10_00_000) return `\u20b9${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `\u20b9${(n / 1_000).toFixed(1)}K`;
  return `\u20b9${n.toLocaleString('en-IN')}`;
};

// ─── Donut Chart (inline SVG) ─────────────────────────────────────────────────
const DonutChart: React.FC<{
  value: number;
  total: number;
  color: string;
  label: string;
}> = ({ value, total, color, label }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const R = 36, CX = 44, CY = 44;
  const circ = 2 * Math.PI * R;
  const stroke = (pct / 100) * circ;

  return (
    <div className="sdb-donut">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx={CX} cy={CY} r={R} fill="none"
          stroke={color} strokeWidth="9"
          strokeDasharray={`${stroke} ${circ - stroke}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
        />
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
          {Math.round(pct)}%
        </text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
          {label}
        </text>
      </svg>
    </div>
  );
};

// ─── Attendance Spark (inline SVG) ────────────────────────────────────────────
const AttendanceSpark: React.FC<{ data: WeeklyAttendance[] }> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.present + d.absent), 1);
  return (
    <div className="sdb-spark-wrap">
      {data.map((d, i) => {
        const height = Math.max(6, (d.present / maxVal) * 56);
        const absentH = Math.max(0, (d.absent / maxVal) * 56);
        return (
          <div key={i} className="sdb-spark-col">
            <div className="sdb-spark-bars">
              <div className="sdb-spark-absent" style={{ height: `${absentH}px` }} title={`Absent: ${d.absent}`} />
              <div className="sdb-spark-present" style={{ height: `${height}px` }} title={`Present: ${d.present}`} />
            </div>
            <span className="sdb-spark-label">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string; value: string; sub: string;
  icon: React.ReactNode; color: string; trend: number; invertTrend?: boolean;
}> = ({ label, value, sub, icon, color, trend, invertTrend = false }) => {
  const positive = invertTrend ? trend < 0 : trend > 0;
  return (
    <div className={`sdb-kpi sdb-kpi-${color}`}>
      <div className="sdb-kpi-top">
        <div className="sdb-kpi-icon">{icon}</div>
        <div className={`sdb-kpi-trend ${positive ? 'sdb-trend-up' : 'sdb-trend-down'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
      <div className="sdb-kpi-val">{value}</div>
      <div className="sdb-kpi-label">{label}</div>
      <div className="sdb-kpi-sub">{sub}</div>
    </div>
  );
};

// ─── Gender Stat ──────────────────────────────────────────────────────────────
const GenderStat: React.FC<{ label: string; count: number; total: number; color: string; emoji: string }> =
  ({ label, count, total, color, emoji }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="sdb-gender-card">
        <div className="sdb-gender-emoji">{emoji}</div>
        <div className="sdb-gender-count" style={{ color }}>{count}</div>
        <div className="sdb-gender-label">{label}</div>
        <div className="sdb-gender-bar-wrap">
          <div className="sdb-gender-bar" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="sdb-gender-pct" style={{ color }}>{pct}%</div>
      </div>
    );
  };

// ─── Exam Row ─────────────────────────────────────────────────────────────────
const ExamRow: React.FC<{ exam: UpcomingExam }> = ({ exam }) => {
  const urgency = exam.days_left <= 3 ? 'sdb-exam-urgent' : exam.days_left <= 7 ? 'sdb-exam-soon' : 'sdb-exam-normal';
  return (
    <div className={`sdb-exam-row ${urgency}`}>
      <div className="sdb-exam-cal">
        <div className="sdb-exam-day">{new Date(exam.start_date).getDate()}</div>
        <div className="sdb-exam-mon">{new Date(exam.start_date).toLocaleString('default', { month: 'short' })}</div>
      </div>
      <div className="sdb-exam-info">
        <div className="sdb-exam-name">{exam.name}</div>
        <div className="sdb-exam-date">
          <Clock size={11} />
          {exam.days_left > 0 ? `In ${exam.days_left} days` : exam.days_left === 0 ? 'Today!' : 'Started'}
        </div>
      </div>
      <span className={`sdb-badge ${exam.days_left <= 3 ? 'sdb-badge-red' : 'sdb-badge-blue'}`}>
        {exam.status}
      </span>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="sdb-empty">
    <div className="sdb-empty-icon">{icon}</div>
    <p>{text}</p>
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const DashboardSkeleton: React.FC = () => (
  <div className="sdb-root">
    <div className="sdb-skeleton sdb-skel-header" />
    <div className="sdb-kpi-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="sdb-skeleton sdb-skel-kpi" />
      ))}
    </div>
    <div className="sdb-main-grid">
      <div className="sdb-col-main">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="sdb-skeleton sdb-skel-card" />)}
      </div>
      <div className="sdb-col-side">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="sdb-skeleton sdb-skel-card" />)}
      </div>
    </div>
    <style>{styles}</style>
  </div>
);

// ─── Mock Data ────────────────────────────────────────────────────────────────
const getMockData = (): DashboardData => ({
  summary: {
    total_students: 1248, active_students: 1201,
    male_students: 672, female_students: 576,
    new_this_month: 34,
    present_today: 1085, absent_today: 163, attendance_percent: 86.9,
  },
  fees: {
    collected_this_month: 485000, pending_total: 127500, defaulters: 48,
    monthly_trend: [
      { month: 'Jan 2025', amount: 320000 }, { month: 'Feb 2025', amount: 410000 },
      { month: 'Mar 2025', amount: 395000 }, { month: 'Apr 2025', amount: 520000 },
      { month: 'May 2025', amount: 460000 }, { month: 'Jun 2025', amount: 485000 },
    ],
  },
  exams: {
    upcoming: [
      { id: 1, name: 'Half Yearly Exam', start_date: new Date(Date.now() + 4 * 86400000).toISOString(), end_date: '', status: 'scheduled', days_left: 4 },
      { id: 2, name: 'Unit Test 3', start_date: new Date(Date.now() + 12 * 86400000).toISOString(), end_date: '', status: 'scheduled', days_left: 12 },
      { id: 3, name: 'Math Olympiad', start_date: new Date(Date.now() + 2 * 86400000).toISOString(), end_date: '', status: 'upcoming', days_left: 2 },
    ],
  },
  recent_students: [
    { id: 1, name: 'Aarav Sharma', class: 'Class 10', section: 'A', roll: '1001', admission_no: 'ADM2025001', enrolled_at: '10 Jun 2025', status: 'active' },
    { id: 2, name: 'Priya Patel', class: 'Class 9', section: 'B', roll: '902', admission_no: 'ADM2025002', enrolled_at: '08 Jun 2025', status: 'active' },
    { id: 3, name: 'Rohan Gupta', class: 'Class 11', section: 'A', roll: '1102', admission_no: 'ADM2025003', enrolled_at: '05 Jun 2025', status: 'active' },
    { id: 4, name: 'Sneha Verma', class: 'Class 8', section: 'C', roll: '803', admission_no: 'ADM2025004', enrolled_at: '03 Jun 2025', status: 'active' },
    { id: 5, name: 'Dev Malhotra', class: 'Class 12', section: 'A', roll: '1201', admission_no: 'ADM2025005', enrolled_at: '01 Jun 2025', status: 'active' },
  ],
  class_distribution: [
    { class: 'Class 10', section: 'A', count: 42 }, { class: 'Class 9', section: 'B', count: 38 },
    { class: 'Class 11', section: 'A', count: 35 }, { class: 'Class 8', section: 'C', count: 40 },
    { class: 'Class 12', section: 'A', count: 28 }, { class: 'Class 7', section: 'B', count: 45 },
    { class: 'Class 6', section: 'A', count: 50 }, { class: 'Class 5', section: 'B', count: 48 },
  ],
  weekly_attendance: [
    { day: 'Mon', date: '', present: 1050, absent: 198 },
    { day: 'Tue', date: '', present: 1085, absent: 163 },
    { day: 'Wed', date: '', present: 1020, absent: 228 },
    { day: 'Thu', date: '', present: 1100, absent: 148 },
    { day: 'Fri', date: '', present: 980, absent: 268 },
    { day: 'Sat', date: '', present: 640, absent: 120 },
    { day: 'Sun', date: '', present: 0, absent: 0 },
  ],
});

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student-dashboard');
      if (res.data.success) setData(res.data.data);
      else setError(res.data.message || 'Failed to load data');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Network error — showing sample data');
      setData(getMockData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  const s = data?.summary;
  const fees = data?.fees;
  const maxFee = Math.max(...(fees?.monthly_trend?.map((f) => f.amount) ?? [1]), 1);

  return (
    <div className="sdb-root">
      {/* Header */}
      <div className="sdb-header">
        <div className="sdb-header-left">
          <div className="sdb-title-wrap">
            <GraduationCap size={22} className="sdb-title-icon" />
            <div>
              <h1 className="sdb-h1">Student Dashboard</h1>
              <p className="sdb-sub">
                Overview &amp; analytics &middot;{' '}
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <div className="sdb-header-right">
          {error && (
            <div className="sdb-alert">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <button className="sdb-refresh-btn" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'sdb-spin' : ''} />
            Refresh
          </button>
          <button className="sdb-cta-btn" onClick={() => navigate('/students')}>
            View Students <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sdb-kpi-grid">
        <KpiCard label="Total Students" value={fmt(s?.total_students ?? 0)} sub={`${s?.active_students ?? 0} active`} icon={<Users size={20} />} color="blue" trend={2.4} />
        <KpiCard label="Present Today" value={fmt(s?.present_today ?? 0)} sub={`${s?.attendance_percent ?? 0}% attendance`} icon={<UserCheck size={20} />} color="emerald" trend={+(s?.attendance_percent ?? 0) - 85} />
        <KpiCard label="Absent Today" value={fmt(s?.absent_today ?? 0)} sub={`${Math.round(100 - (s?.attendance_percent ?? 0))}% absent`} icon={<UserX size={20} />} color="rose" trend={s?.absent_today ?? 0} invertTrend />
        <KpiCard label="New This Month" value={fmt(s?.new_this_month ?? 0)} sub="new admissions" icon={<TrendingUp size={20} />} color="violet" trend={12} />
        <KpiCard label="Fee Collected" value={fmtRupee(fees?.collected_this_month ?? 0)} sub="this month" icon={<IndianRupee size={20} />} color="amber" trend={8.3} />
        <KpiCard label="Fee Pending" value={fmtRupee(fees?.pending_total ?? 0)} sub={`${fees?.defaulters ?? 0} defaulters`} icon={<AlertCircle size={20} />} color="orange" trend={fees?.defaulters ?? 0} invertTrend />
      </div>

      {/* Main Grid */}
      <div className="sdb-main-grid">
        {/* Left column */}
        <div className="sdb-col-main">

          {/* Attendance */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><Activity size={16} />Weekly Attendance</div>
              <span className="sdb-badge sdb-badge-blue">Last 7 days</span>
            </div>
            <div className="sdb-attendance-body">
              <div className="sdb-attendance-stats">
                <DonutChart value={s?.present_today ?? 0} total={(s?.present_today ?? 0) + (s?.absent_today ?? 0)} color="#22c55e" label="Present" />
                <div className="sdb-att-legend">
                  <div className="sdb-att-leg-item"><span className="sdb-dot sdb-dot-green" /><div><div className="sdb-leg-val">{s?.present_today ?? 0}</div><div className="sdb-leg-label">Present</div></div></div>
                  <div className="sdb-att-leg-item"><span className="sdb-dot sdb-dot-red" /><div><div className="sdb-leg-val">{s?.absent_today ?? 0}</div><div className="sdb-leg-label">Absent</div></div></div>
                  <div className="sdb-att-leg-item"><span className="sdb-dot sdb-dot-blue" /><div><div className="sdb-leg-val">{s?.total_students ?? 0}</div><div className="sdb-leg-label">Total</div></div></div>
                </div>
              </div>
              <div className="sdb-spark-section">
                <p className="sdb-spark-title">Daily breakdown</p>
                <AttendanceSpark data={data?.weekly_attendance ?? []} />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><Users size={16} />Student Distribution</div>
            </div>
            <div className="sdb-gender-grid">
              <GenderStat label="Male" count={s?.male_students ?? 0} total={s?.total_students ?? 1} color="#3b82f6" emoji="👦" />
              <GenderStat label="Female" count={s?.female_students ?? 0} total={s?.total_students ?? 1} color="#ec4899" emoji="👧" />
              <div className="sdb-gender-card sdb-gender-card-total">
                <div className="sdb-gender-emoji">🎓</div>
                <div className="sdb-gender-count">{s?.total_students ?? 0}</div>
                <div className="sdb-gender-label">Total</div>
              </div>
            </div>
          </div>

          {/* Fee trend */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><BarChart3 size={16} />Fee Collection Trend</div>
              <span className="sdb-badge sdb-badge-green">Last 6 Months</span>
            </div>
            <div className="sdb-fee-chart">
              {fees?.monthly_trend?.map((f, i) => (
                <div key={i} className="sdb-fee-bar-wrap">
                  <div className="sdb-fee-bar-col">
                    <div className="sdb-fee-bar" style={{ height: `${Math.max(8, (f.amount / maxFee) * 100)}px` }} title={`\u20b9${f.amount.toLocaleString('en-IN')}`} />
                  </div>
                  <span className="sdb-fee-month">{f.month.slice(0, 3)}</span>
                  <span className="sdb-fee-val">{fmtRupee(f.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="sdb-col-side">

          {/* Upcoming Exams */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><BookOpen size={16} />Upcoming Exams</div>
              <button className="sdb-link" onClick={() => navigate('/exams')}>View all</button>
            </div>
            <div className="sdb-exam-list">
              {(data?.exams.upcoming.length ?? 0) === 0 && <EmptyState icon={<BookOpen size={28} />} text="No exams scheduled" />}
              {data?.exams.upcoming.map((ex) => <ExamRow key={ex.id} exam={ex} />)}
            </div>
          </div>

          {/* Class strength */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><Layers size={16} />Class Strength</div>
              <span className="sdb-badge sdb-badge-violet">Section wise</span>
            </div>
            <div className="sdb-class-list">
              {(data?.class_distribution.length ?? 0) === 0 && <EmptyState icon={<Layers size={28} />} text="No class data" />}
              {data?.class_distribution.slice(0, 8).map((c, i) => {
                const maxC = Math.max(...(data?.class_distribution.map((x) => x.count) ?? [1]), 1);
                return (
                  <div key={i} className="sdb-class-row">
                    <div className="sdb-class-info">
                      <span className="sdb-class-name">{c.class}</span>
                      <span className="sdb-class-sec">{c.section}</span>
                    </div>
                    <div className="sdb-class-bar-wrap">
                      <div className="sdb-class-bar" style={{ width: `${(c.count / maxC) * 100}%` }} />
                    </div>
                    <span className="sdb-class-count">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sdb-card">
            <div className="sdb-card-head">
              <div className="sdb-card-title"><Target size={16} />Quick Actions</div>
            </div>
            <div className="sdb-quick-grid">
              {[
                { label: 'Add Student', icon: '👨‍🎓', path: '/students/add', color: '#3b82f6' },
                { label: 'Attendance', icon: '✅', path: '/attendance', color: '#22c55e' },
                { label: 'Collect Fee', icon: '💰', path: '/fees/collect', color: '#f59e0b' },
                { label: 'Create Exam', icon: '📝', path: '/exams/create', color: '#8b5cf6' },
                { label: 'Reports', icon: '📊', path: '/reports', color: '#06b6d4' },
                { label: 'Library', icon: '📚', path: '/library', color: '#ec4899' },
              ].map((a) => (
                <button key={a.label} className="sdb-qa-btn" onClick={() => navigate(a.path)}>
                  <span className="sdb-qa-icon" style={{ background: a.color + '20', color: a.color }}>{a.icon}</span>
                  <span className="sdb-qa-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="sdb-card sdb-recent-card">
        <div className="sdb-card-head">
          <div className="sdb-card-title"><Award size={16} />Recently Enrolled Students</div>
          <button className="sdb-link" onClick={() => navigate('/students')}>View All Students →</button>
        </div>
        <div className="sdb-table-wrap">
          <table className="sdb-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Class</th><th>Section</th>
                <th>Roll No</th><th>Admission No</th><th>Enrolled On</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent_students.length ?? 0) === 0 && (
                <tr><td colSpan={8} className="sdb-empty-row">No students found</td></tr>
              )}
              {data?.recent_students.map((st, i) => (
                <tr key={st.id} className="sdb-tr" onClick={() => navigate(`/students/${st.id}`)}>
                  <td className="sdb-td-num">{i + 1}</td>
                  <td className="sdb-td-name">
                    <span className="sdb-avatar">{st.name.charAt(0)}</span>
                    {st.name}
                  </td>
                  <td>{st.class}</td>
                  <td>{st.section}</td>
                  <td>{st.roll}</td>
                  <td>{st.admission_no}</td>
                  <td>{st.enrolled_at}</td>
                  <td>
                    <span className={`sdb-status ${st.status === 'active' ? 'sdb-status-active' : 'sdb-status-inactive'}`}>
                      {st.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {st.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.sdb-root{font-family:'Inter',sans-serif;padding:0 0 32px;min-height:100vh;background:#f8fafc;color:#1e293b;}
.sdb-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e2e8f0;}
.sdb-header-left,.sdb-header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.sdb-title-wrap{display:flex;align-items:center;gap:10px;}
.sdb-title-icon{color:#6366f1;}
.sdb-h1{font-size:18px;font-weight:800;color:#0f172a;margin:0;line-height:1.2;}
.sdb-sub{font-size:11.5px;color:#94a3b8;margin:0;}
.sdb-refresh-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;}
.sdb-refresh-btn:hover{background:#f1f5f9;border-color:#cbd5e1;}
.sdb-cta-btn{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
.sdb-cta-btn:hover{opacity:.9;transform:translateY(-1px);}
.sdb-alert{display:flex;align-items:center;gap:5px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:5px 10px;font-size:11px;color:#92400e;}
.sdb-spin{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.sdb-link{background:none;border:none;color:#6366f1;font-size:12px;font-weight:500;cursor:pointer;}
.sdb-link:hover{text-decoration:underline;}
.sdb-kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;}
@media(max-width:1200px){.sdb-kpi-grid{grid-template-columns:repeat(3,1fr);}}
@media(max-width:768px){.sdb-kpi-grid{grid-template-columns:repeat(2,1fr);}}
.sdb-kpi{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9;transition:box-shadow .2s,transform .2s;cursor:default;}
.sdb-kpi:hover{box-shadow:0 4px 16px rgba(0,0,0,.1);transform:translateY(-2px);}
.sdb-kpi-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
.sdb-kpi-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
.sdb-kpi-blue .sdb-kpi-icon{background:#eff6ff;color:#3b82f6;}
.sdb-kpi-emerald .sdb-kpi-icon{background:#ecfdf5;color:#10b981;}
.sdb-kpi-rose .sdb-kpi-icon{background:#fff1f2;color:#f43f5e;}
.sdb-kpi-violet .sdb-kpi-icon{background:#f5f3ff;color:#8b5cf6;}
.sdb-kpi-amber .sdb-kpi-icon{background:#fffbeb;color:#f59e0b;}
.sdb-kpi-orange .sdb-kpi-icon{background:#fff7ed;color:#f97316;}
.sdb-kpi-trend{font-size:10px;font-weight:600;border-radius:6px;padding:3px 6px;display:flex;align-items:center;gap:2px;}
.sdb-trend-up{background:#dcfce7;color:#16a34a;}
.sdb-trend-down{background:#fee2e2;color:#dc2626;}
.sdb-kpi-val{font-size:20px;font-weight:800;color:#0f172a;line-height:1;margin-bottom:2px;}
.sdb-kpi-label{font-size:11.5px;font-weight:600;color:#64748b;}
.sdb-kpi-sub{font-size:10.5px;color:#94a3b8;margin-top:2px;}
.sdb-main-grid{display:grid;grid-template-columns:1fr 380px;gap:16px;margin-bottom:16px;}
@media(max-width:1100px){.sdb-main-grid{grid-template-columns:1fr;}}
.sdb-col-main,.sdb-col-side{display:flex;flex-direction:column;gap:16px;}
.sdb-card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9;}
.sdb-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.sdb-card-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#334155;}
.sdb-badge{font-size:10px;font-weight:600;border-radius:20px;padding:3px 8px;}
.sdb-badge-blue{background:#eff6ff;color:#3b82f6;}
.sdb-badge-green{background:#ecfdf5;color:#10b981;}
.sdb-badge-violet{background:#f5f3ff;color:#8b5cf6;}
.sdb-badge-red{background:#fee2e2;color:#ef4444;}
.sdb-attendance-body{display:flex;flex-direction:column;gap:16px;}
.sdb-attendance-stats{display:flex;align-items:center;gap:20px;}
.sdb-att-legend{display:flex;flex-direction:column;gap:10px;flex:1;}
.sdb-att-leg-item{display:flex;align-items:center;gap:8px;}
.sdb-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0;}
.sdb-dot-green{background:#22c55e;}
.sdb-dot-red{background:#ef4444;}
.sdb-dot-blue{background:#3b82f6;}
.sdb-leg-val{font-size:16px;font-weight:700;color:#0f172a;line-height:1;}
.sdb-leg-label{font-size:10.5px;color:#94a3b8;}
.sdb-donut{display:flex;align-items:center;justify-content:center;}
.sdb-spark-section{border-top:1px solid #f1f5f9;padding-top:12px;}
.sdb-spark-title{font-size:11px;color:#94a3b8;margin:0 0 8px;font-weight:500;}
.sdb-spark-wrap{display:flex;align-items:flex-end;gap:6px;height:72px;}
.sdb-spark-col{display:flex;flex-direction:column;align-items:center;flex:1;}
.sdb-spark-bars{display:flex;flex-direction:column-reverse;align-items:center;gap:2px;width:100%;}
.sdb-spark-present{width:100%;max-width:28px;background:#22c55e;border-radius:3px 3px 0 0;min-height:4px;}
.sdb-spark-absent{width:100%;max-width:28px;background:#fca5a5;border-radius:3px 3px 0 0;min-height:0;}
.sdb-spark-label{font-size:9px;color:#94a3b8;margin-top:3px;font-weight:500;}
.sdb-gender-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.sdb-gender-card{background:#f8fafc;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid #f1f5f9;display:flex;flex-direction:column;align-items:center;gap:4px;}
.sdb-gender-card-total{border-color:#e0e7ff;background:#f5f3ff;}
.sdb-gender-emoji{font-size:24px;}
.sdb-gender-count{font-size:20px;font-weight:800;color:#0f172a;}
.sdb-gender-label{font-size:10.5px;color:#64748b;font-weight:500;}
.sdb-gender-bar-wrap{width:80%;height:5px;background:#e2e8f0;border-radius:10px;margin:4px 0;overflow:hidden;}
.sdb-gender-bar{height:100%;border-radius:10px;transition:width .6s ease;}
.sdb-gender-pct{font-size:11px;font-weight:600;}
.sdb-fee-chart{display:flex;align-items:flex-end;gap:8px;height:130px;padding-top:10px;}
.sdb-fee-bar-wrap{display:flex;flex-direction:column;align-items:center;flex:1;gap:4px;height:100%;justify-content:flex-end;}
.sdb-fee-bar-col{display:flex;align-items:flex-end;justify-content:center;width:100%;flex:1;}
.sdb-fee-bar{width:26px;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#6366f1,#8b5cf6);transition:height .6s ease;}
.sdb-fee-month{font-size:9px;color:#94a3b8;}
.sdb-fee-val{font-size:8.5px;color:#6366f1;font-weight:600;}
.sdb-exam-list{display:flex;flex-direction:column;gap:8px;}
.sdb-exam-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1px solid #f1f5f9;background:#f8fafc;transition:all .15s;cursor:default;}
.sdb-exam-row:hover{box-shadow:0 2px 8px rgba(0,0,0,.08);transform:translateX(2px);}
.sdb-exam-urgent{border-left:3px solid #ef4444 !important;background:#fff5f5;}
.sdb-exam-soon{border-left:3px solid #f59e0b !important;background:#fffbeb;}
.sdb-exam-normal{border-left:3px solid #3b82f6 !important;}
.sdb-exam-cal{text-align:center;background:#fff;border-radius:8px;padding:6px 8px;min-width:38px;border:1px solid #e2e8f0;}
.sdb-exam-day{font-size:15px;font-weight:800;color:#0f172a;line-height:1;}
.sdb-exam-mon{font-size:8px;font-weight:600;color:#94a3b8;text-transform:uppercase;}
.sdb-exam-info{flex:1;min-width:0;}
.sdb-exam-name{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sdb-exam-date{font-size:10.5px;color:#94a3b8;display:flex;align-items:center;gap:3px;margin-top:2px;}
.sdb-class-list{display:flex;flex-direction:column;gap:8px;}
.sdb-class-row{display:flex;align-items:center;gap:8px;}
.sdb-class-info{min-width:80px;}
.sdb-class-name{font-size:11.5px;font-weight:600;color:#334155;display:block;}
.sdb-class-sec{font-size:10px;color:#94a3b8;}
.sdb-class-bar-wrap{flex:1;height:8px;background:#f1f5f9;border-radius:10px;overflow:hidden;}
.sdb-class-bar{height:100%;border-radius:10px;background:linear-gradient(90deg,#6366f1,#8b5cf6);transition:width .6s ease;}
.sdb-class-count{font-size:11.5px;font-weight:700;color:#6366f1;min-width:28px;text-align:right;}
.sdb-quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.sdb-qa-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:10px;border:1px solid #f1f5f9;background:#f8fafc;cursor:pointer;transition:all .15s;}
.sdb-qa-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08);border-color:#e0e7ff;}
.sdb-qa-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;}
.sdb-qa-label{font-size:10.5px;font-weight:600;color:#334155;text-align:center;}
.sdb-recent-card{padding:18px;}
.sdb-table-wrap{overflow-x:auto;border-radius:10px;border:1px solid #f1f5f9;}
.sdb-table{width:100%;border-collapse:collapse;font-size:12.5px;}
.sdb-table thead tr{background:#f8fafc;}
.sdb-table th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
.sdb-tr{cursor:pointer;transition:background .12s;}
.sdb-tr:hover{background:#f8fafc;}
.sdb-table td{padding:10px 14px;border-bottom:1px solid #f8fafc;color:#334155;}
.sdb-td-num{color:#94a3b8;font-size:11px;}
.sdb-td-name{display:flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap;}
.sdb-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sdb-status{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:600;border-radius:20px;padding:3px 8px;}
.sdb-status-active{background:#dcfce7;color:#16a34a;}
.sdb-status-inactive{background:#fee2e2;color:#dc2626;}
.sdb-empty-row{text-align:center;padding:32px;color:#94a3b8;font-size:13px;}
.sdb-empty{text-align:center;padding:24px 16px;color:#94a3b8;}
.sdb-empty-icon{margin:0 auto 8px;opacity:.4;}
.sdb-empty p{font-size:12.5px;}
.sdb-skeleton{border-radius:14px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200%;animation:shimmer 1.5s infinite;}
@keyframes shimmer{to{background-position:-200% 0;}}
.sdb-skel-header{height:48px;margin-bottom:20px;}
.sdb-skel-kpi{height:110px;}
.sdb-skel-card{height:200px;}
`;

export default StudentDashboard;
