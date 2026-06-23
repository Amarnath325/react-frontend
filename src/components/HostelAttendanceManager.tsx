import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, ClipboardList, BarChart3, CalendarDays, Plus,
  Search, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, X,
  Check, Users, Clock, TrendingUp, AlertTriangle, BookOpen,
  UserCheck, UserX, LogOut, Timer, Sunrise, Sunset, Moon,
  Zap, Eye, Filter, Send, Ban, ThumbsUp, ThumbsDown
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'sessions' | 'markroll' | 'report' | 'leaves';

interface Session {
  id: number; session_code: string; session_date: string; session_date_raw: string;
  session_type: string; session_time?: string; taken_by?: string; block_name?: string;
  status: 'Open' | 'Closed'; total_students: number;
  present_count: number; absent_count: number; leave_count: number;
  late_count: number; outpass_count: number; attendance_pct: number;
  notes?: string; created_at?: string;
}

interface AttendanceRecord {
  id: number; session_id: number;
  student_name: string; room_number?: string; block_name?: string;
  student_class?: string; admission_number?: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late' | 'Outpass';
  marked_at?: string; marked_by?: string; remarks?: string;
}

interface StudentStat {
  student_name: string; room_number?: string; block_name?: string; student_class?: string;
  total_sessions: number; present: number; absent: number; on_leave: number; late: number; outpass: number;
  percentage: number; status: 'Good' | 'Average' | 'Low';
}

interface Leave {
  id: number; leave_code: string; student_name: string; room_number?: string;
  block_name?: string; student_class?: string;
  from_date: string; to_date: string; total_days: number; leave_type: string;
  reason: string; applied_by?: string; approved_by?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejection_reason?: string; created_at?: string;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const statusConfig = {
  Present: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500', icon: UserCheck },
  Absent:  { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-300',    dot: 'bg-rose-500',   icon: UserX },
  Leave:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',  icon: LogOut },
  Late:    { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500', icon: Timer },
  Outpass: { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  dot: 'bg-indigo-500', icon: LogOut },
};

const sessionTypeConfig = {
  'Morning Roll Call':  { icon: Sunrise, color: 'text-amber-600',  bg: 'bg-amber-50',  time: '7:00 AM' },
  'Evening Roll Call':  { icon: Sunset,  color: 'text-orange-600', bg: 'bg-orange-50', time: '6:00 PM' },
  'Night Curfew Check': { icon: Moon,    color: 'text-indigo-600', bg: 'bg-indigo-50', time: '10:00 PM' },
  'Special':            { icon: Zap,     color: 'text-violet-600', bg: 'bg-violet-50', time: '' },
};

const leaveStatusConfig = {
  Pending:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  Approved:  { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Rejected:  { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  Cancelled: { color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   dot: 'bg-slate-400' },
};

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
const AttPct: React.FC<{ pct: number }> = ({ pct }) => {
  const color = pct >= 90 ? 'text-emerald-700' : pct >= 75 ? 'text-amber-700' : 'text-rose-700';
  const bg    = pct >= 90 ? 'bg-emerald-500'   : pct >= 75 ? 'bg-amber-500'   : 'bg-rose-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[9px] font-black ${color} w-8 text-right`}>{pct}%</span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; size?: 'xs' | 'sm' }> = ({ status, size = 'sm' }) => {
  const c = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.Present;
  const px = size === 'xs' ? 'px-1 py-0' : 'px-1.5 py-0.5';
  return (
    <span className={`inline-flex items-center gap-0.5 ${px} rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{status}
    </span>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
interface DashProps {
  stats: any; trend: any[]; defaulters: any[]; todaySessions: Session[];
  absentToday: any[]; loading: boolean; onTabChange: (t: TabId) => void;
}
const DashboardTab: React.FC<DashProps> = ({ stats, trend, defaulters, todaySessions, absentToday, loading, onTabChange }) => (
  <div className="space-y-2">
    {/* Today's attendance summary */}
    <div className={`rounded-xl p-2.5 border flex items-center gap-3 ${stats.todayPct >= 90 ? 'bg-emerald-50 border-emerald-200' : stats.todayPct >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
      <div className={`text-center ${stats.todayPct >= 90 ? 'text-emerald-700' : stats.todayPct >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>
        <p className="text-3xl font-black leading-none">{stats.todayPct}%</p>
        <p className="text-[8px] font-bold uppercase tracking-wide">Today's Avg</p>
      </div>
      <div className="flex-1 grid grid-cols-5 gap-1">
        {[
          { label: 'Present',  value: stats.todayPresent,  color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
          { label: 'Absent',   value: stats.todayAbsent,   color: 'text-rose-700',    bg: 'bg-rose-50 border border-rose-200' },
          { label: 'On Leave', value: stats.todayLeave,    color: 'text-amber-700',   bg: 'bg-amber-50 border border-amber-200' },
          { label: 'Late',     value: stats.todayLate,     color: 'text-orange-700',  bg: 'bg-orange-50 border border-orange-200' },
          { label: 'Outpass',  value: stats.todayOutpass,  color: 'text-indigo-700',  bg: 'bg-indigo-50 border border-indigo-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg ${s.bg} text-center p-1`}>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color}`}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="text-right">
        <p className="text-[8px] font-bold text-slate-500">Total Students</p>
        <p className="text-xl font-black text-slate-800">{stats.totalStudents}</p>
        <p className="text-[7px] text-slate-400 font-semibold">{stats.openSessions} open session{stats.openSessions !== 1 ? 's' : ''}</p>
      </div>
    </div>

    {/* Quick stats */}
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { label: 'Monthly Sessions', value: stats.monthSessions, color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
        { label: 'Pending Leaves',   value: stats.pendingLeaves, color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
        { label: 'Open Sessions',    value: stats.openSessions,  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
        { label: 'Total Students',   value: stats.totalStudents, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      ].map(s => (
        <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-1.5 text-center`}>
          <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
          <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5`}>{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-2">
      {/* Trend */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> 7-Day Attendance Trend</h3>
        <div className="space-y-1">
          {trend.map(t => (
            <div key={t.date} className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-slate-400 w-16 truncate">{t.date}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${t.attendance >= 90 ? 'bg-emerald-500' : t.attendance >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${t.attendance}%` }} />
              </div>
              <span className={`text-[8px] font-black w-8 text-right ${t.attendance >= 90 ? 'text-emerald-700' : t.attendance >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>{t.attendance}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's sessions */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1"><ClipboardList className="w-2.5 h-2.5" /> Today's Sessions</span>
          <button onClick={() => onTabChange('sessions')} className="text-indigo-400 hover:text-indigo-600 text-[8px] font-bold cursor-pointer transition">View All →</button>
        </h3>
        {todaySessions.length === 0 ? (
          <p className="text-[8px] text-slate-400 font-semibold text-center py-2">No sessions today yet</p>
        ) : (
          <div className="space-y-1">
            {todaySessions.map(s => {
              const tc = sessionTypeConfig[s.session_type as keyof typeof sessionTypeConfig] ?? sessionTypeConfig.Special;
              const Icon = tc.icon;
              return (
                <div key={s.id} className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${s.status === 'Open' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                  <Icon className={`w-3 h-3 ${tc.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-800 truncate">{s.session_type}</p>
                    <p className="text-[7px] text-slate-400 font-semibold">{s.attendance_pct}% · {s.present_count}P/{s.absent_count}A/{s.leave_count}L</p>
                  </div>
                  <span className={`text-[7px] font-bold px-1 rounded ${s.status === 'Open' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* Defaulters */}
    {defaulters.length > 0 && (
      <div className="bg-white border border-rose-200 rounded-xl p-2.5">
        <h3 className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> Frequent Absentees (Last 7 Days)
        </h3>
        <div className="space-y-1">
          {defaulters.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-rose-50 border border-rose-100 rounded-lg">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 text-[8px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-900 truncate">{d.student_name}</p>
                <p className="text-[7px] text-slate-500 font-semibold">Room {d.room_number} · {d.block_name}</p>
              </div>
              <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">{d.absent_count} absent</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Absent today */}
    {absentToday.length > 0 && (
      <div className="bg-white border border-orange-200 rounded-xl p-2.5">
        <h3 className="text-[9px] font-bold text-orange-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <UserX className="w-2.5 h-2.5" /> Absent Today
        </h3>
        <div className="flex flex-wrap gap-1">
          {absentToday.map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-[8px] font-bold text-orange-800">{s.student_name}</span>
              <span className="text-[7px] text-orange-500">Rm.{s.room_number}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── SESSIONS TAB ─────────────────────────────────────────────────────────────
interface SessionsTabProps { sessions: Session[]; loading: boolean; onRefresh: () => void; onTakeRoll: (s: Session) => void; }
const SessionsTab: React.FC<SessionsTabProps> = ({ sessions, loading, onRefresh, onTakeRoll }) => {
  const [showForm, setSF]       = useState(false);
  const [submitting, setSub]    = useState(false);
  const [filterDate, setFD]     = useState('');
  const [filterType, setFT]     = useState('all');
  const [filterStatus, setFS]   = useState('all');
  const [closing, setClosing]   = useState<number | null>(null);

  const [form, setForm] = useState({
    session_type: 'Morning Roll Call', session_date: new Date().toISOString().split('T')[0],
    session_time: '07:00', taken_by: '', block_name: '', notes: '',
  });

  const filtered = sessions.filter(s => {
    const matchDate = !filterDate || s.session_date_raw === filterDate;
    const matchType = filterType === 'all' || s.session_type === filterType;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchDate && matchType && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true);
    try {
      const r = await api.post('/school/hostel/attendance/sessions', form);
      if (r.data.success) { toast.success(r.data.message); setSF(false); onRefresh(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSub(false); }
  };

  const handleClose = async (id: number, code: string) => {
    setClosing(id);
    try {
      const r = await api.post(`/school/hostel/attendance/sessions/${id}/close`);
      if (r.data.success) { toast.success(r.data.message); onRefresh(); }
    } catch { toast.error('Failed to close session'); }
    finally { setClosing(null); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <input type="date" value={filterDate} onChange={e => setFD(e.target.value)}
          className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white outline-none cursor-pointer" />
        <select value={filterType} onChange={e => setFT(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Types</option>
          {['Morning Roll Call', 'Evening Roll Call', 'Night Curfew Check', 'Special'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFS(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'Open', 'Closed'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setSF(!showForm)}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
            <Plus className="w-3 h-3" /> New Session
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Plus className="w-3 h-3 text-indigo-500" /> Create Attendance Session
          </h3>
          <form onSubmit={handleCreate} className="space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className={lbl}>Session Type *</label>
                <select value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))} className={inp}>
                  {['Morning Roll Call', 'Evening Roll Call', 'Night Curfew Check', 'Special'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Date *</label>
                <input type="date" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Time</label>
                <input type="time" value={form.session_time} onChange={e => setForm(f => ({ ...f, session_time: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Taken By</label>
                <input value={form.taken_by} onChange={e => setForm(f => ({ ...f, taken_by: e.target.value }))} placeholder="Warden name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Block (optional)</label>
                <select value={form.block_name} onChange={e => setForm(f => ({ ...f, block_name: e.target.value }))} className={inp}>
                  <option value="">All Blocks</option>
                  {['Block A', 'Block B', 'Block C', 'Block D'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />{submitting ? 'Creating...' : 'Create & Open Session'}
              </button>
              <button type="button" onClick={() => setSF(false)} className="px-3 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <p className="text-[8px] font-bold text-slate-400">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div> : (
        <div className="space-y-1.5">
          {filtered.map(s => {
            const tc = sessionTypeConfig[s.session_type as keyof typeof sessionTypeConfig] ?? sessionTypeConfig.Special;
            const Icon = tc.icon;
            return (
              <div key={s.id} className={`bg-white border rounded-xl p-2.5 shadow-xs hover:border-indigo-200 transition ${s.status === 'Open' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${tc.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${tc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[10px] font-bold text-slate-900">{s.session_type}</h4>
                      <span className="text-[8px] font-bold text-slate-400">{s.session_code}</span>
                      <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${s.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                    </div>
                    <p className="text-[8px] text-slate-500 font-semibold mt-0.5">{s.session_date} · {s.session_time ?? ''} · By: {s.taken_by ?? '—'}</p>

                    {/* Attendance bar */}
                    <div className="mt-1.5">
                      <AttPct pct={s.attendance_pct} />
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {[
                          { label: 'P', value: s.present_count, color: 'text-emerald-700 bg-emerald-50' },
                          { label: 'A', value: s.absent_count,  color: 'text-rose-700 bg-rose-50' },
                          { label: 'L', value: s.leave_count,   color: 'text-amber-700 bg-amber-50' },
                          { label: 'Lt', value: s.late_count,   color: 'text-orange-700 bg-orange-50' },
                          { label: 'Op', value: s.outpass_count,color: 'text-indigo-700 bg-indigo-50' },
                        ].map(st => (
                          <span key={st.label} className={`text-[8px] font-black ${st.color} px-1 rounded`}>{st.label}: {st.value}</span>
                        ))}
                        <span className="text-[8px] text-slate-400 font-semibold">/ {s.total_students}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => onTakeRoll(s)}
                      className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[8px] font-bold cursor-pointer transition ${s.status === 'Open' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <ClipboardList className="w-2.5 h-2.5" /> {s.status === 'Open' ? 'Take Roll' : 'View'}
                    </button>
                    {s.status === 'Open' && (
                      <button onClick={() => handleClose(s.id, s.session_code)} disabled={closing === s.id}
                        className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[8px] font-bold cursor-pointer border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                        <Check className="w-2.5 h-2.5" /> {closing === s.id ? '...' : 'Close'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MARK ROLL CALL TAB ───────────────────────────────────────────────────────
interface MarkRollProps { sessions: Session[]; onRefresh: () => void; }
const MarkRollTab: React.FC<MarkRollProps> = ({ sessions, onRefresh }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered]       = useState<AttendanceRecord[]>([]);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<number, { status: string; remarks: string }>>({});

  const openSessions = sessions.filter(s => s.status === 'Open');

  const loadRecords = async (session: Session) => {
    setLoading(true);
    setLocalChanges({});
    try {
      const r = await api.get(`/school/hostel/attendance/sessions/${session.id}/records`);
      if (r.data.success) {
        setRecords(r.data.data.records);
        setFiltered(r.data.data.records);
      }
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedSession) loadRecords(selectedSession);
  }, [selectedSession]);

  useEffect(() => {
    let f = records;
    if (search) f = f.filter(r => r.student_name.toLowerCase().includes(search.toLowerCase()) || r.room_number?.includes(search));
    if (statusFilter !== 'all') f = f.filter(r => {
      const effective = localChanges[r.id]?.status ?? r.status;
      return effective === statusFilter;
    });
    setFiltered(f);
  }, [records, search, statusFilter, localChanges]);

  const getStatus = (r: AttendanceRecord) => localChanges[r.id]?.status ?? r.status;
  const getRemarks = (r: AttendanceRecord) => localChanges[r.id]?.remarks ?? r.remarks ?? '';

  const setStudentStatus = (id: number, status: string) => {
    setLocalChanges(prev => ({ ...prev, [id]: { status, remarks: prev[id]?.remarks ?? '' } }));
  };

  const setStudentRemarks = (id: number, remarks: string) => {
    const current = localChanges[id];
    setLocalChanges(prev => ({ ...prev, [id]: { status: current?.status ?? 'Present', remarks } }));
  };

  const quickMarkAll = (status: string) => {
    const changes: Record<number, { status: string; remarks: string }> = {};
    filtered.forEach(r => { changes[r.id] = { status, remarks: '' }; });
    setLocalChanges(prev => ({ ...prev, ...changes }));
    toast.success(`Marked ${filtered.length} students as ${status}`);
  };

  const saveAll = async () => {
    if (!selectedSession || Object.keys(localChanges).length === 0) { toast('No changes to save'); return; }
    setSaving(true);
    try {
      const recordsPayload = Object.entries(localChanges).map(([id, val]) => ({ id: parseInt(id), status: val.status, remarks: val.remarks }));
      const r = await api.post(`/school/hostel/attendance/sessions/${selectedSession.id}/bulk-mark`, { records: recordsPayload });
      if (r.data.success) {
        toast.success(r.data.message);
        setLocalChanges({});
        await loadRecords(selectedSession);
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const changes = Object.keys(localChanges).length;
  const statusCounts = (['Present', 'Absent', 'Leave', 'Late', 'Outpass'] as const).reduce((acc, st) => {
    acc[st] = filtered.filter(r => (localChanges[r.id]?.status ?? r.status) === st).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-2">
      {/* Session picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-2">
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Select Session for Roll Call</label>
        <select value={selectedSession?.id ?? ''} onChange={e => {
          const id = parseInt(e.target.value);
          setSelectedSession(sessions.find(s => s.id === id) ?? null);
        }} className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
          <option value="">— Select a Session —</option>
          {sessions.slice(0, 20).map(s => (
            <option key={s.id} value={s.id}>{s.session_type} · {s.session_date} · {s.status === 'Open' ? '🟢 OPEN' : '🔴 Closed'} · {s.session_code}</option>
          ))}
        </select>
      </div>

      {!selectedSession ? (
        <div className="text-center py-12 flex flex-col items-center gap-2">
          <ClipboardList className="w-12 h-12 text-slate-200" />
          <p className="text-[10px] text-slate-400 font-semibold">Select a session to take roll call</p>
          {openSessions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {openSessions.slice(0, 3).map(s => {
                const tc = sessionTypeConfig[s.session_type as keyof typeof sessionTypeConfig] ?? sessionTypeConfig.Special;
                const Icon = tc.icon;
                return (
                  <button key={s.id} onClick={() => setSelectedSession(s)}
                    className={`flex items-center gap-1 px-2 py-1 ${tc.bg} border border-slate-200 rounded-lg text-[8px] font-bold ${tc.color} cursor-pointer hover:shadow-sm transition`}>
                    <Icon className="w-3 h-3" /> {s.session_type}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Session Header */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-indigo-900">{selectedSession.session_type} — {selectedSession.session_date}</p>
              <p className="text-[8px] text-indigo-600 font-semibold">{selectedSession.session_code} · By: {selectedSession.taken_by ?? '—'} · Status: {selectedSession.status}</p>
            </div>
            <div className="flex gap-1">
              {(['Present', 'Absent', 'Leave'] as const).map(st => {
                const sc = statusConfig[st];
                return (
                  <span key={st} className={`text-[7px] font-bold ${sc.color} ${sc.bg} px-1.5 py-0.5 rounded-full border ${sc.border}`}>
                    {st[0]}: {statusCounts[st] ?? 0}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <div className="relative flex-1 min-w-28">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student / room..."
                className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
              <option value="all">All Status</option>
              {['Present', 'Absent', 'Leave', 'Late', 'Outpass'].map(s => <option key={s}>{s}</option>)}
            </select>
            {/* Quick mark */}
            <div className="flex gap-0.5">
              <button onClick={() => quickMarkAll('Present')} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[8px] rounded cursor-pointer hover:bg-emerald-200 transition">All P</button>
              <button onClick={() => quickMarkAll('Absent')} className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-[8px] rounded cursor-pointer hover:bg-rose-200 transition">All A</button>
            </div>
            {changes > 0 && (
              <button onClick={saveAll} disabled={saving}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg cursor-pointer transition disabled:opacity-60">
                <Send className="w-2.5 h-2.5" /> {saving ? 'Saving...' : `Save ${changes} Change${changes !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {/* Records */}
          {loading ? (
            <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading student list...</div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(r => {
                const currentStatus = getStatus(r) as keyof typeof statusConfig;
                const sc = statusConfig[currentStatus] ?? statusConfig.Present;
                const changed = !!localChanges[r.id];
                return (
                  <div key={r.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${changed ? `${sc.bg} ${sc.border}` : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    {/* Room */}
                    <div className="w-12 flex-shrink-0">
                      <p className="text-[9px] font-black text-slate-700 leading-none">Rm.{r.room_number}</p>
                      <p className="text-[7px] text-slate-400 font-semibold leading-none">{r.block_name?.replace('Block ', 'Blk ')}</p>
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-bold truncate ${changed ? sc.color : 'text-slate-800'}`}>{r.student_name}</p>
                      <p className="text-[7px] text-slate-400 font-semibold">{r.student_class}</p>
                    </div>
                    {/* Remarks (for absent/late) */}
                    {(currentStatus === 'Absent' || currentStatus === 'Late') && (
                      <input value={getRemarks(r)} onChange={e => setStudentRemarks(r.id, e.target.value)}
                        placeholder="Remarks..." className="text-[8px] border border-slate-200 rounded px-1 py-0.5 w-24 outline-none focus:ring-1 focus:ring-slate-300" />
                    )}
                    {/* Status Buttons */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {(['Present', 'Absent', 'Leave', 'Late', 'Outpass'] as const).map(st => {
                        const stc = statusConfig[st];
                        const active = currentStatus === st;
                        return (
                          <button key={st} onClick={() => setStudentStatus(r.id, st)} title={st}
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[7px] cursor-pointer border transition ${active ? `${stc.bg} ${stc.border} ${stc.color}` : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                            {st[0]}
                          </button>
                        );
                      })}
                    </div>
                    {changed && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Save */}
          {changes > 0 && (
            <div className="sticky bottom-0 pt-1">
              <button onClick={saveAll} disabled={saving}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5">
                <Send className="w-3 h-3" /> {saving ? 'Saving...' : `Save ${changes} Change${changes !== 1 ? 's' : ''} to Session`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── REPORT TAB ───────────────────────────────────────────────────────────────
interface ReportTabProps { loading?: boolean; }
const ReportTab: React.FC<ReportTabProps> = () => {
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFS]   = useState('all');
  const [sortBy, setSortBy]     = useState<'name' | 'pct' | 'absent'>('pct');
  const [sortDir, setSD]        = useState<'asc' | 'desc'>('asc');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/school/hostel/attendance/student-report?days=${days}`);
      if (r.data.success) setStudents(r.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [days]);

  const filtered = students.filter(s => {
    const matchS = !search || s.student_name.toLowerCase().includes(search.toLowerCase()) || s.room_number?.includes(search);
    const matchSt = filterStatus === 'all' || s.status === filterStatus;
    return matchS && matchSt;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.student_name.localeCompare(b.student_name);
    else if (sortBy === 'pct') cmp = a.percentage - b.percentage;
    else cmp = a.absent - b.absent;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggle = (col: typeof sortBy) => {
    if (sortBy === col) setSD(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSD('asc'); }
  };

  const statusColors = { Good: 'bg-emerald-100 text-emerald-700', Average: 'bg-amber-100 text-amber-700', Low: 'bg-rose-100 text-rose-700' };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student / room..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {[7, 15, 30, 60, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFS(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'Good', 'Average', 'Low'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Good (≥90%)',    value: students.filter(s => s.status === 'Good').length,    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Average (75-90%)',value: students.filter(s => s.status === 'Average').length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Low (<75%)',     value: students.filter(s => s.status === 'Low').length,     color: 'text-rose-700 bg-rose-50 border-rose-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-1.5 text-center ${s.color}`}>
            <p className="text-xl font-black leading-none">{s.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading report...</div> : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-2 py-1.5 text-left font-bold text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggle('name')}>
                  Student {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-2 py-1.5 text-center font-bold text-slate-500">Sessions</th>
                <th className="px-2 py-1.5 text-center font-bold text-slate-500">P</th>
                <th className="px-2 py-1.5 text-center font-bold text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggle('absent')}>
                  A {sortBy === 'absent' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-2 py-1.5 text-center font-bold text-slate-500">L</th>
                <th className="px-2 py-1.5 text-center font-bold text-slate-500">Lt</th>
                <th className="px-2 py-1.5 text-right font-bold text-slate-500 cursor-pointer hover:text-slate-700" onClick={() => toggle('pct')}>
                  % {sortBy === 'pct' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 transition ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  <td className="px-2 py-1.5">
                    <p className="font-bold text-slate-900">{s.student_name}</p>
                    <p className="text-[7px] text-slate-400">Rm.{s.room_number} · {s.student_class}</p>
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-600">{s.total_sessions}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-emerald-700">{s.present}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-rose-700">{s.absent}</td>
                  <td className="px-2 py-1.5 text-center font-semibold text-amber-600">{s.on_leave}</td>
                  <td className="px-2 py-1.5 text-center font-semibold text-orange-600">{s.late}</td>
                  <td className="px-2 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.percentage >= 90 ? 'bg-emerald-500' : s.percentage >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.percentage}%` }} />
                      </div>
                      <span className={`font-black text-[9px] ${s.percentage >= 90 ? 'text-emerald-700' : s.percentage >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>{s.percentage}%</span>
                      <span className={`text-[7px] font-bold px-1 rounded ${statusColors[s.status]}`}>{s.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── LEAVES TAB ───────────────────────────────────────────────────────────────
interface LeavesTabProps { leaves: Leave[]; loading: boolean; onRefresh: () => void; }
const LeavesTab: React.FC<LeavesTabProps> = ({ leaves, loading, onRefresh }) => {
  const [showForm, setSF]     = useState(false);
  const [submitting, setSub]  = useState(false);
  const [filterStatus, setFS] = useState('all');
  const [search, setSearch]   = useState('');
  const [actioning, setActioning] = useState<number | null>(null);
  const [rejectModal, setRM]  = useState<Leave | null>(null);
  const [rejectReason, setRR] = useState('');

  const [form, setForm] = useState({
    student_name: '', room_number: '', block_name: '', student_class: '',
    from_date: '', to_date: '', leave_type: 'Home Visit', reason: '', applied_by: 'Parent',
  });

  const filtered = leaves.filter(l => {
    const matchS = filterStatus === 'all' || l.status === filterStatus;
    const matchQ = !search || l.student_name.toLowerCase().includes(search.toLowerCase()) || l.leave_code.toLowerCase().includes(search.toLowerCase());
    return matchS && matchQ;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.from_date || !form.to_date || !form.reason.trim()) { toast.error('Required fields missing'); return; }
    setSub(true);
    try {
      const r = await api.post('/school/hostel/attendance/leaves', form);
      if (r.data.success) { toast.success(r.data.message); setSF(false); onRefresh(); setForm({ student_name: '', room_number: '', block_name: '', student_class: '', from_date: '', to_date: '', leave_type: 'Home Visit', reason: '', applied_by: 'Parent' }); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSub(false); }
  };

  const handleApprove = async (id: number) => {
    setActioning(id);
    try { const r = await api.post(`/school/hostel/attendance/leaves/${id}/approve`, { approved_by: 'Chief Warden' }); if (r.data.success) { toast.success(r.data.message); onRefresh(); } } catch { toast.error('Failed'); }
    finally { setActioning(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSub(true);
    try { const r = await api.post(`/school/hostel/attendance/leaves/${rejectModal.id}/reject`, { rejection_reason: rejectReason }); if (r.data.success) { toast.success(r.data.message); setRM(null); setRR(''); onRefresh(); } } catch { toast.error('Failed'); }
    finally { setSub(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student / code..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={e => setFS(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
        <button onClick={() => setSF(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Apply Leave
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <CalendarDays className="w-3 h-3 text-indigo-500" /> Apply for Leave
          </h3>
          <form onSubmit={handleCreate} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={lbl}>Student Name *</label>
                <input value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Room Number</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. 204" className={inp} />
              </div>
              <div>
                <label className={lbl}>From Date *</label>
                <input type="date" value={form.from_date} onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>To Date *</label>
                <input type="date" value={form.to_date} onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Leave Type *</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} className={inp}>
                  {['Home Visit', 'Medical', 'Personal', 'Emergency', 'Event'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Applied By</label>
                <select value={form.applied_by} onChange={e => setForm(f => ({ ...f, applied_by: e.target.value }))} className={inp}>
                  {['Parent', 'Student', 'Warden'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Reason *</label>
                <textarea rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={`${inp} resize-none`} required />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1">
                <Send className="w-3 h-3" />{submitting ? 'Submitting...' : 'Submit Leave Application'}
              </button>
              <button type="button" onClick={() => setSF(false)} className="px-3 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div> : (
        <div className="space-y-1.5">
          {filtered.map(l => {
            const lsc = leaveStatusConfig[l.status] ?? leaveStatusConfig.Pending;
            const lTypeColors: Record<string, string> = {
              'Home Visit': 'bg-teal-50 text-teal-700', Medical: 'bg-pink-50 text-pink-700',
              Personal: 'bg-violet-50 text-violet-700', Emergency: 'bg-rose-50 text-rose-700', Event: 'bg-indigo-50 text-indigo-700',
            };
            return (
              <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs hover:border-indigo-200 transition">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[10px] font-bold text-slate-900">{l.student_name}</h4>
                      <span className="text-[8px] font-bold text-slate-400">{l.leave_code}</span>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${lsc.color} ${lsc.bg} ${lsc.border}`}>{l.status}</span>
                      <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${lTypeColors[l.leave_type] ?? 'bg-slate-50 text-slate-500'}`}>{l.leave_type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[8px] text-slate-500 font-semibold flex-wrap">
                      {l.room_number && <span>Room {l.room_number}</span>}
                      {l.student_class && <span>{l.student_class}</span>}
                      <span className="flex items-center gap-0.5"><CalendarDays className="w-2 h-2" />{l.from_date} → {l.to_date} ({l.total_days}d)</span>
                    </div>
                    <p className="text-[8px] text-slate-600 font-semibold mt-0.5 line-clamp-2">{l.reason}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[7px] text-slate-400">
                      {l.applied_by && <span>By: {l.applied_by}</span>}
                      {l.approved_by && <span>Approved: {l.approved_by}</span>}
                      {l.rejection_reason && <span className="text-rose-500">Reason: {l.rejection_reason}</span>}
                    </div>
                  </div>
                  {l.status === 'Pending' && (
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => handleApprove(l.id)} disabled={actioning === l.id}
                        className="flex items-center gap-0.5 px-1.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-emerald-100 transition">
                        <ThumbsUp className="w-2.5 h-2.5" /> {actioning === l.id ? '...' : 'Approve'}
                      </button>
                      <button onClick={() => setRM(l)}
                        className="flex items-center gap-0.5 px-1.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-rose-100 transition">
                        <ThumbsDown className="w-2.5 h-2.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2" onClick={e => e.target === e.currentTarget && setRM(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-3">
            <h3 className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 mb-2"><Ban className="w-4 h-4 text-rose-500" /> Reject Leave</h3>
            <p className="text-[9px] text-slate-500 font-semibold mb-2">{rejectModal.student_name} · {rejectModal.from_date} to {rejectModal.to_date}</p>
            <div>
              <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Rejection Reason (optional)</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRR(e.target.value)} placeholder="Why is the leave being rejected?" className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-rose-500 resize-none" />
            </div>
            <div className="flex gap-1.5 mt-2">
              <button onClick={handleReject} disabled={submitting} className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60 cursor-pointer">
                {submitting ? 'Rejecting...' : 'Reject Leave'}
              </button>
              <button onClick={() => setRM(null)} className="px-3 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const HostelAttendanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const [dashStats, setDashStats]     = useState<any>({ todayPresent: 0, todayAbsent: 0, todayLeave: 0, todayLate: 0, todayOutpass: 0, todayTotal: 0, todayPct: 0, monthSessions: 0, totalStudents: 0, pendingLeaves: 0, openSessions: 0 });
  const [trend, setTrend]             = useState<any[]>([]);
  const [defaulters, setDefaulters]   = useState<any[]>([]);
  const [todaySessions, setTodaySess] = useState<Session[]>([]);
  const [absentToday, setAbsentToday] = useState<any[]>([]);
  const [dashLoading, setDashLoad]    = useState(true);

  const [sessions, setSessions]   = useState<Session[]>([]);
  const [sessLoad, setSessLoad]   = useState(true);
  const [leaves, setLeaves]       = useState<Leave[]>([]);
  const [leavesLoad, setLeavLoad] = useState(true);

  const [rollSession, setRollSession] = useState<Session | null>(null);

  const fetchDashboard = async () => {
    setDashLoad(true);
    try {
      const r = await api.get('/school/hostel/attendance/dashboard');
      if (r.data.success) {
        const d = r.data.data;
        setDashStats(d.stats); setTrend(d.trend); setDefaulters(d.defaulters);
        setTodaySess(d.today_sessions); setAbsentToday(d.absent_today);
      }
    } catch (e) { console.error(e); }
    finally { setDashLoad(false); }
  };

  const fetchSessions = async () => {
    setSessLoad(true);
    try { const r = await api.get('/school/hostel/attendance/sessions'); if (r.data.success) setSessions(r.data.data); } catch(e) { console.error(e); }
    finally { setSessLoad(false); }
  };

  const fetchLeaves = async () => {
    setLeavLoad(true);
    try { const r = await api.get('/school/hostel/attendance/leaves'); if (r.data.success) setLeaves(r.data.data); } catch(e) { console.error(e); }
    finally { setLeavLoad(false); }
  };

  useEffect(() => { fetchDashboard(); fetchSessions(); fetchLeaves(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') { fetchDashboard(); fetchSessions(); }
    if (activeTab === 'sessions' || activeTab === 'markroll') fetchSessions();
    if (activeTab === 'leaves') fetchLeaves();
  }, [activeTab]);

  const handleTakeRoll = (s: Session) => {
    setRollSession(s);
    setActiveTab('markroll');
  };

  const refreshAll = () => { fetchDashboard(); fetchSessions(); fetchLeaves(); };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'sessions',  label: 'Sessions',   icon: ClipboardList, badge: dashStats.openSessions || undefined },
    { id: 'markroll',  label: 'Mark Roll',  icon: UserCheck },
    { id: 'report',    label: 'Report',     icon: BarChart3 },
    { id: 'leaves',    label: 'Leaves',     icon: CalendarDays, badge: dashStats.pendingLeaves || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <ClipboardList className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Attendance Tracking</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              Today: {dashStats.todayPct}% attendance · {dashStats.openSessions} open session{dashStats.openSessions !== 1 ? 's' : ''} · {dashStats.pendingLeaves} pending leave{dashStats.pendingLeaves !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.openSessions > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-600 text-white animate-pulse">
              <Clock className="w-2 h-2" /> {dashStats.openSessions} open
            </span>
          )}
          {dashStats.pendingLeaves > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
              <CalendarDays className="w-2 h-2" /> {dashStats.pendingLeaves} leaves
            </span>
          )}
          <button onClick={refreshAll} className="p-1 hover:bg-slate-100 rounded-lg transition cursor-pointer">
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 pb-0.5 flex-shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition duration-150 cursor-pointer text-[10px] shadow-xs ${
                isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}>
              <Icon className={`w-2.5 h-2.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-0.5 px-1 bg-rose-500 text-white text-[7px] font-black rounded-full leading-none py-0.5">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'dashboard' && (
          <DashboardTab stats={dashStats} trend={trend} defaulters={defaulters} todaySessions={todaySessions}
            absentToday={absentToday} loading={dashLoading} onTabChange={setActiveTab} />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab sessions={sessions} loading={sessLoad} onRefresh={() => { fetchSessions(); fetchDashboard(); }} onTakeRoll={handleTakeRoll} />
        )}
        {activeTab === 'markroll' && (
          <MarkRollTab sessions={sessions} onRefresh={() => { fetchSessions(); fetchDashboard(); }} />
        )}
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'leaves' && (
          <LeavesTab leaves={leaves} loading={leavesLoad} onRefresh={() => { fetchLeaves(); fetchDashboard(); }} />
        )}
      </div>
    </div>
  );
};

export default HostelAttendanceManager;
