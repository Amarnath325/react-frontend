import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Calendar, Search, Plus, RefreshCw, CheckCircle2,
  XCircle, Clock, AlertTriangle, ArrowRight, BarChart3,
  ChevronLeft, ChevronRight, Edit2, Trash2, Loader2, X,
  UserCheck, UserX, Shuffle, BookOpen, Filter, Inbox,
  TrendingUp, Award, Zap, Info, CheckCheck
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Teacher {
  id: number;
  name: string;
  employee_id: string;
  department: string | null;
  specialization?: string | null;
  is_available?: boolean;
  reason?: string | null;
}

interface ClassMaster {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  code: string | null;
  class_id: number;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface AbsentPeriod {
  timetable_id: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  room_number: string | null;
  class_name: string;
  section_name: string | null;
  subject_name: string;
  subject_code: string | null;
  allocation_id: number | null;
  substitute_teacher_id: number | null;
  substitute_name: string | null;
  status: string | null;
  is_assigned: boolean;
}

interface Allocation {
  id: number;
  date: string;
  original_teacher_id: number;
  substitute_teacher_id: number;
  original_name: string;
  substitute_name: string;
  original_emp_id: string;
  substitute_emp_id: string;
  class_name: string;
  section_name: string | null;
  subject_name: string;
  subject_code: string | null;
  period_number: number;
  start_time: string;
  end_time: string;
  absence_reason: string | null;
  status: string;
  is_notified: boolean;
  created_at: string;
}

interface Stats {
  total_month: number;
  assigned: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  top_absent: { name: string; cnt: number }[];
  top_subs: { name: string; cnt: number }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  assigned:  { label: 'Assigned',  color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200'     },
  confirmed: { label: 'Confirmed', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200'  },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200'    },
};

const ABSENCE_REASONS = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Emergency', 'Official Duty', 'Training', 'Workshop', 'Other'];

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];
  const clr = colors[(name || ' ').charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${clr} flex items-center justify-center font-black shrink-0`}>{initials}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status];
  if (!c) return <span className="text-[10px] text-slate-400">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${c.color} ${c.bg} ${c.border}`}>
      {status === 'assigned' && <Clock className="w-3 h-3" />}
      {status === 'confirmed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'completed' && <CheckCheck className="w-3 h-3" />}
      {status === 'cancelled' && <XCircle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

const TABS = [
  { key: 'assign', label: '🔄 Assign Substitute' },
  { key: 'logs',   label: '📋 Allocation Logs'   },
  { key: 'workload', label: '📊 Workload Report'  },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function SubstituteTeacherManagement() {
  const [tab, setTab] = useState<TabKey>('assign');

  /* ── Masters ── */
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassMaster[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [mastersLoaded, setMastersLoaded] = useState(false);

  /* ── Stats ── */
  const [stats, setStats] = useState<Stats | null>(null);

  /* ── Assign Tab State ── */
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [absentTeacherId, setAbsentTeacherId] = useState<number | null>(null);
  const [absenceReason, setAbsenceReason] = useState('Sick Leave');
  const [leaveRef, setLeaveRef] = useState('');
  const [notes, setNotes] = useState('');
  const [periods, setPeriods] = useState<AbsentPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  // Per-period substitute selection
  const [periodSubs, setPeriodSubs] = useState<Record<number, number | null>>({});
  // Available teachers for each period (lazy loaded on selection)
  const [availableMap, setAvailableMap] = useState<Record<number, Teacher[]>>({});
  const [loadingAvail, setLoadingAvail] = useState<Record<number, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);

  /* ── Logs Tab ── */
  const [logs, setLogs] = useState<Allocation[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPages, setLogsPages] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filtDate, setFiltDate] = useState('');
  const [filtOrigId, setFiltOrigId] = useState('');
  const [filtSubId, setFiltSubId] = useState('');
  const [filtStatus, setFiltStatus] = useState('');

  /* ── Edit Modal ── */
  const [editModal, setEditModal] = useState<{ record: Allocation; subId: number | null; status: string; remarks: string } | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  /* ── Workload ── */
  const [workload, setWorkload] = useState<any[]>([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [workFrom, setWorkFrom] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [workTo, setWorkTo] = useState(new Date().toISOString().slice(0, 10));

  /* ═══ Load Masters ═══ */
  const loadMasters = useCallback(async () => {
    try {
      const res = await api.get('/school/substitute-allocations/masters');
      if (res.data.success) {
        setTeachers(res.data.teachers || []);
        setClasses(res.data.classes || []);
        setAcademicYears(res.data.academic_years || []);
        const cur = (res.data.academic_years || []).find((y: AcademicYear) => y.is_current);
        if (cur) setSelectedYear(cur.id);
        else if (res.data.academic_years?.length) setSelectedYear(res.data.academic_years[0].id);
        setMastersLoaded(true);
      }
    } catch { toast.error('Failed to load master data'); }
  }, []);

  /* ═══ Load Stats ═══ */
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/school/substitute-allocations/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadMasters(); loadStats(); }, [loadMasters, loadStats]);

  /* ═══ Load Absent Periods ═══ */
  const loadPeriods = useCallback(async () => {
    if (!absentTeacherId || !selectedDate || !selectedYear) return;
    setLoadingPeriods(true);
    setPeriods([]);
    setPeriodSubs({});
    setAvailableMap({});
    try {
      const res = await api.get('/school/substitute-allocations/absent-periods', {
        params: { teacher_id: absentTeacherId, date: selectedDate, academic_year_id: selectedYear },
      });
      if (res.data.success) {
        const data: AbsentPeriod[] = res.data.data || [];
        setPeriods(data);
        // Pre-fill already assigned substitutes
        const preSelected: Record<number, number | null> = {};
        data.forEach(p => { preSelected[p.timetable_id] = p.substitute_teacher_id ?? null; });
        setPeriodSubs(preSelected);
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to load periods'); }
    finally { setLoadingPeriods(false); }
  }, [absentTeacherId, selectedDate, selectedYear]);

  /* ═══ Load Available Teachers for a period ═══ */
  const loadAvailForPeriod = useCallback(async (period: AbsentPeriod) => {
    const key = period.timetable_id;
    if (availableMap[key]) return; // already loaded
    setLoadingAvail(prev => ({ ...prev, [key]: true }));
    try {
      const res = await api.get('/school/substitute-allocations/available-teachers', {
        params: {
          date: selectedDate,
          start_time: period.start_time,
          end_time: period.end_time,
          exclude_teacher_id: absentTeacherId,
          academic_year_id: selectedYear,
        },
      });
      if (res.data.success) {
        setAvailableMap(prev => ({ ...prev, [key]: res.data.data || [] }));
      }
    } catch { /* silent */ }
    finally { setLoadingAvail(prev => ({ ...prev, [key]: false })); }
  }, [selectedDate, absentTeacherId, selectedYear, availableMap]);

  /* ═══ Bulk Save All ═══ */
  const handleSaveAll = async () => {
    if (!absentTeacherId || !selectedYear) { toast.error('Select absent teacher and academic year'); return; }
    const assignments = periods
      .filter(p => periodSubs[p.timetable_id])
      .map(p => ({
        timetable_id:           p.timetable_id,
        substitute_teacher_id:  periodSubs[p.timetable_id],
        class_id:               p.class_id,
        section_id:             p.section_id,
        subject_id:             p.subject_id,
        period_number:          p.period_number,
        start_time:             p.start_time,
        end_time:               p.end_time,
      }));

    if (!assignments.length) { toast.error('Assign at least one period'); return; }
    setSavingAll(true);
    try {
      const res = await api.post('/school/substitute-allocations/bulk', {
        academic_year_id:    selectedYear,
        date:                selectedDate,
        original_teacher_id: absentTeacherId,
        absence_reason:      absenceReason,
        leave_reference:     leaveRef,
        notes,
        assignments,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Substitutes assigned!');
        loadStats();
        loadPeriods();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSavingAll(false); }
  };

  /* ═══ Load Logs ═══ */
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params: Record<string, any> = { per_page: 25, page: logsPage };
      if (filtDate)   params.date                   = filtDate;
      if (filtOrigId) params.original_teacher_id    = filtOrigId;
      if (filtSubId)  params.substitute_teacher_id  = filtSubId;
      if (filtStatus) params.status                 = filtStatus;
      const res = await api.get('/school/substitute-allocations', { params });
      if (res.data.success) {
        setLogs(res.data.data || []);
        setLogsTotal(res.data.meta?.total || 0);
        setLogsPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load logs'); }
    finally { setLoadingLogs(false); }
  }, [logsPage, filtDate, filtOrigId, filtSubId, filtStatus]);

  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  /* ═══ Update allocation ═══ */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditBusy(true);
    try {
      const res = await api.put(`/school/substitute-allocations/${editModal.record.id}`, {
        substitute_teacher_id: editModal.subId,
        status: editModal.status,
        review_remarks: editModal.remarks,
      });
      if (res.data.success) { toast.success('Updated'); setEditModal(null); loadLogs(); loadStats(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditBusy(false); }
  };

  /* ═══ Delete allocation ═══ */
  const handleDelete = async (id: number) => {
    if (!confirm('Remove this substitute allocation?')) return;
    try {
      await api.delete(`/school/substitute-allocations/${id}`);
      toast.success('Removed'); loadLogs(); loadStats();
    } catch { toast.error('Failed'); }
  };

  /* ═══ Load Workload ═══ */
  const loadWorkload = useCallback(async () => {
    setLoadingWork(true);
    try {
      const res = await api.get('/school/substitute-allocations/workload', { params: { from_date: workFrom, to_date: workTo } });
      if (res.data.success) setWorkload(res.data.data || []);
    } catch { toast.error('Failed to load workload'); }
    finally { setLoadingWork(false); }
  }, [workFrom, workTo]);

  useEffect(() => { if (tab === 'workload') loadWorkload(); }, [tab, loadWorkload]);

  /* ─── Computed ─── */
  const assignedCount = useMemo(() => periods.filter(p => periodSubs[p.timetable_id]).length, [periods, periodSubs]);
  const totalCount    = periods.length;
  const absentTeacher = teachers.find(t => t.id === absentTeacherId);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><Shuffle className="w-5 h-5" /></span>
            Substitute Teacher Allocation
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Quickly assign substitutes for absent teachers with real-time availability checks.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'This Month',   val: stats.total_month, bg: 'bg-slate-50',    text: 'text-slate-700'   },
            { label: 'Today',        val: stats.today,       bg: 'bg-violet-50',   text: 'text-violet-700'  },
            { label: 'Assigned',     val: stats.assigned,    bg: 'bg-sky-50',      text: 'text-sky-700'     },
            { label: 'Confirmed',    val: stats.confirmed,   bg: 'bg-indigo-50',   text: 'text-indigo-700'  },
            { label: 'Completed',    val: stats.completed,   bg: 'bg-emerald-50',  text: 'text-emerald-700' },
            { label: 'Cancelled',    val: stats.cancelled,   bg: 'bg-rose-50',     text: 'text-rose-700'    },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-white shadow-sm p-3`}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-2xl font-black ${s.text}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═════════════════════════ TAB: ASSIGN ═════════════════════════ */}
      {tab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT: Selection panel */}
          <div className="lg:col-span-1 space-y-3">
            {/* Academic Year */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Step 1 — Select Date & Teacher</h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ⭐' : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Absence</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
                {selectedDate && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    📅 {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Absent Teacher <span className="text-rose-500">*</span></label>
                <select value={absentTeacherId ?? ''} onChange={e => setAbsentTeacherId(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
                </select>
              </div>

              {absentTeacher && (
                <div className="flex items-center gap-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <Avatar name={absentTeacher.name} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-rose-700">{absentTeacher.name}</p>
                    <p className="text-[10px] text-rose-500">{absentTeacher.department || 'Teacher'} · {absentTeacher.employee_id}</p>
                  </div>
                  <UserX className="w-4 h-4 text-rose-400 ml-auto" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Absence Reason</label>
                <select value={absenceReason} onChange={e => setAbsenceReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                  {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Leave Reference</label>
                <input type="text" placeholder="Leave application ID..." value={leaveRef} onChange={e => setLeaveRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                <textarea rows={2} placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 resize-none" />
              </div>

              <button onClick={loadPeriods} disabled={!absentTeacherId || !selectedDate || loadingPeriods}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-40">
                {loadingPeriods ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Load Timetable
              </button>
            </div>

            {/* Top Absent & Top Subs from stats */}
            {stats && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-3">
                {stats.top_absent.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">⚠️ Frequent Absentees (Month)</h4>
                    {stats.top_absent.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-600 truncate">{t.name || '—'}</span>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">{t.cnt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.top_subs.length > 0 && (
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">🏆 Top Substitutes (Month)</h4>
                    {stats.top_subs.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs text-slate-600 truncate">{t.name || '—'}</span>
                        <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">{t.cnt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Period allocation grid */}
          <div className="lg:col-span-2 space-y-3">
            {/* Progress bar */}
            {periods.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold">{assignedCount} / {totalCount} periods assigned</span>
                    <span>{Math.round((assignedCount / totalCount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }} />
                  </div>
                </div>
                <button onClick={handleSaveAll} disabled={savingAll || assignedCount === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-40">
                  {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save All
                </button>
              </div>
            )}

            {/* Period cards */}
            {loadingPeriods ? (
              <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400">Loading timetable...</p>
                </div>
              </div>
            ) : periods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
                {absentTeacherId ? (
                  <>
                    <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400 font-semibold">No periods found</p>
                    <p className="text-xs text-slate-400 mt-1">This teacher has no scheduled classes on the selected day.</p>
                  </>
                ) : (
                  <>
                    <UserX className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400 font-semibold">Select an absent teacher and click Load Timetable</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {periods.map(period => {
                  const selectedSubId = periodSubs[period.timetable_id];
                  const avail = availableMap[period.timetable_id] || [];
                  const isLoading = !!loadingAvail[period.timetable_id];
                  const selectedSub = avail.find(t => t.id === selectedSubId);
                  const isAssigned = period.is_assigned && !!selectedSubId;

                  return (
                    <div key={period.timetable_id}
                      className={`bg-white border-2 rounded-xl p-4 shadow-sm transition ${isAssigned ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                      <div className="flex items-start gap-3">
                        {/* Period badge */}
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-100 flex flex-col items-center justify-center">
                          <span className="text-[9px] font-bold text-violet-500 uppercase">Per.</span>
                          <span className="text-sm font-black text-violet-700">{period.period_number}</span>
                        </div>

                        {/* Period info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-slate-800">{period.subject_name}</span>
                            {period.subject_code && <span className="text-[10px] font-mono text-slate-400">[{period.subject_code}]</span>}
                            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                              {period.class_name}{period.section_name ? ' - ' + period.section_name : ''}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              🕐 {period.start_time} – {period.end_time}
                            </span>
                            {period.room_number && (
                              <span className="text-[10px] text-slate-400">📍 Room {period.room_number}</span>
                            )}
                          </div>

                          {/* Substitute selector */}
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedSubId ?? ''}
                              onFocus={() => loadAvailForPeriod(period)}
                              onChange={e => setPeriodSubs(prev => ({ ...prev, [period.timetable_id]: parseInt(e.target.value) || null }))}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer"
                            >
                              <option value="">— Select Substitute Teacher —</option>
                              {avail.map(t => (
                                <option key={t.id} value={t.id} disabled={!t.is_available}>
                                  {t.is_available ? '✅' : '🚫'} {t.name} ({t.employee_id}){t.reason ? ` [${t.reason}]` : ''}
                                </option>
                              ))}
                              {avail.length === 0 && !isLoading && (
                                <option value="" disabled>Click to load available teachers</option>
                              )}
                            </select>

                            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />}

                            {selectedSubId && (
                              <button onClick={() => setPeriodSubs(prev => ({ ...prev, [period.timetable_id]: null }))}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Selected sub info */}
                          {selectedSub && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Avatar name={selectedSub.name} size="sm" />
                              <div>
                                <p className="text-xs font-bold text-slate-700">{selectedSub.name}</p>
                                <p className="text-[10px] text-slate-400">{selectedSub.department || ''}</p>
                              </div>
                              {period.is_assigned && period.substitute_teacher_id === selectedSubId && (
                                <StatusBadge status="assigned" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Save bottom */}
                <div className="flex justify-end pt-2">
                  <button onClick={handleSaveAll} disabled={savingAll || assignedCount === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-md disabled:opacity-40">
                    {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save {assignedCount} Substitute{assignedCount !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════ TAB: LOGS ═════════════════════════ */}
      {tab === 'logs' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <input type="date" value={filtDate} onChange={e => setFiltDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm" />
            <select value={filtOrigId} onChange={e => setFiltOrigId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Absent Teachers</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={filtSubId} onChange={e => setFiltSubId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Substitutes</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={filtStatus} onChange={e => setFiltStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Status</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={() => { setLogsPage(1); loadLogs(); }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <span className="text-[10px] text-slate-400 ml-auto">{logsTotal} records</span>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-14">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No allocations found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Date', 'Period', 'Class / Subject', 'Absent Teacher', 'Substitute', 'Reason', 'Status', 'Actions'].map(h => (
                          <th key={h} className="py-3 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-800">{log.date}</p>
                            <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-base font-black text-violet-600">{log.period_number}</span>
                            <p className="text-[9px] text-slate-400">{log.start_time}–{log.end_time}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-xs font-bold text-slate-800">{log.subject_name}</p>
                            <p className="text-[10px] text-slate-500">{log.class_name}{log.section_name ? ' - ' + log.section_name : ''}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <Avatar name={log.original_name} size="sm" />
                              <div>
                                <p className="text-xs font-bold text-slate-700">{log.original_name}</p>
                                <p className="text-[10px] font-mono text-rose-400">{log.original_emp_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <Avatar name={log.substitute_name} size="sm" />
                              <div>
                                <p className="text-xs font-bold text-slate-700">{log.substitute_name}</p>
                                <p className="text-[10px] font-mono text-emerald-500">{log.substitute_emp_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-xs text-slate-600">{log.absence_reason || '—'}</p>
                          </td>
                          <td className="py-2.5 px-3"><StatusBadge status={log.status} /></td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditModal({ record: log, subId: log.substitute_teacher_id, status: log.status, remarks: '' })}
                                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(log.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
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
                  <span className="text-[11px] text-slate-500">Page {logsPage} of {logsPages} · {logsTotal} total</span>
                  <div className="flex gap-2">
                    <button disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={logsPage >= logsPages} onClick={() => setLogsPage(p => p + 1)}
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

      {/* ═════════════════════════ TAB: WORKLOAD ═════════════════════════ */}
      {tab === 'workload' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <input type="date" value={workFrom} onChange={e => setWorkFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={workTo} onChange={e => setWorkTo(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm" />
            <button onClick={loadWorkload}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Load
            </button>
          </div>

          {loadingWork ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : workload.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No workload data for this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workload.map((row, i) => {
                const maxCount = workload[0]?.total_substitutions || 1;
                const pct = Math.round((row.total_substitutions / maxCount) * 100);
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                      </div>
                      <Avatar name={row.name || '?'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">{row.name || '—'}</p>
                          {row.department && <span className="text-[10px] text-slate-400">{row.department}</span>}
                          <span className="font-mono text-[10px] text-slate-400">{row.employee_id}</span>
                        </div>
                        {/* Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-lg font-black text-violet-700">{row.total_substitutions}</span>
                            <div className="text-[9px] text-right space-y-0.5">
                              <p className="text-emerald-600 font-bold">{row.completed} completed</p>
                              <p className="text-rose-500 font-bold">{row.cancelled} cancelled</p>
                            </div>
                          </div>
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

      {/* ═════════════════════════ EDIT MODAL ═════════════════════════ */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-violet-600" /> Edit Allocation
              </h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="rounded-xl p-3 border border-violet-100 bg-violet-50 space-y-1">
                <p className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">{editModal.record.original_name}</span> → Period {editModal.record.period_number}
                </p>
                <p className="text-[10px] text-slate-500">{editModal.record.subject_name} · {editModal.record.class_name} · {editModal.record.date}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Substitute Teacher</label>
                <select value={editModal.subId ?? ''} onChange={e => setEditModal(m => m ? { ...m, subId: parseInt(e.target.value) || null } : m)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                <select value={editModal.status} onChange={e => setEditModal(m => m ? { ...m, status: e.target.value } : m)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 cursor-pointer">
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={editBusy}
                  className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {editBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
