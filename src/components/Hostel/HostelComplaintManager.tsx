import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  Wrench, Zap, Droplets, Sofa, Trash2, Wifi, HelpCircle,
  AlertTriangle, Check, X, Plus, Calendar, User, Clock,
  ArrowRight, Shield, Award, Edit2, CheckCircle2, ChevronRight,
  Trash, Search, Filter, Star, Info, ListTodo, Hammer, Brush,
  Activity, BarChart2, LayoutDashboard, ClipboardList, ShieldCheck,
  Users, TrendingUp
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'raise-ticket' | 'my-tickets' | 'admin-view' | 'schedule';
type ComplaintCategory = 'Electrical' | 'Plumbing' | 'Furniture' | 'Cleanliness' | 'Internet/WiFi' | 'Other';
type TicketStatus = 'Open' | 'In Progress' | 'Ordered' | 'Resolved' | 'Closed';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

interface Technician {
  id: number;
  name: string;
  specialty: string;
  status: 'Available' | 'Busy';
  avatar: string;
  tasks: string;
}

interface Complaint {
  id: number;
  ticket_number: string;
  category: ComplaintCategory;
  room_number: string;
  block_floor: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  preferred_time?: string;
  status: TicketStatus;
  assigned_technician_id?: number;
  assigned_custom_name?: string;
  photo_path?: string;
  resolution_details?: string;
  rating?: number;
  rating_feedback?: string;
  resolved_at?: string;
  created_at: string;
  technician?: {
    id: number;
    name: string;
    specialty: string;
  };
}

interface MaintenanceSchedule {
  id: number;
  title: string;
  scheduled_time: string;
  scheduled_date: string;
  location: string;
  status: 'Ongoing' | 'Upcoming' | 'Mandatory' | 'Completed' | 'Scheduled';
  type: 'today' | 'upcoming';
}

interface TechnicianWorkload {
  id: number;
  name: string;
  specialty: string;
  tasks_done: number;
  tasks_total: number;
  percent: number;
}

// ─── HELPERS & CONFIGS ─────────────────────────────────────────────────────────

const categoryConfig: Record<ComplaintCategory, { label: string; sub: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  Electrical:    { label: 'Electrical',    sub: 'Fan, light, plug, AC',       icon: Zap,          color: 'text-orange-700',   bg: 'bg-orange-50',   border: 'border-orange-200' },
  Plumbing:      { label: 'Plumbing',      sub: 'Pipe, tap, geyser, drain',   icon: Droplets,     color: 'text-blue-700',     bg: 'bg-blue-50',     border: 'border-blue-200' },
  Furniture:     { label: 'Furniture',     sub: 'Bed, chair, table, almirah',  icon: Sofa,         color: 'text-amber-700',    bg: 'bg-amber-50',    border: 'border-amber-200' },
  Cleanliness:   { label: 'Cleanliness',   sub: 'Bathroom, corridor, trash',  icon: Trash2,       color: 'text-emerald-700',  bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  'Internet/WiFi':{ label: 'Internet/WiFi',sub: 'No connection, slow speed',  icon: Wifi,         color: 'text-indigo-700',   bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  Other:         { label: 'Other',         sub: 'Pest, noise, security',      icon: HelpCircle,   color: 'text-slate-700',    bg: 'bg-slate-50',    border: 'border-slate-200' },
};

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  Open:         { label: 'Open',        color: 'text-rose-700',   bg: 'bg-rose-50',       border: 'border-rose-200',   dot: 'bg-rose-500' },
  'In Progress':{ label: 'In progress', color: 'text-amber-700',  bg: 'bg-amber-50',      border: 'border-amber-200',  dot: 'bg-amber-500 animate-pulse' },
  Ordered:      { label: 'Ordered',     color: 'text-blue-700',   bg: 'bg-blue-50',       border: 'border-blue-200',   dot: 'bg-blue-500' },
  Resolved:     { label: 'Resolved',    color: 'text-emerald-700',bg: 'bg-emerald-50',    border: 'border-emerald-200',dot: 'bg-emerald-500' },
  Closed:       { label: 'Closed',      color: 'text-slate-600',  bg: 'bg-slate-100',     border: 'border-slate-200',  dot: 'bg-slate-400' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; border: string }> = {
  Low:    { label: 'low',     color: 'text-slate-600',  bg: 'bg-slate-50',    border: 'border-slate-200' },
  Medium: { label: 'medium',  color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200' },
  High:   { label: 'high',    color: 'text-orange-700', bg: 'bg-orange-50',   border: 'border-orange-200' },
  Urgent: { label: 'urgent',  color: 'text-rose-700',   bg: 'bg-rose-50',     border: 'border-rose-200' },
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d;
  }
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const c = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border ${c.color} ${c.bg} ${c.border}`}>
      {c.label}
    </span>
  );
};

// ─── DASHBOARD TAB ─────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: { open: number; in_progress: number; resolved: number; avg_time: string };
  urgent: any[];
  recent: any[];
  technicians: Technician[];
  rates: any[];
  breakdown: any[];
  onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ stats, urgent, recent, technicians, rates, breakdown, onTabChange }) => {
  const maxVal = Math.max(...breakdown.map(d => d.count)) || 1;
  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {[
          { label: 'Open', value: stats.open, sub: 'Complaints', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'In Progress', value: stats.in_progress, sub: 'Being fixed', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Resolved', value: stats.resolved, sub: 'This month', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Avg Time', value: stats.avg_time, sub: 'To resolve', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 flex flex-col justify-center`}>
            <span className={`text-lg font-black ${s.color} leading-none`}>{s.value}</span>
            <span className={`text-[8px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-none`}>{s.label}</span>
            <span className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Urgent tickets */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Urgent tickets
            </h3>
            {urgent.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-400 font-semibold">No urgent complaints open ✓</div>
            ) : (
              <div className="space-y-1.5">
                {urgent.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-1.5 bg-rose-50/50 border border-rose-100 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{u.title} &mdash; Rm {u.room}</p>
                      <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">{u.desc || 'No description'} · {u.time_ago}</p>
                    </div>
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200 uppercase whitespace-nowrap">Urgent</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onTabChange('my-tickets')} className="w-full mt-2 py-1 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-lg text-[9px] cursor-pointer transition">
            View all urgent &rarr;
          </button>
        </div>

        {/* By Category counts */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart2 className="w-2.5 h-2.5" /> By category
          </h3>
          <div className="space-y-1">
            {breakdown.map(b => {
              const pc = (b.count / maxVal) * 100;
              return (
                <div key={b.category} className="flex items-center justify-between text-[9px] font-semibold text-slate-600">
                  <span className="w-18 truncate">{b.category}</span>
                  <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pc}%` }} />
                  </div>
                  <span className="w-4 text-right font-bold text-slate-800">{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Activity className="w-3 h-3" /> Recent activity
        </h3>
        <div className="divide-y divide-slate-100">
          {recent.map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0 gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-800 leading-tight">{r.title} - Rm {r.room}</p>
                <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">{r.action_text}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Technicians on duty */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Technicians on duty
          </h3>
          <div className="space-y-1.5">
            {technicians.map(t => (
              <div key={t.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-700 font-black text-[8px] flex items-center justify-center">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{t.name}</p>
                    <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">{t.specialty} · {t.tasks}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${
                  t.status === 'Available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution rates */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Resolution rate
          </h3>
          <div className="space-y-2">
            {rates.map(rate => (
              <div key={rate.category} className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase tracking-wide leading-none">
                  <span>{rate.category}</span>
                  <span>{rate.rate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${rate.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── RAISE TICKET TAB ──────────────────────────────────────────────────────────

interface RaiseTicketProps {
  onSuccess: () => void;
}

const RaiseTicket: React.FC<RaiseTicketProps> = ({ onSuccess }) => {
  const [category, setCategory] = useState<ComplaintCategory>('Electrical');
  const [form, setForm] = useState({
    room_number: '204',
    block_floor: 'Block A - 2nd Floor',
    title: '',
    description: '',
    priority: 'Medium' as TicketPriority,
    preferred_time: 'Morning (8-12 AM)'
  });
  const [loading, setLoading] = useState(false);

  const categories: { type: ComplaintCategory; desc: string; icon: React.ElementType }[] = [
    { type: 'Electrical',    desc: 'Fan, light, plug, AC',       icon: Zap },
    { type: 'Plumbing',      desc: 'Pipe, tap, geyser, drain',   icon: Droplets },
    { type: 'Furniture',     desc: 'Bed, chair, table, almirah',  icon: Sofa },
    { type: 'Cleanliness',   desc: 'Bathroom, corridor, trash',  icon: Trash2 },
    { type: 'Internet/WiFi', desc: 'No connection, slow speed',  icon: Wifi },
    { type: 'Other',         desc: 'Pest, noise, security',      icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please enter issue title'); return; }

    setLoading(true);
    try {
      const res = await api.post('/school/hostel/complaints/apply', {
        category,
        ...form
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Ticket submitted successfully!');
        setForm(f => ({ ...f, title: '', description: '' }));
        onSuccess();
      } else {
        toast.error(res.data.message || 'Submission failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Category Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-2">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <ListTodo className="w-3 h-3 text-indigo-500" /> Select category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {categories.map(c => {
            const config = categoryConfig[c.type];
            const Icon = c.icon;
            const isActive = category === c.type;
            return (
              <button
                key={c.type}
                type="button"
                onClick={() => setCategory(c.type)}
                className={`flex items-center gap-2 p-1.5 rounded-lg border font-bold text-left transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <div className={`p-1 rounded-md ${isActive ? 'bg-indigo-500' : config.bg}`}>
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : config.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black leading-none">{config.label}</p>
                  <p className={`text-[8px] font-semibold mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{c.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <Wrench className="w-3 h-3 text-indigo-500" /> Complaint details
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Room number</label>
              <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Block / floor</label>
              <input value={form.block_floor} onChange={e => setForm(f => ({ ...f, block_floor: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Issue title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Ceiling fan not working since morning"
              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the problem in detail — when it started, how severe, etc."
              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-12" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Preferred time</label>
              <select value={form.preferred_time} onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                {['Morning (8-12 AM)', 'Afternoon (12-4 PM)', 'Evening (4-8 PM)'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Upload photo (optional)</label>
            <input type="file" disabled
              className="w-full border border-slate-200 rounded-lg p-1 text-[10px] font-semibold bg-slate-50 text-slate-400 cursor-not-allowed outline-none" />
          </div>

          {/* Emergency Warning */}
          <div className="flex items-start gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[9px] text-rose-700 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Emergency issue &mdash; warden will be notified immediately. For life-threatening emergencies call hostel security: 9876-000-111.</span>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-[10px] border-0 transition shadow-sm">
            {loading ? 'Submitting...' : (
              <><ArrowRight className="w-3 h-3" /> Submit complaint</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── MY TICKETS TAB ───────────────────────────────────────────────────────────

interface MyTicketsProps {
  tickets: Complaint[];
  loading: boolean;
  onRefresh: () => void;
}

const MyTickets: React.FC<MyTicketsProps> = ({ tickets, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCancel = async (id: number) => {
    try {
      const res = await api.post(`/school/hostel/complaints/${id}/status`, { status: 'Closed' });
      if (res.data.success) {
        toast.success('Ticket closed successfully.');
        onRefresh();
      }
    } catch {
      toast.error('Failed to close ticket.');
    }
  };

  const handleRate = async (id: number, stars: number) => {
    const feedback = prompt('Provide feedback for the fix (optional):');
    try {
      const res = await api.post(`/school/hostel/complaints/${id}/rate`, {
        rating: stars,
        rating_feedback: feedback || ''
      });
      if (res.data.success) {
        toast.success('Thank you for rating!');
        onRefresh();
      }
    } catch {
      toast.error('Failed to save rating.');
    }
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-1.5">
      {/* Search and Filters */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="in progress">In progress</option>
          <option value="ordered">Ordered</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">No tickets found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const config = categoryConfig[t.category] || categoryConfig.Other;
            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 tracking-wider block">{t.ticket_number} · {t.category}</span>
                    <h4 className="text-[11px] font-bold text-slate-900 mt-0.5">{t.title}</h4>
                  </div>
                  <div className="flex gap-1">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-500 font-semibold border-t border-b border-slate-100 py-1">
                  <div>Raised: <span className="text-slate-800 font-bold">{fmtDate(t.created_at)}</span></div>
                  <div>Room: <span className="text-slate-800 font-bold">{t.room_number} ({t.block_floor.split(' ')[0]})</span></div>
                  <div className="col-span-2">
                    Assigned: <span className="text-slate-800 font-bold">{t.technician ? t.technician.name : (t.assigned_custom_name ?? 'Unassigned')}</span>
                  </div>
                </div>

                {/* Conditional Actions */}
                <div className="flex gap-1.5 pt-0.5">
                  {t.status === 'Open' && (
                    <>
                      <button onClick={() => handleCancel(t.id)} className="flex-1 py-1 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-[9px] cursor-pointer">
                        Cancel ticket
                      </button>
                      <button disabled className="flex-1 py-1 text-center border border-slate-200 text-slate-400 font-bold rounded-lg text-[9px] cursor-not-allowed">
                        Edit
                      </button>
                    </>
                  )}
                  {t.status === 'In Progress' && (
                    <>
                      <button onClick={() => alert(`Status updates: Ticket is currently assigned to ${t.technician ? t.technician.name : t.assigned_custom_name}.`)} className="flex-1 py-1 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-[9px] cursor-pointer">
                        View updates
                      </button>
                      <button onClick={() => alert('SLA check: technician is on track.')} className="flex-1 py-1 text-center border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[9px] cursor-pointer">
                        Track status
                      </button>
                    </>
                  )}
                  {t.status === 'Resolved' && (
                    <>
                      <div className="flex-1 flex gap-1 items-center justify-center">
                        <span className="text-[9px] text-slate-400 font-semibold mr-1">Rate resolution:</span>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => handleRate(t.id, star)} className="p-0.5 hover:scale-115 transition cursor-pointer bg-transparent border-0">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-transparent hover:fill-amber-400" />
                          </button>
                        ))}
                      </div>
                      <button onClick={() => alert(`Timeline: Raised on ${fmtDate(t.created_at)}, Resolved on ${fmtDate(t.resolved_at)}`)} className="py-1 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-[9px] cursor-pointer">
                        View timeline
                      </button>
                    </>
                  )}
                  {t.status === 'Closed' && (
                    <div className="text-center text-[9px] text-slate-400 font-semibold w-full">Ticket closed. {t.rating ? `Rating: ${t.rating} Stars` : ''}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── ADMIN VIEW TAB ───────────────────────────────────────────────────────────

interface AdminViewProps {
  stats: { open: number; in_progress: number; resolved: number; avg_time: string };
  tickets: Complaint[];
  technicians: Technician[];
  loading: boolean;
  onRefresh: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ stats, tickets, technicians, loading, onRefresh }) => {
  const [filterCat, setFilterCat] = useState('all');
  const [filterPri, setFilterPri] = useState('all');
  const [filterStat, setFilterStat] = useState('all');

  const handleAssign = async (ticketId: number, techId: number) => {
    try {
      const res = await api.post(`/school/hostel/complaints/${ticketId}/assign`, { technician_id: techId });
      if (res.data.success) {
        toast.success(res.data.message || 'Technician assigned.');
        onRefresh();
      }
    } catch {
      toast.error('Failed to assign technician.');
    }
  };

  const handleStatusUpdate = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      const res = await api.post(`/school/hostel/complaints/${ticketId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success('Status updated.');
        onRefresh();
      }
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const filtered = tickets.filter(t => {
    const catMatch = filterCat === 'all' || t.category === filterCat;
    const priMatch = filterPri === 'all' || t.priority === filterPri;
    const statMatch = filterStat === 'all' || t.status === filterStat;
    return catMatch && priMatch && statMatch;
  });

  const unassignedCount = tickets.filter(t => t.assigned_custom_name === 'Unassigned' || !t.assigned_technician_id).length;

  return (
    <div className="space-y-2">
      {/* Admin stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Unassigned', value: unassignedCount, sub: 'Need assignment', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'In Progress', value: stats.in_progress, sub: 'Active work', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Avg SLA', value: stats.avg_time, sub: 'Resolution time', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Rating', value: '4.2 ★', sub: 'This month', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-1.5 flex flex-col justify-center`}>
            <span className={`text-sm font-black ${s.color} leading-none`}>{s.value}</span>
            <span className={`text-[8px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-none`}>{s.label}</span>
            <span className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-3 gap-1">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-300 rounded-lg p-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All categories</option>
          {['Electrical', 'Plumbing', 'Furniture', 'Cleanliness', 'Internet/WiFi', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPri} onChange={e => setFilterPri(e.target.value)} className="border border-slate-300 rounded-lg p-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All priority</option>
          {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStat} onChange={e => setFilterStat(e.target.value)} className="border border-slate-300 rounded-lg p-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All status</option>
          {['Open', 'In Progress', 'Ordered', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tickets Admin List */}
      {loading ? (
        <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">No tickets found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => (
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-slate-200 rounded-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-900 leading-tight">{t.ticket_number} · {t.title}</span>
                  <span className="text-[8px] text-slate-400 font-semibold leading-tight">Rm {t.room_number}</span>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-[8px] text-slate-400 font-semibold mt-0.5 leading-none">Raised by Aditya Rathore (Rm 204) · {fmtDate(t.created_at)}</p>
                {t.description && <p className="text-[8px] text-slate-500 mt-1 truncate">{t.description}</p>}
              </div>

              {/* Assignment Controls */}
              <div className="flex gap-1.5 items-center flex-shrink-0">
                {/* Tech selector */}
                <select
                  value={t.assigned_technician_id || ''}
                  onChange={e => handleAssign(t.id, Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-1.5 py-0.8 text-[9px] font-semibold bg-white cursor-pointer outline-none"
                >
                  <option value="">Assign Tech</option>
                  {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name} ({tech.specialty})</option>)}
                </select>

                {/* Status selector */}
                <select
                  value={t.status}
                  onChange={e => handleStatusUpdate(t.id, e.target.value as TicketStatus)}
                  className="border border-slate-300 rounded-lg px-1.5 py-0.8 text-[9px] font-semibold bg-white cursor-pointer outline-none"
                >
                  {['Open', 'In Progress', 'Ordered', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SCHEDULE TAB ─────────────────────────────────────────────────────────────

interface ScheduleTabProps {
  todaySchedule: MaintenanceSchedule[];
  upcomingSchedule: any[];
  workload: TechnicianWorkload[];
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ todaySchedule, upcomingSchedule, workload }) => {
  const flow = [
    { label: 'Student raises ticket', detail: 'Category, description, priority, photo' },
    { label: 'Auto-acknowledgement sent', detail: 'Ticket ID generated, SMS to student' },
    { label: 'Admin assigns technician', detail: 'Based on category & availability' },
    { label: 'Technician visits & fixes', detail: 'Marks In-progress ➔ Resolved' },
    { label: 'Student rates resolution', detail: '1-5 stars + optional feedback' },
    { label: 'Ticket closed', detail: 'Auto-closed after 48h if no dispute' }
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Today's Schedule */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Today's schedule
          </h3>
          <div className="divide-y divide-slate-100">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-4 text-[9px] text-slate-400 font-semibold">No cleaning scheduled today.</div>
            ) : (
              todaySchedule.map(s => (
                <div key={s.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{s.title}</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5 leading-none">{s.scheduled_time} · {s.location}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                    s.status === 'Ongoing'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> Upcoming maintenance
          </h3>
          <div className="divide-y divide-slate-100">
            {upcomingSchedule.map(s => (
              <div key={s.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[10px] font-bold text-slate-800 leading-tight">{s.title}</p>
                  <p className="text-[8px] text-slate-400 font-semibold mt-0.5 leading-none">{s.location}</p>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-400 font-bold">{s.date}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                    s.status === 'Mandatory'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technician workload */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Users className="w-3 h-3 text-indigo-500" /> Technician workload &mdash; today
        </h3>
        <div className="space-y-1.5">
          {workload.map(w => (
            <div key={w.id} className="space-y-0.5">
              <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase tracking-wide leading-none">
                <span>{w.name} - <span className="font-semibold text-slate-400">{w.specialty}</span></span>
                <span>{w.tasks_done}/{w.tasks_total} tasks</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${w.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution flow */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Standard resolution flow
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {flow.map((step, i) => (
            <div key={step.label} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-[9px] font-bold text-slate-800 leading-tight truncate">{step.label}</span>
              </div>
              <p className="text-[8px] text-slate-400 font-semibold leading-tight mt-1">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const HostelComplaintManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard Stats
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, avg_time: '1.8d' });
  const [urgentTickets, setUrgentTickets] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [techniciansList, setTechniciansList] = useState<Technician[]>([]);
  const [resolutionRates, setResolutionRates] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  // Schedule Stats
  const [todaySchedule, setTodaySchedule] = useState<MaintenanceSchedule[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<any[]>([]);
  const [workload, setWorkload] = useState<TechnicianWorkload[]>([]);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/school/hostel/complaints/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setUrgentTickets(res.data.data.urgent_tickets);
        setRecentActivity(res.data.data.recent_activity);
        setTechniciansList(res.data.data.technicians);
        setResolutionRates(res.data.data.resolution_rates);
        setCategoryBreakdown(res.data.data.category_breakdown);
      }
    } catch (err) {
      console.error('Error fetching complaints dashboard:', err);
    }
  };

  const fetchTicketsList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/hostel/complaints/list');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleData = async () => {
    try {
      const res = await api.get('/school/hostel/complaints/schedules');
      if (res.data.success) {
        setTodaySchedule(res.data.data.today);
        setUpcomingSchedule(res.data.data.upcoming);
        setWorkload(res.data.data.workload);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTicketsList();
    fetchScheduleData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'my-tickets' || activeTab === 'admin-view') {
      fetchTicketsList();
    } else if (activeTab === 'schedule') {
      fetchScheduleData();
    }
  }, [activeTab]);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'raise-ticket', label: '+ Raise ticket',icon: Plus },
    { id: 'my-tickets',   label: 'My tickets',   icon: ClipboardList, badge: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length || undefined },
    { id: 'admin-view',   label: 'Admin view',   icon: ShieldCheck },
    { id: 'schedule',     label: 'Schedule',     icon: Calendar },
  ];

  const urgentOpenCount = tickets.filter(t => t.priority === 'Urgent' && (t.status === 'Open' || t.status === 'In Progress')).length;

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <Wrench className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Complaint &amp; Maintenance</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">Shri Ram Boys Hostel · Room 204 · Aditya Rathore</p>
          </div>
        </div>
        {urgentOpenCount > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
            <span className="w-1 h-1 rounded-full bg-rose-500" />
            {urgentOpenCount} urgent open
          </span>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 pb-0.5 flex-shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition duration-150 cursor-pointer text-[10px] shadow-xs relative ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-2.5 h-2.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
              {tab.badge && (
                <span className="ml-0.5 px-1 py-0.2 bg-blue-500 text-white text-[8px] font-black rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable tab contents */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            urgent={urgentTickets}
            recent={recentActivity}
            technicians={techniciansList}
            rates={resolutionRates}
            breakdown={categoryBreakdown}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === 'raise-ticket' && (
          <RaiseTicket onSuccess={() => setActiveTab('my-tickets')} />
        )}

        {activeTab === 'my-tickets' && (
          <MyTickets
            tickets={tickets}
            loading={loading}
            onRefresh={fetchTicketsList}
          />
        )}

        {activeTab === 'admin-view' && (
          <AdminView
            stats={stats}
            tickets={tickets}
            technicians={techniciansList}
            loading={loading}
            onRefresh={fetchTicketsList}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            todaySchedule={todaySchedule}
            upcomingSchedule={upcomingSchedule}
            workload={workload}
          />
        )}
      </div>
    </div>
  );
};

export default HostelComplaintManager;
