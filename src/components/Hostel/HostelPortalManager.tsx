import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  LayoutDashboard, Users, Bell, MessageSquare, Eye,
  Plus, Search, RefreshCw, ChevronDown, ChevronUp,
  Phone, Mail, Home, Key, Lock, Unlock, Pin, PinOff,
  IndianRupee, CreditCard, AlertCircle, CheckCircle2,
  Clock, User, Shield, BookOpen, Calendar, Activity,
  Heart, Stethoscope, FileText, MapPin, Smartphone,
  Send, MessageCircle, Volume2, Megaphone, BellRing,
  CalendarDays, TrendingUp, X, Check, RefreshCcw,
  ChevronRight, ClipboardList, Zap, Globe
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'students' | 'notices' | 'messages';

interface PortalStudent {
  id: number; student_name: string; student_class?: string;
  room_number?: string; block_name?: string; roll_number?: string; admission_number?: string;
  phone?: string; email?: string; date_of_birth?: string; blood_group: string;
  parent_name?: string; parent_phone?: string; parent_email?: string; parent_relation?: string;
  warden_name?: string; warden_phone?: string; hostel_name?: string; joining_date?: string;
  portal_pin?: string; parent_pin?: string;
  fee_status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  fee_amount: number; fee_paid: number; fee_balance: number; fee_due_date?: string;
  is_active: boolean; notes?: string; messages_count: number; created_at?: string;
}

interface Notice {
  id: number; title: string; content: string;
  category: string; priority: 'Normal' | 'High' | 'Critical';
  target: string; published_by?: string; valid_until?: string;
  is_pinned: boolean; is_active: boolean; created_at?: string; time_ago?: string;
}

interface PortalMessage {
  id: number; student_id: number; student_name?: string;
  sender_type: 'Parent' | 'Warden'; sender_name?: string;
  message: string; is_read: boolean; created_at?: string; time_ago?: string;
}

interface DashStats {
  totalStudents: number; activeNotices: number; urgentNotices: number; unreadMsgs: number;
  pinnedCount: number; overdueStudents: number; feePending: number; totalFeePaid: number; totalFeeAmount: number;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const feeStatusConfig = {
  Paid:     { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Partial:  { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  Pending:  { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',     dot: 'bg-blue-400' },
  Overdue:  { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',     dot: 'bg-rose-500 animate-pulse' },
};

const noticeCategoryConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'General':      { color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-200',  icon: Bell },
  'Urgent':       { color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',   icon: BellRing },
  'Mess & Diet':  { color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', icon: ClipboardList },
  'Event':        { color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', icon: Calendar },
  'Holiday':      { color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   icon: CalendarDays },
  'Fees':         { color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: IndianRupee },
  'Health':       { color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',icon: Heart },
  'Rules':        { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Shield },
};

const priorityConfig = {
  Normal:   { color: 'text-slate-500',  bg: 'bg-slate-100', dot: '' },
  High:     { color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-500' },
  Critical: { color: 'text-rose-700',   bg: 'bg-rose-50',   dot: 'bg-rose-600 animate-pulse' },
};

const bloodGroupColors: Record<string, string> = {
  'A+': 'text-rose-700 bg-rose-50 border-rose-200', 'A-': 'text-rose-700 bg-rose-100 border-rose-300',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200', 'B-': 'text-blue-700 bg-blue-100 border-blue-300',
  'AB+': 'text-violet-700 bg-violet-50 border-violet-200', 'AB-': 'text-violet-700 bg-violet-100 border-violet-300',
  'O+': 'text-emerald-700 bg-emerald-50 border-emerald-200', 'O-': 'text-emerald-700 bg-emerald-100 border-emerald-300',
  'Unknown': 'text-slate-500 bg-slate-100 border-slate-200',
};

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────

const FeeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = feeStatusConfig[status as keyof typeof feeStatusConfig] ?? feeStatusConfig.Pending;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const c = priorityConfig[priority as keyof typeof priorityConfig] ?? priorityConfig.Normal;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${c.bg} ${c.color}`}>
      {c.dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}{priority}
    </span>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats; feeBreakdown: Record<string, number>;
  noticesByCategory: Record<string, number>;
  pinnedNotices: Notice[]; recentMessages: PortalMessage[];
  recentActivities: any[]; loading: boolean;
  onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats, feeBreakdown, noticesByCategory, pinnedNotices, recentMessages, recentActivities, loading, onTabChange
}) => {
  const feeCollectionPct = stats.totalFeeAmount > 0 ? Math.round((stats.totalFeePaid / stats.totalFeeAmount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Registered Students', value: stats.totalStudents,    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Active Notices',       value: stats.activeNotices,    color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
          { label: 'Unread Parent Msgs',   value: stats.unreadMsgs,       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
          { label: 'Urgent Notices',       value: stats.urgentNotices,    color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
          { label: 'Overdue Fees',         value: stats.overdueStudents,  color: 'text-rose-800',   bg: 'bg-rose-100',  border: 'border-rose-300' },
          { label: 'Pinned Notices',       value: stats.pinnedCount,      color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Fee Collected',        value: `₹${(stats.totalFeePaid/1000).toFixed(0)}k`,  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Fee Pending',          value: `₹${(stats.feePending/1000).toFixed(0)}k`,   color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-1.5 text-center`}>
            <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-tight`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(stats.urgentNotices > 0 || stats.unreadMsgs > 0 || stats.overdueStudents > 0) && (
        <div className="flex gap-1.5 flex-wrap">
          {stats.urgentNotices > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1.5 flex-1">
              <BellRing className="w-3 h-3 text-rose-500 flex-shrink-0 animate-pulse" />
              <p className="text-[9px] font-bold text-rose-800">{stats.urgentNotices} critical notices active</p>
              <button onClick={() => onTabChange('notices')} className="ml-auto text-[8px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer transition">View →</button>
            </div>
          )}
          {stats.unreadMsgs > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 flex-1">
              <MessageCircle className="w-3 h-3 text-amber-500 flex-shrink-0 animate-pulse" />
              <p className="text-[9px] font-bold text-amber-800">{stats.unreadMsgs} unread parent messages</p>
              <button onClick={() => onTabChange('messages')} className="ml-auto text-[8px] font-bold text-amber-600 hover:text-amber-800 cursor-pointer transition">Reply →</button>
            </div>
          )}
        </div>
      )}

      {/* Fee Collection Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><IndianRupee className="w-2.5 h-2.5 text-emerald-500" /> Fee Collection Status</span>
          <span className={`text-[10px] font-black ${feeCollectionPct >= 80 ? 'text-emerald-700' : feeCollectionPct >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>{feeCollectionPct}%</span>
        </h3>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-1.5">
          <div className={`h-full rounded-full transition-all duration-700 ${feeCollectionPct >= 80 ? 'bg-emerald-400' : feeCollectionPct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
            style={{ width: `${feeCollectionPct}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(['Paid', 'Partial', 'Pending', 'Overdue'] as const).map(st => {
            const fc = feeStatusConfig[st];
            return (
              <div key={st} className={`${fc.bg} border ${fc.border} rounded-lg p-1 text-center`}>
                <p className={`text-[11px] font-black ${fc.color}`}>{feeBreakdown[st] || 0}</p>
                <p className={`text-[7px] font-bold ${fc.color}`}>{st}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Pinned Notices */}
        {pinnedNotices.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1"><Pin className="w-2.5 h-2.5 text-violet-500" /> Pinned Notices</span>
              <button onClick={() => onTabChange('notices')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition text-[8px]">All →</button>
            </h3>
            <div className="space-y-1">
              {pinnedNotices.map(n => {
                const nc = noticeCategoryConfig[n.category] ?? noticeCategoryConfig.General;
                const Icon = nc.icon;
                return (
                  <div key={n.id} className={`border rounded-lg px-2 py-1 ${nc.border} ${nc.bg}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${nc.color}`} />
                      <span className={`text-[9px] font-bold ${nc.color} flex-1 truncate`}>{n.title}</span>
                      <PriorityBadge priority={n.priority} />
                    </div>
                    <p className="text-[8px] text-slate-400 mt-0.5">{n.target} · {n.time_ago}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notice Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Bell className="w-2.5 h-2.5" /> Notices by Category
          </h3>
          <div className="space-y-1">
            {Object.entries(noticesByCategory).map(([cat, count]) => {
              const nc = noticeCategoryConfig[cat] ?? noticeCategoryConfig.General;
              const Icon = nc.icon;
              const maxCat = Math.max(...Object.values(noticesByCategory), 1);
              return (
                <div key={cat} className="flex items-center gap-1.5">
                  <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${nc.color}`} />
                  <span className="text-[8px] font-semibold text-slate-600 flex-1 truncate">{cat}</span>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-indigo-400`} style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 w-3 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unread Messages */}
      {recentMessages.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5" /> Recent Parent Messages</span>
            <button onClick={() => onTabChange('messages')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition text-[8px]">Reply →</button>
          </h3>
          <div className="space-y-1">
            {recentMessages.map(m => (
              <div key={m.id} className={`border rounded-lg px-2 py-1.5 ${m.is_read ? 'border-slate-100 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-1.5">
                  {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />}
                  <span className="text-[9px] font-bold text-slate-900">{m.student_name}</span>
                  <span className="text-[7px] font-semibold text-slate-400 ml-auto">{m.time_ago}</span>
                </div>
                <p className="text-[8px] text-slate-600 font-semibold mt-0.5 line-clamp-2">{m.message}</p>
                <p className="text-[7px] text-slate-400 mt-0.5">From: {m.sender_name} (Parent)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" /> Recent Portal Activity
          </h3>
          <div className="space-y-1">
            {recentActivities.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-0.5 border-b border-slate-50">
                <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${a.actor === 'Parent' ? 'bg-violet-50 text-violet-700' : a.actor === 'Warden' ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-indigo-700'}`}>{a.actor}</span>
                <span className="text-[8px] font-semibold text-slate-700 flex-1 truncate">{a.description}</span>
                <span className="text-[7px] text-slate-400">{a.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STUDENTS TAB ─────────────────────────────────────────────────────────────

interface StudentsTabProps {
  students: PortalStudent[]; loading: boolean;
  onRefresh: () => void; onViewStudent: (s: PortalStudent) => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ students, loading, onRefresh, onViewStudent }) => {
  const [search, setSearch]           = useState('');
  const [filterFee, setFilterFee]     = useState('all');
  const [expandedId, setExpanded]     = useState<number | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    student_name: '', student_class: '', room_number: '', block_name: '',
    roll_number: '', admission_number: '', phone: '', email: '',
    date_of_birth: '', blood_group: 'Unknown',
    parent_name: '', parent_phone: '', parent_email: '', parent_relation: 'Father',
    warden_name: '', warden_phone: '', hostel_name: '',
    joining_date: new Date().toISOString().split('T')[0],
    fee_amount: '', fee_paid: '', fee_due_date: '', notes: '',
  });

  const filtered = students.filter(s => {
    const matchS  = !search || [s.student_name, s.room_number, s.admission_number, s.student_class, s.parent_name]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchFee = filterFee === 'all' || s.fee_status === filterFee;
    return matchS && matchFee;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim()) { toast.error('Student name required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/portal/students', form);
      if (res.data.success) {
        toast.success(res.data.message, { duration: 5000 });
        setShowForm(false);
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create account'); }
    finally { setSubmitting(false); }
  };

  const handleResetPins = async (id: number, name: string) => {
    setResettingId(id);
    try {
      const res = await api.post(`/school/hostel/portal/students/${id}/reset-pins`);
      if (res.data.success) {
        toast.success(`PINs reset! Student: ${res.data.portal_pin} · Parent: ${res.data.parent_pin}`, { duration: 6000 });
        onRefresh();
      }
    } catch { toast.error('Failed to reset PINs'); }
    finally { setResettingId(null); }
  };

  const inp  = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl  = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, room, admission, parent..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterFee} onChange={e => setFilterFee(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Fee Status</option>
          {['Paid', 'Partial', 'Pending', 'Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Add Student
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Globe className="w-3 h-3 text-indigo-500" /> Create portal account (PINs auto-generated)
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={lbl}>Student Name *</label>
                <input value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Class / Section</label>
                <input value={form.student_class} onChange={e => setForm(f => ({ ...f, student_class: e.target.value }))} placeholder="e.g. Class XI-A" className={inp} />
              </div>
              <div>
                <label className={lbl}>Room Number</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Block Name</label>
                <input value={form.block_name} onChange={e => setForm(f => ({ ...f, block_name: e.target.value }))} placeholder="e.g. Block A" className={inp} />
              </div>
              <div>
                <label className={lbl}>Admission Number</label>
                <input value={form.admission_number} onChange={e => setForm(f => ({ ...f, admission_number: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Blood Group</label>
                <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} className={inp}>
                  {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Student Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Student Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2"><div className="border-t border-dashed border-slate-200 pt-1.5"><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Parent Information</p></div></div>
              <div>
                <label className={lbl}>Parent Name</label>
                <input value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Relation</label>
                <select value={form.parent_relation} onChange={e => setForm(f => ({ ...f, parent_relation: e.target.value }))} className={inp}>
                  {['Father', 'Mother', 'Guardian', 'Sibling', 'Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Parent Phone</label>
                <input value={form.parent_phone} onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Parent Email</label>
                <input type="email" value={form.parent_email} onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2"><div className="border-t border-dashed border-slate-200 pt-1.5"><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fee & Hostel Info</p></div></div>
              <div>
                <label className={lbl}>Hostel Name</label>
                <input value={form.hostel_name} onChange={e => setForm(f => ({ ...f, hostel_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Warden Name</label>
                <input value={form.warden_name} onChange={e => setForm(f => ({ ...f, warden_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Total Fee Amount (₹)</label>
                <input type="number" min="0" value={form.fee_amount} onChange={e => setForm(f => ({ ...f, fee_amount: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Fee Paid So Far (₹)</label>
                <input type="number" min="0" value={form.fee_paid} onChange={e => setForm(f => ({ ...f, fee_paid: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Fee Due Date</label>
                <input type="date" value={form.fee_due_date} onChange={e => setForm(f => ({ ...f, fee_due_date: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Joining Date</label>
                <input type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <Key className="w-3 h-3" /> {submitting ? 'Creating...' : 'Create Account & Generate PINs'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Student Cards */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No students found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(s => {
            const fc = feeStatusConfig[s.fee_status] ?? feeStatusConfig.Pending;
            const feePct = s.fee_amount > 0 ? Math.round((s.fee_paid / s.fee_amount) * 100) : 0;
            return (
              <div key={s.id} className={`bg-white border rounded-xl p-2.5 shadow-xs hover:border-indigo-200 transition ${s.fee_status === 'Overdue' ? 'border-rose-200' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                    {s.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[11px] font-bold text-slate-900">{s.student_name}</h4>
                      {s.student_class && <span className="text-[8px] text-slate-400 font-semibold">{s.student_class}</span>}
                      {s.room_number && <span className="text-[8px] text-slate-500 font-semibold flex items-center gap-0.5"><Home className="w-2 h-2" />{s.block_name} · Rm {s.room_number}</span>}
                      <span className={`text-[8px] font-black border px-1 py-0.5 rounded-full ${bloodGroupColors[s.blood_group] || bloodGroupColors.Unknown}`}>{s.blood_group}</span>
                      <FeeStatusBadge status={s.fee_status} />
                      {!s.is_active && <span className="text-[7px] font-bold text-slate-400 bg-slate-100 px-1 rounded">INACTIVE</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[8px] text-slate-500">
                      {s.admission_number && <span className="font-bold">{s.admission_number}</span>}
                      {s.parent_name && <span className="flex items-center gap-0.5 font-semibold"><User className="w-2 h-2" />{s.parent_name} ({s.parent_relation})</span>}
                      {s.parent_phone && <span className="flex items-center gap-0.5"><Phone className="w-2 h-2" />{s.parent_phone}</span>}
                    </div>

                    {/* Fee Progress */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${feePct >= 100 ? 'bg-emerald-400' : feePct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${feePct}%` }} />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500">₹{s.fee_paid.toLocaleString('en-IN')}/₹{s.fee_amount.toLocaleString('en-IN')}</span>
                      {s.fee_balance > 0 && <span className="text-[8px] font-black text-rose-700">(₹{s.fee_balance.toLocaleString('en-IN')} due)</span>}
                    </div>

                    {expandedId === s.id && (
                      <div className="mt-2 border-t border-slate-100 pt-2 space-y-1.5">
                        {/* Credentials */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-1.5">
                            <p className="text-[7px] font-bold text-indigo-600 uppercase mb-0.5">Student Portal PIN</p>
                            <p className="text-[14px] font-black text-indigo-800 tracking-widest">{s.portal_pin || '——'}</p>
                          </div>
                          <div className="bg-violet-50 border border-violet-100 rounded-lg p-1.5">
                            <p className="text-[7px] font-bold text-violet-600 uppercase mb-0.5">Parent Portal PIN</p>
                            <p className="text-[14px] font-black text-violet-800 tracking-widest">{s.parent_pin || '——'}</p>
                          </div>
                        </div>
                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
                          {s.phone && <p className="text-slate-500"><span className="font-bold">Student Phone:</span> {s.phone}</p>}
                          {s.email && <p className="text-slate-500 truncate"><span className="font-bold">Email:</span> {s.email}</p>}
                          {s.parent_email && <p className="text-slate-500 truncate"><span className="font-bold">Parent Email:</span> {s.parent_email}</p>}
                          {s.warden_name && <p className="text-slate-500"><span className="font-bold">Warden:</span> {s.warden_name}</p>}
                          {s.warden_phone && <p className="text-slate-500"><span className="font-bold">Warden Ph:</span> {s.warden_phone}</p>}
                          {s.joining_date && <p className="text-slate-500"><span className="font-bold">Joined:</span> {s.joining_date}</p>}
                          {s.fee_due_date && <p className="text-rose-600 font-bold"><span className="font-bold">Fee Due:</span> {s.fee_due_date}</p>}
                          {s.hostel_name && <p className="text-slate-500"><span className="font-bold">Hostel:</span> {s.hostel_name}</p>}
                        </div>
                        {s.notes && <div className="bg-slate-50 border border-slate-100 rounded p-1"><p className="text-[9px] text-slate-600">{s.notes}</p></div>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => onViewStudent(s)}
                        className="p-0.5 hover:bg-teal-100 rounded transition cursor-pointer" title="View full student portal">
                        <Eye className="w-3 h-3 text-teal-500" />
                      </button>
                      <button onClick={() => handleResetPins(s.id, s.student_name)}
                        disabled={resettingId === s.id}
                        className="p-0.5 hover:bg-amber-100 rounded transition cursor-pointer" title="Reset PINs">
                        {resettingId === s.id ? <RefreshCcw className="w-3 h-3 text-amber-500 animate-spin" /> : <Key className="w-3 h-3 text-amber-500" />}
                      </button>
                      <button onClick={() => setExpanded(expandedId === s.id ? null : s.id)}
                        className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer">
                        {expandedId === s.id ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                    {s.messages_count > 0 && (
                      <span className="text-[7px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded-full">{s.messages_count} msgs</span>
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

// ─── NOTICES TAB ──────────────────────────────────────────────────────────────

interface NoticesTabProps {
  notices: Notice[]; loading: boolean; onRefresh: () => void;
}

const NoticesTab: React.FC<NoticesTabProps> = ({ notices, loading, onRefresh }) => {
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [filterTarget, setFT]       = useState('all');
  const [expandedId, setExpanded]   = useState<number | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', content: '', category: 'General', priority: 'Normal',
    target: 'All', published_by: '', valid_until: '', is_pinned: false,
  });

  const filtered = notices.filter(n => {
    const matchS = !search || [n.title, n.content].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchC = filterCat === 'all' || n.category === filterCat;
    const matchT = filterTarget === 'all' || n.target === filterTarget;
    return matchS && matchC && matchT;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/portal/notices', form);
      if (res.data.success) { toast.success(res.data.message); setShowForm(false); setForm({ title: '', content: '', category: 'General', priority: 'Normal', target: 'All', published_by: '', valid_until: '', is_pinned: false }); onRefresh(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to publish notice'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id: number) => {
    try { const r = await api.post(`/school/hostel/portal/notices/${id}/toggle`); if (r.data.success) { toast.success(r.data.message); onRefresh(); } } catch { toast.error('Failed'); }
  };
  const handlePin = async (id: number) => {
    try { const r = await api.post(`/school/hostel/portal/notices/${id}/pin`); if (r.data.success) { toast.success(r.data.message); onRefresh(); } } catch { toast.error('Failed'); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const categories = Object.keys(noticeCategoryConfig);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterTarget} onChange={e => setFT(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'All', 'Students Only', 'Parents Only', 'Staff Only'].map(t => <option key={t} value={t}>{t === 'all' ? 'All Targets' : t}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Megaphone className="w-3 h-3" /> Post Notice
        </button>
      </div>

      {/* Post Notice Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Megaphone className="w-3 h-3 text-indigo-500" /> Post a new notice for students / parents
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className={lbl}>Notice Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Priority *</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inp}>
                  {['Normal', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Target Audience *</label>
                <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className={inp}>
                  {['All', 'Students Only', 'Parents Only', 'Staff Only'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Published By</label>
                <input value={form.published_by} onChange={e => setForm(f => ({ ...f, published_by: e.target.value }))} placeholder="Warden / Management" className={inp} />
              </div>
              <div>
                <label className={lbl}>Valid Until (optional)</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inp} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pin_notice" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="w-3 h-3 cursor-pointer" />
                <label htmlFor="pin_notice" className="text-[9px] font-bold text-violet-700 cursor-pointer flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Pin this notice (always show first)</label>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Notice Content *</label>
                <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write the full notice content..." className={`${inp} resize-none`} required />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <Megaphone className="w-3 h-3" /> {submitting ? 'Publishing...' : 'Publish Notice'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Notices list */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading notices...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No notices found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(n => {
            const nc  = noticeCategoryConfig[n.category] ?? noticeCategoryConfig.General;
            const pc  = priorityConfig[n.priority] ?? priorityConfig.Normal;
            const Icon = nc.icon;
            return (
              <div key={n.id} className={`bg-white border rounded-xl p-2.5 shadow-xs transition ${!n.is_active ? 'opacity-50' : ''} ${n.priority === 'Critical' ? 'border-rose-300' : n.is_pinned ? 'border-violet-300' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded-lg flex-shrink-0 ${nc.bg}`}>
                    <Icon className={`w-3 h-3 ${nc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {n.is_pinned && <Pin className="w-2.5 h-2.5 text-violet-500 flex-shrink-0" />}
                      <h4 className="text-[10px] font-bold text-slate-900 flex-1 min-w-0">{n.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${nc.color} ${nc.bg} ${nc.border}`}>{n.category}</span>
                      <PriorityBadge priority={n.priority} />
                      <span className="text-[8px] text-slate-400 font-semibold">{n.target}</span>
                      {n.valid_until && <span className="text-[8px] text-rose-600 font-semibold">Until {n.valid_until}</span>}
                    </div>
                    <p className="text-[8px] text-slate-400 mt-0.5">{n.published_by ? `By ${n.published_by} · ` : ''}{n.time_ago}</p>

                    {expandedId === n.id && (
                      <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                        <p className="text-[9px] text-slate-700 font-semibold leading-relaxed whitespace-pre-line">{n.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handlePin(n.id)}
                        className={`p-0.5 rounded transition cursor-pointer ${n.is_pinned ? 'bg-violet-100 hover:bg-violet-200' : 'hover:bg-slate-100'}`} title={n.is_pinned ? 'Unpin' : 'Pin'}>
                        {n.is_pinned ? <PinOff className="w-2.5 h-2.5 text-violet-500" /> : <Pin className="w-2.5 h-2.5 text-slate-400" />}
                      </button>
                      <button onClick={() => handleToggle(n.id)}
                        className={`px-1.5 py-0.5 text-[8px] font-bold rounded border cursor-pointer transition ${n.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {n.is_active ? 'Active' : 'Off'}
                      </button>
                      <button onClick={() => setExpanded(expandedId === n.id ? null : n.id)}
                        className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer">
                        {expandedId === n.id ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
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

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────

interface MessagesTabProps {
  students: PortalStudent[]; loading: boolean; onRefresh: () => void;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ students, loading, onRefresh }) => {
  const [selectedStudent, setSelectedStudent] = useState<PortalStudent | null>(null);
  const [messages, setMessages]   = useState<PortalMessage[]>([]);
  const [msgLoading, setML]       = useState(false);
  const [reply, setReply]         = useState('');
  const [senderName, setSenderName] = useState('Warden Management');
  const [submitting, setSubmitting] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStudent) fetchMessages(selectedStudent.id);
  }, [selectedStudent]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (studentId: number) => {
    setML(true);
    try {
      const res = await api.get('/school/hostel/portal/messages', { params: { student_id: studentId } });
      if (res.data.success) setMessages(res.data.data);
    } catch (e) { console.error(e); }
    finally { setML(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/portal/messages/reply', {
        portal_student_id: selectedStudent.id,
        message: reply,
        sender_name: senderName,
      });
      if (res.data.success) {
        toast.success('Reply sent!');
        setReply('');
        fetchMessages(selectedStudent.id);
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSubmitting(false); }
  };

  const studentsWithMsgs = students.filter(s => s.messages_count > 0);

  return (
    <div className="flex gap-2 h-full">
      {/* Left: Student list */}
      <div className="w-48 flex-shrink-0 space-y-1 overflow-y-auto">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Conversations</p>
        {loading ? (
          <p className="text-[9px] text-slate-400 font-semibold text-center py-4">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-[9px] text-slate-400 font-semibold text-center py-4">No students yet.</p>
        ) : (
          students.map(s => (
            <button key={s.id} onClick={() => setSelectedStudent(s)}
              className={`w-full text-left border rounded-xl p-2 transition cursor-pointer ${selectedStudent?.id === s.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black flex-shrink-0">
                  {s.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-800 truncate">{s.student_name}</p>
                  <p className="text-[7px] text-slate-400 font-semibold truncate">Rm {s.room_number} · {s.parent_name}</p>
                </div>
                {s.messages_count > 0 && (
                  <span className="text-[7px] font-black text-white bg-indigo-500 rounded-full w-4 h-4 flex items-center justify-center">{s.messages_count}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {!selectedStudent ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-10 h-10 text-slate-200" />
            <p className="text-[10px] text-slate-400 font-semibold">Select a student to view messages</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-slate-200 bg-slate-50">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black">
                {selectedStudent.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900">{selectedStudent.student_name}</p>
                <p className="text-[7px] text-slate-400 font-semibold">Room {selectedStudent.room_number} · Parent: {selectedStudent.parent_name} ({selectedStudent.parent_phone})</p>
              </div>
              <button onClick={() => fetchMessages(selectedStudent.id)} className="ml-auto p-1 hover:bg-slate-100 rounded cursor-pointer transition">
                <RefreshCw className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {msgLoading ? (
                <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No messages yet.</div>
              ) : (
                messages.map(m => {
                  const isWarden = m.sender_type === 'Warden';
                  return (
                    <div key={m.id} className={`flex ${isWarden ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 ${isWarden ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                        <p className={`text-[8px] font-bold mb-0.5 ${isWarden ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {m.sender_name} ({m.sender_type})
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed">{m.message}</p>
                        <p className={`text-[7px] mt-0.5 text-right ${isWarden ? 'text-indigo-300' : 'text-slate-400'}`}>{m.time_ago}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-slate-200 p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[8px] font-bold text-slate-500">Sender name:</p>
                <input value={senderName} onChange={e => setSenderName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-semibold outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
              <form onSubmit={handleSend} className="flex gap-1">
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                  placeholder={`Reply to ${selectedStudent.parent_name}...`}
                  className="flex-1 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                <button type="submit" disabled={submitting || !reply.trim()}
                  className="flex-shrink-0 w-8 h-16 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── STUDENT PORTAL VIEW MODAL ────────────────────────────────────────────────

interface StudentPortalViewProps {
  student: PortalStudent; data: any; onClose: () => void;
}

const StudentPortalView: React.FC<StudentPortalViewProps> = ({ student, data, onClose }) => {
  const [activeSection, setSection] = useState<'overview' | 'outpass' | 'complaints' | 'health' | 'conduct'>('overview');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
            {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[12px] font-black text-white">{student.student_name}</h2>
            <p className="text-[8px] text-indigo-200">{student.student_class} · {student.hostel_name} · Room {student.room_number}</p>
          </div>
          <div className="flex gap-1.5">
            <div className="bg-white/20 rounded-lg px-2 py-1 text-center">
              <p className="text-[7px] text-indigo-200">Student PIN</p>
              <p className="text-[11px] font-black text-white tracking-widest">{student.portal_pin}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-2 py-1 text-center">
              <p className="text-[7px] text-indigo-200">Parent PIN</p>
              <p className="text-[11px] font-black text-white tracking-widest">{student.parent_pin}</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-1 text-white/70 hover:text-white cursor-pointer transition"><X className="w-4 h-4" /></button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0.5 px-2 pt-1.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          {[
            { id: 'overview',    label: 'Overview',    icon: User },
            { id: 'outpass',     label: 'Outpasses',   icon: CalendarDays },
            { id: 'complaints',  label: 'Complaints',  icon: MessageSquare },
            { id: 'health',      label: 'Health',      icon: Heart },
            { id: 'conduct',     label: 'Conduct',     icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button key={tab.id} onClick={() => setSection(tab.id as any)}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg font-bold text-[9px] border cursor-pointer transition mb-1 ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                <Icon className="w-2.5 h-2.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {activeSection === 'overview' && (
            <div className="space-y-2">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2">
                  <p className="text-[8px] font-bold text-indigo-700 uppercase mb-1">Student Details</p>
                  <div className="space-y-0.5 text-[9px]">
                    {[['Name', student.student_name], ['Class', student.student_class], ['Room', `${student.block_name} · Room ${student.room_number}`], ['Adm. No.', student.admission_number], ['Blood', student.blood_group], ['Joined', student.joining_date]].map(([k, v]) => v && (
                      <p key={k} className="text-slate-700"><span className="font-bold text-slate-500">{k}: </span>{v}</p>
                    ))}
                  </div>
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-2">
                  <p className="text-[8px] font-bold text-violet-700 uppercase mb-1">Parent / Guardian</p>
                  <div className="space-y-0.5 text-[9px]">
                    {[['Name', student.parent_name], ['Relation', student.parent_relation], ['Phone', student.parent_phone], ['Email', student.parent_email]].map(([k, v]) => v && (
                      <p key={k} className="text-slate-700"><span className="font-bold text-slate-500">{k}: </span>{v}</p>
                    ))}
                  </div>
                </div>
              </div>
              {/* Fee card */}
              <div className={`border rounded-xl p-2 ${feeStatusConfig[student.fee_status]?.bg} ${feeStatusConfig[student.fee_status]?.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[8px] font-bold text-slate-700 uppercase">Fee Status</p>
                  <FeeStatusBadge status={student.fee_status} />
                </div>
                <div className="flex gap-4 text-[9px]">
                  <div><p className="font-bold text-slate-500">Total</p><p className="font-black text-slate-900">₹{student.fee_amount.toLocaleString('en-IN')}</p></div>
                  <div><p className="font-bold text-emerald-600">Paid</p><p className="font-black text-emerald-800">₹{student.fee_paid.toLocaleString('en-IN')}</p></div>
                  <div><p className="font-bold text-rose-600">Balance</p><p className="font-black text-rose-800">₹{student.fee_balance.toLocaleString('en-IN')}</p></div>
                  {student.fee_due_date && <div><p className="font-bold text-slate-500">Due Date</p><p className="font-black text-rose-700">{student.fee_due_date}</p></div>}
                </div>
              </div>
              {/* Warden contact */}
              {student.warden_name && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-500" />
                  <div className="text-[9px]">
                    <p className="font-bold text-teal-800">Warden: {student.warden_name}</p>
                    <p className="text-teal-600">{student.warden_phone}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'outpass' && (
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recent Outpass / Leave Requests</p>
              {!data?.outpasses || data.outpasses.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No outpass records found.</div>
              ) : (
                <div className="space-y-1">
                  {data.outpasses.map((o: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-lg px-2 py-1.5 flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400">{o.outpass_code}</span>
                      <span className="text-[9px] font-bold text-slate-700 flex-1">{o.reason_type}</span>
                      <span className="text-[8px] text-slate-500">{o.from_datetime?.slice(0, 10)} → {o.to_datetime?.slice(0, 10)}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : o.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'complaints' && (
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recent Complaints</p>
              {!data?.complaints || data.complaints.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No complaints found.</div>
              ) : (
                <div className="space-y-1">
                  {data.complaints.map((c: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-lg px-2 py-1.5 flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400">{c.complaint_code}</span>
                      <span className="text-[9px] font-bold text-slate-700 flex-1 truncate">{c.title}</span>
                      <span className="text-[8px] text-slate-500">{c.category}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'health' && (
            <div className="space-y-2">
              {data?.health_profile && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-2">
                  <p className="text-[8px] font-bold text-teal-700 uppercase mb-1">Health Profile</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
                    {data.health_profile.blood_group && <p><span className="font-bold text-slate-500">Blood Group:</span> {data.health_profile.blood_group}</p>}
                    {data.health_profile.allergies && <p><span className="font-bold text-rose-600">Allergies:</span> {data.health_profile.allergies}</p>}
                    {data.health_profile.chronic_conditions && <p className="col-span-2"><span className="font-bold text-violet-700">Conditions:</span> {data.health_profile.chronic_conditions}</p>}
                  </div>
                </div>
              )}
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Recent Medical Visits</p>
              {!data?.health_visits || data.health_visits.length === 0 ? (
                <div className="text-center py-4 text-[10px] text-slate-400 font-semibold">No medical visits found.</div>
              ) : (
                <div className="space-y-1">
                  {data.health_visits.map((v: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-lg px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400">{v.visit_date}</span>
                        <span className="text-[9px] font-bold text-slate-700 flex-1 truncate">{v.symptoms?.slice(0, 50)}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${v.severity === 'Emergency' ? 'bg-rose-100 text-rose-700' : v.severity === 'Severe' ? 'bg-orange-100 text-orange-700' : 'bg-amber-50 text-amber-700'}`}>{v.severity}</span>
                      </div>
                      {v.diagnosis && <p className="text-[8px] text-teal-700 font-semibold mt-0.5">Dx: {v.diagnosis}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'conduct' && (
            <div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Discipline Records</p>
              {!data?.violations || data.violations.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                  <p className="text-[10px] text-slate-400 font-semibold">No violations on record. Excellent conduct!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {data.violations.map((v: any, i: number) => (
                    <div key={i} className="border border-rose-200 bg-rose-50 rounded-lg px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400">{v.incident_date}</span>
                        <span className="text-[9px] font-bold text-slate-700 flex-1 truncate">{v.description?.slice(0, 60)}</span>
                        {v.fine_amount > 0 && <span className="text-[8px] font-black text-rose-700">₹{v.fine_amount}</span>}
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${v.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{v.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HostelPortalManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedStudentView, setStudentView] = useState<{ student: PortalStudent; data: any } | null>(null);

  const [dashStats, setDashStats]     = useState<DashStats>({ totalStudents: 0, activeNotices: 0, urgentNotices: 0, unreadMsgs: 0, pinnedCount: 0, overdueStudents: 0, feePending: 0, totalFeePaid: 0, totalFeeAmount: 0 });
  const [feeBreakdown, setFeeBreakdown] = useState<Record<string, number>>({});
  const [noticesByCat, setNBCat]      = useState<Record<string, number>>({});
  const [pinnedNotices, setPinned]    = useState<Notice[]>([]);
  const [recentMsgs, setRecentMsgs]   = useState<PortalMessage[]>([]);
  const [recentActs, setRecentActs]   = useState<any[]>([]);
  const [dashLoading, setDashLoad]    = useState(true);

  const [students, setStudents]       = useState<PortalStudent[]>([]);
  const [studLoading, setStudLoad]    = useState(true);
  const [notices, setNotices]         = useState<Notice[]>([]);
  const [noticeLoading, setNL]        = useState(true);

  const fetchDashboard = async () => {
    setDashLoad(true);
    try {
      const res = await api.get('/school/hostel/portal/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats); setFeeBreakdown(d.fee_breakdown); setNBCat(d.notices_by_category);
        setPinned(d.pinned_notices); setRecentMsgs(d.recent_messages); setRecentActs(d.recent_activities);
      }
    } catch (e) { console.error(e); }
    finally { setDashLoad(false); }
  };

  const fetchStudents = async () => { setStudLoad(true); try { const r = await api.get('/school/hostel/portal/students'); if (r.data.success) setStudents(r.data.data); } catch (e) { console.error(e); } finally { setStudLoad(false); } };
  const fetchNotices  = async () => { setNL(true); try { const r = await api.get('/school/hostel/portal/notices'); if (r.data.success) setNotices(r.data.data); } catch (e) { console.error(e); } finally { setNL(false); } };

  useEffect(() => { fetchDashboard(); fetchStudents(); fetchNotices(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'students')  fetchStudents();
    if (activeTab === 'notices')   fetchNotices();
  }, [activeTab]);

  const handleViewStudent = async (student: PortalStudent) => {
    try {
      const res = await api.get(`/school/hostel/portal/students/${student.id}/view`);
      if (res.data.success) setStudentView({ student, data: res.data.data });
    } catch (e) { toast.error('Failed to load student data'); }
  };

  const refreshAll = () => { fetchDashboard(); fetchStudents(); fetchNotices(); };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'students',  label: 'Students',      icon: Users,          badge: students.length || undefined },
    { id: 'notices',   label: 'Notices',       icon: Megaphone,      badge: dashStats.urgentNotices || undefined },
    { id: 'messages',  label: 'Messages',      icon: MessageSquare,  badge: dashStats.unreadMsgs || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <Globe className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Student &amp; Parent Portal</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              {dashStats.totalStudents} accounts · {dashStats.activeNotices} notices · {dashStats.unreadMsgs} unread msgs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.unreadMsgs > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
              <MessageCircle className="w-2.5 h-2.5" /> {dashStats.unreadMsgs} unread
            </span>
          )}
          {dashStats.overdueStudents > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
              <AlertCircle className="w-2.5 h-2.5" /> {dashStats.overdueStudents} overdue fees
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
      <div className={`flex-1 ${activeTab === 'messages' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'} pr-0.5`}>
        {activeTab === 'dashboard' && (
          <DashboardTab stats={dashStats} feeBreakdown={feeBreakdown} noticesByCategory={noticesByCat}
            pinnedNotices={pinnedNotices} recentMessages={recentMsgs} recentActivities={recentActs}
            loading={dashLoading} onTabChange={setActiveTab} />
        )}
        {activeTab === 'students'  && <StudentsTab students={students} loading={studLoading} onRefresh={() => { fetchStudents(); fetchDashboard(); }} onViewStudent={handleViewStudent} />}
        {activeTab === 'notices'   && <NoticesTab  notices={notices}  loading={noticeLoading} onRefresh={() => { fetchNotices(); fetchDashboard(); }} />}
        {activeTab === 'messages'  && <MessagesTab students={students} loading={studLoading} onRefresh={() => { fetchStudents(); fetchDashboard(); }} />}
      </div>

      {/* Student Portal View Modal */}
      {selectedStudentView && (
        <StudentPortalView student={selectedStudentView.student} data={selectedStudentView.data} onClose={() => setStudentView(null)} />
      )}
    </div>
  );
};

export default HostelPortalManager;
