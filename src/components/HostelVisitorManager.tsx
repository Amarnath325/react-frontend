import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, Users, ClipboardCheck, LogIn, LogOut, ShieldBan,
  Plus, Search, UserCheck, UserX, AlertTriangle, Check, X,
  Activity, BarChart2, Clock, Phone, Home, Calendar,
  ChevronRight, Trash2, Eye, RefreshCw, CheckCircle2,
  Badge, BookUser, ScanLine, UserRoundX, Shield, QrCode
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'register' | 'approvals' | 'checkinout' | 'blacklist';
type VisitorStatus = 'Pending' | 'Approved' | 'Rejected' | 'Checked In' | 'Checked Out' | 'Overstay' | 'Cancelled';

interface Visitor {
  id: number;
  gate_pass_number: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_relation: string;
  purpose: string;
  id_type: string;
  id_number?: string;
  student_name?: string;
  room_number?: string;
  block_floor?: string;
  visitor_count: number;
  expected_visit_date: string;
  expected_entry_time?: string;
  expected_exit_time?: string;
  actual_entry_at?: string;
  actual_exit_at?: string;
  status: VisitorStatus;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  notes?: string;
  duration?: string;
  is_overstay: boolean;
}

interface BlacklistEntry {
  id: number;
  visitor_name: string;
  visitor_phone?: string;
  id_type?: string;
  id_number?: string;
  reason: string;
  blacklisted_by?: string;
  blacklisted_on: string;
}

interface DashStats {
  today_total: number;
  pending_approval: number;
  active_visits: number;
  today_checkouts: number;
  overstay: number;
  blacklist_count: number;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const statusConfig: Record<VisitorStatus, { color: string; bg: string; border: string; dot: string }> = {
  Pending:      { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500 animate-pulse' },
  Approved:     { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  Rejected:     { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  'Checked In': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
  'Checked Out':{ color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-400' },
  Overstay:     { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500 animate-ping' },
  Cancelled:    { color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-100',   dot: 'bg-slate-300' },
};

const relationColors: Record<string, string> = {
  Father: 'text-blue-700 bg-blue-50 border-blue-200',
  Mother: 'text-pink-700 bg-pink-50 border-pink-200',
  Sibling: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Guardian: 'text-violet-700 bg-violet-50 border-violet-200',
  Relative: 'text-teal-700 bg-teal-50 border-teal-200',
  Friend: 'text-orange-700 bg-orange-50 border-orange-200',
  Other: 'text-slate-600 bg-slate-100 border-slate-200',
};

// ─── BADGE COMPONENTS ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: VisitorStatus }> = ({ status }) => {
  const c = statusConfig[status] ?? statusConfig.Pending;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${c.dot}`} /> {status}
    </span>
  );
};

const RelationBadge: React.FC<{ relation: string }> = ({ relation }) => {
  const cls = relationColors[relation] ?? relationColors.Other;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${cls}`}>
      {relation}
    </span>
  );
};

// ─── VISITOR CARD ─────────────────────────────────────────────────────────────

interface VisitorCardProps {
  visitor: Visitor;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onCheckIn?: (id: number) => void;
  onCheckOut?: (id: number) => void;
  onCancel?: (id: number) => void;
  showActions?: boolean;
}

const VisitorCard: React.FC<VisitorCardProps> = ({
  visitor: v, onApprove, onReject, onCheckIn, onCheckOut, onCancel, showActions = true
}) => (
  <div className={`bg-white border rounded-xl p-2.5 shadow-xs ${v.is_overstay ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}>
    {/* Header row */}
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[8px] font-bold text-slate-400 tracking-wider">{v.gate_pass_number}</span>
          <RelationBadge relation={v.visitor_relation} />
          {v.is_overstay && (
            <span className="text-[8px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
              <AlertTriangle className="w-2 h-2" /> OVERSTAY
            </span>
          )}
        </div>
        <h4 className="text-[11px] font-bold text-slate-900 mt-0.5 leading-tight">{v.visitor_name}</h4>
        <p className="text-[9px] text-slate-500 font-semibold leading-none mt-0.5 flex items-center gap-1">
          <Phone className="w-2 h-2" /> {v.visitor_phone}
          <span className="text-slate-300">·</span>
          {v.visitor_count > 1 && <><Users className="w-2 h-2" /> {v.visitor_count} persons</>}
        </p>
      </div>
      <StatusBadge status={v.status} />
    </div>

    {/* Info grid */}
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-slate-100 text-[9px]">
      <div className="text-slate-500 font-semibold">
        Student: <span className="text-slate-800 font-bold">{v.student_name || '—'}</span>
      </div>
      <div className="text-slate-500 font-semibold">
        Room: <span className="text-slate-800 font-bold">{v.room_number || '—'}</span>
      </div>
      <div className="text-slate-500 font-semibold col-span-2 truncate">
        Purpose: <span className="text-slate-700 font-semibold">{v.purpose}</span>
      </div>
      <div className="text-slate-500 font-semibold">
        Visit Date: <span className="text-slate-800 font-bold">{v.expected_visit_date}</span>
      </div>
      <div className="text-slate-500 font-semibold">
        Time: <span className="text-slate-800 font-bold">{v.expected_entry_time || '—'} – {v.expected_exit_time || '—'}</span>
      </div>
      {v.actual_entry_at && (
        <div className="text-slate-500 font-semibold">
          Checked In: <span className="text-emerald-700 font-bold">{v.actual_entry_at}</span>
        </div>
      )}
      {v.actual_exit_at && (
        <div className="text-slate-500 font-semibold">
          Checked Out: <span className="text-slate-700 font-bold">{v.actual_exit_at}</span>
        </div>
      )}
      {v.duration && (
        <div className="text-slate-500 font-semibold">
          Duration: <span className="text-indigo-700 font-bold">{v.duration}</span>
        </div>
      )}
      {v.rejected_reason && (
        <div className="col-span-2 text-rose-600 font-semibold text-[8px] bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 mt-0.5">
          Rejection: {v.rejected_reason}
        </div>
      )}
      {v.approved_by && (
        <div className="text-slate-500 font-semibold">
          By: <span className="text-slate-700 font-bold">{v.approved_by}</span>
        </div>
      )}
      <div className="text-slate-500 font-semibold">
        ID: <span className="text-slate-700 font-semibold">{v.id_type} {v.id_number ? `· ${v.id_number}` : ''}</span>
      </div>
    </div>

    {/* Action buttons */}
    {showActions && (
      <div className="flex gap-1 mt-1.5">
        {v.status === 'Pending' && onApprove && (
          <button onClick={() => onApprove(v.id)}
            className="flex-1 py-1 text-center border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-lg cursor-pointer transition flex items-center justify-center gap-0.5">
            <UserCheck className="w-3 h-3" /> Approve
          </button>
        )}
        {v.status === 'Pending' && onReject && (
          <button onClick={() => onReject(v.id)}
            className="flex-1 py-1 text-center border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-[9px] rounded-lg cursor-pointer transition flex items-center justify-center gap-0.5">
            <UserX className="w-3 h-3" /> Reject
          </button>
        )}
        {v.status === 'Approved' && onCheckIn && (
          <button onClick={() => onCheckIn(v.id)}
            className="flex-1 py-1 text-center border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-lg cursor-pointer transition flex items-center justify-center gap-0.5">
            <LogIn className="w-3 h-3" /> Check In
          </button>
        )}
        {(v.status === 'Checked In' || v.status === 'Overstay') && onCheckOut && (
          <button onClick={() => onCheckOut(v.id)}
            className="flex-1 py-1 text-center border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[9px] rounded-lg cursor-pointer transition flex items-center justify-center gap-0.5">
            <LogOut className="w-3 h-3" /> Check Out
          </button>
        )}
        {v.status === 'Pending' && onCancel && (
          <button onClick={() => onCancel(v.id)}
            className="py-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-400 font-bold text-[9px] rounded-lg cursor-pointer transition">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    )}
  </div>
);

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats;
  weeklyTrend: any[];
  purposeBreakdown: any[];
  todayVisitors: Visitor[];
  recentActivity: Visitor[];
  loading: boolean;
  onActions: {
    approve: (id: number) => void;
    reject: (id: number) => void;
    checkIn: (id: number) => void;
    checkOut: (id: number) => void;
    cancel: (id: number) => void;
  };
  onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats, weeklyTrend, purposeBreakdown, todayVisitors, recentActivity, loading, onActions, onTabChange
}) => {
  const maxWeek = Math.max(...weeklyTrend.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Today's Visitors", value: stats.today_total,     color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
          { label: 'Pending Approval', value: stats.pending_approval, color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
          { label: 'Active Inside',    value: stats.active_visits,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Checked Out',      value: stats.today_checkouts,  color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
          { label: 'Overstay',         value: stats.overstay,         color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
          { label: 'Blacklisted',      value: stats.blacklist_count,  color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 text-center`}>
            <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-tight`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Weekly Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart2 className="w-2.5 h-2.5" /> 7-day visitor trend
          </h3>
          <div className="flex items-end gap-1 h-12">
            {weeklyTrend.map(d => {
              const pct = (d.count / maxWeek) * 100;
              const isToday = d.date === new Date().toISOString().split('T')[0];
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[7px] font-bold text-slate-600">{d.count || ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '32px' }}>
                    <div
                      className={`w-full rounded-sm transition-all ${isToday ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      style={{ height: `${Math.max(pct, d.count > 0 ? 15 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[7px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Relation Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" /> By relation
          </h3>
          {purposeBreakdown.length === 0 ? (
            <p className="text-[9px] text-slate-400 text-center py-3">No data yet</p>
          ) : (
            <div className="space-y-1.5">
              {purposeBreakdown.map((p: any) => {
                const total = purposeBreakdown.reduce((a: number, b: any) => a + b.count, 0);
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.visitor_relation} className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold text-slate-600 w-16 truncate">{p.visitor_relation}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-700 w-6 text-right">{p.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Visitors */}
      {todayVisitors.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Today's visitors ({todayVisitors.length})</span>
            <button onClick={() => onTabChange('approvals')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition">View all →</button>
          </h3>
          <div className="space-y-1.5">
            {todayVisitors.slice(0, 4).map(v => (
              <VisitorCard key={v.id} visitor={v}
                onApprove={onActions.approve} onReject={onActions.reject}
                onCheckIn={onActions.checkIn} onCheckOut={onActions.checkOut}
                onCancel={onActions.cancel} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick actions</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Register Visitor', tab: 'register' as TabId,  color: 'bg-indigo-600 text-white', icon: Plus },
            { label: 'Pending Approvals', tab: 'approvals' as TabId, color: 'bg-amber-500 text-white',  icon: ClipboardCheck },
            { label: 'Check-in / Out', tab: 'checkinout' as TabId,  color: 'bg-emerald-600 text-white', icon: ScanLine },
            { label: 'Blacklist',      tab: 'blacklist' as TabId,  color: 'bg-slate-700 text-white',   icon: ShieldBan },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => onTabChange(a.tab)}
                className={`flex items-center gap-1.5 p-2 rounded-xl font-bold text-[9px] cursor-pointer transition hover:opacity-90 ${a.color}`}>
                <Icon className="w-3 h-3" /> {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── REGISTER TAB ─────────────────────────────────────────────────────────────

interface RegisterTabProps {
  visitors: Visitor[];
  loading: boolean;
  onRefresh: () => void;
}

const RegisterTab: React.FC<RegisterTabProps> = ({ visitors, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_relation: 'Father',
    purpose: '', id_type: 'Aadhar Card', id_number: '',
    student_name: '', room_number: '', block_floor: '',
    visitor_count: '1', expected_visit_date: new Date().toISOString().split('T')[0],
    expected_entry_time: '', expected_exit_time: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = visitors.filter(v => {
    const matchSearch = !search || [v.visitor_name, v.visitor_phone, v.student_name, v.room_number, v.gate_pass_number]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name.trim() || !form.visitor_phone.trim()) {
      toast.error('Visitor name and phone required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/visitors/register', {
        ...form,
        visitor_count: Number(form.visitor_count),
        expected_entry_time: form.expected_entry_time || undefined,
        expected_exit_time: form.expected_exit_time || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({
          visitor_name: '', visitor_phone: '', visitor_relation: 'Father',
          purpose: '', id_type: 'Aadhar Card', id_number: '',
          student_name: '', room_number: '', block_floor: '',
          visitor_count: '1', expected_visit_date: new Date().toISOString().split('T')[0],
          expected_entry_time: '', expected_exit_time: '', notes: '',
        });
        onRefresh();
      }
    } catch (err: any) {
      if (err.response?.data?.blacklisted) {
        toast.error(err.response.data.message, { duration: 5000, icon: '🚫' });
      } else {
        toast.error(err.response?.data?.message || 'Failed to register visitor');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitors, students, room..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All status</option>
          {['Pending', 'Approved', 'Rejected', 'Checked In', 'Checked Out', 'Overstay', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Register
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <BookUser className="w-3 h-3 text-indigo-500" /> Register new visitor
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2 md:col-span-1">
                <label className={lbl}>Visitor Name *</label>
                <input value={form.visitor_name} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))}
                  placeholder="Full name" className={inp} required />
              </div>
              <div>
                <label className={lbl}>Phone *</label>
                <input value={form.visitor_phone} onChange={e => setForm(f => ({ ...f, visitor_phone: e.target.value }))}
                  placeholder="10-digit mobile" className={inp} required />
              </div>
              <div>
                <label className={lbl}>Relation</label>
                <select value={form.visitor_relation} onChange={e => setForm(f => ({ ...f, visitor_relation: e.target.value }))} className={inp}>
                  {['Father', 'Mother', 'Sibling', 'Guardian', 'Relative', 'Friend', 'Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Purpose of Visit *</label>
                <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Monthly parent visit, delivering medicines..." className={inp} required />
              </div>
              <div>
                <label className={lbl}>ID Type</label>
                <select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} className={inp}>
                  {['Aadhar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>ID Number</label>
                <input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))}
                  placeholder="e.g. 1234-5678-9012" className={inp} />
              </div>
              <div>
                <label className={lbl}>Student Name</label>
                <input value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                  placeholder="Student being visited" className={inp} />
              </div>
              <div>
                <label className={lbl}>Room No.</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                  placeholder="e.g. 204" className={inp} />
              </div>
              <div>
                <label className={lbl}>No. of Visitors</label>
                <input type="number" min="1" max="10" value={form.visitor_count} onChange={e => setForm(f => ({ ...f, visitor_count: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Visit Date *</label>
                <input type="date" value={form.expected_visit_date} onChange={e => setForm(f => ({ ...f, expected_visit_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Entry Time</label>
                <input type="time" value={form.expected_entry_time} onChange={e => setForm(f => ({ ...f, expected_entry_time: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Exit Time</label>
                <input type="time" value={form.expected_exit_time} onChange={e => setForm(f => ({ ...f, expected_exit_time: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <QrCode className="w-3 h-3" /> {submitting ? 'Registering...' : 'Register & Generate Gate Pass'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading visitor records...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No visitors found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(v => (
            <VisitorCard key={v.id} visitor={v} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── APPROVALS TAB ────────────────────────────────────────────────────────────

interface ApprovalsTabProps {
  visitors: Visitor[];
  loading: boolean;
  onActions: {
    approve: (id: number) => void;
    reject: (id: number) => void;
    cancel: (id: number) => void;
  };
}

const ApprovalsTab: React.FC<ApprovalsTabProps> = ({ visitors, loading, onActions }) => {
  const pending = visitors.filter(v => v.status === 'Pending');
  const approved = visitors.filter(v => v.status === 'Approved');
  const rejected = visitors.filter(v => ['Rejected', 'Cancelled'].includes(v.status));

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : (
        <>
          {/* Pending */}
          <div className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs">
            <h3 className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse" /> Awaiting Approval ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <div className="text-center py-3 text-[9px] text-slate-400 font-semibold flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" /> No pending approvals
              </div>
            ) : (
              <div className="space-y-1.5">
                {pending.map(v => (
                  <VisitorCard key={v.id} visitor={v}
                    onApprove={onActions.approve} onReject={onActions.reject} onCancel={onActions.cancel} />
                ))}
              </div>
            )}
          </div>

          {/* Approved - waiting check-in */}
          {approved.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl p-2.5 shadow-xs">
              <h3 className="text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Approved — Awaiting Check-in ({approved.length})
              </h3>
              <div className="space-y-1.5">
                {approved.map(v => <VisitorCard key={v.id} visitor={v} showActions={false} />)}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <UserX className="w-3 h-3" /> Rejected / Cancelled ({rejected.length})
              </h3>
              <div className="space-y-1.5">
                {rejected.map(v => <VisitorCard key={v.id} visitor={v} showActions={false} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── CHECK-IN / OUT TAB ───────────────────────────────────────────────────────

interface CheckInOutTabProps {
  visitors: Visitor[];
  loading: boolean;
  onActions: {
    checkIn: (id: number) => void;
    checkOut: (id: number) => void;
  };
}

const CheckInOutTab: React.FC<CheckInOutTabProps> = ({ visitors, loading, onActions }) => {
  const approved    = visitors.filter(v => v.status === 'Approved');
  const active      = visitors.filter(v => v.status === 'Checked In');
  const overstay    = visitors.filter(v => v.status === 'Overstay');
  const checkedOut  = visitors.filter(v => v.status === 'Checked Out');

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : (
        <>
          {/* Overstay Alert */}
          {overstay.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 shadow-xs">
              <h3 className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 animate-pulse" /> Overstay Alert — {overstay.length} visitor(s)!
              </h3>
              <div className="space-y-1.5">
                {overstay.map(v => (
                  <VisitorCard key={v.id} visitor={v} onCheckOut={onActions.checkOut} />
                ))}
              </div>
            </div>
          )}

          {/* Ready to Check In */}
          <div className="bg-white border border-blue-200 rounded-xl p-2.5 shadow-xs">
            <h3 className="text-[9px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Ready to Check In ({approved.length})
            </h3>
            {approved.length === 0 ? (
              <div className="text-center py-3 text-[9px] text-slate-400 font-semibold">No approved visitors pending check-in.</div>
            ) : (
              <div className="space-y-1.5">
                {approved.map(v => (
                  <VisitorCard key={v.id} visitor={v} onCheckIn={onActions.checkIn} />
                ))}
              </div>
            )}
          </div>

          {/* Currently Inside */}
          <div className="bg-white border border-emerald-200 rounded-xl p-2.5 shadow-xs">
            <h3 className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" /> Currently Inside ({active.length})
            </h3>
            {active.length === 0 ? (
              <div className="text-center py-3 text-[9px] text-slate-400 font-semibold">No active visitors.</div>
            ) : (
              <div className="space-y-1.5">
                {active.map(v => (
                  <VisitorCard key={v.id} visitor={v} onCheckOut={onActions.checkOut} />
                ))}
              </div>
            )}
          </div>

          {/* Checked Out Today */}
          {checkedOut.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Checked Out ({checkedOut.length})
              </h3>
              <div className="space-y-1.5">
                {checkedOut.map(v => <VisitorCard key={v.id} visitor={v} showActions={false} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── BLACKLIST TAB ────────────────────────────────────────────────────────────

interface BlacklistTabProps {
  blacklist: BlacklistEntry[];
  loading: boolean;
  onRefresh: () => void;
}

const BlacklistTab: React.FC<BlacklistTabProps> = ({ blacklist, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitor_name: '', visitor_phone: '', id_type: 'Aadhar Card',
    id_number: '', reason: '', blacklisted_by: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-rose-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name.trim() || !form.reason.trim()) { toast.error('Name and reason required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/visitors/blacklist', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ visitor_name: '', visitor_phone: '', id_type: 'Aadhar Card', id_number: '', reason: '', blacklisted_by: '' });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to blacklist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}" from blacklist?`)) return;
    try {
      const res = await api.delete(`/school/hostel/visitors/blacklist/${id}`);
      if (res.data.success) { toast.success(res.data.message); onRefresh(); }
    } catch { toast.error('Failed to remove.'); }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg flex items-center gap-1">
          <ShieldBan className="w-3 h-3" /> {blacklist.length} person(s) blacklisted
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-rose-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-rose-700 transition">
          <Plus className="w-3 h-3" /> Add to Blacklist
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-rose-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <ShieldBan className="w-3 h-3 text-rose-500" /> Add visitor to blacklist
          </h3>
          <form onSubmit={handleAdd} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={lbl}>Visitor Name *</label>
                <input value={form.visitor_name} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input value={form.visitor_phone} onChange={e => setForm(f => ({ ...f, visitor_phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>ID Type</label>
                <select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} className={inp}>
                  {['Aadhar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>ID Number</label>
                <input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Blacklisted By</label>
                <input value={form.blacklisted_by} onChange={e => setForm(f => ({ ...f, blacklisted_by: e.target.value }))} placeholder="Your name / authority" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Reason *</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Why is this person being blacklisted?" required
                  className={`${inp} resize-none h-12`} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <ShieldBan className="w-3 h-3" /> {submitting ? 'Adding...' : 'Add to Blacklist'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blacklist */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading...</div>
      ) : blacklist.length === 0 ? (
        <div className="text-center py-8 flex flex-col items-center gap-2">
          <Shield className="w-8 h-8 text-emerald-300" />
          <p className="text-[10px] text-slate-400 font-semibold">No blacklisted visitors</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {blacklist.map(b => (
            <div key={b.id} className="bg-white border border-rose-100 rounded-xl p-2.5 shadow-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{b.visitor_name}</h4>
                  {b.visitor_phone && <p className="text-[9px] text-slate-500 font-semibold mt-0.5 flex items-center gap-0.5"><Phone className="w-2 h-2" /> {b.visitor_phone}</p>}
                </div>
                <button onClick={() => handleRemove(b.id, b.visitor_name)}
                  className="p-0.5 hover:bg-rose-50 rounded transition cursor-pointer">
                  <Trash2 className="w-3 h-3 text-slate-300 hover:text-rose-500" />
                </button>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] space-y-0.5">
                <p className="text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5">{b.reason}</p>
                <div className="flex gap-3 text-slate-500 font-semibold">
                  {b.id_number && <span>ID: {b.id_type} · {b.id_number}</span>}
                  <span>By: {b.blacklisted_by || '—'}</span>
                  <span>Date: {b.blacklisted_on}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HostelVisitorManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Dashboard
  const [dashStats, setDashStats]       = useState<DashStats>({ today_total: 0, pending_approval: 0, active_visits: 0, today_checkouts: 0, overstay: 0, blacklist_count: 0 });
  const [weeklyTrend, setWeeklyTrend]   = useState<any[]>([]);
  const [purposeBreakdown, setPurpose]  = useState<any[]>([]);
  const [todayVisitors, setTodayVis]    = useState<Visitor[]>([]);
  const [recentActivity, setRecent]     = useState<Visitor[]>([]);
  const [dashLoading, setDashLoading]   = useState(true);

  // All visitors
  const [visitors, setVisitors]         = useState<Visitor[]>([]);
  const [visitorsLoading, setVL]        = useState(true);

  // Blacklist
  const [blacklist, setBlacklist]       = useState<BlacklistEntry[]>([]);
  const [blacklistLoading, setBL]       = useState(true);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await api.get('/school/hostel/visitors/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats);
        setWeeklyTrend(d.weekly_trend);
        setPurpose(d.purpose_breakdown);
        setTodayVis(d.today_visitors);
        setRecent(d.recent_activity);
      }
    } catch (e) { console.error('Visitor dashboard error:', e); }
    finally { setDashLoading(false); }
  };

  const fetchVisitors = async () => {
    setVL(true);
    try {
      const res = await api.get('/school/hostel/visitors/list');
      if (res.data.success) setVisitors(res.data.data);
    } catch (e) { console.error('Visitors fetch error:', e); }
    finally { setVL(false); }
  };

  const fetchBlacklist = async () => {
    setBL(true);
    try {
      const res = await api.get('/school/hostel/visitors/blacklist');
      if (res.data.success) setBlacklist(res.data.data);
    } catch (e) { console.error('Blacklist fetch error:', e); }
    finally { setBL(false); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchVisitors();
    fetchBlacklist();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (['register', 'approvals', 'checkinout'].includes(activeTab)) fetchVisitors();
    if (activeTab === 'blacklist') fetchBlacklist();
  }, [activeTab]);

  const refreshAll = () => { fetchDashboard(); fetchVisitors(); };

  // ── Shared action handlers ───────────────────────────────────────────────

  const handleApprove = async (id: number) => {
    const approver = prompt('Approved by (name/designation):') || 'Hostel Warden';
    try {
      const res = await api.post(`/school/hostel/visitors/${id}/approve`, { approved_by: approver });
      if (res.data.success) { toast.success(res.data.message); refreshAll(); }
      else toast.error(res.data.message);
    } catch { toast.error('Approval failed.'); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      const res = await api.post(`/school/hostel/visitors/${id}/reject`, { rejected_reason: reason });
      if (res.data.success) { toast.success(res.data.message); refreshAll(); }
      else toast.error(res.data.message);
    } catch { toast.error('Rejection failed.'); }
  };

  const handleCheckIn = async (id: number) => {
    try {
      const res = await api.post(`/school/hostel/visitors/${id}/checkin`);
      if (res.data.success) { toast.success(res.data.message); refreshAll(); }
      else toast.error(res.data.message);
    } catch { toast.error('Check-in failed.'); }
  };

  const handleCheckOut = async (id: number) => {
    try {
      const res = await api.post(`/school/hostel/visitors/${id}/checkout`);
      if (res.data.success) { toast.success(res.data.message); refreshAll(); }
      else toast.error(res.data.message);
    } catch { toast.error('Check-out failed.'); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this visit request?')) return;
    try {
      const res = await api.post(`/school/hostel/visitors/${id}/cancel`);
      if (res.data.success) { toast.success(res.data.message); refreshAll(); }
    } catch { toast.error('Cancel failed.'); }
  };

  const actions = {
    approve: handleApprove, reject: handleReject,
    checkIn: handleCheckIn, checkOut: handleCheckOut, cancel: handleCancel,
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'register',  label: 'All Visitors', icon: BookUser,       badge: visitors.length || undefined },
    { id: 'approvals', label: 'Approvals',    icon: ClipboardCheck, badge: dashStats.pending_approval || undefined },
    { id: 'checkinout',label: 'Check-in/Out', icon: ScanLine,       badge: (dashStats.active_visits + dashStats.overstay) || undefined },
    { id: 'blacklist', label: 'Blacklist',    icon: ShieldBan,      badge: dashStats.blacklist_count || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <Users className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Guest &amp; Visitor Management</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              Shri Ram Boys Hostel · {dashStats.active_visits} inside · {dashStats.today_total} today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.overstay > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" /> {dashStats.overstay} overstay
            </span>
          )}
          {dashStats.pending_approval > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
              <Clock className="w-2.5 h-2.5" /> {dashStats.pending_approval} pending
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
            stats={dashStats} weeklyTrend={weeklyTrend} purposeBreakdown={purposeBreakdown}
            todayVisitors={todayVisitors} recentActivity={recentActivity}
            loading={dashLoading} onActions={actions} onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'register' && (
          <RegisterTab visitors={visitors} loading={visitorsLoading} onRefresh={refreshAll} />
        )}
        {activeTab === 'approvals' && (
          <ApprovalsTab visitors={visitors} loading={visitorsLoading} onActions={actions} />
        )}
        {activeTab === 'checkinout' && (
          <CheckInOutTab visitors={visitors} loading={visitorsLoading} onActions={actions} />
        )}
        {activeTab === 'blacklist' && (
          <BlacklistTab blacklist={blacklist} loading={blacklistLoading} onRefresh={fetchBlacklist} />
        )}
      </div>
    </div>
  );
};

export default HostelVisitorManager;
