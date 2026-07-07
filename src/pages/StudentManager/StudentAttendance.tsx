import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, User, ChevronLeft,
  ChevronRight, RefreshCw, Calendar, BarChart3, ClipboardList,
  Users, Check, Save,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendStatus = 'present' | 'absent' | 'late' | 'half_day';
type ActiveTab    = 'logs' | 'mark' | 'summary';

interface AttendLog {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number: string;
  section: string;
  class_name: string;
  photo_url: string | null;
  date: string;
  status: AttendStatus;
  in_time: string | null;
  out_time: string | null;
  remarks: string | null;
}

interface SummaryRow {
  date: string;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  total: number;
}

interface StudentForMark {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  photo_url: string | null;
  status: AttendStatus;
  in_time: string;
  out_time: string;
  remarks: string;
}

interface TodayStats { present: number; absent: number; late: number; half_day: number; total: number; }
interface MasterOption { value: string | number; label: string; }

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<AttendStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  present:  { label: 'Present',  color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  absent:   { label: 'Absent',   color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     dot: 'bg-red-500'     },
  late:     { label: 'Late',     color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-500'   },
  half_day: { label: 'Half Day', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    dot: 'bg-blue-500'    },
};

// ─── react-select styles ──────────────────────────────────────────────────────
const selSm = {
  control: (b: any, s: any) => ({
    ...b, borderRadius: '8px', borderColor: s.isFocused ? '#a855f7' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(168,85,247,.15)' : 'none',
    minHeight: '30px', height: '30px', '&:hover': { borderColor: '#a855f7' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '30px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: 0, padding: 0, fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '28px' }),
  option: (b: any, s: any) => ({
    ...b, fontSize: '11px', padding: '6px 10px', cursor: 'pointer',
    backgroundColor: s.isSelected ? '#a855f7' : s.isFocused ? '#f5f3ff' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '8px', border: '1px solid #e5e7eb', zIndex: 9999 }),
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AttendStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Status Toggle Button Group ────────────────────────────────────────────────
function StatusToggle({ value, onChange }: { value: AttendStatus; onChange: (s: AttendStatus) => void }) {
  return (
    <div className="flex gap-0.5">
      {(Object.keys(STATUS_CFG) as AttendStatus[]).map(s => {
        const cfg = STATUS_CFG[s];
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={cfg.label}
            className={`px-2 py-0.5 text-[9px] font-extrabold rounded transition cursor-pointer border outline-none ${
              active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100'
            }`}
          >
            {s === 'present' ? 'P' : s === 'absent' ? 'A' : s === 'late' ? 'L' : 'H'}
          </button>
        );
      })}
    </div>
  );
}

// ─── Calendar Heatmap Row ────────────────────────────────────────────────────
function HeatmapRow({ row }: { row: SummaryRow }) {
  const total = row.total || 1;
  const pctPresent = Math.round((row.present / total) * 100);
  const d = new Date(row.date);
  const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  return (
    <tr className={`border-b border-gray-50 ${isWeekend ? 'bg-slate-50/60' : 'hover:bg-purple-50/20'} transition`}>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold w-6 ${isWeekend ? 'text-indigo-400' : 'text-gray-400'}`}>{dayName}</span>
          <span className="text-[11px] font-extrabold text-slate-700">{dateStr}</span>
        </div>
      </td>
      <td className="px-3 py-1.5 text-center"><span className="text-[11px] font-extrabold text-emerald-600">{row.present}</span></td>
      <td className="px-3 py-1.5 text-center"><span className="text-[11px] font-extrabold text-red-500">{row.absent}</span></td>
      <td className="px-3 py-1.5 text-center"><span className="text-[11px] font-extrabold text-amber-500">{row.late}</span></td>
      <td className="px-3 py-1.5 text-center"><span className="text-[11px] font-extrabold text-blue-500">{row.half_day}</span></td>
      <td className="px-3 py-1.5 text-center"><span className="text-[10px] font-bold text-gray-500">{row.total}</span></td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pctPresent}%` }} />
          </div>
          <span className={`text-[9px] font-extrabold w-8 text-right ${pctPresent >= 75 ? 'text-emerald-600' : pctPresent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {pctPresent}%
          </span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudentAttendance() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('logs');

  // Masters
  const [classes, setClasses] = useState<MasterOption[]>([]);

  // Today stats
  const [todayStats, setTodayStats] = useState<TodayStats>({ present: 0, absent: 0, late: 0, half_day: 0, total: 0 });

  // ── TAB: Logs ──────────────────────────────────────────────────────────────
  const [logs, setLogs]         = useState<AttendLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch]           = useState('');
  const [filterDate, setFilterDate]   = useState('');
  const [filterFrom, setFilterFrom]   = useState('');
  const [filterTo, setFilterTo]       = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [perPage]                     = useState(20);

  // ── TAB: Mark Attendance ───────────────────────────────────────────────────
  const [markDate, setMarkDate]         = useState(new Date().toISOString().split('T')[0]);
  const [markClass, setMarkClass]       = useState('');
  const [markSection, setMarkSection]   = useState('');
  const [studentsForMark, setStudentsForMark] = useState<StudentForMark[]>([]);
  const [markLoading, setMarkLoading]   = useState(false);
  const [saving, setSaving]             = useState(false);


  // ── TAB: Summary ──────────────────────────────────────────────────────────
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summaryClass, setSummaryClass] = useState('');
  const [summaryData, setSummaryData]   = useState<SummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load masters + today stats ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/master/classes').then(res => {
      if (res.data?.success && res.data.data)
        setClasses(Object.entries(res.data.data).map(([id, name]) => ({ value: Number(id), label: name as string })));
    }).catch(() => {});

    api.get('/attendance/today-stats').then(res => {
      if (res.data?.success) setTodayStats(res.data.data);
    }).catch(() => {});
  }, []);

  // ── Load Logs ─────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async (p = 1) => {
    setLogsLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (search)       params.search    = search;
      if (filterDate)   params.date      = filterDate;
      if (filterFrom)   params.from_date = filterFrom;
      if (filterTo)     params.to_date   = filterTo;
      if (filterClass)  params.class_id  = filterClass;
      if (filterStatus) params.status    = filterStatus;

      const res = await api.get('/attendance/logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch {
      toast.error('Failed to load attendance logs');
    } finally {
      setLogsLoading(false);
    }
  }, [search, filterDate, filterFrom, filterTo, filterClass, filterStatus, perPage]);

  useEffect(() => {
    if (activeTab !== 'logs') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadLogs(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeTab, loadLogs]);

  // ── Load Students for Mark ────────────────────────────────────────────────
  const loadStudentsForMark = useCallback(async () => {
    if (!markClass) return;
    setMarkLoading(true);
    try {
      const params: Record<string, any> = { class_id: markClass, per_page: 999 };
      if (markSection) params.section = markSection;
      const res = await api.get('/students', { params });
      if (res.data?.success) {
        const rows: StudentForMark[] = (res.data.data ?? []).map((s: any) => ({
          id: s.id, full_name: s.full_name, admission_number: s.admission_number,
          roll_number: s.roll_number, class_name: s.class_name, section: s.section,
          photo_url: s.photo_url,
          status: 'present' as AttendStatus,
          in_time: '', out_time: '', remarks: '',
        }));
        setStudentsForMark(rows);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setMarkLoading(false);
    }
  }, [markClass, markSection]);

  useEffect(() => {
    if (activeTab === 'mark' && markClass) loadStudentsForMark();
  }, [activeTab, markClass, markSection]);

  // ── Load Summary ──────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params: Record<string, any> = { month: summaryMonth };
      if (summaryClass) params.class_id = summaryClass;
      const res = await api.get('/attendance/summary', { params });
      if (res.data?.success) setSummaryData(res.data.data ?? []);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryMonth, summaryClass]);

  useEffect(() => {
    if (activeTab === 'summary') loadSummary();
  }, [activeTab, loadSummary]);

  // ── Save attendance marks ─────────────────────────────────────────────────
  const handleSaveMark = async () => {
    if (studentsForMark.length === 0) { toast.error('No students to mark'); return; }
    setSaving(true);
    try {
      const records = studentsForMark.map(s => ({
        student_id: s.id,
        date: markDate,
        status: s.status,
        in_time: s.in_time || null,
        out_time: s.out_time || null,
        remarks: s.remarks || null,
      }));
      const res = await api.post('/attendance/mark', { records });
      if (res.data?.success) {
        toast.success(res.data.message ?? 'Attendance saved!');
        // Refresh today stats
        api.get('/attendance/today-stats').then(r => { if (r.data?.success) setTodayStats(r.data.data); });
      } else {
        toast.error(res.data?.message ?? 'Failed to save');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // ── Quick mark all ────────────────────────────────────────────────────────
  const markAll = (status: AttendStatus) => {
    setStudentsForMark(prev => prev.map(s => ({ ...s, status })));
  };

  const updateStudent = (id: number, field: keyof StudentForMark, val: any) => {
    setStudentsForMark(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  // ── Summary aggregation ────────────────────────────────────────────────────
  const summaryTotals = summaryData.reduce(
    (acc, r) => ({ present: acc.present + r.present, absent: acc.absent + r.absent, late: acc.late + r.late, half_day: acc.half_day + r.half_day, total: acc.total + r.total }),
    { present: 0, absent: 0, late: 0, half_day: 0, total: 0 }
  );
  const avgPct = summaryTotals.total > 0
    ? Math.round(((summaryTotals.present + 0.5 * summaryTotals.half_day) / summaryTotals.total) * 100)
    : 0;

  const pageRange = () => {
    const start = Math.max(1, page - 2); const end = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const presentPct = todayStats.total > 0 ? Math.round((todayStats.present / todayStats.total) * 100) : 0;

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
  ];

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Attendance Logs</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                Mark, view and analyse student attendance records
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium">Today</p>
              <p className="text-[11px] font-extrabold text-slate-700">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Total Today',  value: todayStats.total,    g: 'from-violet-500 to-purple-600', pct: null },
              { label: 'Present',      value: todayStats.present,  g: 'from-emerald-500 to-teal-600',  pct: presentPct },
              { label: 'Absent',       value: todayStats.absent,   g: 'from-rose-500 to-red-600',      pct: todayStats.total > 0 ? Math.round((todayStats.absent / todayStats.total) * 100) : 0 },
              { label: 'Late',         value: todayStats.late,     g: 'from-amber-500 to-orange-500',  pct: todayStats.total > 0 ? Math.round((todayStats.late / todayStats.total) * 100) : 0 },
              { label: 'Half Day',     value: todayStats.half_day, g: 'from-blue-500 to-indigo-600',   pct: todayStats.total > 0 ? Math.round((todayStats.half_day / todayStats.total) * 100) : 0 },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.g} text-white rounded-xl p-2.5 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold opacity-80 uppercase tracking-wide">{s.label}</p>
                  {s.pct !== null && <span className="text-[9px] font-extrabold opacity-70">{s.pct}%</span>}
                </div>
                <p className="text-xl font-extrabold mt-0.5">{s.value}</p>
                {s.pct !== null && (
                  <div className="mt-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/70 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'logs',    label: 'Attendance Logs',  icon: <ClipboardList size={12} /> },
              { id: 'mark',    label: 'Mark Attendance',  icon: <Check size={12} /> },
              { id: 'summary', label: 'Monthly Summary',  icon: <BarChart3 size={12} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer border-none outline-none transition ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — LOGS                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="relative min-w-[180px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, adm. no..."
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50" />
              </div>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-slate-50" />
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-slate-50" placeholder="From" />
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-slate-50" placeholder="To" />
              <div className="w-28">
                <Select options={[{ value: '', label: 'All Classes' }, ...classes]}
                  value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === filterClass) ?? null}
                  onChange={opt => setFilterClass(opt?.value ? String(opt.value) : '')}
                  styles={selSm} placeholder="Class" isClearable={false} />
              </div>
              <div className="w-28">
                <Select options={statusOptions}
                  value={statusOptions.find(o => o.value === filterStatus) ?? null}
                  onChange={opt => setFilterStatus(opt?.value ?? '')}
                  styles={selSm} isClearable={false} />
              </div>
              <span className="ml-auto text-[10px] text-gray-400 font-semibold">{total} records</span>
              <button onClick={() => { setSearch(''); setFilterDate(''); setFilterFrom(''); setFilterTo(''); setFilterClass(''); setFilterStatus(''); }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer outline-none transition">
                <RefreshCw size={11} /> Clear
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">#</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">In Time</th>
                    <th className="px-3 py-2">Out Time</th>
                    <th className="px-3 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                        <p className="text-gray-400 font-semibold">Loading logs…</p>
                      </div>
                    </td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <ClipboardList size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-extrabold">No attendance logs found</p>
                    </td></tr>
                  ) : logs.map((log, idx) => {
                    const d = new Date(log.date);
                    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const dayStr  = d.toLocaleDateString('en-IN', { weekday: 'short' });
                    const fmtTime = (t: string | null) => {
                      if (!t) return '—';
                      // t is HH:MM:SS from MySQL TIME column
                      const [h, m] = t.split(':').map(Number);
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
                    };
                    return (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                        <td className="px-3 py-2 text-center text-[10px] font-bold text-gray-400">{(page-1)*perPage+idx+1}</td>
                        <td className="px-3 py-2">
                          <p className="text-[11px] font-extrabold text-slate-700">{dateStr}</p>
                          <p className="text-[9px] text-gray-400">{dayStr}</p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {log.photo_url
                              ? <img src={log.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover border border-purple-100 flex-shrink-0" />
                              : <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0"><User size={10} /></div>
                            }
                            <div>
                              <p className="font-bold text-slate-800">{log.student_name}</p>
                              <p className="text-[9px] text-gray-400">{log.admission_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                            {log.class_name}{log.section ? ` - ${log.section}` : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2"><StatusBadge status={log.status} /></td>
                        <td className="px-3 py-2 text-[10px] font-semibold text-slate-600">{fmtTime(log.in_time)}</td>
                        <td className="px-3 py-2 text-[10px] font-semibold text-slate-600">{fmtTime(log.out_time)}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-500 max-w-[120px] truncate">{log.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!logsLoading && logs.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">{((page-1)*perPage)+1}–{Math.min(page*perPage, total)} of {total}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page<=1} onClick={() => loadLogs(page-1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronLeft size={13} /></button>
                  {pageRange().map(p => <button key={p} onClick={() => loadLogs(p)} className={`w-5 h-5 rounded text-[10px] font-bold cursor-pointer border-none outline-none ${p===page?'bg-purple-600 text-white':'hover:bg-gray-100 text-gray-600 bg-transparent'}`}>{p}</button>)}
                  <button disabled={page>=lastPage} onClick={() => loadLogs(page+1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none"><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — MARK ATTENDANCE                                       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'mark' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Config bar */}
            <div className="px-3 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-3 flex-shrink-0 bg-purple-50/30">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-purple-500" />
                <label className="text-[10px] font-bold text-gray-500 uppercase">Date:</label>
                <input type="date" value={markDate} onChange={e => setMarkDate(e.target.value)}
                  className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-white" />
              </div>
              <div className="w-32">
                <Select options={[{ value: '', label: 'Pick Class…' }, ...classes]}
                  value={[{ value: '', label: 'Pick Class…' }, ...classes].find(c => String(c.value) === markClass) ?? null}
                  onChange={opt => setMarkClass(opt?.value ? String(opt.value) : '')}
                  styles={selSm} placeholder="Class" isClearable={false} />
              </div>
              <input value={markSection} onChange={e => setMarkSection(e.target.value.toUpperCase())} placeholder="Section (opt.)"
                className="w-24 py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-white" />
              <button onClick={loadStudentsForMark} disabled={!markClass}
                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 cursor-pointer border-none outline-none transition disabled:opacity-50">
                <Users size={11} /> Load
              </button>

              {studentsForMark.length > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] text-gray-400 font-bold">Quick:</span>
                  {(['present','absent','late','half_day'] as AttendStatus[]).map(s => {
                    const cfg = STATUS_CFG[s];
                    return (
                      <button key={s} onClick={() => markAll(s)}
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded border cursor-pointer outline-none transition ${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`}>
                        All {cfg.label}
                      </button>
                    );
                  })}
                  <button onClick={handleSaveMark} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer border-none outline-none transition disabled:opacity-60 ml-2">
                    {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" />Saving…</> : <><Save size={11} /> Save ({studentsForMark.length})</>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {!markClass ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Calendar size={40} className="text-gray-200 mb-3" />
                  <p className="font-extrabold text-gray-500">Select a class to begin marking</p>
                  <p className="text-[10px] mt-1">Choose a date and class from the bar above</p>
                </div>
              ) : markLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin mb-3" />
                  <p className="text-gray-400 font-semibold">Loading students…</p>
                </div>
              ) : studentsForMark.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Users size={36} className="text-gray-200 mb-3" />
                  <p className="font-extrabold text-gray-500">No students found in this class</p>
                </div>
              ) : (
                <table className="w-full text-[11px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-3 py-2 w-8 text-center">#</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Roll / Adm.</th>
                      <th className="px-3 py-2 text-center w-40">Status</th>
                      <th className="px-3 py-2 w-28">In Time</th>
                      <th className="px-3 py-2 w-28">Out Time</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForMark.map((s, idx) => {
                      const cfg = STATUS_CFG[s.status];

                      return (
                        <React.Fragment key={s.id}>
                          <tr className={`border-b border-gray-50 transition ${cfg.bg}/30`}>
                            <td className="px-3 py-1.5 text-center text-[10px] font-bold text-gray-400">{idx+1}</td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                {s.photo_url
                                  ? <img src={s.photo_url} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                                  : <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 flex-shrink-0"><User size={10} /></div>
                                }
                                <span className="font-bold text-slate-800 text-[11px]">{s.full_name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5">
                              <p className="text-[10px] font-bold text-purple-600">{s.roll_number || '—'}</p>
                              <p className="text-[9px] text-gray-400">{s.admission_number}</p>
                            </td>
                            <td className="px-3 py-1.5">
                              <StatusToggle value={s.status} onChange={v => updateStudent(s.id, 'status', v)} />
                            </td>
                            <td className="px-3 py-1.5">
                              <input type="time" value={s.in_time} onChange={e => updateStudent(s.id, 'in_time', e.target.value)}
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-purple-400" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input type="time" value={s.out_time} onChange={e => updateStudent(s.id, 'out_time', e.target.value)}
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-purple-400" />
                            </td>
                            <td className="px-3 py-1.5">
                              <input value={s.remarks} onChange={e => updateStudent(s.id, 'remarks', e.target.value)}
                                placeholder="Remarks…"
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] outline-none focus:border-purple-400" />
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom bar */}
            {studentsForMark.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {(Object.keys(STATUS_CFG) as AttendStatus[]).map(s => {
                    const count = studentsForMark.filter(st => st.status === s).length;
                    const cfg   = STATUS_CFG[s];
                    return count > 0 ? (
                      <span key={s} className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {cfg.label}: {count}
                      </span>
                    ) : null;
                  })}
                </div>
                <button onClick={handleSaveMark} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-extrabold bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer border-none outline-none transition disabled:opacity-60">
                  {saving ? <><div className="w-3 h-3 border-b border-white rounded-full animate-spin" /> Saving…</> : <><Save size={12} /> Save Attendance</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 3 — MONTHLY SUMMARY                                       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="flex-1 overflow-hidden flex gap-3">
            {/* Left: calendar table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
              {/* Controls */}
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                <Calendar size={13} className="text-purple-500" />
                <input type="month" value={summaryMonth} onChange={e => setSummaryMonth(e.target.value)}
                  className="py-1 px-2 text-[11px] border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-white" />
                <div className="w-32">
                  <Select options={[{ value: '', label: 'All Classes' }, ...classes]}
                    value={[{ value: '', label: 'All Classes' }, ...classes].find(c => String(c.value) === summaryClass) ?? null}
                    onChange={opt => setSummaryClass(opt?.value ? String(opt.value) : '')}
                    styles={selSm} placeholder="All Classes" isClearable={false} />
                </div>
                <button onClick={loadSummary}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 cursor-pointer border-none outline-none transition">
                  <RefreshCw size={11} /> Load
                </button>
                <span className="ml-auto text-[10px] text-gray-400 font-semibold">{summaryData.length} days with data</span>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-center text-emerald-600">Present</th>
                      <th className="px-3 py-2 text-center text-red-500">Absent</th>
                      <th className="px-3 py-2 text-center text-amber-500">Late</th>
                      <th className="px-3 py-2 text-center text-blue-500">Half Day</th>
                      <th className="px-3 py-2 text-center">Total</th>
                      <th className="px-3 py-2 text-left">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryLoading ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                          <p className="text-gray-400 font-semibold">Loading summary…</p>
                        </div>
                      </td></tr>
                    ) : summaryData.length === 0 ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <BarChart3 size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-extrabold">No attendance data for this month</p>
                      </td></tr>
                    ) : summaryData.map(row => (
                      <HeatmapRow key={row.date} row={row} />
                    ))}
                    {summaryData.length > 0 && (
                      <tr className="bg-purple-50 border-t border-purple-200">
                        <td className="px-3 py-2 font-extrabold text-purple-700 text-[11px]">TOTAL</td>
                        <td className="px-3 py-2 text-center font-extrabold text-emerald-600">{summaryTotals.present}</td>
                        <td className="px-3 py-2 text-center font-extrabold text-red-500">{summaryTotals.absent}</td>
                        <td className="px-3 py-2 text-center font-extrabold text-amber-500">{summaryTotals.late}</td>
                        <td className="px-3 py-2 text-center font-extrabold text-blue-500">{summaryTotals.half_day}</td>
                        <td className="px-3 py-2 text-center font-extrabold text-gray-600">{summaryTotals.total}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${avgPct >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : avgPct >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            Avg {avgPct}%
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: mini stats panel */}
            <div className="w-52 flex flex-col gap-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase mb-2">Month Totals</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Present',  value: summaryTotals.present,  color: 'text-emerald-600', bar: 'bg-emerald-400' },
                    { label: 'Absent',   value: summaryTotals.absent,   color: 'text-red-500',     bar: 'bg-red-400' },
                    { label: 'Late',     value: summaryTotals.late,     color: 'text-amber-500',   bar: 'bg-amber-400' },
                    { label: 'Half Day', value: summaryTotals.half_day, color: 'text-blue-500',    bar: 'bg-blue-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-gray-500 font-semibold">{s.label}</span>
                        <span className={`text-[10px] font-extrabold ${s.color}`}>{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.bar} rounded-full`} style={{ width: `${summaryTotals.total > 0 ? Math.round((s.value / summaryTotals.total) * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white text-center">
                <p className="text-[9px] font-bold opacity-80 uppercase">Avg Attendance</p>
                <p className="text-4xl font-extrabold mt-1">{avgPct}<span className="text-xl">%</span></p>
                <p className="text-[9px] opacity-70 mt-1">{summaryData.length} school days</p>
                <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full" style={{ width: `${avgPct}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase mb-2">Legend</p>
                <div className="space-y-1.5">
                  {(Object.entries(STATUS_CFG) as [AttendStatus, typeof STATUS_CFG[AttendStatus]][]).map(([s, cfg]) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-gray-100 pt-2">
                  <p className="text-[9px] text-gray-400">% = (Present + 0.5×Half Day) / Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
