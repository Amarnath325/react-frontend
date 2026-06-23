import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, BookOpen, AlertOctagon, Gavel,
  Plus, Search, Shield, ShieldAlert, ShieldBan, ShieldCheck,
  BarChart2, TrendingUp, AlertTriangle, CheckCircle2,
  RefreshCw, ChevronDown, ChevronUp, Clock, Eye,
  XCircle, CheckSquare, FileWarning, Scale, Flame,
  Zap, Utensils, Users, Home, Smartphone, Leaf,
  BookMarked, DoorOpen, Activity, X, Check, Ban,
  IndianRupee, CalendarDays, UserX
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'rules' | 'violations' | 'actions';

interface Rule {
  id: number; rule_code: string; title: string; description: string;
  category: string; severity: 'Low' | 'Medium' | 'High' | 'Critical';
  consequence?: string; sort_order: number; is_active: boolean;
  violations_count: number;
}

interface Violation {
  id: number; violation_code: string;
  student_name?: string; student_class?: string; room_number?: string;
  rule_title?: string; rule_category?: string;
  incident_date?: string; incident_time?: string;
  description: string; witnesses?: string; reported_by?: string;
  status: string; action_taken?: string;
  fine_amount: number; suspension_days: number;
  hearing_date?: string; is_repeat_offender: boolean;
  notes?: string; resolved_by?: string; actions_count: number; created_at?: string;
}

interface DashStats {
  totalRules: number; totalViolations: number; pendingCases: number;
  thisMonthViol: number; totalFines: number; suspended: number; repeatOffenders: number;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const severityConfig = {
  Low:      { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-400', icon: Shield },
  Medium:   { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-400',   icon: ShieldAlert },
  High:     { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-orange-500',  icon: ShieldBan },
  Critical: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    bar: 'bg-rose-600',    icon: Flame },
};

const categoryConfig: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'General':               { color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-200',   icon: BookMarked },
  'Curfew & Timing':       { color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: Clock },
  'Mess & Dining':         { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  icon: Utensils },
  'Visiting & Guests':     { color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  icon: DoorOpen },
  'Cleanliness & Hygiene': { color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    icon: Leaf },
  'Academic Discipline':   { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: BookOpen },
  'Security & Safety':     { color: 'text-slate-800',   bg: 'bg-slate-100',  border: 'border-slate-300',   icon: ShieldCheck },
  'Technology & Devices':  { color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: Smartphone },
  'Substance & Conduct':   { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: Ban },
};

const violationStatusConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  'Pending':        { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400 animate-pulse' },
  'Under Review':   { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500 animate-pulse' },
  'Warning Issued': { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500' },
  'Fine Imposed':   { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  'Suspended':      { color: 'text-rose-800',    bg: 'bg-rose-100',   border: 'border-rose-300',    dot: 'bg-rose-700' },
  'Resolved':       { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Dismissed':      { color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',   dot: 'bg-slate-400' },
};

const actionTypeConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Verbal Warning':     { color: 'text-amber-700',   bg: 'bg-amber-50',   icon: AlertTriangle },
  'Written Warning':    { color: 'text-orange-700',  bg: 'bg-orange-50',  icon: FileWarning },
  'Fine':               { color: 'text-rose-700',    bg: 'bg-rose-50',    icon: IndianRupee },
  'Suspension':         { color: 'text-rose-800',    bg: 'bg-rose-100',   icon: UserX },
  'Community Service':  { color: 'text-teal-700',    bg: 'bg-teal-50',    icon: Leaf },
  'Counselling':        { color: 'text-blue-700',    bg: 'bg-blue-50',    icon: Users },
  'Expulsion Notice':   { color: 'text-rose-900',    bg: 'bg-rose-200',   icon: ShieldBan },
  'Parent Notification':{ color: 'text-indigo-700',  bg: 'bg-indigo-50',  icon: Users },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const c = severityConfig[severity as keyof typeof severityConfig] ?? severityConfig.Low;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <Icon className="w-2 h-2" /> {severity}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const c = categoryConfig[category] ?? categoryConfig.General;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <Icon className="w-2 h-2" /> {category}
    </span>
  );
};

const ViolationStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = violationStatusConfig[status] ?? violationStatusConfig.Pending;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} /> {status}
    </span>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats; monthlyTrend: any[]; byCategory: any[];
  bySeverity: Record<string, number>; statusBreakdown: Record<string, number>;
  recentViolations: Violation[]; mostViolated: any[];
  loading: boolean; onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats, monthlyTrend, byCategory, bySeverity, statusBreakdown,
  recentViolations, mostViolated, loading, onTabChange
}) => {
  const maxMonth = Math.max(...monthlyTrend.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Active Rules',     value: stats.totalRules,      color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Total Violations', value: stats.totalViolations,  color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
          { label: 'Pending Cases',    value: stats.pendingCases,     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
          { label: 'This Month',       value: stats.thisMonthViol,    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Currently Susp.',  value: stats.suspended,        color: 'text-rose-800',   bg: 'bg-rose-100',  border: 'border-rose-300' },
          { label: 'Repeat Offenders', value: stats.repeatOffenders,  color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 text-center`}>
            <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-tight`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total Fines */}
      {stats.totalFines > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-rose-600" />
          <div>
            <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wide">Total Fines Imposed: </span>
            <span className="text-[13px] font-black text-rose-800">₹{stats.totalFines.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> 6-Month Violation Trend
          </h3>
          <div className="flex items-end gap-1 h-12">
            {monthlyTrend.map((d, i) => {
              const pct = (d.count / maxMonth) * 100;
              const isCurr = i === monthlyTrend.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[7px] font-bold text-slate-600">{d.count || ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '32px' }}>
                    <div className={`w-full rounded-sm transition-all ${isCurr ? 'bg-rose-500' : 'bg-slate-200'}`}
                      style={{ height: `${Math.max(pct, d.count > 0 ? 15 : 0)}%` }} />
                  </div>
                  <span className={`text-[7px] font-bold ${isCurr ? 'text-rose-600' : 'text-slate-400'}`}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Violation Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" /> Cases by Status
          </h3>
          <div className="space-y-1">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const sc = violationStatusConfig[status];
              const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold w-24 ${sc?.color || 'text-slate-600'}`}>{status}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${sc?.dot?.split(' ')[0] || 'bg-slate-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <BarChart2 className="w-2.5 h-2.5" /> Violations by Category
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {byCategory.map((c: any) => {
            const cc = categoryConfig[c.rule_category] ?? categoryConfig.General;
            const Icon = cc.icon;
            const maxCat = Math.max(...byCategory.map((x: any) => x.count), 1);
            return (
              <div key={c.rule_category} className="flex items-center gap-1.5">
                <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${cc.color}`} />
                <span className="text-[8px] font-semibold text-slate-600 flex-1 truncate">{c.rule_category}</span>
                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cc.bg.replace('50','400').replace('100','400')} rounded-full`}
                    style={{ width: `${(c.count / maxCat) * 100}%`, background: '' }}>
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <span className="text-[8px] font-black text-slate-700 w-3 text-right">{c.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5" /> Violations by Severity
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => {
            const sc = severityConfig[sev];
            const Icon = sc.icon;
            return (
              <div key={sev} className={`${sc.bg} border ${sc.border} rounded-xl p-2 text-center`}>
                <Icon className={`w-3 h-3 ${sc.color} mx-auto`} />
                <p className={`text-lg font-black ${sc.color} leading-tight mt-0.5`}>{bySeverity[sev] || 0}</p>
                <p className={`text-[7px] font-bold ${sc.color} uppercase`}>{sev}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most Violated Rules */}
      {mostViolated.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-rose-500" /> Most Violated Rules
          </h3>
          <div className="space-y-1">
            {mostViolated.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1">
                <span className="text-[8px] font-black text-rose-600 w-4">{i + 1}.</span>
                <span className="text-[9px] font-bold text-slate-800 flex-1 truncate">{r.rule_title}</span>
                <CategoryBadge category={r.rule_category} />
                <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1 rounded">{r.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Violations */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><AlertOctagon className="w-2.5 h-2.5 text-rose-500" /> Recent Cases</span>
          <button onClick={() => onTabChange('violations')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer text-[8px] transition">View all →</button>
        </h3>
        <div className="space-y-1">
          {recentViolations.slice(0, 4).map(v => (
            <div key={v.id} className="flex items-start gap-2 border border-slate-100 rounded-lg px-2 py-1.5">
              {v.is_repeat_offender && (
                <span className="text-[7px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1 py-0.5 rounded flex-shrink-0">REPEAT</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-800 leading-none">{v.student_name}</span>
                  <span className="text-[8px] text-slate-400">{v.room_number ? `Room ${v.room_number}` : ''}</span>
                </div>
                <p className="text-[8px] text-slate-500 font-semibold mt-0.5 truncate">{v.rule_title || v.description.slice(0, 60)}</p>
                <p className="text-[8px] text-slate-400">{v.incident_date}</p>
              </div>
              <ViolationStatusBadge status={v.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── RULES TAB ────────────────────────────────────────────────────────────────

interface RulesTabProps {
  rules: Rule[]; loading: boolean;
  onRefresh: () => void;
  onToggle: (id: number) => void;
}

const RulesTab: React.FC<RulesTabProps> = ({ rules, loading, onRefresh, onToggle }) => {
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [filterSev, setFilterSev]   = useState('all');
  const [expandedId, setExpanded]   = useState<number | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'General',
    severity: 'Medium', consequence: '',
  });

  const categories = Object.keys(categoryConfig);

  const filtered = rules.filter(r => {
    const matchS = !search || [r.title, r.rule_code, r.description]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchC = filterCat === 'all' || r.category === filterCat;
    const matchV = filterSev === 'all' || r.severity === filterSev;
    return matchS && matchC && matchV;
  });

  // Group by category
  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Rule[]>);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/discipline/rules', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ title: '', description: '', category: 'General', severity: 'Medium', consequence: '' });
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add rule'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          {['all', 'Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Severity' : s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Plus className="w-3 h-3" /> Add Rule
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <BookOpen className="w-3 h-3 text-indigo-500" /> Add new hostel rule
          </h3>
          <form onSubmit={handleAdd} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className={lbl}>Rule Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. No Smoking on Premises" className={inp} required />
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Severity *</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className={inp}>
                  {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Full Description *</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inp} resize-none`} required />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Consequence / Penalty</label>
                <textarea rows={2} value={form.consequence} onChange={e => setForm(f => ({ ...f, consequence: e.target.value }))}
                  placeholder="e.g. First offence: Warning. Repeat: Fine ₹500." className={`${inp} resize-none`} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <Shield className="w-3 h-3" /> {submitting ? 'Saving...' : 'Save Rule'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-1.5 flex-wrap">
        {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => {
          const sc = severityConfig[sev];
          const cnt = rules.filter(r => r.severity === sev).length;
          return cnt > 0 ? (
            <span key={sev} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[8px] font-bold ${sc.color} ${sc.bg} ${sc.border}`}>
              {sev}: {cnt}
            </span>
          ) : null;
        })}
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[8px] font-bold text-slate-500 bg-slate-100 border-slate-200">
          Total: {rules.length} rules
        </span>
      </div>

      {/* Grouped Rules */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading rules...</div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([cat, catRules]) => {
            const cc = categoryConfig[cat] ?? categoryConfig.General;
            const CatIcon = cc.icon;
            return (
              <div key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-100 ${cc.bg}`}>
                  <CatIcon className={`w-3 h-3 ${cc.color}`} />
                  <span className={`text-[9px] font-bold ${cc.color} uppercase tracking-wide`}>{cat}</span>
                  <span className={`ml-auto text-[8px] font-bold ${cc.color}`}>{catRules.length} rules</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {catRules.map(r => (
                    <div key={r.id} className={`p-2 ${!r.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-bold text-slate-400">{r.rule_code}</span>
                            <SeverityBadge severity={r.severity} />
                            {r.violations_count > 0 && (
                              <span className="text-[7px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded-full">{r.violations_count} violations</span>
                            )}
                            {!r.is_active && <span className="text-[7px] font-bold text-slate-400 bg-slate-100 px-1 rounded">INACTIVE</span>}
                          </div>
                          <h4 className="text-[10px] font-bold text-slate-900 mt-0.5">{r.title}</h4>
                          {expandedId === r.id && (
                            <div className="mt-1 space-y-1">
                              <p className="text-[9px] text-slate-600 font-semibold leading-relaxed">{r.description}</p>
                              {r.consequence && (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-1.5">
                                  <p className="text-[8px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Consequence</p>
                                  <p className="text-[9px] text-amber-800 font-semibold">{r.consequence}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setExpanded(expandedId === r.id ? null : r.id)}
                            className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer">
                            {expandedId === r.id
                              ? <ChevronUp className="w-3 h-3 text-slate-400" />
                              : <ChevronDown className="w-3 h-3 text-slate-400" />}
                          </button>
                          <button onClick={() => onToggle(r.id)}
                            className={`px-1.5 py-0.5 text-[8px] font-bold rounded border cursor-pointer transition ${r.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}>
                            {r.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── VIOLATIONS TAB ───────────────────────────────────────────────────────────

interface ViolationsTabProps {
  violations: Violation[]; rules: Rule[]; loading: boolean;
  onRefresh: () => void; onActionTab: (v: Violation) => void;
}

const ViolationsTab: React.FC<ViolationsTabProps> = ({ violations, rules, loading, onRefresh, onActionTab }) => {
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('all');
  const [filterCat, setFilterCat]   = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpanded]   = useState<number | null>(null);

  const [form, setForm] = useState({
    student_name: '', student_class: '', room_number: '',
    rule_id: '', incident_date: new Date().toISOString().split('T')[0],
    incident_time: '', description: '', witnesses: '',
    reported_by: '', hearing_date: '', notes: '',
  });

  const filtered = violations.filter(v => {
    const matchS = !search || [v.student_name, v.violation_code, v.rule_title, v.room_number]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchSt = filterStatus === 'all' || v.status === filterStatus;
    const matchC  = filterCat === 'all' || v.rule_category === filterCat;
    return matchS && matchSt && matchC;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.description.trim()) { toast.error('Student name and description required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/discipline/violations', {
        ...form,
        rule_id: form.rule_id ? Number(form.rule_id) : undefined,
        incident_time: form.incident_time || undefined,
        hearing_date: form.hearing_date || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message, { duration: 4000 });
        setShowForm(false);
        setForm({ student_name: '', student_class: '', room_number: '', rule_id: '', incident_date: new Date().toISOString().split('T')[0], incident_time: '', description: '', witnesses: '', reported_by: '', hearing_date: '', notes: '' });
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to record violation'); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await api.post(`/school/hostel/discipline/violations/${id}/status`, { status });
      if (res.data.success) { toast.success(res.data.message); onRefresh(); }
    } catch { toast.error('Status update failed.'); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const categories = Object.keys(categoryConfig);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, room, rule..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Status</option>
          {['Pending', 'Under Review', 'Warning Issued', 'Fine Imposed', 'Suspended', 'Resolved', 'Dismissed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-rose-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-rose-700 transition">
          <Plus className="w-3 h-3" /> Report Violation
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
        <div className="bg-white border border-rose-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <AlertOctagon className="w-3 h-3 text-rose-500" /> Report new violation
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
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. 204" className={inp} />
              </div>
              <div>
                <label className={lbl}>Rule Violated</label>
                <select value={form.rule_id} onChange={e => setForm(f => ({ ...f, rule_id: e.target.value }))} className={inp}>
                  <option value="">— Select Rule —</option>
                  {rules.filter(r => r.is_active).map(r => <option key={r.id} value={r.id}>[{r.rule_code}] {r.title}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Incident Date *</label>
                <input type="date" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Incident Time</label>
                <input type="time" value={form.incident_time} onChange={e => setForm(f => ({ ...f, incident_time: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description of Incident *</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what happened, when and where..." className={`${inp} resize-none`} required />
              </div>
              <div>
                <label className={lbl}>Witnesses</label>
                <input value={form.witnesses} onChange={e => setForm(f => ({ ...f, witnesses: e.target.value }))} placeholder="Names of witnesses" className={inp} />
              </div>
              <div>
                <label className={lbl}>Reported By</label>
                <input value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} placeholder="Your name / designation" className={inp} />
              </div>
              <div>
                <label className={lbl}>Hearing Date (if required)</label>
                <input type="date" value={form.hearing_date} onChange={e => setForm(f => ({ ...f, hearing_date: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <AlertOctagon className="w-3 h-3" /> {submitting ? 'Recording...' : 'Record Violation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Violation Cards */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading violations...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 flex flex-col items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-emerald-300" />
          <p className="text-[10px] text-slate-400 font-semibold">No violations found.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(v => (
            <div key={v.id} className={`bg-white border rounded-xl p-2.5 shadow-xs ${v.is_repeat_offender ? 'border-rose-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-bold text-slate-400">{v.violation_code}</span>
                    {v.is_repeat_offender && (
                      <span className="text-[7px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1 py-0.5 rounded-full animate-pulse">⚠ REPEAT</span>
                    )}
                    {v.rule_category && <CategoryBadge category={v.rule_category} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{v.student_name}</h4>
                    {v.student_class && <span className="text-[8px] text-slate-400 font-semibold">{v.student_class}</span>}
                    {v.room_number && <span className="text-[8px] text-slate-500 font-semibold">Room {v.room_number}</span>}
                  </div>
                  <p className="text-[9px] text-slate-600 font-semibold mt-0.5 leading-tight">{v.rule_title || 'General violation'}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{v.incident_date} {v.incident_time ? `at ${v.incident_time}` : ''}</p>
                  {expandedId === v.id && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[9px] text-slate-700 font-semibold leading-relaxed bg-slate-50 border border-slate-100 rounded p-1.5">{v.description}</p>
                      {v.witnesses && <p className="text-[8px] text-slate-500"><span className="font-bold">Witnesses:</span> {v.witnesses}</p>}
                      {v.reported_by && <p className="text-[8px] text-slate-500"><span className="font-bold">Reported by:</span> {v.reported_by}</p>}
                      {v.action_taken && <p className="text-[8px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-1">{v.action_taken}</p>}
                      {v.fine_amount > 0 && <p className="text-[8px] font-bold text-rose-700"><IndianRupee className="inline w-2 h-2" /> Fine: ₹{v.fine_amount}</p>}
                      {v.hearing_date && <p className="text-[8px] text-indigo-700 font-bold">Hearing: {v.hearing_date}</p>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ViolationStatusBadge status={v.status} />
                  <button onClick={() => setExpanded(expandedId === v.id ? null : v.id)}
                    className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer">
                    {expandedId === v.id ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Action row */}
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <button onClick={() => onActionTab(v)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-indigo-100 transition">
                  <Gavel className="w-2.5 h-2.5" /> Issue Action {v.actions_count > 0 ? `(${v.actions_count})` : ''}
                </button>
                {['Pending', 'Under Review'].includes(v.status) && (
                  <>
                    <button onClick={() => handleStatusUpdate(v.id, 'Under Review')}
                      className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-blue-100 transition">
                      Under Review
                    </button>
                    <button onClick={() => handleStatusUpdate(v.id, 'Dismissed')}
                      className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-slate-100 transition">
                      Dismiss
                    </button>
                  </>
                )}
                {['Warning Issued', 'Fine Imposed', 'Suspended', 'Under Review'].includes(v.status) && (
                  <button onClick={() => handleStatusUpdate(v.id, 'Resolved')}
                    className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-emerald-100 transition">
                    <CheckCircle2 className="inline w-2.5 h-2.5 mr-0.5" /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ACTIONS TAB ──────────────────────────────────────────────────────────────

interface ActionsTabProps {
  selectedViolation: Violation | null;
  violations: Violation[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

const ActionsTab: React.FC<ActionsTabProps> = ({ selectedViolation, violations, onClearSelection, onRefresh }) => {
  const [activeViolation, setActiveViolation] = useState<Violation | null>(selectedViolation);
  const [actions, setActions]       = useState<any[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    action_type: 'Verbal Warning', description: '', issued_by: '',
    fine_amount: '', suspension_from: '', suspension_to: '',
    parent_notified: false, notes: '',
  });

  useEffect(() => {
    if (selectedViolation) setActiveViolation(selectedViolation);
  }, [selectedViolation]);

  useEffect(() => {
    if (activeViolation) fetchActions(activeViolation.id);
  }, [activeViolation]);

  const fetchActions = async (id: number) => {
    setActLoading(true);
    try {
      const res = await api.get(`/school/hostel/discipline/violations/${id}/actions`);
      if (res.data.success) setActions(res.data.data);
    } catch (e) { console.error(e); }
    finally { setActLoading(false); }
  };

  const handleIssue = async (e: React.FormEvent) => {
    if (!activeViolation) return;
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Action description required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/school/hostel/discipline/violations/${activeViolation.id}/action`, {
        ...form,
        fine_amount: form.fine_amount ? Number(form.fine_amount) : undefined,
        parent_notified: form.parent_notified,
        suspension_from: form.suspension_from || undefined,
        suspension_to: form.suspension_to || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ action_type: 'Verbal Warning', description: '', issued_by: '', fine_amount: '', suspension_from: '', suspension_to: '', parent_notified: false, notes: '' });
        fetchActions(activeViolation.id);
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to issue action'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const showFine = form.action_type === 'Fine';
  const showSusp = form.action_type === 'Suspension' || form.action_type === 'Expulsion Notice';

  return (
    <div className="space-y-2">
      {/* Select Violation */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1"><Gavel className="w-2.5 h-2.5" /> Select Violation Case</span>
          {activeViolation && <button onClick={() => { setActiveViolation(null); onClearSelection(); }} className="text-slate-400 cursor-pointer hover:text-slate-600 transition"><X className="w-3 h-3" /></button>}
        </h3>
        {activeViolation ? (
          <div className="border border-indigo-200 bg-indigo-50 rounded-lg px-2 py-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-bold text-indigo-600">{activeViolation.violation_code}</span>
              <ViolationStatusBadge status={activeViolation.status} />
            </div>
            <p className="text-[10px] font-bold text-slate-900 mt-0.5">{activeViolation.student_name}</p>
            <p className="text-[8px] text-slate-600 font-semibold">{activeViolation.rule_title || activeViolation.description.slice(0, 60)}</p>
          </div>
        ) : (
          <select onChange={e => {
            const v = violations.find(vv => vv.id === Number(e.target.value));
            setActiveViolation(v || null);
          }} className={`${inp} h-8`} defaultValue="">
            <option value="">— Select a violation case —</option>
            {violations.filter(v => !['Resolved', 'Dismissed'].includes(v.status)).map(v => (
              <option key={v.id} value={v.id}>[{v.violation_code}] {v.student_name} — {v.rule_title || 'General'}</option>
            ))}
          </select>
        )}
      </div>

      {activeViolation && (
        <>
          {/* Issue New Action */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-2.5 h-2.5" /> Issue Disciplinary Action
              </h3>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-600 text-white font-bold text-[8px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
                <Plus className="w-2.5 h-2.5" /> New Action
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleIssue} className="space-y-1.5 border-t border-slate-100 pt-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="col-span-2">
                    <label className={lbl}>Action Type *</label>
                    <div className="grid grid-cols-4 gap-1">
                      {Object.keys(actionTypeConfig).map(at => {
                        const ac = actionTypeConfig[at];
                        const Icon = ac.icon;
                        const isSelected = form.action_type === at;
                        return (
                          <button key={at} type="button" onClick={() => setForm(f => ({ ...f, action_type: at }))}
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-center cursor-pointer transition text-[8px] font-bold ${isSelected ? `${ac.bg} ${ac.color} border-current` : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                            <Icon className="w-3 h-3" />
                            <span className="leading-tight">{at.split(' ').slice(0, 2).join(' ')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Description / Reason *</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className={`${inp} resize-none`} required />
                  </div>
                  <div>
                    <label className={lbl}>Issued By</label>
                    <input value={form.issued_by} onChange={e => setForm(f => ({ ...f, issued_by: e.target.value }))} placeholder="Warden name" className={inp} />
                  </div>
                  {showFine && (
                    <div>
                      <label className={lbl}>Fine Amount (₹) *</label>
                      <input type="number" min="0" value={form.fine_amount} onChange={e => setForm(f => ({ ...f, fine_amount: e.target.value }))} className={inp} />
                    </div>
                  )}
                  {showSusp && (
                    <>
                      <div>
                        <label className={lbl}>Suspension From</label>
                        <input type="date" value={form.suspension_from} onChange={e => setForm(f => ({ ...f, suspension_from: e.target.value }))} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Suspension To</label>
                        <input type="date" value={form.suspension_to} onChange={e => setForm(f => ({ ...f, suspension_to: e.target.value }))} className={inp} />
                      </div>
                    </>
                  )}
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="parent_notified" checked={form.parent_notified}
                      onChange={e => setForm(f => ({ ...f, parent_notified: e.target.checked }))}
                      className="w-3 h-3 cursor-pointer" />
                    <label htmlFor="parent_notified" className="text-[9px] font-bold text-slate-600 cursor-pointer">Parents have been notified</label>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                    <Gavel className="w-3 h-3" /> {submitting ? 'Issuing...' : 'Issue Action'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Actions History */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Action History ({actions.length})
            </h3>
            {actLoading ? (
              <div className="text-center py-4 text-[10px] text-slate-400 font-semibold">Loading...</div>
            ) : actions.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-400 font-semibold">No actions issued yet for this case.</div>
            ) : (
              <div className="space-y-1.5">
                {actions.map((a: any) => {
                  const ac = actionTypeConfig[a.action_type] ?? { color: 'text-slate-600', bg: 'bg-slate-50', icon: Gavel };
                  const Icon = ac.icon;
                  return (
                    <div key={a.id} className={`border rounded-xl p-2 ${ac.bg} border-slate-200`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3 h-3 ${ac.color}`} />
                          <span className={`text-[9px] font-bold ${ac.color}`}>{a.action_type}</span>
                          {a.fine_amount > 0 && <span className="text-[8px] font-black text-rose-700">₹{a.fine_amount}</span>}
                          {a.parent_notified && <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded">Parent Notified</span>}
                        </div>
                        <span className="text-[8px] text-slate-400 font-semibold">{a.action_date}</span>
                      </div>
                      <p className="text-[9px] text-slate-700 font-semibold mt-0.5 leading-relaxed">{a.description}</p>
                      {a.suspension_from && (
                        <p className="text-[8px] font-bold text-rose-700 mt-0.5">Suspension: {a.suspension_from} → {a.suspension_to}</p>
                      )}
                      <p className="text-[8px] text-slate-400 mt-0.5">Issued by: <span className="font-bold text-slate-600">{a.issued_by}</span></p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HostelDisciplineManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  const [dashStats, setDashStats]    = useState<DashStats>({ totalRules: 0, totalViolations: 0, pendingCases: 0, thisMonthViol: 0, totalFines: 0, suspended: 0, repeatOffenders: 0 });
  const [monthlyTrend, setMonthTrend]= useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [bySeverity, setBySeverity]  = useState<Record<string, number>>({});
  const [statusBD, setStatusBD]      = useState<Record<string, number>>({});
  const [recentViol, setRecentViol]  = useState<Violation[]>([]);
  const [mostViol, setMostViol]      = useState<any[]>([]);
  const [dashLoading, setDashLoading]= useState(true);

  const [rules, setRules]            = useState<Rule[]>([]);
  const [rulesLoading, setRL]        = useState(true);
  const [violations, setViolations]  = useState<Violation[]>([]);
  const [violLoading, setVL]         = useState(true);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await api.get('/school/hostel/discipline/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats);
        setMonthTrend(d.monthly_trend);
        setByCategory(d.by_category);
        setBySeverity(d.by_severity);
        setStatusBD(d.status_breakdown);
        setRecentViol(d.recent_violations);
        setMostViol(d.most_violated);
      }
    } catch (e) { console.error(e); }
    finally { setDashLoading(false); }
  };

  const fetchRules = async () => {
    setRL(true);
    try {
      const res = await api.get('/school/hostel/discipline/rules');
      if (res.data.success) setRules(res.data.data);
    } catch (e) { console.error(e); }
    finally { setRL(false); }
  };

  const fetchViolations = async () => {
    setVL(true);
    try {
      const res = await api.get('/school/hostel/discipline/violations');
      if (res.data.success) setViolations(res.data.data);
    } catch (e) { console.error(e); }
    finally { setVL(false); }
  };

  useEffect(() => { fetchDashboard(); fetchRules(); fetchViolations(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'rules') fetchRules();
    if (activeTab === 'violations') fetchViolations();
  }, [activeTab]);

  const handleToggleRule = async (id: number) => {
    try {
      const res = await api.post(`/school/hostel/discipline/rules/${id}/toggle`);
      if (res.data.success) { toast.success(res.data.message); fetchRules(); fetchDashboard(); }
    } catch { toast.error('Failed to toggle rule.'); }
  };

  const handleOpenAction = (v: Violation) => {
    setSelectedViolation(v);
    setActiveTab('actions');
  };

  const refreshAll = () => { fetchDashboard(); fetchViolations(); fetchRules(); };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'rules',      label: 'Rules',        icon: BookOpen,        badge: rules.length || undefined },
    { id: 'violations', label: 'Violations',   icon: AlertOctagon,    badge: dashStats.pendingCases || undefined },
    { id: 'actions',    label: 'Actions',      icon: Gavel },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-rose-50 text-rose-600 rounded-md">
            <Scale className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Rules &amp; Discipline Management</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              {dashStats.totalRules} rules active · {dashStats.pendingCases} pending · {dashStats.suspended} suspended
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.pendingCases > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
              <Clock className="w-2.5 h-2.5" /> {dashStats.pendingCases} pending
            </span>
          )}
          {dashStats.suspended > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
              <UserX className="w-2.5 h-2.5" /> {dashStats.suspended} suspended
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
                isActive ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
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
          <DashboardTab stats={dashStats} monthlyTrend={monthlyTrend} byCategory={byCategory}
            bySeverity={bySeverity} statusBreakdown={statusBD} recentViolations={recentViol}
            mostViolated={mostViol} loading={dashLoading} onTabChange={setActiveTab} />
        )}
        {activeTab === 'rules' && (
          <RulesTab rules={rules} loading={rulesLoading} onRefresh={fetchRules} onToggle={handleToggleRule} />
        )}
        {activeTab === 'violations' && (
          <ViolationsTab violations={violations} rules={rules} loading={violLoading}
            onRefresh={refreshAll} onActionTab={handleOpenAction} />
        )}
        {activeTab === 'actions' && (
          <ActionsTab selectedViolation={selectedViolation} violations={violations}
            onClearSelection={() => setSelectedViolation(null)} onRefresh={refreshAll} />
        )}
      </div>
    </div>
  );
};

export default HostelDisciplineManager;
