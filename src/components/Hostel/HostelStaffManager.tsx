import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  LayoutDashboard, Users, CalendarCheck, ClipboardList,
  ShieldCheck, Plus, Search, ChevronDown, ChevronUp,
  Phone, Building2, Clock, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, UserCog, BadgeCheck,
  Stethoscope, Utensils, Zap, Shield, Sparkles,
  BarChart2, Briefcase, CalendarDays, Activity,
  UserCheck, UserX, FileText, PenLine, Check, X,
  Star, Award, Calendar, Home
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'staff' | 'attendance' | 'roster' | 'leaves';

interface Staff {
  id: number; staff_code: string; name: string; phone: string; email?: string;
  designation: string; department: string; block_assigned?: string;
  shift_type: string; shift_start?: string; shift_end?: string;
  joining_date?: string; salary?: number;
  emergency_contact?: string; emergency_phone?: string;
  id_type?: string; id_number?: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Resigned';
  qualifications?: string; notes?: string;
  today_att?: { status: string; check_in?: string } | null;
  attendance?: { id: number; status: string; check_in?: string; check_out?: string; remarks?: string } | null;
}

interface Leave {
  id: number; staff_id: number; staff_name: string;
  designation: string; department: string;
  leave_type: string; from_date: string; to_date: string;
  days_count: number; reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approved_by?: string; approved_at?: string; admin_notes?: string;
}

interface DashStats {
  total_staff: number; on_leave: number; today_present: number;
  today_absent: number; pending_leaves: number; on_duty_now: number; on_duty_shift: string;
}

// ─── DEPT CONFIG ──────────────────────────────────────────────────────────────

const deptConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'Administration':   { color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: Briefcase },
  'Security':         { color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-300',  icon: Shield },
  'Kitchen & Mess':   { color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', icon: Utensils },
  'Housekeeping':     { color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   icon: Sparkles },
  'Maintenance':      { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Zap },
  'Medical':          { color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',   icon: Stethoscope },
};

const deptDefault = { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: UserCog };

const statusConfig = {
  Active:   { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'On Leave': { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500 animate-pulse' },
  Inactive: { color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  Resigned: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-500' },
};

const attConfig: Record<string, { color: string; bg: string; label: string }> = {
  Present:   { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'P' },
  Absent:    { color: 'text-rose-700',    bg: 'bg-rose-50',    label: 'A' },
  'Half Day':{ color: 'text-amber-700',   bg: 'bg-amber-50',   label: 'H' },
  Leave:     { color: 'text-blue-700',    bg: 'bg-blue-50',    label: 'L' },
  Holiday:   { color: 'text-violet-700',  bg: 'bg-violet-50',  label: 'Ho' },
  Late:      { color: 'text-orange-700',  bg: 'bg-orange-50',  label: 'Lt' },
};

const leaveStatusCfg = {
  Pending:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400 animate-pulse' },
  Approved:  { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Rejected:  { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  Cancelled: { color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-300' },
};

const shiftColors: Record<string, string> = {
  Morning:    'bg-yellow-400 text-yellow-900',
  Evening:    'bg-orange-400 text-orange-900',
  Night:      'bg-indigo-600 text-white',
  Rotational: 'bg-violet-400 text-violet-900',
  Off:        'bg-slate-200 text-slate-500',
  'On Call':  'bg-teal-400 text-teal-900',
};

// ─── BADGE COMPONENTS ─────────────────────────────────────────────────────────

const DeptBadge: React.FC<{ dept: string }> = ({ dept }) => {
  const c = deptConfig[dept] ?? deptDefault;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <Icon className="w-2 h-2" /> {dept}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.Active;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} /> {status}
    </span>
  );
};

const ShiftBadge: React.FC<{ shift: string }> = ({ shift }) => (
  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${shiftColors[shift] || shiftColors.Morning}`}>
    {shift}
  </span>
);

// ─── STAFF CARD ───────────────────────────────────────────────────────────────

interface StaffCardProps {
  staff: Staff;
  onStatusChange?: (id: number, status: string) => void;
  compact?: boolean;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff: s, onStatusChange, compact }) => {
  const dc = deptConfig[s.department] ?? deptDefault;
  const DeptIcon = dc.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Avatar + name row */}
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${dc.bg} ${dc.color} border ${dc.border}`}>
              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[8px] font-bold text-slate-400">{s.staff_code}</span>
                <ShiftBadge shift={s.shift_type} />
              </div>
              <h4 className="text-[11px] font-bold text-slate-900 leading-tight truncate">{s.name}</h4>
            </div>
          </div>

          {/* Designation + dept */}
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[9px] font-semibold text-slate-600">{s.designation}</span>
            <DeptBadge dept={s.department} />
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-[9px]">
              <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                <Phone className="w-2 h-2" /> {s.phone}
              </span>
              {s.block_assigned && (
                <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                  <Home className="w-2 h-2" /> {s.block_assigned}
                </span>
              )}
              {s.shift_start && (
                <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                  <Clock className="w-2 h-2" /> {s.shift_start} – {s.shift_end}
                </span>
              )}
              {s.joining_date && (
                <span className="text-slate-500 font-semibold">
                  Joined: <span className="text-slate-700">{s.joining_date}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={s.status} />
          {s.today_att && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${attConfig[s.today_att.status]?.bg || 'bg-slate-50'} ${attConfig[s.today_att.status]?.color || 'text-slate-500'}`}>
              {attConfig[s.today_att.status]?.label || '?'}
            </span>
          )}
          {!compact && onStatusChange && (
            <select
              className="text-[8px] font-bold border border-slate-200 rounded px-1 py-0.5 bg-white cursor-pointer outline-none"
              value={s.status}
              onChange={e => onStatusChange(s.id, e.target.value)}>
              {['Active', 'On Leave', 'Inactive', 'Resigned'].map(st => <option key={st}>{st}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats; deptBreakdown: any[]; shiftSummary: any[];
  recentLeaves: Leave[]; todayAttendance: Staff[];
  loading: boolean; onTabChange: (t: TabId) => void;
  onStatusChange: (id: number, status: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats, deptBreakdown, shiftSummary, recentLeaves, todayAttendance, loading, onTabChange, onStatusChange
}) => {
  const totalDept = deptBreakdown.reduce((a, b) => a + b.count, 0) || 1;
  const attRate = stats.today_present + stats.today_absent > 0
    ? Math.round((stats.today_present / (stats.today_present + stats.today_absent)) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Total Active Staff', value: stats.total_staff,    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'On Duty Now',        value: stats.on_duty_now,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Today Present',      value: stats.today_present,  color: 'text-teal-700',   bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Today Absent',       value: stats.today_absent,   color: 'text-rose-700',   bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'On Leave',           value: stats.on_leave,       color: 'text-amber-700',  bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Pending Leaves',     value: stats.pending_leaves, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 text-center`}>
            <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-tight`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance Rate */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" /> Today's Attendance Rate
          </h3>
          <span className="text-[10px] font-black text-indigo-700">{attRate}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${attRate}%` }} />
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[8px] font-bold text-emerald-700">{stats.today_present} Present</span>
          <span className="text-[8px] font-bold text-rose-700">{stats.today_absent} Absent</span>
          <span className="text-[8px] font-bold text-amber-700">{stats.on_leave} On Leave</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Dept Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart2 className="w-2.5 h-2.5" /> By Department
          </h3>
          <div className="space-y-1.5">
            {deptBreakdown.map(d => {
              const dc = deptConfig[d.department] ?? deptDefault;
              const Icon = dc.icon;
              const pct = Math.round((d.count / totalDept) * 100);
              return (
                <div key={d.department} className="flex items-center gap-2">
                  <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${dc.color}`} />
                  <span className="text-[9px] font-semibold text-slate-600 w-20 truncate">{d.department}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dc.bg} border-0`}
                      style={{ width: `${pct}%`, background: dc.color.replace('text-', '#') }}>
                      <div className={`h-full ${dc.bg.replace('bg-', 'bg-').replace('-50', '-400')} rounded-full`} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 w-6 text-right">{d.count}</span>
                  <span className="text-[8px] text-emerald-600 font-bold">{d.active}✓</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Shift Distribution
          </h3>
          <div className="space-y-1.5">
            {shiftSummary.map((s: any) => (
              <div key={s.shift_type} className="flex items-center justify-between">
                <ShiftBadge shift={s.shift_type} />
                <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${Math.round((s.count / (stats.total_staff || 1)) * 100)}%` }} />
                </div>
                <span className="text-[9px] font-bold text-slate-700">{s.count} staff</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[8px] font-bold text-slate-500 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            Currently on duty: <span className="text-indigo-600 font-black">{stats.on_duty_shift} shift ({stats.on_duty_now})</span>
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      {recentLeaves.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" /> Recent Leave Requests</span>
            <button onClick={() => onTabChange('leaves')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition">View all →</button>
          </h3>
          <div className="space-y-1">
            {recentLeaves.slice(0, 4).map(l => {
              const lc = leaveStatusCfg[l.status];
              return (
                <div key={l.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-2 py-1">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-800">{l.staff_name}</span>
                    <span className="text-[8px] text-slate-400 ml-1">{l.designation}</span>
                    <div className="text-[8px] font-semibold text-slate-500 mt-0.5">
                      {l.leave_type} · {l.from_date} – {l.to_date} ({l.days_count}d)
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold border ${lc.color} ${lc.bg} ${lc.border}`}>
                    <span className={`w-1 h-1 rounded-full ${lc.dot}`} /> {l.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Staff Quick View */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> All Staff — Today</span>
          <button onClick={() => onTabChange('attendance')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition">Mark attendance →</button>
        </h3>
        <div className="space-y-1.5">
          {todayAttendance.slice(0, 6).map(s => (
            <StaffCard key={s.id} staff={s} compact />
          ))}
          {todayAttendance.length > 6 && (
            <p className="text-[8px] text-slate-400 font-semibold text-center">+ {todayAttendance.length - 6} more staff members</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── STAFF TAB ────────────────────────────────────────────────────────────────

interface StaffTabProps {
  staff: Staff[]; loading: boolean;
  onRefresh: () => void;
  onStatusChange: (id: number, status: string) => void;
}

const StaffTab: React.FC<StaffTabProps> = ({ staff, loading, onRefresh, onStatusChange }) => {
  const [search, setSearch]           = useState('');
  const [filterDept, setFilterDept]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', designation: '', department: 'Administration',
    block_assigned: '', shift_type: 'Morning', shift_start: '08:00', shift_end: '17:00',
    joining_date: '', salary: '', address: '',
    emergency_contact: '', emergency_phone: '',
    id_type: 'Aadhar Card', id_number: '', qualifications: '', notes: '',
  });

  const departments = ['Administration', 'Security', 'Kitchen & Mess', 'Housekeeping', 'Maintenance', 'Medical'];

  const filtered = staff.filter(s => {
    const matchSearch = !search || [s.name, s.phone, s.designation, s.staff_code, s.department]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchDept   = filterDept   === 'all' || s.department === filterDept;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.designation.trim()) {
      toast.error('Name, phone and designation required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/staff/add', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        onRefresh();
        setForm({ name: '', phone: '', email: '', designation: '', department: 'Administration', block_assigned: '', shift_type: 'Morning', shift_start: '08:00', shift_end: '17:00', joining_date: '', salary: '', address: '', emergency_contact: '', emergency_phone: '', id_type: 'Aadhar Card', id_number: '', qualifications: '', notes: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally { setSubmitting(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff name, code, designation..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'Active', 'On Leave', 'Inactive', 'Resigned'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Add Staff
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <UserCog className="w-3 h-3 text-indigo-500" /> Add new staff member
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2 md:col-span-1">
                <label className={lbl}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Phone *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Designation *</label>
                <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Assistant Warden" className={inp} required />
              </div>
              <div>
                <label className={lbl}>Department *</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inp}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Block / Location</label>
                <input value={form.block_assigned} onChange={e => setForm(f => ({ ...f, block_assigned: e.target.value }))} placeholder="e.g. Block A, Main Gate" className={inp} />
              </div>
              <div>
                <label className={lbl}>Shift Type *</label>
                <select value={form.shift_type} onChange={e => setForm(f => ({ ...f, shift_type: e.target.value }))} className={inp}>
                  {['Morning', 'Evening', 'Night', 'Rotational'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Shift Start</label>
                <input type="time" value={form.shift_start} onChange={e => setForm(f => ({ ...f, shift_start: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Shift End</label>
                <input type="time" value={form.shift_end} onChange={e => setForm(f => ({ ...f, shift_end: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Joining Date</label>
                <input type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Monthly Salary (₹)</label>
                <input type="number" min="0" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Emergency Contact</label>
                <input value={form.emergency_contact} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} placeholder="Relation — Name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Emergency Phone</label>
                <input value={form.emergency_phone} onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>ID Type</label>
                <select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} className={inp}>
                  {['Aadhar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>ID Number</label>
                <input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <BadgeCheck className="w-3 h-3" /> {submitting ? 'Adding...' : 'Add Staff & Generate ID'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Summary counts */}
      <div className="flex gap-1.5 flex-wrap text-[8px]">
        {Object.entries(departments.reduce((acc, d) => {
          const cnt = staff.filter(s => s.department === d).length;
          if (cnt > 0) acc[d] = cnt;
          return acc;
        }, {} as Record<string, number>)).map(([dept, cnt]) => {
          const dc = deptConfig[dept] ?? deptDefault;
          const Icon = dc.icon;
          return (
            <span key={dept} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border font-bold ${dc.color} ${dc.bg} ${dc.border}`}>
              <Icon className="w-2 h-2" /> {dept}: {cnt}
            </span>
          );
        })}
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading staff records...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No staff found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(s => (
            <StaffCard key={s.id} staff={s} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────

interface AttendanceTabProps {
  loading: boolean;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ loading }) => {
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setList]    = useState<Staff[]>([]);
  const [summary, setSummary]   = useState<Record<string, number>>({});
  const [localAtt, setLocalAtt] = useState<Record<number, string>>({});
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving]     = useState(false);

  const fetchAtt = async () => {
    setFetching(true);
    try {
      const res = await api.get(`/school/hostel/staff/attendance?date=${date}`);
      if (res.data.success) {
        setList(res.data.data.staff);
        setSummary(res.data.data.summary);
        // init local
        const init: Record<number, string> = {};
        res.data.data.staff.forEach((s: Staff) => {
          init[s.id] = s.attendance?.status || 'Present';
        });
        setLocalAtt(init);
      }
    } catch (e) { console.error(e); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchAtt(); }, [date]);

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(localAtt).map(([sid, status]) => ({
        staff_id: Number(sid), status,
      }));
      const res = await api.post('/school/hostel/staff/attendance/bulk', {
        date, records, marked_by: 'Warden',
      });
      if (res.data.success) { toast.success(res.data.message); fetchAtt(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const setAll = (status: string) => {
    const updated: Record<number, string> = {};
    staffList.forEach(s => { updated[s.id] = status; });
    setLocalAtt(updated);
  };

  const attStatuses = ['Present', 'Absent', 'Half Day', 'Leave', 'Late'];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
          <CalendarCheck className="w-3 h-3 text-slate-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-[10px] font-bold border-none outline-none bg-transparent" />
        </div>
        <div className="flex gap-1">
          {['Present', 'Absent'].map(s => (
            <button key={s} onClick={() => setAll(s)}
              className={`px-1.5 py-0.5 text-[8px] font-bold rounded border cursor-pointer transition ${
                s === 'Present' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              }`}>
              All {s}
            </button>
          ))}
        </div>
        <button onClick={handleBulkSave} disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition disabled:opacity-60 ml-auto">
          <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(attConfig).map(([status, cfg]) => (
          <div key={status} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold ${cfg.color} ${cfg.bg} border-slate-200`}>
            <span className="font-black">{cfg.label}</span> {status}: {summary[status] || 0}
          </div>
        ))}
      </div>

      {/* Attendance Sheet */}
      {(fetching || loading) ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider w-6">#</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Staff</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Dept</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Shift</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s, i) => {
                  const curStatus = localAtt[s.id] || 'Present';
                  const ac = attConfig[curStatus];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-2 py-1.5 text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <div className="font-bold text-slate-900 leading-tight">{s.name}</div>
                        <div className="text-[8px] text-slate-400 font-semibold">{s.designation}</div>
                      </td>
                      <td className="px-2 py-1.5"><DeptBadge dept={s.department} /></td>
                      <td className="px-2 py-1.5"><ShiftBadge shift={s.shift_type} /></td>
                      <td className="px-2 py-1.5">
                        <select
                          value={curStatus}
                          onChange={e => setLocalAtt(p => ({ ...p, [s.id]: e.target.value }))}
                          className={`text-[9px] font-bold border rounded-lg px-1.5 py-0.5 cursor-pointer outline-none ${ac?.bg || 'bg-white'} ${ac?.color || 'text-slate-700'} border-slate-200`}>
                          {attStatuses.map(st => <option key={st}>{st}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DUTY ROSTER TAB ──────────────────────────────────────────────────────────

interface RosterTabProps {}

const RosterTab: React.FC<RosterTabProps> = () => {
  const [shifts, setShifts]     = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [startDate, setStart]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({
    staff_id: '', shift_date: new Date().toISOString().split('T')[0],
    shift_type: 'Morning', duty_location: '', start_time: '', end_time: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/hostel/staff/roster');
      if (res.data.success) {
        setShifts(res.data.data.shifts);
        setAllStaff(res.data.data.allStaff);
        setStart(res.data.data.startDate);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoster(); }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id) { toast.error('Select a staff member'); return; }
    setSaving(true);
    try {
      const res = await api.post('/school/hostel/staff/roster/assign', form);
      if (res.data.success) { toast.success(res.data.message); fetchRoster(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to assign shift'); }
    finally { setSaving(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  // Group shifts by day
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-2">
      {/* Assign Form */}
      <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
          <CalendarDays className="w-3 h-3 text-indigo-500" /> Assign / Update Shift
        </h3>
        <form onSubmit={handleAssign} className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2">
              <label className={lbl}>Staff Member</label>
              <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className={inp}>
                <option value="">— Select Staff —</option>
                {allStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Date</label>
              <input type="date" value={form.shift_date} onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Shift</label>
              <select value={form.shift_type} onChange={e => setForm(f => ({ ...f, shift_type: e.target.value }))} className={inp}>
                {['Morning', 'Evening', 'Night', 'Off', 'On Call'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Location</label>
              <input value={form.duty_location} onChange={e => setForm(f => ({ ...f, duty_location: e.target.value }))} placeholder="e.g. Main Gate" className={inp} />
            </div>
            <div>
              <button type="submit" disabled={saving}
                className="w-full h-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] rounded-lg cursor-pointer transition mt-4 disabled:opacity-60">
                <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Assign'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Weekly Roster */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><ClipboardList className="w-2.5 h-2.5" /> This Week's Duty Roster</span>
          <button onClick={fetchRoster} className="p-0.5 hover:bg-slate-100 rounded cursor-pointer"><RefreshCw className="w-3 h-3 text-slate-400" /></button>
        </h3>

        {loading ? (
          <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">Loading roster...</div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">
            No shifts assigned this week. Use the form above to assign shifts.
          </div>
        ) : (
          <div className="space-y-1.5">
            {shifts.map(sh => (
              <div key={sh.id} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition">
                <div className="text-center min-w-10">
                  <p className="text-[8px] font-black text-slate-400 uppercase">{sh.day_label}</p>
                  <p className="text-[9px] font-bold text-slate-700">{sh.shift_date.split(' ')[0]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-900 leading-tight">{sh.staff_name}</span>
                    <ShiftBadge shift={sh.shift_type} />
                  </div>
                  <p className="text-[8px] font-semibold text-slate-500 mt-0.5">{sh.designation} · {sh.duty_location || 'General duty'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── LEAVES TAB ───────────────────────────────────────────────────────────────

interface LeavesTabProps {}

const LeavesTab: React.FC<LeavesTabProps> = () => {
  const [leaves, setLeaves]     = useState<Leave[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    staff_id: '', leave_type: 'Casual',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const [lr, sr] = await Promise.all([
        api.get('/school/hostel/staff/leaves'),
        api.get('/school/hostel/staff/list'),
      ]);
      if (lr.data.success) setLeaves(lr.data.data);
      if (sr.data.success) setAllStaff(sr.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const filteredLeaves = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.reason.trim()) { toast.error('Staff and reason required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/staff/leaves/apply', form);
      if (res.data.success) { toast.success(res.data.message); setShowForm(false); fetchLeaves(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to apply leave'); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (id: number, status: 'Approved' | 'Rejected') => {
    const by = prompt(`${status} by (name):`) || 'Chief Warden';
    try {
      const res = await api.post(`/school/hostel/staff/leaves/${id}/update`, { status, approved_by: by });
      if (res.data.success) { toast.success(res.data.message); fetchLeaves(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to update leave'); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="flex gap-1 flex-wrap">
          {['all', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2 py-0.5 text-[8px] font-bold rounded border cursor-pointer transition ${
                filter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {s === 'all' ? 'All' : s} {s !== 'all' ? `(${leaves.filter(l => l.status === s).length})` : `(${leaves.length})`}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition ml-auto">
          <Plus className="w-3 h-3" /> Apply Leave
        </button>
      </div>

      {/* Apply Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <FileText className="w-3 h-3 text-indigo-500" /> Apply for Leave
          </h3>
          <form onSubmit={handleApply} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2 md:col-span-1">
                <label className={lbl}>Staff Member *</label>
                <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className={inp} required>
                  <option value="">— Select Staff —</option>
                  {allStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Leave Type</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} className={inp}>
                  {['Casual', 'Sick', 'Emergency', 'Earned', 'Unpaid'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>From Date *</label>
                <input type="date" value={form.from_date} onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>To Date *</label>
                <input type="date" value={form.to_date} onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} className={inp} required />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Reason *</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={`${inp} resize-none`} required />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <FileText className="w-3 h-3" /> {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave List */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading leaves...</div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No leave records found.</div>
      ) : (
        <div className="space-y-1.5">
          {filteredLeaves.map(l => {
            const lc = leaveStatusCfg[l.status];
            return (
              <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{l.staff_name}</h4>
                      <span className="text-[8px] text-slate-400 font-semibold">{l.designation} · {l.department}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[9px]">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">{l.leave_type} Leave</span>
                      <span className="text-slate-500 font-semibold">{l.from_date} → {l.to_date}</span>
                      <span className="text-slate-700 font-bold">{l.days_count} day(s)</span>
                    </div>
                    <p className="text-[9px] text-slate-600 font-semibold mt-0.5 line-clamp-2">{l.reason}</p>
                    {l.approved_by && (
                      <p className="text-[8px] text-slate-400 mt-0.5">
                        {l.status} by <span className="font-bold">{l.approved_by}</span> on {l.approved_at}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold border flex-shrink-0 ${lc.color} ${lc.bg} ${lc.border}`}>
                    <span className={`w-1 h-1 rounded-full ${lc.dot}`} /> {l.status}
                  </span>
                </div>

                {l.status === 'Pending' && (
                  <div className="flex gap-1 mt-1.5">
                    <button onClick={() => handleUpdate(l.id, 'Approved')}
                      className="flex-1 flex items-center justify-center gap-0.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer hover:bg-emerald-100 transition">
                      <UserCheck className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => handleUpdate(l.id, 'Rejected')}
                      className="flex-1 flex items-center justify-center gap-0.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[9px] rounded-lg cursor-pointer hover:bg-rose-100 transition">
                      <UserX className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HostelStaffManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const [dashStats, setDashStats]     = useState<DashStats>({ total_staff: 0, on_leave: 0, today_present: 0, today_absent: 0, pending_leaves: 0, on_duty_now: 0, on_duty_shift: 'Morning' });
  const [deptBreakdown, setDeptBD]    = useState<any[]>([]);
  const [shiftSummary, setShiftSum]   = useState<any[]>([]);
  const [recentLeaves, setRecLeaves]  = useState<Leave[]>([]);
  const [todayAtt, setTodayAtt]       = useState<Staff[]>([]);
  const [dashLoading, setDashLoading] = useState(true);

  const [staff, setStaff]             = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await api.get('/school/hostel/staff/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats);
        setDeptBD(d.dept_breakdown);
        setShiftSum(d.shift_summary);
        setRecLeaves(d.recent_leaves);
        setTodayAtt(d.today_attendance);
      }
    } catch (e) { console.error(e); }
    finally { setDashLoading(false); }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/school/hostel/staff/list');
      if (res.data.success) setStaff(res.data.data);
    } catch (e) { console.error(e); }
    finally { setStaffLoading(false); }
  };

  useEffect(() => { fetchDashboard(); fetchStaff(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await api.post(`/school/hostel/staff/${id}/status`, { status });
      if (res.data.success) { toast.success(res.data.message); fetchStaff(); fetchDashboard(); }
      else toast.error(res.data.message);
    } catch { toast.error('Failed to update status'); }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'staff',     label: 'Staff Register',  icon: Users,           badge: staff.length || undefined },
    { id: 'attendance',label: 'Attendance',      icon: CalendarCheck,   badge: dashStats.today_absent || undefined },
    { id: 'roster',    label: 'Duty Roster',     icon: ClipboardList },
    { id: 'leaves',    label: 'Leave Mgmt',      icon: CalendarDays,    badge: dashStats.pending_leaves || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <ShieldCheck className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Staff &amp; Warden Management</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              Shri Ram Boys Hostel · {dashStats.total_staff} staff · {dashStats.today_present} present today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.pending_leaves > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-violet-50 text-violet-700 border-violet-200 animate-pulse">
              <Clock className="w-2.5 h-2.5" /> {dashStats.pending_leaves} leave pending
            </span>
          )}
          {dashStats.today_absent > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
              <AlertTriangle className="w-2.5 h-2.5" /> {dashStats.today_absent} absent
            </span>
          )}
          <button onClick={() => { fetchDashboard(); fetchStaff(); }} className="p-1 hover:bg-slate-100 rounded-lg transition cursor-pointer">
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
                <span className="ml-0.5 px-1 bg-rose-500 text-white text-[7px] font-black rounded-full leading-none py-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={dashStats} deptBreakdown={deptBreakdown} shiftSummary={shiftSummary}
            recentLeaves={recentLeaves} todayAttendance={todayAtt}
            loading={dashLoading} onTabChange={setActiveTab} onStatusChange={handleStatusChange}
          />
        )}
        {activeTab === 'staff'      && <StaffTab staff={staff} loading={staffLoading} onRefresh={fetchStaff} onStatusChange={handleStatusChange} />}
        {activeTab === 'attendance' && <AttendanceTab loading={false} />}
        {activeTab === 'roster'     && <RosterTab />}
        {activeTab === 'leaves'     && <LeavesTab />}
      </div>
    </div>
  );
};

export default HostelStaffManager;
