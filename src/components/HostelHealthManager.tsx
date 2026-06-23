import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, HeartPulse, Stethoscope, Pill, ClipboardList,
  Plus, Search, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  Phone, Thermometer, Activity, Heart, User, Home,
  ShieldAlert, CheckCircle2, Clock, TrendingUp, BarChart2,
  Droplets, FlaskConical, Zap, Syringe, Package, AlertCircle,
  CalendarDays, UserCheck, X, Check, Eye, FileText,
  IndianRupee, BookOpen
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'profiles' | 'visits' | 'medicines';

interface HealthProfile {
  id: number; student_name: string; student_class?: string; room_number?: string;
  date_of_birth?: string; age?: number; blood_group: string;
  height_cm?: number; weight_kg?: number; bmi?: number;
  allergies?: string; chronic_conditions?: string; disabilities?: string;
  current_medications?: string; vaccination_notes?: string;
  emergency_contact_name?: string; emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  insurance_provider?: string; primary_doctor?: string; doctor_phone?: string;
  has_special_diet: boolean; diet_details?: string; notes?: string;
  visits_count: number;
}

interface MedVisit {
  id: number; visit_code: string;
  student_name: string; student_class?: string; room_number?: string;
  visit_date?: string; visit_date_raw?: string; visit_time?: string;
  symptoms: string; diagnosis?: string; treatment_given?: string;
  medicines_prescribed?: string; follow_up_date?: string;
  referred_to_hospital: boolean; hospital_name?: string;
  attended_by?: string; severity: 'Mild' | 'Moderate' | 'Severe' | 'Emergency';
  status: 'Open' | 'Recovered' | 'Referred' | 'Follow-Up Needed';
  temperature?: number; pulse_rate?: number; blood_pressure?: string;
  notes?: string; created_at?: string;
}

interface Medicine {
  id: number; name: string; generic_name?: string; category: string;
  quantity_in_stock: number; unit: string; minimum_stock_level: number;
  expiry_date?: string; expiry_date_raw?: string; days_to_expiry?: number;
  is_low_stock: boolean; is_expiring_soon: boolean; is_expired: boolean;
  manufacturer?: string; storage_instructions?: string; usage_notes?: string; is_active: boolean;
}

interface DashStats {
  totalProfiles: number; todayVisits: number; openCases: number; referredCases: number;
  thisMonthVisits: number; chronicStudents: number; lowStock: number; expiringSoon: number;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const severityConfig = {
  Mild:      { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-400' },
  Moderate:  { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-400' },
  Severe:    { color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-orange-500' },
  Emergency: { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    bar: 'bg-rose-600' },
};

const visitStatusConfig = {
  Open:             { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400 animate-pulse' },
  Recovered:        { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Referred:         { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'bg-rose-500' },
  'Follow-Up Needed': { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200',  dot: 'bg-indigo-500 animate-pulse' },
};

const bloodGroupColors: Record<string, string> = {
  'A+': 'text-rose-700 bg-rose-50 border-rose-200',
  'A-': 'text-rose-700 bg-rose-100 border-rose-300',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200',
  'B-': 'text-blue-700 bg-blue-100 border-blue-300',
  'AB+':'text-violet-700 bg-violet-50 border-violet-200',
  'AB-':'text-violet-700 bg-violet-100 border-violet-300',
  'O+': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'O-': 'text-emerald-700 bg-emerald-100 border-emerald-300',
  'Unknown': 'text-slate-500 bg-slate-100 border-slate-200',
};

const medCatConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Tablet':       { color: 'text-indigo-700', bg: 'bg-indigo-50',  icon: Pill },
  'Syrup':        { color: 'text-teal-700',   bg: 'bg-teal-50',    icon: FlaskConical },
  'Injection':    { color: 'text-rose-700',   bg: 'bg-rose-50',    icon: Syringe },
  'Capsule':      { color: 'text-violet-700', bg: 'bg-violet-50',  icon: Pill },
  'Ointment/Cream':{ color: 'text-amber-700', bg: 'bg-amber-50',   icon: Package },
  'Drops':        { color: 'text-cyan-700',   bg: 'bg-cyan-50',    icon: Droplets },
  'Powder':       { color: 'text-orange-700', bg: 'bg-orange-50',  icon: FlaskConical },
  'Other':        { color: 'text-slate-600',  bg: 'bg-slate-100',  icon: Package },
};

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────

const SeverityBadge: React.FC<{ severity: string }> = ({ s: severity = '' as any, severity: sev }: any) => {
  const sv = sev as string;
  const c = severityConfig[sv as keyof typeof severityConfig] ?? severityConfig.Mild;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <Activity className="w-2 h-2" /> {sv}
    </span>
  );
};

const VisitStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const c = visitStatusConfig[status as keyof typeof visitStatusConfig] ?? visitStatusConfig.Open;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} /> {status}
    </span>
  );
};

const BloodGroupBadge: React.FC<{ bg: string }> = ({ bg }) => (
  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black border ${bloodGroupColors[bg] || bloodGroupColors.Unknown}`}>
    <Droplets className="w-2 h-2" /> {bg}
  </span>
);

const BmiIndicator: React.FC<{ bmi: number }> = ({ bmi }) => {
  const cat = bmi < 18.5 ? { l: 'Underweight', c: 'text-blue-600' }
    : bmi < 25 ? { l: 'Normal', c: 'text-emerald-600' }
    : bmi < 30 ? { l: 'Overweight', c: 'text-amber-600' }
    : { l: 'Obese', c: 'text-rose-600' };
  return (
    <span className={`text-[8px] font-bold ${cat.c}`}>{bmi} <span className="text-slate-400">({cat.l})</span></span>
  );
};

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: DashStats; monthlyTrend: any[]; bySeverity: Record<string, number>;
  byBloodGroup: any[]; recentVisits: MedVisit[]; openCases: MedVisit[];
  lowStockList: Medicine[]; loading: boolean; onTabChange: (t: TabId) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  stats, monthlyTrend, bySeverity, byBloodGroup, recentVisits, openCases, lowStockList, loading, onTabChange
}) => {
  const maxMonth = Math.max(...monthlyTrend.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Health Profiles', value: stats.totalProfiles,   color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Today\'s Visits',  value: stats.todayVisits,     color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
          { label: 'Open Cases',       value: stats.openCases,       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
          { label: 'Referred',         value: stats.referredCases,   color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
          { label: 'This Month',       value: stats.thisMonthVisits, color: 'text-slate-700',  bg: 'bg-slate-100', border: 'border-slate-200' },
          { label: 'Chronic Illness',  value: stats.chronicStudents, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
          { label: 'Low Stock Meds',   value: stats.lowStock,        color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: 'Expiring Soon',    value: stats.expiringSoon,    color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-1.5 text-center`}>
            <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
            <p className={`text-[7px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-tight`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts row */}
      <div className="flex gap-1.5 flex-wrap">
        {stats.lowStock > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5 flex-1">
            <AlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
            <p className="text-[9px] font-bold text-orange-800">{stats.lowStock} medicines below minimum stock level</p>
            <button onClick={() => onTabChange('medicines')} className="ml-auto text-[8px] font-bold text-orange-600 hover:text-orange-800 cursor-pointer transition">View →</button>
          </div>
        )}
        {stats.expiringSoon > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1.5 flex-1">
            <AlertTriangle className="w-3 h-3 text-rose-500 flex-shrink-0" />
            <p className="text-[9px] font-bold text-rose-800">{stats.expiringSoon} medicines expiring within 90 days</p>
            <button onClick={() => onTabChange('medicines')} className="ml-auto text-[8px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer transition">View →</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> 6-Month Visit Trend
          </h3>
          <div className="flex items-end gap-1 h-14">
            {monthlyTrend.map((d, i) => {
              const pct = (d.count / maxMonth) * 100;
              const isCurr = i === monthlyTrend.length - 1;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[7px] font-bold text-slate-600">{d.count || ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '36px' }}>
                    <div className={`w-full rounded-t transition-all ${isCurr ? 'bg-teal-500' : 'bg-teal-200'}`}
                      style={{ height: `${Math.max(pct, d.count > 0 ? 15 : 0)}%` }} />
                  </div>
                  <span className={`text-[7px] font-bold ${isCurr ? 'text-teal-600' : 'text-slate-400'}`}>{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blood Group Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Droplets className="w-2.5 h-2.5 text-rose-500" /> Blood Group Distribution
          </h3>
          <div className="grid grid-cols-4 gap-1">
            {byBloodGroup.map((bg: any) => (
              <div key={bg.blood_group} className={`text-center rounded-lg p-1 border ${bloodGroupColors[bg.blood_group] || bloodGroupColors.Unknown}`}>
                <p className="text-[10px] font-black">{bg.count}</p>
                <p className="text-[8px] font-bold">{bg.blood_group}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <HeartPulse className="w-2.5 h-2.5 text-rose-500" /> Visits by Severity
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(['Emergency', 'Severe', 'Moderate', 'Mild'] as const).map(sev => {
            const sc = severityConfig[sev];
            return (
              <div key={sev} className={`${sc.bg} border ${sc.border} rounded-xl p-2 text-center`}>
                <p className={`text-lg font-black ${sc.color} leading-none`}>{bySeverity[sev] || 0}</p>
                <p className={`text-[7px] font-bold ${sc.color} uppercase`}>{sev}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Cases */}
      {openCases.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Open / Follow-Up Cases ({openCases.length})</span>
            <button onClick={() => onTabChange('visits')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition text-[8px]">View all →</button>
          </h3>
          <div className="space-y-1">
            {openCases.map(v => {
              const sc = severityConfig[v.severity] ?? severityConfig.Mild;
              return (
                <div key={v.id} className={`flex items-center gap-2 border rounded-lg px-2 py-1.5 ${sc.border} ${sc.bg}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-900">{v.student_name}</span>
                      {v.room_number && <span className="text-[8px] text-slate-400">Room {v.room_number}</span>}
                    </div>
                    <p className="text-[8px] text-slate-600 font-semibold truncate">{v.symptoms.slice(0, 60)}</p>
                    <p className="text-[8px] text-slate-400">{v.visit_date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-[8px] font-bold ${sc.color}`}>{v.severity}</span>
                    <VisitStatusBadge status={v.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low Stock Medicines */}
      {lowStockList.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-orange-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Low Stock Alerts</span>
            <button onClick={() => onTabChange('medicines')} className="text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer transition text-[8px]">Manage →</button>
          </h3>
          <div className="space-y-1">
            {lowStockList.map(m => {
              const pct = Math.min((m.quantity_in_stock / m.minimum_stock_level) * 100, 100);
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-700 flex-1 truncate">{m.name}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct < 30 ? 'bg-rose-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[8px] font-black ${m.quantity_in_stock === 0 ? 'text-rose-700' : 'text-orange-700'}`}>
                    {m.quantity_in_stock}/{m.minimum_stock_level} {m.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── HEALTH PROFILES TAB ──────────────────────────────────────────────────────

interface ProfilesTabProps {
  profiles: HealthProfile[]; loading: boolean; onRefresh: () => void;
}

const ProfilesTab: React.FC<ProfilesTabProps> = ({ profiles, loading, onRefresh }) => {
  const [search, setSearch]           = useState('');
  const [filterBG, setFilterBG]       = useState('all');
  const [expandedId, setExpanded]     = useState<number | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const [form, setForm] = useState({
    student_name: '', student_class: '', room_number: '',
    date_of_birth: '', blood_group: 'Unknown',
    height_cm: '', weight_kg: '',
    allergies: 'None', chronic_conditions: 'None', disabilities: 'None',
    current_medications: '', vaccination_notes: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: 'Father',
    insurance_provider: '', primary_doctor: '', doctor_phone: '',
    has_special_diet: false, diet_details: '', notes: '',
  });

  const filtered = profiles.filter(p => {
    const matchS = !search || [p.student_name, p.room_number, p.student_class]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchBG = filterBG === 'all' || p.blood_group === filterBG;
    return matchS && matchBG;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim()) { toast.error('Student name required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/health/profiles', form);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create profile'); }
    finally { setSubmitting(false); }
  };

  const inp  = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-teal-500';
  const lbl  = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, room, class..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500" />
        </div>
        <select value={filterBG} onChange={e => setFilterBG(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Blood Groups</option>
          {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-teal-700 transition">
          <Plus className="w-3 h-3" /> Add Profile
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-teal-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <User className="w-3 h-3 text-teal-500" /> Create student health profile
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2 md:col-span-1">
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
                <label className={lbl}>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Blood Group</label>
                <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} className={inp}>
                  {bloodGroups.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Height (cm)</label>
                <input type="number" min="50" max="250" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Weight (kg)</label>
                <input type="number" min="10" max="200" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Known Allergies</label>
                <input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, Dust. Write 'None' if no allergies." className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Chronic Conditions / Medical History</label>
                <input value={form.chronic_conditions} onChange={e => setForm(f => ({ ...f, chronic_conditions: e.target.value }))} placeholder="e.g. Asthma, Diabetes. Write 'None' if healthy." className={inp} />
              </div>
              <div>
                <label className={lbl}>Emergency Contact Name</label>
                <input value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Emergency Phone</label>
                <input value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Relation</label>
                <select value={form.emergency_contact_relation} onChange={e => setForm(f => ({ ...f, emergency_contact_relation: e.target.value }))} className={inp}>
                  {['Father', 'Mother', 'Guardian', 'Sibling', 'Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Primary Doctor</label>
                <input value={form.primary_doctor} onChange={e => setForm(f => ({ ...f, primary_doctor: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="spec_diet" checked={form.has_special_diet}
                  onChange={e => setForm(f => ({ ...f, has_special_diet: e.target.checked }))} className="w-3 h-3 cursor-pointer" />
                <label htmlFor="spec_diet" className="text-[9px] font-bold text-slate-600 cursor-pointer">Student requires special diet</label>
              </div>
              {form.has_special_diet && (
                <div className="col-span-2">
                  <label className={lbl}>Diet Details</label>
                  <input value={form.diet_details} onChange={e => setForm(f => ({ ...f, diet_details: e.target.value }))} placeholder="e.g. No dairy products, low sugar diet" className={inp} />
                </div>
              )}
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <Heart className="w-3 h-3" /> {submitting ? 'Saving...' : 'Save Health Profile'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles list */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No profiles found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs hover:border-teal-200 transition">
              <div className="flex items-start gap-2">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                  {p.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-[11px] font-bold text-slate-900">{p.student_name}</h4>
                    {p.student_class && <span className="text-[8px] text-slate-400 font-semibold">{p.student_class}</span>}
                    {p.room_number && <span className="text-[8px] text-slate-500 font-semibold flex items-center gap-0.5"><Home className="w-2 h-2" />{p.room_number}</span>}
                    <BloodGroupBadge bg={p.blood_group} />
                    {p.has_special_diet && <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded-full">Special Diet</span>}
                    {p.visits_count > 0 && <span className="text-[7px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1 py-0.5 rounded-full">{p.visits_count} visit{p.visits_count > 1 ? 's' : ''}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[9px]">
                    {p.bmi && <span className="text-slate-500 font-semibold">BMI: <BmiIndicator bmi={p.bmi} /></span>}
                    {p.height_cm && <span className="text-slate-500 font-semibold">{p.height_cm}cm / {p.weight_kg}kg</span>}
                    {p.allergies && p.allergies !== 'None' && (
                      <span className="text-rose-600 font-bold col-span-2 flex items-center gap-0.5">
                        <AlertTriangle className="w-2 h-2" /> Allergy: {p.allergies}
                      </span>
                    )}
                    {p.chronic_conditions && p.chronic_conditions !== 'None' && (
                      <span className="text-violet-600 font-bold col-span-2 flex items-center gap-0.5">
                        <HeartPulse className="w-2 h-2" /> {p.chronic_conditions}
                      </span>
                    )}
                  </div>

                  {expandedId === p.id && (
                    <div className="mt-1.5 border-t border-slate-100 pt-1.5 space-y-1 text-[9px]">
                      {p.emergency_contact_name && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-2.5 h-2.5 text-teal-500" />
                          <span className="font-bold">Emergency:</span> {p.emergency_contact_name} ({p.emergency_contact_relation})
                          <span className="font-bold text-teal-700">{p.emergency_contact_phone}</span>
                        </div>
                      )}
                      {p.primary_doctor && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <Stethoscope className="w-2.5 h-2.5 text-indigo-500" />
                          <span className="font-bold">Doctor:</span> {p.primary_doctor} {p.doctor_phone && `· ${p.doctor_phone}`}
                        </div>
                      )}
                      {p.current_medications && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded p-1">
                          <p className="text-[8px] font-bold text-indigo-700 mb-0.5">Current Medications</p>
                          <p className="text-slate-700">{p.current_medications}</p>
                        </div>
                      )}
                      {p.diet_details && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded p-1">
                          <p className="text-[8px] font-bold text-emerald-700 mb-0.5">Special Diet</p>
                          <p className="text-slate-700">{p.diet_details}</p>
                        </div>
                      )}
                      {p.vaccination_notes && (
                        <div className="bg-teal-50 border border-teal-100 rounded p-1">
                          <p className="text-[8px] font-bold text-teal-700 mb-0.5">Vaccination Notes</p>
                          <p className="text-slate-700">{p.vaccination_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button onClick={() => setExpanded(expandedId === p.id ? null : p.id)}
                  className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer flex-shrink-0">
                  {expandedId === p.id ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MEDICAL VISITS TAB ───────────────────────────────────────────────────────

interface VisitsTabProps {
  visits: MedVisit[]; profiles: HealthProfile[]; loading: boolean;
  onRefresh: () => void;
}

const VisitsTab: React.FC<VisitsTabProps> = ({ visits, profiles, loading, onRefresh }) => {
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [filterSev, setFilterSev] = useState('all');
  const [expandedId, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_name: '', student_class: '', room_number: '', health_profile_id: '',
    visit_date: new Date().toISOString().split('T')[0], visit_time: '',
    symptoms: '', diagnosis: '', treatment_given: '', medicines_prescribed: '',
    follow_up_date: '', referred_to_hospital: false, hospital_name: '',
    attended_by: '', severity: 'Mild', temperature: '', pulse_rate: '', blood_pressure: '', notes: '',
  });

  const filtered = visits.filter(v => {
    const matchS  = !search || [v.student_name, v.visit_code, v.symptoms, v.room_number]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchSt = filterStatus === 'all' || v.status === filterStatus;
    const matchSv = filterSev === 'all' || v.severity === filterSev;
    return matchS && matchSt && matchSv;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name.trim() || !form.symptoms.trim()) { toast.error('Student name and symptoms required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/health/visits', {
        ...form,
        health_profile_id: form.health_profile_id ? Number(form.health_profile_id) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        pulse_rate: form.pulse_rate ? Number(form.pulse_rate) : undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForm(false);
        setForm({ student_name: '', student_class: '', room_number: '', health_profile_id: '', visit_date: new Date().toISOString().split('T')[0], visit_time: '', symptoms: '', diagnosis: '', treatment_given: '', medicines_prescribed: '', follow_up_date: '', referred_to_hospital: false, hospital_name: '', attended_by: '', severity: 'Mild', temperature: '', pulse_rate: '', blood_pressure: '', notes: '' });
        onRefresh();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to record visit'); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await api.post(`/school/hostel/health/visits/${id}/status`, { status });
      if (res.data.success) { toast.success(res.data.message); onRefresh(); }
    } catch { toast.error('Failed to update status.'); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-teal-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, symptoms, code..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500" />
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Status</option>
          {['Open', 'Recovered', 'Referred', 'Follow-Up Needed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Severity</option>
          {['Mild', 'Moderate', 'Severe', 'Emergency'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-teal-700 transition">
          <Plus className="w-3 h-3" /> Log Visit
        </button>
      </div>

      {/* Log Visit Form */}
      {showForm && (
        <div className="bg-white border border-teal-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Stethoscope className="w-3 h-3 text-teal-500" /> Log new sick room visit
          </h3>
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={lbl}>Student Name *</label>
                <input value={form.student_name} onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, student_name: v }));
                  const p = profiles.find(p => p.student_name.toLowerCase().includes(v.toLowerCase()));
                  if (p && v.length > 2) setForm(f => ({ ...f, student_name: v, health_profile_id: String(p.id), room_number: p.room_number || f.room_number, student_class: p.student_class || f.student_class }));
                }} placeholder="Type to auto-fill from profile" className={inp} required />
              </div>
              <div>
                <label className={lbl}>Link to Health Profile</label>
                <select value={form.health_profile_id} onChange={e => {
                  const p = profiles.find(p => p.id === Number(e.target.value));
                  setForm(f => ({ ...f, health_profile_id: e.target.value, student_name: p?.student_name || f.student_name, room_number: p?.room_number || f.room_number, student_class: p?.student_class || f.student_class }));
                }} className={inp}>
                  <option value="">— Select Profile —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.student_name} (Room {p.room_number})</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Class</label>
                <input value={form.student_class} onChange={e => setForm(f => ({ ...f, student_class: e.target.value }))} placeholder="e.g. Class XI-A" className={inp} />
              </div>
              <div>
                <label className={lbl}>Room</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Visit Date *</label>
                <input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Time</label>
                <input type="time" value={form.visit_time} onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Symptoms *</label>
                <textarea rows={2} value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="Describe all symptoms clearly..." className={`${inp} resize-none`} required />
              </div>
              {/* Vitals */}
              <div>
                <label className={lbl}>Temperature (°C)</label>
                <input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} placeholder="e.g. 38.5" className={inp} />
              </div>
              <div>
                <label className={lbl}>Pulse Rate (bpm)</label>
                <input type="number" value={form.pulse_rate} onChange={e => setForm(f => ({ ...f, pulse_rate: e.target.value }))} placeholder="e.g. 95" className={inp} />
              </div>
              <div>
                <label className={lbl}>Blood Pressure</label>
                <input value={form.blood_pressure} onChange={e => setForm(f => ({ ...f, blood_pressure: e.target.value }))} placeholder="e.g. 120/80" className={inp} />
              </div>
              <div>
                <label className={lbl}>Severity *</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className={inp}>
                  {['Mild', 'Moderate', 'Severe', 'Emergency'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Diagnosis</label>
                <input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Viral fever, Gastroenteritis" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Treatment Given</label>
                <textarea rows={2} value={form.treatment_given} onChange={e => setForm(f => ({ ...f, treatment_given: e.target.value }))} className={`${inp} resize-none`} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Medicines Prescribed</label>
                <input value={form.medicines_prescribed} onChange={e => setForm(f => ({ ...f, medicines_prescribed: e.target.value }))} placeholder="e.g. Paracetamol 500mg TDS, ORS" className={inp} />
              </div>
              <div>
                <label className={lbl}>Attended By</label>
                <input value={form.attended_by} onChange={e => setForm(f => ({ ...f, attended_by: e.target.value }))} placeholder="Doctor / Nurse name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Follow-Up Date</label>
                <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className={inp} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="refer_hosp" checked={form.referred_to_hospital}
                  onChange={e => setForm(f => ({ ...f, referred_to_hospital: e.target.checked }))} className="w-3 h-3 cursor-pointer" />
                <label htmlFor="refer_hosp" className="text-[9px] font-bold text-rose-700 cursor-pointer">Referred to hospital</label>
              </div>
              {form.referred_to_hospital && (
                <div className="col-span-2">
                  <label className={lbl}>Hospital Name</label>
                  <input value={form.hospital_name} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} placeholder="Name of hospital referred to" className={inp} />
                </div>
              )}
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <ClipboardList className="w-3 h-3" /> {submitting ? 'Saving...' : 'Save Visit Record'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visit Cards */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading visits...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">No records found.</div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(v => {
            const sc = severityConfig[v.severity] ?? severityConfig.Mild;
            return (
              <div key={v.id} className={`bg-white border rounded-xl p-2.5 shadow-xs ${v.severity === 'Emergency' ? 'border-rose-300' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${sc.bar}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-bold text-slate-400">{v.visit_code}</span>
                      <span className={`text-[8px] font-bold ${sc.color}`}>{v.severity}</span>
                      {v.referred_to_hospital && (
                        <span className="text-[7px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1 py-0.5 rounded-full">HOSPITAL REFERRED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <h4 className="text-[11px] font-bold text-slate-900">{v.student_name}</h4>
                      {v.student_class && <span className="text-[8px] text-slate-400">{v.student_class}</span>}
                      {v.room_number && <span className="text-[8px] text-slate-500">Room {v.room_number}</span>}
                    </div>
                    <p className="text-[9px] text-slate-600 font-semibold mt-0.5 leading-tight line-clamp-2">{v.symptoms}</p>

                    {/* Vitals */}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {v.temperature && (
                        <span className={`flex items-center gap-0.5 text-[8px] font-bold ${v.temperature >= 38 ? 'text-rose-600' : 'text-slate-500'}`}>
                          <Thermometer className="w-2.5 h-2.5" /> {v.temperature}°C
                        </span>
                      )}
                      {v.pulse_rate && (
                        <span className={`flex items-center gap-0.5 text-[8px] font-bold ${v.pulse_rate > 100 ? 'text-amber-600' : 'text-slate-500'}`}>
                          <Activity className="w-2.5 h-2.5" /> {v.pulse_rate} bpm
                        </span>
                      )}
                      {v.blood_pressure && (
                        <span className="flex items-center gap-0.5 text-[8px] font-bold text-slate-500">
                          <Heart className="w-2.5 h-2.5" /> {v.blood_pressure}
                        </span>
                      )}
                    </div>

                    <p className="text-[8px] text-slate-400 mt-0.5">
                      {v.visit_date} {v.visit_time ? `at ${v.visit_time}` : ''}
                      {v.attended_by ? ` · Dr. ${v.attended_by}` : ''}
                    </p>

                    {expandedId === v.id && (
                      <div className="mt-1.5 space-y-1 border-t border-slate-100 pt-1.5">
                        {v.diagnosis && <div className="bg-teal-50 border border-teal-100 rounded p-1"><p className="text-[8px] font-bold text-teal-700">Diagnosis</p><p className="text-[9px] text-slate-700">{v.diagnosis}</p></div>}
                        {v.treatment_given && <div className="bg-indigo-50 border border-indigo-100 rounded p-1"><p className="text-[8px] font-bold text-indigo-700">Treatment</p><p className="text-[9px] text-slate-700">{v.treatment_given}</p></div>}
                        {v.medicines_prescribed && <div className="bg-amber-50 border border-amber-100 rounded p-1"><p className="text-[8px] font-bold text-amber-700">Medicines</p><p className="text-[9px] text-slate-700">{v.medicines_prescribed}</p></div>}
                        {v.follow_up_date && <p className="text-[8px] font-bold text-indigo-700">Follow-up: {v.follow_up_date}</p>}
                        {v.hospital_name && <p className="text-[8px] font-bold text-rose-700">Referred to: {v.hospital_name}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <VisitStatusBadge status={v.status} />
                    <button onClick={() => setExpanded(expandedId === v.id ? null : v.id)}
                      className="p-0.5 hover:bg-slate-100 rounded transition cursor-pointer">
                      {expandedId === v.id ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Action row */}
                {['Open', 'Follow-Up Needed'].includes(v.status) && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <button onClick={() => handleStatusUpdate(v.id, 'Recovered')}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-emerald-100 transition">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Mark Recovered
                    </button>
                    <button onClick={() => handleStatusUpdate(v.id, 'Follow-Up Needed')}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-indigo-100 transition">
                      <CalendarDays className="w-2.5 h-2.5" /> Schedule Follow-Up
                    </button>
                    <button onClick={() => handleStatusUpdate(v.id, 'Referred')}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[8px] rounded-lg cursor-pointer hover:bg-rose-100 transition">
                      <AlertTriangle className="w-2.5 h-2.5" /> Refer to Hospital
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

// ─── MEDICINES TAB ────────────────────────────────────────────────────────────

interface MedicinesTabProps {
  medicines: Medicine[]; loading: boolean; onRefresh: () => void;
}

const MedicinesTab: React.FC<MedicinesTabProps> = ({ medicines, loading, onRefresh }) => {
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [filterAlert, setFilterAlert] = useState('all');
  const [showAddForm, setShowAdd]   = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [stockEdit, setStockEdit]   = useState<Medicine | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '', generic_name: '', category: 'Tablet',
    quantity_in_stock: '', unit: 'tablets', minimum_stock_level: '10',
    expiry_date: '', manufacturer: '', storage_instructions: 'Room temperature', usage_notes: '',
  });
  const [dispForm, setDispForm] = useState({
    medicine_id: '', student_name: '', quantity_given: '1',
    dispensed_by: '', dosage_instructions: '',
  });
  const [stockVal, setStockVal] = useState('');

  const filtered = medicines.filter(m => {
    const matchS = !search || [m.name, m.generic_name, m.category]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchC = filterCat === 'all' || m.category === filterCat;
    const matchA = filterAlert === 'all'
      || (filterAlert === 'low' && m.is_low_stock)
      || (filterAlert === 'expiring' && m.is_expiring_soon)
      || (filterAlert === 'expired' && m.is_expired);
    return matchS && matchC && matchA;
  });

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) { toast.error('Medicine name required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/health/medicines', { ...addForm, quantity_in_stock: Number(addForm.quantity_in_stock), minimum_stock_level: Number(addForm.minimum_stock_level) || 10 });
      if (res.data.success) { toast.success(res.data.message); setShowAdd(false); onRefresh(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to add medicine'); }
    finally { setSubmitting(false); }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispForm.medicine_id || !dispForm.student_name.trim()) { toast.error('Select medicine and enter student name'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/school/hostel/health/medicines/dispense', { ...dispForm, medicine_id: Number(dispForm.medicine_id), quantity_given: Number(dispForm.quantity_given) });
      if (res.data.success) { toast.success(res.data.message); setShowDispense(false); onRefresh(); }
      else toast.error(res.data.message);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Dispense failed'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEdit) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/school/hostel/health/medicines/${stockEdit.id}/stock`, { quantity_in_stock: Number(stockVal) });
      if (res.data.success) { toast.success(res.data.message); setStockEdit(null); onRefresh(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Stock update failed'); }
    finally { setSubmitting(false); }
  };

  const inp = 'w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-teal-500';
  const lbl = 'block text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-0.5';
  const categories = ['Tablet', 'Syrup', 'Injection', 'Capsule', 'Ointment/Cream', 'Drops', 'Powder', 'Other'];

  const alertCounts = {
    low: medicines.filter(m => m.is_low_stock).length,
    expiring: medicines.filter(m => m.is_expiring_soon).length,
    expired: medicines.filter(m => m.is_expired).length,
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="relative flex-1 min-w-28">
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine name..."
            className="w-full pl-6 pr-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-teal-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All Types</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterAlert} onChange={e => setFilterAlert(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1 text-[9px] font-semibold bg-white cursor-pointer outline-none">
          <option value="all">All ({medicines.length})</option>
          <option value="low">Low Stock ({alertCounts.low})</option>
          <option value="expiring">Expiring ({alertCounts.expiring})</option>
          <option value="expired">Expired ({alertCounts.expired})</option>
        </select>
        <button onClick={() => setShowDispense(!showDispense)}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-indigo-700 transition">
          <Pill className="w-3 h-3" /> Dispense
        </button>
        <button onClick={() => setShowAdd(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white font-bold text-[9px] rounded-lg cursor-pointer hover:bg-teal-700 transition">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Dispense Form */}
      {showDispense && (
        <div className="bg-white border border-indigo-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <Pill className="w-3 h-3 text-indigo-500" /> Dispense Medicine
          </h3>
          <form onSubmit={handleDispense} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <label className={lbl}>Medicine *</label>
                <select value={dispForm.medicine_id} onChange={e => setDispForm(f => ({ ...f, medicine_id: e.target.value }))} className={inp} required>
                  <option value="">— Select Medicine —</option>
                  {medicines.filter(m => m.is_active && m.quantity_in_stock > 0).map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.quantity_in_stock} {m.unit})</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Student Name *</label>
                <input value={dispForm.student_name} onChange={e => setDispForm(f => ({ ...f, student_name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Quantity *</label>
                <input type="number" min="1" value={dispForm.quantity_given} onChange={e => setDispForm(f => ({ ...f, quantity_given: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Dispensed By</label>
                <input value={dispForm.dispensed_by} onChange={e => setDispForm(f => ({ ...f, dispensed_by: e.target.value }))} placeholder="Nurse / Doctor name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Dosage Instructions</label>
                <input value={dispForm.dosage_instructions} onChange={e => setDispForm(f => ({ ...f, dosage_instructions: e.target.value }))} placeholder="e.g. 1 tablet after meals TDS" className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <Check className="w-3 h-3" /> {submitting ? 'Dispensing...' : 'Dispense & Deduct Stock'}
              </button>
              <button type="button" onClick={() => setShowDispense(false)} className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Medicine Form */}
      {showAddForm && (
        <div className="bg-white border border-teal-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100">
            <FlaskConical className="w-3 h-3 text-teal-500" /> Add medicine to stock
          </h3>
          <form onSubmit={handleAddMedicine} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={lbl}>Medicine Name *</label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Generic Name</label>
                <input value={addForm.generic_name} onChange={e => setAddForm(f => ({ ...f, generic_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Quantity in Stock *</label>
                <input type="number" min="0" value={addForm.quantity_in_stock} onChange={e => setAddForm(f => ({ ...f, quantity_in_stock: e.target.value }))} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Unit</label>
                <select value={addForm.unit} onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))} className={inp}>
                  {['tablets', 'capsules', 'strips', 'ml', 'bottles', 'vials', 'sachets', 'pieces', 'tubes'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Min Stock Level</label>
                <input type="number" min="1" value={addForm.minimum_stock_level} onChange={e => setAddForm(f => ({ ...f, minimum_stock_level: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Expiry Date</label>
                <input type="date" value={addForm.expiry_date} onChange={e => setAddForm(f => ({ ...f, expiry_date: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Manufacturer</label>
                <input value={addForm.manufacturer} onChange={e => setAddForm(f => ({ ...f, manufacturer: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60">
                <FlaskConical className="w-3 h-3" /> {submitting ? 'Adding...' : 'Add to Stock'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 border border-slate-300 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockEdit && (
        <div className="bg-white border border-amber-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
            <span className="flex items-center gap-1.5"><Package className="w-3 h-3 text-amber-500" /> Update Stock — {stockEdit.name}</span>
            <button onClick={() => setStockEdit(null)} className="cursor-pointer text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
          </h3>
          <form onSubmit={handleUpdateStock} className="flex gap-1.5">
            <div className="flex-1">
              <label className={lbl}>New Quantity ({stockEdit.unit})</label>
              <input type="number" min="0" value={stockVal} onChange={e => setStockVal(e.target.value)} className={inp} required autoFocus />
            </div>
            <button type="submit" disabled={submitting}
              className="self-end px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-xl transition disabled:opacity-60 cursor-pointer">
              {submitting ? 'Saving...' : 'Update'}
            </button>
          </form>
        </div>
      )}

      {/* Medicines Table */}
      {loading ? (
        <div className="text-center py-8 text-[10px] text-slate-400 font-semibold">Loading medicines...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Medicine</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                  <th className="text-right px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(m => {
                  const mc = medCatConfig[m.category] ?? medCatConfig.Other;
                  const Icon = mc.icon;
                  const stockPct = Math.min((m.quantity_in_stock / (m.minimum_stock_level * 3)) * 100, 100);
                  return (
                    <tr key={m.id} className={`hover:bg-slate-50 transition ${m.is_expired ? 'opacity-60' : ''}`}>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${mc.color}`} />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{m.name}</p>
                            {m.generic_name && <p className="text-[8px] text-slate-400 font-semibold">{m.generic_name}</p>}
                            {m.manufacturer && <p className="text-[7px] text-slate-400">{m.manufacturer}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${mc.bg} ${mc.color} border-0`}>
                          {m.category}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`font-black text-[10px] ${m.quantity_in_stock === 0 ? 'text-rose-700' : m.is_low_stock ? 'text-orange-700' : 'text-slate-700'}`}>
                            {m.quantity_in_stock} <span className="text-[8px] font-semibold text-slate-400">{m.unit}</span>
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.quantity_in_stock === 0 ? 'bg-rose-500' : m.is_low_stock ? 'bg-orange-400' : 'bg-emerald-400'}`}
                              style={{ width: `${Math.max(stockPct, m.quantity_in_stock > 0 ? 5 : 0)}%` }} />
                          </div>
                          {m.is_low_stock && <span className="text-[7px] font-bold text-orange-600">LOW STOCK</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        {m.expiry_date ? (
                          <div>
                            <p className={`font-bold ${m.is_expired ? 'text-rose-700' : m.is_expiring_soon ? 'text-amber-700' : 'text-slate-600'}`}>{m.expiry_date}</p>
                            {m.is_expired && <p className="text-[7px] font-black text-rose-700">EXPIRED</p>}
                            {!m.is_expired && m.is_expiring_soon && <p className="text-[7px] font-black text-amber-700">{m.days_to_expiry}d left</p>}
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button onClick={() => { setStockEdit(m); setStockVal(String(m.quantity_in_stock)); }}
                          className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 border border-amber-200 text-amber-700 rounded cursor-pointer hover:bg-amber-100 transition">
                          Restock
                        </button>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const HostelHealthManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const [dashStats, setDashStats]   = useState<DashStats>({ totalProfiles: 0, todayVisits: 0, openCases: 0, referredCases: 0, thisMonthVisits: 0, chronicStudents: 0, lowStock: 0, expiringSoon: 0 });
  const [monthlyTrend, setMonthly]  = useState<any[]>([]);
  const [bySeverity, setBySev]      = useState<Record<string, number>>({});
  const [byBloodGroup, setByBG]     = useState<any[]>([]);
  const [recentVisits, setRecVis]   = useState<MedVisit[]>([]);
  const [openCases, setOpenCases]   = useState<MedVisit[]>([]);
  const [lowStockList, setLowStock] = useState<Medicine[]>([]);
  const [dashLoading, setDashLoad]  = useState(true);

  const [profiles, setProfiles]     = useState<HealthProfile[]>([]);
  const [profLoading, setProfLoad]  = useState(true);
  const [visits, setVisits]         = useState<MedVisit[]>([]);
  const [visLoading, setVisLoad]    = useState(true);
  const [medicines, setMedicines]   = useState<Medicine[]>([]);
  const [medLoading, setMedLoad]    = useState(true);

  const fetchDashboard = async () => {
    setDashLoad(true);
    try {
      const res = await api.get('/school/hostel/health/dashboard');
      if (res.data.success) {
        const d = res.data.data;
        setDashStats(d.stats); setMonthly(d.monthly_trend); setBySev(d.by_severity);
        setByBG(d.by_blood_group); setRecVis(d.recent_visits);
        setOpenCases(d.open_cases); setLowStock(d.low_stock_list);
      }
    } catch (e) { console.error(e); }
    finally { setDashLoad(false); }
  };

  const fetchProfiles  = async () => { setProfLoad(true); try { const r = await api.get('/school/hostel/health/profiles'); if (r.data.success) setProfiles(r.data.data); } catch (e) { console.error(e); } finally { setProfLoad(false); } };
  const fetchVisits    = async () => { setVisLoad(true);  try { const r = await api.get('/school/hostel/health/visits');   if (r.data.success) setVisits(r.data.data);   } catch (e) { console.error(e); } finally { setVisLoad(false); } };
  const fetchMedicines = async () => { setMedLoad(true);  try { const r = await api.get('/school/hostel/health/medicines'); if (r.data.success) setMedicines(r.data.data); } catch (e) { console.error(e); } finally { setMedLoad(false); } };

  useEffect(() => { fetchDashboard(); fetchProfiles(); fetchVisits(); fetchMedicines(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'profiles')  fetchProfiles();
    if (activeTab === 'visits')    fetchVisits();
    if (activeTab === 'medicines') fetchMedicines();
  }, [activeTab]);

  const refreshAll = () => { fetchDashboard(); fetchProfiles(); fetchVisits(); fetchMedicines(); };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'profiles',  label: 'Health Profiles', icon: User,            badge: profiles.length || undefined },
    { id: 'visits',    label: 'Sick Room',        icon: Stethoscope,    badge: dashStats.openCases || undefined },
    { id: 'medicines', label: 'Medicines',        icon: Pill,            badge: (dashStats.lowStock + dashStats.expiringSoon) || undefined },
  ];

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-teal-50 text-teal-600 rounded-md">
            <HeartPulse className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Health &amp; Medical Records</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">
              {dashStats.totalProfiles} profiles · {dashStats.openCases} open cases · {dashStats.lowStock} low stock
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dashStats.openCases > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
              <Clock className="w-2.5 h-2.5" /> {dashStats.openCases} open
            </span>
          )}
          {dashStats.lowStock > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="w-2.5 h-2.5" /> {dashStats.lowStock} low stock
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
                isActive ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
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
          <DashboardTab stats={dashStats} monthlyTrend={monthlyTrend} bySeverity={bySeverity}
            byBloodGroup={byBloodGroup} recentVisits={recentVisits} openCases={openCases}
            lowStockList={lowStockList} loading={dashLoading} onTabChange={setActiveTab} />
        )}
        {activeTab === 'profiles'  && <ProfilesTab  profiles={profiles} loading={profLoading} onRefresh={fetchProfiles} />}
        {activeTab === 'visits'    && <VisitsTab    visits={visits} profiles={profiles} loading={visLoading} onRefresh={() => { fetchVisits(); fetchDashboard(); fetchMedicines(); }} />}
        {activeTab === 'medicines' && <MedicinesTab medicines={medicines} loading={medLoading} onRefresh={() => { fetchMedicines(); fetchDashboard(); }} />}
      </div>
    </div>
  );
};

export default HostelHealthManager;
