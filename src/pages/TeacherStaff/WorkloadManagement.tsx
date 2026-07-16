import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Monitor, BarChart3, Users, Calendar, Clock, TrendingUp,
  Award, Filter, ChevronLeft, ChevronRight, ArrowLeft,
  BookOpen, Loader2, Inbox, RefreshCw, Sun, Zap, Activity,
  Target, AlertCircle, CheckCircle2, XCircle, Coffee
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Teacher { id: number; name: string; employee_id: string; department: string | null; }
interface AcademicYear { id: number; name: string; is_current: boolean; }

interface WorkloadRow {
  teacher_id: number; employee_id: string; name: string; department: string | null;
  weekly_periods: number; weekly_hours: number; subject_count: number; class_count: number;
  total_scheduled_periods: number; estimated_actual_periods: number;
  working_days: number; present_days: number; absent_days: number;
  half_days: number; leave_days: number; attendance_pct: number;
  late_minutes: number; overtime_minutes: number;
  sub_given: number; sub_received: number; net_extra_periods: number;
}

interface DeptRow {
  department: string; teacher_count: number; total_weekly_periods: number;
  total_weekly_hours: number; avg_period_hours: number; unique_subjects: number;
}

interface HeatmapTeacher {
  teacher_id: number; teacher_name: string; weekly_total: number; weekly_hours: number;
  days: { day: string; periods: number; hours: number }[];
}

interface TeacherDetail {
  teacher: { id: number; name: string; employee_id: string; department: string | null };
  from_date: string; to_date: string; working_days: number; weeks_in_range: number;
  weekly_summary: { total_periods: number; total_hours: number; unique_subjects: number; unique_classes: number };
  day_wise: { day: number; day_name: string; period_count: number; hours: number; slots: any[] }[];
  subject_wise: { subject_id: number; subject_name: string; subject_code: string | null; period_count: number; hours: number; classes: string[] }[];
  attendance: { date: string; status: string; check_in: string | null; check_out: string | null; late_minutes: number; overtime_minutes: number; remarks: string | null }[];
  subs_given: any[];
  subs_received: any[];
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];
  const clr = colors[(name || ' ').charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${clr} flex items-center justify-center font-black shrink-0`}>{initials}</div>;
}

function AttBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : pct >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${color}`}>{pct}%</span>;
}

function MiniBar({ val, max, color = 'bg-violet-500' }: { val: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const HEAT_COLORS = [
  'bg-slate-100 text-slate-400',
  'bg-violet-100 text-violet-600',
  'bg-violet-200 text-violet-700',
  'bg-violet-300 text-violet-800',
  'bg-violet-400 text-white',
  'bg-violet-500 text-white',
  'bg-violet-600 text-white',
  'bg-violet-800 text-white',
];

function heatColor(val: number, max: number): string {
  if (max === 0 || val === 0) return HEAT_COLORS[0];
  const idx = Math.min(HEAT_COLORS.length - 1, Math.ceil((val / max) * (HEAT_COLORS.length - 1)));
  return HEAT_COLORS[idx];
}

const ATT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  present:  { label: 'P',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  absent:   { label: 'A',  color: 'text-rose-700',    bg: 'bg-rose-100'    },
  half_day: { label: 'H',  color: 'text-amber-700',   bg: 'bg-amber-100'   },
  on_leave: { label: 'L',  color: 'text-sky-700',     bg: 'bg-sky-100'     },
  holiday:  { label: 'Ho', color: 'text-slate-500',   bg: 'bg-slate-100'   },
  off:      { label: 'O',  color: 'text-slate-400',   bg: 'bg-slate-50'    },
};

const TABS = [
  { key: 'summary',    label: '📊 Summary'          },
  { key: 'heatmap',   label: '🔥 Weekly Heatmap'    },
  { key: 'department', label: '🏢 By Department'     },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
export default function WorkloadManagement() {
  const [tab, setTab] = useState<TabKey>('summary');

  /* ── Masters ── */
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState(0);

  /* ── Filters ── */
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterDept, setFilterDept] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'weekly_periods' | 'attendance_pct' | 'sub_given'>('weekly_periods');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  /* ── Summary ── */
  const [summary, setSummary] = useState<WorkloadRow[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  /* ── Heatmap ── */
  const [heatmap, setHeatmap] = useState<HeatmapTeacher[]>([]);
  const [loadingHeat, setLoadingHeat] = useState(false);

  /* ── Department ── */
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  /* ── Teacher Detail Drawer ── */
  const [detailTeacherId, setDetailTeacherId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TeacherDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ═══ Load Masters ═══ */
  useEffect(() => {
    api.get('/school/workload/masters').then(res => {
      if (res.data.success) {
        setTeachers(res.data.teachers || []);
        setDepartments(res.data.departments || []);
        setAcademicYears(res.data.academic_years || []);
        const cur = (res.data.academic_years || []).find((y: AcademicYear) => y.is_current);
        if (cur) setSelectedYear(cur.id);
        else if (res.data.academic_years?.length) setSelectedYear(res.data.academic_years[0].id);
      }
    }).catch(() => {});
  }, []);

  /* ═══ Load Summary ═══ */
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params: any = { from_date: fromDate, to_date: toDate };
      if (selectedYear)  params.academic_year_id = selectedYear;
      if (filterDept)    params.department        = filterDept;
      if (filterTeacher) params.teacher_id        = filterTeacher;
      const res = await api.get('/school/workload/summary', { params });
      if (res.data.success) {
        setSummary(res.data.data || []);
        setTotals(res.data.totals || null);
      }
    } catch { toast.error('Failed to load summary'); }
    finally { setLoadingSummary(false); }
  }, [fromDate, toDate, selectedYear, filterDept, filterTeacher]);

  /* ═══ Load Heatmap ═══ */
  const loadHeatmap = useCallback(async () => {
    setLoadingHeat(true);
    try {
      const params: any = {};
      if (selectedYear)  params.academic_year_id = selectedYear;
      if (filterTeacher) params.teacher_id        = filterTeacher;
      const res = await api.get('/school/workload/heatmap', { params });
      if (res.data.success) setHeatmap(res.data.data || []);
    } catch { toast.error('Failed to load heatmap'); }
    finally { setLoadingHeat(false); }
  }, [selectedYear, filterTeacher]);

  /* ═══ Load Departments ═══ */
  const loadDepts = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const params: any = {};
      if (selectedYear) params.academic_year_id = selectedYear;
      const res = await api.get('/school/workload/department', { params });
      if (res.data.success) setDepts(res.data.data || []);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoadingDepts(false); }
  }, [selectedYear]);

  /* ═══ Load Teacher Detail ═══ */
  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setDetailTeacherId(id);
    setDetail(null);
    try {
      const params: any = { from_date: fromDate, to_date: toDate };
      if (selectedYear) params.academic_year_id = selectedYear;
      const res = await api.get(`/school/workload/teacher/${id}`, { params });
      if (res.data.success) setDetail(res.data);
    } catch { toast.error('Failed to load teacher detail'); }
    finally { setLoadingDetail(false); }
  }, [fromDate, toDate, selectedYear]);

  useEffect(() => { if (tab === 'summary')    loadSummary(); },    [tab, loadSummary]);
  useEffect(() => { if (tab === 'heatmap')    loadHeatmap(); },    [tab, loadHeatmap]);
  useEffect(() => { if (tab === 'department') loadDepts();   },    [tab, loadDepts]);

  /* ── Sort Summary ── */
  const sortedSummary = [...summary].sort((a, b) => {
    const va = (a as any)[sortBy] ?? 0;
    const vb = (b as any)[sortBy] ?? 0;
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const maxWeeklyPeriods = Math.max(...summary.map(r => r.weekly_periods), 1);
  const maxHeatPeriods   = Math.max(...heatmap.flatMap(t => t.days.map(d => d.periods)), 1);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Monitor className="w-5 h-5" /></span>
            Workload & Lecture Hours Monitor
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Track scheduled vs actual lecture hours, attendance impact, and substitution load per teacher.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* GLOBAL FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
          {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ⭐' : ''}</option>)}
        </select>
        {(tab === 'summary') && (
          <>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm" />
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Teachers</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </>
        )}
        <button onClick={() => { if (tab === 'summary') loadSummary(); else if (tab === 'heatmap') loadHeatmap(); else loadDepts(); }}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Load
        </button>
      </div>

      {/* ══════════════ TAB: SUMMARY ══════════════ */}
      {tab === 'summary' && (
        <div className="space-y-4">
          {/* Totals row */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { label: 'Teachers',          val: totals.teachers,              suffix: '',       color: 'text-slate-700',   bg: 'bg-slate-50'    },
                { label: 'Avg Weekly Periods',val: totals.avg_weekly_periods,    suffix: ' /wk',  color: 'text-violet-700',  bg: 'bg-violet-50'   },
                { label: 'Total Weekly Hrs',  val: totals.total_weekly_hours,    suffix: 'h',     color: 'text-indigo-700',  bg: 'bg-indigo-50'   },
                { label: 'Avg Attendance',    val: totals.avg_attendance_pct,    suffix: '%',     color: 'text-emerald-700', bg: 'bg-emerald-50'  },
                { label: 'Total Weekly Slots',val: totals.total_weekly_periods,  suffix: '',       color: 'text-sky-700',    bg: 'bg-sky-50'      },
                { label: 'Sub Periods Given', val: totals.total_sub_given,       suffix: '',       color: 'text-amber-700',  bg: 'bg-amber-50'    },
                { label: 'Sub Periods Recv.',  val: totals.total_sub_received,   suffix: '',       color: 'text-rose-700',   bg: 'bg-rose-50'     },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-white shadow-sm`}>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
                  <span className={`text-xl font-black ${s.color}`}>{s.val}{s.suffix}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sort controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sort by:</span>
            {[
              { key: 'weekly_periods', label: 'Periods' },
              { key: 'attendance_pct', label: 'Attendance' },
              { key: 'sub_given',      label: 'Sub Given' },
              { key: 'name',           label: 'Name' },
            ].map(s => (
              <button key={s.key} onClick={() => { if (sortBy === s.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s.key as any); setSortDir('desc'); } }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${sortBy === s.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {s.label} {sortBy === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </button>
            ))}
          </div>

          {/* Teacher cards */}
          {loadingSummary ? (
            <div className="flex items-center justify-center py-16 bg-white border border-slate-200 rounded-xl">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : sortedSummary.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No workload data found for selected filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSummary.map((row, i) => (
                <div key={row.teacher_id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-violet-300 hover:shadow-md transition cursor-pointer group"
                  onClick={() => loadDetail(row.teacher_id)}>
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <Avatar name={row.name} />
                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-slate-800">{row.name}</p>
                        {row.department && <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{row.department}</span>}
                        <span className="font-mono text-[10px] text-slate-400">{row.employee_id}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                        <span>📚 {row.subject_count} subjects</span>
                        <span>🏫 {row.class_count} classes</span>
                        <AttBadge pct={row.attendance_pct} />
                        {row.net_extra_periods > 0 && <span className="text-emerald-600 font-bold">+{row.net_extra_periods} extra sub periods</span>}
                        {row.net_extra_periods < 0 && <span className="text-rose-500 font-bold">{row.net_extra_periods} covered</span>}
                      </div>
                    </div>

                    {/* Metric blocks */}
                    <div className="hidden lg:flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-xl font-black text-violet-700">{row.weekly_periods}</p>
                        <p className="text-[9px] text-slate-400">periods/wk</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-indigo-700">{row.weekly_hours}h</p>
                        <p className="text-[9px] text-slate-400">hours/wk</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-emerald-700">{row.present_days}</p>
                        <p className="text-[9px] text-slate-400">present days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-amber-700">{row.sub_given}</p>
                        <p className="text-[9px] text-slate-400">sub given</p>
                      </div>
                    </div>

                    <span className="text-slate-300 group-hover:text-violet-500 transition text-xs ml-1">→</span>
                  </div>

                  {/* Mini bar — weekly periods */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Weekly Load</span>
                      <span>{row.weekly_periods} periods · {row.weekly_hours}h</span>
                    </div>
                    <MiniBar val={row.weekly_periods} max={maxWeeklyPeriods} color="bg-gradient-to-r from-violet-500 to-indigo-500" />
                    {/* Attendance bar */}
                    <div className="flex gap-1 mt-1">
                      <div className="h-1 bg-emerald-400 rounded-full" style={{ width: `${row.attendance_pct}%` }} title={`Present: ${row.attendance_pct}%`} />
                      <div className="h-1 bg-amber-300 rounded-full" style={{ width: `${row.working_days > 0 ? (row.half_days / row.working_days) * 100 : 0}%` }} title="Half days" />
                      <div className="h-1 bg-rose-300 rounded-full" style={{ width: `${row.working_days > 0 ? (row.absent_days / row.working_days) * 100 : 0}%` }} title="Absent" />
                      <div className="flex-1 h-1 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex gap-3 text-[9px] text-slate-400">
                      <span className="text-emerald-600">● {row.present_days} Present</span>
                      <span className="text-amber-500">● {row.half_days} Half</span>
                      <span className="text-rose-400">● {row.absent_days} Absent</span>
                      <span className="text-sky-400">● {row.leave_days} Leave</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB: HEATMAP ══════════════ */}
      {tab === 'heatmap' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm overflow-x-auto">
            {loadingHeat ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : heatmap.length === 0 ? (
              <div className="text-center py-14">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No heatmap data. Select an academic year and click Load.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-3 text-left text-[10px] font-bold text-slate-500 uppercase w-48">Teacher</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <th key={d} className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase">{d}</th>
                    ))}
                    <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-500 uppercase">Total</th>
                    <th className="py-3 px-3 text-center text-[10px] font-bold text-slate-500 uppercase">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {heatmap.map(t => (
                    <tr key={t.teacher_id} className="hover:bg-slate-50/50 cursor-pointer transition" onClick={() => loadDetail(t.teacher_id)}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={t.teacher_name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{t.teacher_name}</p>
                          </div>
                        </div>
                      </td>
                      {t.days.map(d => (
                        <td key={d.day} className="py-2 px-1 text-center">
                          <div className={`mx-auto w-9 h-9 rounded-xl flex flex-col items-center justify-center ${heatColor(d.periods, maxHeatPeriods)}`}>
                            <span className="text-xs font-black">{d.periods || ''}</span>
                            {d.hours > 0 && <span className="text-[8px] opacity-80">{d.hours}h</span>}
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center">
                        <span className="text-base font-black text-violet-700">{t.weekly_total}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-base font-black text-indigo-700">{t.weekly_hours}h</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Heatmap legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Less</span>
            {HEAT_COLORS.slice(0, 7).map((c, i) => (
              <div key={i} className={`w-5 h-5 rounded-md ${c.split(' ')[0]}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: DEPARTMENT ══════════════ */}
      {tab === 'department' && (
        <div className="space-y-3">
          {loadingDepts ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : depts.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No department data available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {depts.map((dept, i) => {
                const maxP = depts[0]?.total_weekly_periods || 1;
                const pct  = Math.round((dept.total_weekly_periods / maxP) * 100);
                const cols = ['border-violet-200 bg-violet-50', 'border-indigo-200 bg-indigo-50', 'border-sky-200 bg-sky-50', 'border-emerald-200 bg-emerald-50', 'border-amber-200 bg-amber-50', 'border-rose-200 bg-rose-50'];
                const textCols = ['text-violet-700', 'text-indigo-700', 'text-sky-700', 'text-emerald-700', 'text-amber-700', 'text-rose-700'];
                const col = cols[i % cols.length];
                const tc = textCols[i % textCols.length];
                return (
                  <div key={dept.department} className={`border-2 rounded-2xl p-5 shadow-sm ${col}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-sm font-bold ${tc}`}>{dept.department}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{dept.teacher_count} teacher{dept.teacher_count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className={`text-3xl font-black ${tc}`}>{dept.total_weekly_periods}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${tc.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className={`text-base font-black ${tc}`}>{dept.total_weekly_hours}h</p>
                          <p className="text-[8px] text-slate-400 uppercase">Total Hrs</p>
                        </div>
                        <div>
                          <p className={`text-base font-black ${tc}`}>{dept.unique_subjects}</p>
                          <p className="text-[8px] text-slate-400 uppercase">Subjects</p>
                        </div>
                        <div>
                          <p className={`text-base font-black ${tc}`}>{dept.avg_period_hours ? dept.avg_period_hours + 'h' : '—'}</p>
                          <p className="text-[8px] text-slate-400 uppercase">Avg/Period</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TEACHER DETAIL DRAWER ══════════════ */}
      {detailTeacherId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl border-l border-slate-200 flex flex-col">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white sticky top-0 z-10">
              <button onClick={() => { setDetailTeacherId(null); setDetail(null); }}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                {detail ? (
                  <>
                    <h2 className="text-sm font-bold truncate">{detail.teacher.name}</h2>
                    <p className="text-[10px] text-white/70">{detail.teacher.department} · {detail.teacher.employee_id}</p>
                  </>
                ) : (
                  <p className="text-sm font-bold">Loading...</p>
                )}
              </div>
              {detail && (
                <div className="text-right shrink-0">
                  <p className="text-lg font-black">{detail.weekly_summary.total_periods} <span className="text-xs font-normal">periods/wk</span></p>
                  <p className="text-[10px] text-white/70">{detail.weekly_summary.total_hours}h · {detail.weekly_summary.unique_subjects} subjects</p>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : !detail ? null : (
              <div className="p-5 space-y-6 flex-1">

                {/* Key metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Weekly Periods', val: detail.weekly_summary.total_periods, color: 'text-violet-700', bg: 'bg-violet-50' },
                    { label: 'Weekly Hours',   val: `${detail.weekly_summary.total_hours}h`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                    { label: 'Sub Given',      val: detail.subs_given.length,             color: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Sub Received',   val: detail.subs_received.length,           color: 'text-rose-700', bg: 'bg-rose-50' },
                  ].map(m => (
                    <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
                      <p className={`text-2xl font-black ${m.color}`}>{m.val}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Day-wise breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" /> Day-wise Schedule
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {detail.day_wise.filter(d => d.day <= 6).map(d => (
                      <div key={d.day} className={`rounded-xl p-2.5 border text-center ${d.period_count > 0 ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-slate-50'}`}>
                        <p className="text-[10px] font-bold text-slate-500">{d.day_name.slice(0, 3)}</p>
                        <p className={`text-2xl font-black mt-0.5 ${d.period_count > 0 ? 'text-violet-700' : 'text-slate-300'}`}>{d.period_count}</p>
                        <p className="text-[9px] text-slate-400">{d.hours > 0 ? `${d.hours}h` : '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Subject-wise Breakdown
                  </h3>
                  <div className="space-y-1.5">
                    {detail.subject_wise.map(s => (
                      <div key={s.subject_id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{s.subject_name}</p>
                          <p className="text-[10px] text-slate-400">{s.classes.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-black text-indigo-700">{s.period_count}</p>
                            <p className="text-[9px] text-slate-400">periods</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-violet-700">{s.hours}h</p>
                            <p className="text-[9px] text-slate-400">hours</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance calendar */}
                {detail.attendance.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> Attendance Log ({detail.from_date} → {detail.to_date})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.attendance.map(a => {
                        const cfg = ATT_STATUS[a.status] || ATT_STATUS.off;
                        return (
                          <div key={a.date} className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center border ${cfg.bg} border-white shadow-sm`} title={`${a.date}: ${a.status}${a.check_in ? ` | In: ${a.check_in}` : ''}${a.check_out ? ` | Out: ${a.check_out}` : ''}`}>
                            <span className={`text-[8px] font-black ${cfg.color}`}>{new Date(a.date).getDate()}</span>
                            <span className={`text-[7px] font-black ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex gap-3 mt-1.5 text-[9px]">
                      {Object.entries(ATT_STATUS).filter(([k]) => ['present','absent','half_day','on_leave'].includes(k)).map(([k, v]) => (
                        <span key={k} className={`${v.color} font-bold`}>● {v.label === 'H' ? 'Half' : v.label === 'P' ? 'Present' : v.label === 'A' ? 'Absent' : 'Leave'}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Substitutions Given */}
                {detail.subs_given.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Substitute Periods Given ({detail.subs_given.length})
                    </h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {detail.subs_given.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-bold text-slate-700">{s.date}</span>
                            <span className="text-slate-500"> · P{s.period_number} · {s.subject_name} · {s.class_name}</span>
                          </div>
                          <span className="text-[10px] text-rose-500 font-bold shrink-0">for {s.original_teacher}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Substitutions Received */}
                {detail.subs_received.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Periods Covered by Others ({detail.subs_received.length})
                    </h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {detail.subs_received.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-bold text-slate-700">{s.date}</span>
                            <span className="text-slate-500"> · P{s.period_number} · {s.subject_name} · {s.class_name}</span>
                            <span className="text-[10px] text-slate-400"> [{s.absence_reason || 'absence'}]</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold shrink-0">{s.substitute_teacher}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
