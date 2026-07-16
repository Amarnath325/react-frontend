import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Calendar, ClipboardList, BarChart3, CheckCircle2,
  XCircle, Clock, AlertTriangle, Download, RefreshCw,
  ChevronLeft, ChevronRight, Search, Filter, X, User,
  Loader2, PenLine, Trash2, CheckCheck, Coffee, ArrowUpDown,
  TrendingUp, Award, Eye
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Employee {
  staff_id: number;
  staff_type: 'Teacher' | 'NonTeaching';
  employee_id: string;
  name: string;
  department: string | null;
  designation: string | null;
  shift: string | null;
  photo: string | null;
  attendance_id?: number;
  status?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  late_minutes?: number;
  overtime_minutes?: number;
  leave_type?: string | null;
  source?: string;
  remarks?: string | null;
  is_approved?: boolean;
  is_marked?: boolean;
}

interface AttendanceLog {
  id: number;
  staff_id: number;
  staff_type: string;
  employee_id: string;
  staff_name: string;
  department: string;
  designation: string | null;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  overtime_minutes: number;
  leave_type: string | null;
  shift: string | null;
  source: string;
  remarks: string | null;
  is_approved: boolean;
}

interface DailySummary {
  total: number; marked: number; present: number; absent: number;
  late: number; half_day: number; on_leave: number; unmarked: number;
}

interface TodayStats {
  total_staff: number; marked: number; present: number; absent: number;
  late: number; on_leave: number; half_day: number; unmarked: number;
  teachers_present: number; non_teaching_present: number;
}

interface MonthlySummary {
  staff_id: number; staff_type: string; employee_id: string;
  name: string; department: string | null; designation: string | null;
  working_days: number; present: number; late: number; half_day: number;
  absent: number; on_leave: number; total_present: number;
  attendance_pct: number; total_late_minutes: number; total_overtime_minutes: number;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  present:  { label: 'Present',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  absent:   { label: 'Absent',    color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200',    icon: <XCircle className="w-3.5 h-3.5" />      },
  late:     { label: 'Late',      color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: <Clock className="w-3.5 h-3.5" />        },
  half_day: { label: 'Half Day',  color: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-200',     icon: <Coffee className="w-3.5 h-3.5" />       },
  on_leave: { label: 'On Leave',  color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',  icon: <User className="w-3.5 h-3.5" />         },
  holiday:  { label: 'Holiday',   color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200',   icon: <Calendar className="w-3.5 h-3.5" />     },
  weekend:  { label: 'Weekend',   color: 'text-slate-500',   bg: 'bg-slate-50',    border: 'border-slate-100',   icon: <Calendar className="w-3.5 h-3.5" />     },
};

const STATUSES = Object.keys(STATUS_CONFIG);
const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'compensatory'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-[10px] text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function AttendancePctBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}%</span>
    </div>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
  const clr = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${clr} flex items-center justify-center font-bold shrink-0`}>{initials}</div>;
}

/* ══════════════════════════════════════════════════════════
   MARK CELL (daily attendance row inline)
══════════════════════════════════════════════════════════ */
function MarkCell({ emp, onChange }: { emp: Employee; onChange: (upd: Partial<Employee>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = emp.status;
  const cfg = current ? STATUS_CONFIG[current] : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition hover:shadow-sm ${
          cfg ? `${cfg.color} ${cfg.bg} ${cfg.border}` : 'text-slate-400 bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}>
        {cfg ? <>{cfg.icon}{cfg.label}</> : <><PenLine className="w-3 h-3" />Mark</>}
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 min-w-[130px]">
          {STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => { onChange({ status: s }); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition hover:${c.bg} ${current === s ? `${c.bg} ${c.color}` : 'text-slate-600 hover:text-slate-900'}`}>
                {c.icon}{c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function EmployeeAttendance() {
  /* ── Tab ── */
  const [tab, setTab] = useState<'daily' | 'logs' | 'monthly' | 'report'>('daily');

  /* ── Filters ── */
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [staffType,  setStaffType]  = useState('');
  const [search,     setSearch]     = useState('');
  const [fromDate,   setFromDate]   = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10));
  const [toDate,     setToDate]     = useState(new Date().toISOString().slice(0, 10));
  const [statusFilt, setStatusFilt] = useState('');
  const [month,      setMonth]      = useState(new Date().getMonth() + 1);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [logPage,    setLogPage]    = useState(1);
  const [logTotal,   setLogTotal]   = useState(0);
  const [logPages,   setLogPages]   = useState(1);

  /* ── Data ── */
  const [sheet,       setSheet]       = useState<Employee[]>([]);
  const [summary,     setSummary]     = useState<DailySummary | null>(null);
  const [todayStats,  setTodayStats]  = useState<TodayStats | null>(null);
  const [logs,        setLogs]        = useState<AttendanceLog[]>([]);
  const [monthly,     setMonthly]     = useState<MonthlySummary[]>([]);
  const [monthlyOver, setMonthlyOver] = useState<any>(null);

  /* ── Edit modal ── */
  const [editRow,    setEditRow]    = useState<Employee | null>(null);
  const [eCheckIn,   setECheckIn]   = useState('');
  const [eCheckOut,  setECheckOut]  = useState('');
  const [eLeaveType, setELeaveType] = useState('');
  const [eRemarks,   setERemarks]   = useState('');

  /* ── Loading ── */
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [loadingLogs,  setLoadingLogs]  = useState(false);
  const [loadingMon,   setLoadingMon]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savingAll,    setSavingAll]    = useState(false);

  /* ══ Fetch today stats (always) ══ */
  const fetchTodayStats = useCallback(async () => {
    try {
      const res = await api.get('/school/employee-attendance/today-stats');
      if (res.data.success) setTodayStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTodayStats(); }, [fetchTodayStats]);

  /* ══ Daily sheet ══ */
  const fetchDaily = useCallback(async () => {
    setLoadingSheet(true);
    try {
      const params: Record<string, string> = { date };
      if (staffType) params.staff_type = staffType;
      const res = await api.get('/school/employee-attendance/daily', { params });
      if (res.data.success) {
        setSheet(res.data.data || []);
        setSummary(res.data.summary || null);
      }
    } catch { toast.error('Failed to load daily sheet'); }
    finally { setLoadingSheet(false); }
  }, [date, staffType]);

  /* ══ Logs ══ */
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params: Record<string, string | number> = { per_page: 25, page: logPage };
      if (fromDate)   params.from_date  = fromDate;
      if (toDate)     params.to_date    = toDate;
      if (staffType)  params.staff_type = staffType;
      if (statusFilt) params.status     = statusFilt;
      if (search)     params.search     = search;
      const res = await api.get('/school/employee-attendance', { params });
      if (res.data.success) {
        setLogs(res.data.data || []);
        setLogTotal(res.data.meta?.total || 0);
        setLogPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load logs'); }
    finally { setLoadingLogs(false); }
  }, [fromDate, toDate, staffType, statusFilt, search, logPage]);

  /* ══ Monthly summary ══ */
  const fetchMonthly = useCallback(async () => {
    setLoadingMon(true);
    try {
      const params: Record<string, string | number> = { month, year };
      if (staffType) params.staff_type = staffType;
      const res = await api.get('/school/employee-attendance/summary', { params });
      if (res.data.success) {
        setMonthly(res.data.data || []);
        setMonthlyOver(res.data.overall || null);
      }
    } catch { toast.error('Failed to load monthly summary'); }
    finally { setLoadingMon(false); }
  }, [month, year, staffType]);

  useEffect(() => { if (tab === 'daily') fetchDaily(); }, [tab, fetchDaily]);
  useEffect(() => { if (tab === 'logs') fetchLogs(); }, [tab, fetchLogs]);
  useEffect(() => { if (tab === 'monthly') fetchMonthly(); }, [tab, fetchMonthly]);

  /* ══ Inline status change on daily sheet ══ */
  const handleInlineChange = (idx: number, upd: Partial<Employee>) => {
    setSheet(prev => prev.map((e, i) => i === idx ? { ...e, ...upd } : e));
  };

  /* ══ Save all bulk ══ */
  const handleSaveAll = async () => {
    const toSave = sheet.filter(e => e.status);
    if (!toSave.length) { toast.error('No status set for any employee'); return; }
    setSavingAll(true);
    try {
      const records = toSave.map(e => ({
        staff_id:        e.staff_id,
        staff_type:      e.staff_type,
        status:          e.status,
        check_in:        e.check_in  || null,
        check_out:       e.check_out || null,
        late_minutes:    e.late_minutes     || 0,
        overtime_minutes:e.overtime_minutes || 0,
        leave_type:      e.leave_type  || null,
        remarks:         e.remarks     || null,
      }));
      const res = await api.post('/school/employee-attendance/bulk-mark', { date, records });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchDaily(); fetchTodayStats();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSavingAll(false); }
  };

  /* ══ Open edit modal ══ */
  const openEdit = (emp: Employee) => {
    setEditRow(emp);
    setECheckIn(emp.check_in   || '');
    setECheckOut(emp.check_out || '');
    setELeaveType(emp.leave_type || '');
    setERemarks(emp.remarks || '');
  };

  /* ══ Save edit modal ══ */
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow?.status) { toast.error('Select a status first'); return; }
    setSaving(true);
    try {
      const payload = {
        staff_id:    editRow.staff_id,
        staff_type:  editRow.staff_type,
        date,
        status:      editRow.status,
        check_in:    eCheckIn   || null,
        check_out:   eCheckOut  || null,
        leave_type:  eLeaveType || null,
        remarks:     eRemarks   || null,
        source:      'manual',
      };
      if (editRow.attendance_id) {
        await api.put(`/school/employee-attendance/${editRow.attendance_id}`, payload);
      } else {
        await api.post('/school/employee-attendance/mark', payload);
      }
      toast.success('Attendance saved!');
      setEditRow(null);
      fetchDaily(); fetchTodayStats();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ══ Delete log ══ */
  const deleteLog = async (id: number) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/school/employee-attendance/${id}`);
      toast.success('Deleted'); fetchLogs();
    } catch { toast.error('Delete failed'); }
  };

  /* ══ Approve log ══ */
  const approveLog = async (id: number) => {
    try {
      await api.post(`/school/employee-attendance/${id}/approve`);
      toast.success('Approved'); fetchLogs();
    } catch { toast.error('Approve failed'); }
  };

  /* ══ Export monthly CSV ══ */
  const exportMonthly = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows: unknown[][] = [['Employee ID', 'Name', 'Department', 'Designation', 'Working Days', 'Present', 'Late', 'Half Day', 'Absent', 'On Leave', 'Attendance %', 'Late Mins', 'OT Mins']];
      monthly.forEach(m => rows.push([m.employee_id, m.name, m.department || '', m.designation || '', m.working_days, m.present, m.late, m.half_day, m.absent, m.on_leave, m.attendance_pct + '%', m.total_late_minutes, m.total_overtime_minutes]));
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Attendance');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `attendance_${year}_${month}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  /* ══ Navigate date ══ */
  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10)); };
  const isToday = date === new Date().toISOString().slice(0, 10);

  /* ══ Filtered sheet ══ */
  const filteredSheet = sheet.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.employee_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilt && e.status !== statusFilt) return false;
    return true;
  });

  /* ══ MONTHS for picker ══ */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const YEARS  = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ══ HEADER ══ */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><ClipboardList className="w-5 h-5" /></span>
            Employee Attendance Logs
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Mark, track, and report attendance for all teaching and non-teaching staff.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['daily', 'logs', 'monthly'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${tab === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t === 'daily' ? '📋 Daily Sheet' : t === 'logs' ? '🗂️ Logs' : '📊 Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TODAY STATS CARDS ══ */}
      {todayStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: 'Total Staff', val: todayStats.total_staff,  bg: 'bg-slate-50',    text: 'text-slate-600'   },
            { label: 'Marked',      val: todayStats.marked,       bg: 'bg-indigo-50',   text: 'text-indigo-600'  },
            { label: 'Present',     val: todayStats.present,      bg: 'bg-emerald-50',  text: 'text-emerald-600' },
            { label: 'Absent',      val: todayStats.absent,       bg: 'bg-rose-50',     text: 'text-rose-600'    },
            { label: 'Late',        val: todayStats.late,         bg: 'bg-amber-50',    text: 'text-amber-600'   },
            { label: 'On Leave',    val: todayStats.on_leave,     bg: 'bg-violet-50',   text: 'text-violet-600'  },
            { label: 'Teachers',    val: todayStats.teachers_present, bg: 'bg-sky-50',  text: 'text-sky-600'     },
            { label: 'Non-Teaching',val: todayStats.non_teaching_present, bg: 'bg-teal-50', text: 'text-teal-600'},
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-white shadow-sm p-3 flex flex-col`}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</span>
              <span className={`text-xl font-black ${s.text}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: DAILY ATTENDANCE SHEET
      ════════════════════════════════════════ */}
      {tab === 'daily' && (
        <div className="space-y-3">
          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
            {/* Date navigator */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button onClick={prevDay} className="p-1.5 hover:bg-white rounded-md transition text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-1 text-xs font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer" />
              <button onClick={nextDay} className="p-1.5 hover:bg-white rounded-md transition text-slate-500"><ChevronRight className="w-4 h-4" /></button>
            </div>
            {isToday && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">TODAY</span>}

            <select value={staffType} onChange={e => setStaffType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              <option value="">All Staff</option>
              <option value="Teacher">Teachers</option>
              <option value="NonTeaching">Non-Teaching</option>
            </select>

            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-white shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
                className="text-xs outline-none bg-transparent text-slate-700 w-36" />
            </div>

            <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>

            <button onClick={fetchDaily} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 shadow-sm transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Quick mark all */}
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={() => setSheet(prev => prev.map(e => ({ ...e, status: 'present' })))}
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition">
                All Present
              </button>
              <button onClick={handleSaveAll} disabled={savingAll}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50">
                {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Save All
              </button>
            </div>
          </div>

          {/* Daily Summary Bar */}
          {summary && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-4 text-xs">
              {[
                { label: 'Total',   val: summary.total,    clr: 'text-slate-600'   },
                { label: 'Present', val: summary.present,  clr: 'text-emerald-600' },
                { label: 'Absent',  val: summary.absent,   clr: 'text-rose-600'    },
                { label: 'Late',    val: summary.late,     clr: 'text-amber-600'   },
                { label: 'Half Day',val: summary.half_day, clr: 'text-sky-600'     },
                { label: 'On Leave',val: summary.on_leave, clr: 'text-violet-600'  },
                { label: 'Unmarked',val: summary.unmarked, clr: 'text-slate-400'   },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center min-w-[50px]">
                  <span className={`text-lg font-black ${s.clr}`}>{s.val}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily Sheet Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loadingSheet ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : filteredSheet.length === 0 ? (
              <div className="text-center py-14">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No employees found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Employee', 'Type', 'Department', 'Shift', 'Status', 'Check In', 'Check Out', 'Actions'].map(h => (
                        <th key={h} className="py-3 px-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSheet.map((emp, idx) => {
                      const sheetIdx = sheet.findIndex(e => e.staff_id === emp.staff_id && e.staff_type === emp.staff_type);
                      return (
                        <tr key={`${emp.staff_type}_${emp.staff_id}`}
                          className={`hover:bg-slate-50/60 transition ${emp.is_marked ? '' : 'bg-amber-50/30'}`}>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={emp.name} />
                              <div>
                                <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${emp.staff_type === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                              {emp.staff_type === 'Teacher' ? 'Teacher' : 'Non-Teaching'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">{emp.department || emp.designation || '—'}</td>
                          <td className="py-2.5 px-4 text-xs text-slate-500">{emp.shift || '—'}</td>
                          <td className="py-2.5 px-4">
                            <MarkCell emp={emp} onChange={upd => handleInlineChange(sheetIdx, upd)} />
                          </td>
                          <td className="py-2.5 px-4">
                            <input type="time" value={emp.check_in || ''} onChange={e => handleInlineChange(sheetIdx, { check_in: e.target.value || null })}
                              className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-teal-400 text-slate-600 w-[90px]" />
                          </td>
                          <td className="py-2.5 px-4">
                            <input type="time" value={emp.check_out || ''} onChange={e => handleInlineChange(sheetIdx, { check_out: e.target.value || null })}
                              className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-teal-400 text-slate-600 w-[90px]" />
                          </td>
                          <td className="py-2.5 px-4">
                            <button onClick={() => openEdit({ ...emp, ...sheet[sheetIdx] })}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition">
                              <PenLine className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: ATTENDANCE LOGS
      ════════════════════════════════════════ */}
      {tab === 'logs' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500">FROM</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500">TO</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400" />
            </div>
            <select value={staffType} onChange={e => setStaffType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              <option value="">All Staff</option>
              <option value="Teacher">Teachers</option>
              <option value="NonTeaching">Non-Teaching</option>
            </select>
            <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-white shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)}
                className="text-xs outline-none bg-transparent text-slate-700 w-32" />
            </div>
            <button onClick={() => { setLogPage(1); fetchLogs(); }}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Apply
            </button>
            <span className="text-[10px] text-slate-500 ml-auto font-semibold">{logTotal} records</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">No attendance records found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Date', 'Employee', 'Type', 'Status', 'Check In', 'Check Out', 'Late', 'Leave Type', 'Source', 'Approved', 'Actions'].map(h => (
                          <th key={h} className="py-3 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-600 whitespace-nowrap">{log.date}</td>
                          <td className="py-2.5 px-3">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{log.staff_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{log.employee_id}</p>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.staff_type === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                              {log.staff_type === 'Teacher' ? 'Teacher' : 'Non-Teaching'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3"><StatusBadge status={log.status} /></td>
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-600">{log.check_in || '—'}</td>
                          <td className="py-2.5 px-3 text-xs font-mono text-slate-600">{log.check_out || '—'}</td>
                          <td className="py-2.5 px-3 text-xs text-amber-600 font-semibold">{log.late_minutes ? `${log.late_minutes}m` : '—'}</td>
                          <td className="py-2.5 px-3 text-xs text-slate-500 capitalize">{log.leave_type || '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] text-slate-400 font-semibold capitalize">{log.source}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            {log.is_approved
                              ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Yes</span>
                              : <span className="text-[10px] text-slate-400">No</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {!log.is_approved && (
                                <button onClick={() => approveLog(log.id)}
                                  className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Approve">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => deleteLog(log.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Page {logPage} of {logPages} · {logTotal} total</span>
                  <div className="flex gap-2">
                    <button disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={logPage >= logPages} onClick={() => setLogPage(p => p + 1)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: MONTHLY SUMMARY
      ════════════════════════════════════════ */}
      {tab === 'monthly' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={staffType} onChange={e => setStaffType(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-400 shadow-sm">
              <option value="">All Staff</option>
              <option value="Teacher">Teachers</option>
              <option value="NonTeaching">Non-Teaching</option>
            </select>
            <button onClick={fetchMonthly}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Load
            </button>
            {monthly.length > 0 && (
              <button onClick={exportMonthly}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition">
                <Download className="w-3.5 h-3.5 text-emerald-500" /> Export Excel
              </button>
            )}
          </div>

          {/* Monthly overview cards */}
          {monthlyOver && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Working Days', val: monthlyOver.working_days, icon: <Calendar className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Avg Attendance', val: `${monthlyOver.avg_attendance}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Total Employees', val: monthlyOver.total_employees, icon: <Users className="w-4 h-4" />, color: 'text-teal-600 bg-teal-50' },
                { label: 'Total Present Days', val: monthlyOver.status_breakdown?.present || 0, icon: <Award className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50' },
              ].map(c => (
                <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.color}`}>{c.icon}</div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{c.label}</span>
                    <span className="text-xl font-black text-slate-800">{c.val}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loadingMon ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : monthly.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">Select month and year, then click Load.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Employee', 'Type', 'Dept', 'Work Days', 'Present', 'Late', 'Half', 'Absent', 'Leave', 'Late Mins', 'OT Mins', 'Attendance'].map(h => (
                        <th key={h} className="py-3 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthly.map(m => (
                      <tr key={`${m.staff_type}_${m.staff_id}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.name} size="sm" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{m.employee_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.staff_type === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                            {m.staff_type === 'Teacher' ? 'T' : 'NT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">{m.department || m.designation || '—'}</td>
                        <td className="py-2.5 px-3 text-xs font-semibold text-slate-600">{m.working_days}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-emerald-600">{m.present}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-amber-600">{m.late}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-sky-600">{m.half_day}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-rose-600">{m.absent}</td>
                        <td className="py-2.5 px-3 text-xs font-bold text-violet-600">{m.on_leave}</td>
                        <td className="py-2.5 px-3 text-xs text-amber-500">{m.total_late_minutes ? `${m.total_late_minutes}m` : '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-indigo-500">{m.total_overtime_minutes ? `${m.total_overtime_minutes}m` : '—'}</td>
                        <td className="py-2.5 px-3" style={{ minWidth: '120px' }}>
                          <AttendancePctBar pct={m.attendance_pct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          EDIT MODAL (detailed mark)
      ════════════════════════════════════════ */}
      {editRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" /> Mark Attendance
              </h3>
              <button onClick={() => setEditRow(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Employee info */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <Avatar name={editRow.name} />
                <div>
                  <p className="text-xs font-bold text-slate-800">{editRow.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{editRow.employee_id} · {editRow.staff_type === 'Teacher' ? 'Teacher' : 'Non-Teaching'}</p>
                  {editRow.department && <p className="text-[10px] text-slate-400">{editRow.department}</p>}
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-slate-400">Date</p>
                  <p className="text-xs font-bold text-slate-700">{date}</p>
                </div>
              </div>

              {/* Status buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Attendance Status <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'].map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const active = editRow.status === s;
                    return (
                      <button key={s} type="button" onClick={() => setEditRow(prev => prev ? { ...prev, status: s } : prev)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] font-bold transition ${active ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {cfg.icon}{cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check In</label>
                  <input type="time" value={eCheckIn} onChange={e => setECheckIn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check Out</label>
                  <input type="time" value={eCheckOut} onChange={e => setECheckOut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400" />
                </div>
              </div>

              {/* Leave type */}
              {editRow.status === 'on_leave' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Type</label>
                  <select value={eLeaveType} onChange={e => setELeaveType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    <option value="">Select Leave Type</option>
                    {LEAVE_TYPES.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)} Leave</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                <textarea rows={2} placeholder="Optional note..." value={eRemarks} onChange={e => setERemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-teal-400 resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditRow(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : <><CheckCircle2 className="w-3.5 h-3.5" />Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
