import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard, Plus, ClipboardList, ShieldCheck, BookOpen,
  MapPin, Clock, User, Calendar, CheckCircle2, XCircle, RotateCcw,
  AlertTriangle, QrCode, ArrowRight, ChevronRight, Home, Moon,
  Stethoscope, Zap, LogOut, LogIn, Eye, Check, X, Bell, TrendingUp,
  Users, DoorOpen, BarChart2, Info
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PassType = 'local' | 'overnight' | 'leave' | 'medical' | 'emergency';
type PassStatus = 'Pending' | 'Approved' | 'Active' | 'Returned' | 'Rejected' | 'Expired';
type TabId = 'dashboard' | 'apply' | 'my-passes' | 'warden' | 'rules';

interface Pass {
  id: string;
  pass_number: string;
  pass_type: PassType;
  destination: string;
  purpose: string;
  checkout_datetime: string;
  return_datetime: string;
  actual_return?: string;
  status: PassStatus;
  approved_by?: string;
  rejection_reason?: string;
  student_name?: string;
  room_number?: string;
  contact?: string;
}

interface WardenPending {
  id: string;
  pass_number: string;
  student_name: string;
  room: string;
  avatar: string;
  pass_type: PassType;
  destination: string;
  applied_at: string;
  checkout: string;
  return_by: string;
}

interface CurrentlyOut {
  id: string;
  student_name: string;
  room: string;
  avatar: string;
  pass_type: PassType;
  return_by: string;
  is_late: boolean;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const passTypeConfig: Record<PassType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  local:     { label: 'Local outpass',    icon: MapPin,      color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  overnight: { label: 'Overnight outpass',icon: Moon,        color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  leave:     { label: 'Leave (home)',     icon: Home,        color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  medical:   { label: 'Medical leave',   icon: Stethoscope, color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  emergency: { label: 'Emergency leave', icon: Zap,         color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
};

const statusConfig: Record<PassStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  Pending:  { label: 'Pending',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400' },
  Approved: { label: 'Approved', color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
  Active:   { label: 'Active',   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500 animate-pulse' },
  Returned: { label: 'Returned', color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400' },
  Rejected: { label: 'Rejected', color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-500' },
  Expired:  { label: 'Expired',  color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400' },
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return d;
  }
};

// ─── MINI COMPONENTS ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: PassStatus }> = ({ status }) => {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const PassTypeBadge: React.FC<{ type: PassType; small?: boolean }> = ({ type, small }) => {
  const c = passTypeConfig[type];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      <Icon className="w-2.5 h-2.5" /> {small ? c.label.split(' ')[0] : c.label}
    </span>
  );
};

// ─── QR MODAL ──────────────────────────────────────────────────────────────────

const QRModal: React.FC<{ pass: Pass; onClose: () => void }> = ({ pass, onClose }) => {
  const pc = passTypeConfig[pass.pass_type];
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center">
          <span className="font-bold text-xs">Gate Pass — {pass.pass_number}</span>
          <button onClick={onClose} className="p-1 hover:bg-indigo-700 rounded-lg cursor-pointer bg-transparent border-0 text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 text-center">
          {/* Simulated QR Code */}
          <div className="w-36 h-36 mx-auto mb-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-1.5 grid grid-cols-8 gap-0.5 opacity-90">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${Math.random() > 0.45 ? 'bg-slate-900' : 'bg-white'}`} />
              ))}
            </div>
            <div className="absolute top-1.5 left-1.5 w-6 h-6 border-[3px] border-slate-900 rounded-sm bg-white" />
            <div className="absolute top-1.5 right-1.5 w-6 h-6 border-[3px] border-slate-900 rounded-sm bg-white" />
            <div className="absolute bottom-1.5 left-1.5 w-6 h-6 border-[3px] border-slate-900 rounded-sm bg-white" />
          </div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${pc.bg} ${pc.border} ${pc.color} border rounded-full text-[10px] font-bold mb-2`}>
            <pc.icon className="w-3 h-3" /> {pc.label}
          </div>
          <p className="font-bold text-slate-900 text-xs">{pass.destination}</p>
          <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
            Out: {fmtDate(pass.checkout_datetime)} &nbsp;|&nbsp; Return: {fmtDate(pass.return_datetime)}
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-[9px] text-slate-400 font-semibold">
            Show this QR at gate for scan
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PASS CARD ─────────────────────────────────────────────────────────────────

const PassCard: React.FC<{ pass: Pass; onShowQR: (p: Pass) => void; onMarkReturn: (id: string) => void }> = ({ pass, onShowQR, onMarkReturn }) => {
  const pc = passTypeConfig[pass.pass_type];
  const Icon = pc.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className={`p-1 ${pc.bg} ${pc.border} border rounded-md`}>
            <Icon className={`w-3 h-3 ${pc.color}`} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{pass.pass_number}</p>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">{pc.label}</p>
          </div>
        </div>
        <StatusBadge status={pass.status} />
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold mb-1.5">
        <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">{pass.destination}</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-500 font-semibold mb-2">
        <div>
          <p className="text-slate-400 uppercase tracking-wide text-[8px]">Check out</p>
          <p className="text-slate-700 font-bold leading-tight">{fmtDate(pass.checkout_datetime)}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wide text-[8px]">Return by</p>
          <p className="text-slate-700 font-bold leading-tight">{fmtDate(pass.return_datetime)}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wide text-[8px]">Approved by</p>
          <p className="text-slate-700 font-bold truncate leading-tight">{pass.approved_by || pass.rejection_reason || '—'}</p>
        </div>
      </div>

      {(pass.status === 'Active' || pass.status === 'Approved') && (
        <div className="flex gap-1.5">
          <button
            onClick={() => onShowQR(pass)}
            className="flex-1 flex items-center justify-center gap-1 py-1 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
          >
            <QrCode className="w-3 h-3" /> Show QR pass
          </button>
          {pass.status === 'Active' && (
            <button
              onClick={() => onMarkReturn(pass.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
            >
              <LogIn className="w-3 h-3" /> Mark returned
            </button>
          )}
        </div>
      )}

      {pass.status === 'Returned' && (
        <div className="flex gap-1.5">
          <button
            onClick={() => onShowQR(pass)}
            className="flex-1 flex items-center justify-center gap-1 py-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
          >
            <QrCode className="w-3 h-3" /> Show QR pass
          </button>
        </div>
      )}

      {pass.status === 'Rejected' && pass.rejection_reason && (
        <div className="flex items-center gap-1 px-1.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[9px] text-rose-700 font-semibold">
          <XCircle className="w-2.5 h-2.5 flex-shrink-0" /> {pass.rejection_reason}
        </div>
      )}
    </div>
  );
};

// ─── APPLY FORM ────────────────────────────────────────────────────────────────

const ApplyForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [applyType, setApplyType] = useState<PassType>('local');
  const [form, setForm] = useState({
    student_name: 'Aditya Rathore',
    room_number: '204',
    destination: '',
    purpose: 'Personal',
    checkout_datetime: '',
    return_datetime: '',
    contact: '+91 98765 43210',
    reason: '',
    parent_contact: '',
    doctor_name: '',
  });
  const [loading, setLoading] = useState(false);

  const applyTypes: { type: PassType; label: string; icon: React.ElementType; desc: string; badge: string; badgeColor: string }[] = [
    { type: 'local',     label: 'Local outpass',     icon: MapPin,      desc: 'Same-day return, max 10:30 PM', badge: 'Instant',   badgeColor: 'bg-blue-100 text-blue-700 border-blue-200' },
    { type: 'overnight', label: 'Overnight outpass',  icon: Moon,        desc: 'Max 1 night, parent SMS required', badge: 'Warden', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200' },
    { type: 'leave',     label: 'Leave (multi-day)',  icon: Home,        desc: '48h prior notice needed', badge: 'Warden + HOD',  badgeColor: 'bg-amber-100 text-amber-700 border-amber-200' },
    { type: 'medical',   label: 'Medical leave',      icon: Stethoscope, desc: "Doctor's certificate mandatory", badge: 'Priority', badgeColor: 'bg-rose-100 text-rose-700 border-rose-200' },
  ];

  const selected = applyTypes.find(t => t.type === applyType)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) { toast.error('Please enter destination'); return; }
    if (!form.checkout_datetime) { toast.error('Please set checkout date & time'); return; }
    if (!form.return_datetime) { toast.error('Please set return date & time'); return; }

    setLoading(true);
    try {
      const res = await api.post('/school/hostel/outpass/apply', {
        pass_type: applyType,
        destination: form.destination,
        purpose: form.purpose,
        checkout_datetime: form.checkout_datetime,
        return_datetime: form.return_datetime,
        contact: form.contact,
        parent_contact: form.parent_contact,
        doctor_name: form.doctor_name,
        reason: form.reason
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Outpass request submitted successfully!');
        setForm(f => ({ ...f, destination: '', reason: '', checkout_datetime: '', return_datetime: '' }));
        onSuccess();
      } else {
        toast.error(res.data.message || 'Failed to submit request');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error submitting request. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const infoMsg: Record<PassType, string> = {
    local: 'Local outpass: same-day return, max 10:30 PM. Instant warden sign-off for nearby trips.',
    overnight: 'Overnight outpass: return by 9 AM next day. Parent SMS auto-sent. Requires Warden approval.',
    leave: 'Home leave: minimum 48 hours notice. HOD co-approval needed.',
    medical: 'Medical leave: auto-priority approval. Doctor\'s certificate mandatory on return.',
    emergency: 'Emergency leave: verbal approval + form within 24 hours.',
  };

  return (
    <div className="space-y-1.5">
      {/* Pass type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {applyTypes.map(t => {
          const Icon = t.icon;
          const isActive = applyType === t.type;
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => setApplyType(t.type)}
              className={`flex flex-col items-start gap-1 p-2 rounded-xl border font-bold text-left transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
              }`}
            >
              <div className={`p-1 rounded-md ${isActive ? 'bg-indigo-500' : passTypeConfig[t.type].bg}`}>
                <Icon className={`w-3 h-3 ${isActive ? 'text-white' : passTypeConfig[t.type].color}`} />
              </div>
              <span className="text-[10px] leading-tight">{t.label}</span>
              <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${isActive ? 'bg-indigo-500 text-indigo-100 border-indigo-400' : t.badgeColor}`}>
                {t.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-200 rounded-xl text-[9px] text-blue-700 font-semibold">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>{infoMsg[applyType]}</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
            <selected.icon className="w-3 h-3 text-indigo-500" />
            Apply — {selected.label}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Student name</label>
              <input value={form.student_name} readOnly
                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none bg-slate-50 text-slate-500" required />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Room number</label>
              <input value={form.room_number} readOnly
                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none bg-slate-50 text-slate-500" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Going to</label>
              <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. City mall"
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Purpose</label>
              <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer">
                {['Personal', 'Medical', 'Family visit', 'Shopping', 'Academic', 'Other'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Out date & time</label>
              <input type="datetime-local" value={form.checkout_datetime} onChange={e => setForm(f => ({ ...f, checkout_datetime: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Return date & time</label>
              <input type="datetime-local" value={form.return_datetime} onChange={e => setForm(f => ({ ...f, return_datetime: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Contact number while out</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {(applyType === 'overnight' || applyType === 'leave') && (
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Parent contact</label>
                <input value={form.parent_contact} onChange={e => setForm(f => ({ ...f, parent_contact: e.target.value }))}
                  placeholder="Parent mobile number"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            )}

            {applyType === 'medical' && (
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Doctor / Hospital</label>
                <input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                  placeholder="Doctor / hospital name"
                  className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Reason / Details</label>
            <textarea rows={1} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Reason for going out..."
              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-8" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-[10px] transition border-0">
            {loading ? 'Submitting...' : (
              <><ArrowRight className="w-3.5 h-3.5" /> Submit request</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── DASHBOARD TAB ─────────────────────────────────────────────────────────────

interface DashboardTabProps {
  stats: { this_month: number; pending: number; leave_days_used: number; leave_balance: number };
  activePass: Pass | null;
  alerts: any[];
  weekData: any[];
  onTabChange: (t: TabId) => void;
  onMarkReturn: (id: string) => void;
  onShowQR: (p: Pass) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ stats, activePass, alerts, weekData, onTabChange, onMarkReturn, onShowQR }) => {
  const maxVal = Math.max(...weekData.flatMap(d => [d.outpass, d.leave, d.late])) || 1;

  const getHourOnly = (dateTimeStr: string) => {
    const formatted = fmtDate(dateTimeStr);
    return formatted.split(' ')[1] || formatted;
  };

  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {[
          { label: 'This month', value: stats.this_month, sub: 'Outpasses used', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
          { label: 'Pending', value: stats.pending, sub: 'Awaiting approval', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Leave days', value: stats.leave_days_used, sub: 'Used this sem', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
          { label: 'Balance', value: stats.leave_balance, sub: 'Leave days left', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 flex flex-col justify-center`}>
            <span className={`text-lg font-black ${s.color} leading-none`}>{s.value}</span>
            <span className={`text-[8px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-none`}>{s.label}</span>
            <span className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Active pass */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Active pass
          </h3>
          {activePass ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide leading-none">{activePass.pass_number}</p>
                  <p className="text-[10px] font-bold text-slate-900 mt-0.5 leading-tight">{passTypeConfig[activePass.pass_type].label}</p>
                </div>
                <StatusBadge status="Active" />
              </div>
              <p className="text-[9px] text-slate-600 font-semibold flex items-center gap-1 mb-2">
                <MapPin className="w-2.5 h-2.5" /> {activePass.destination}
              </p>
              <p className="text-[8px] text-slate-500 font-semibold">Out since {getHourOnly(activePass.checkout_datetime)} Today</p>
              <p className="text-[8px] text-blue-700 font-bold mt-0.5">Return by {getHourOnly(activePass.return_datetime)}</p>
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onMarkReturn(activePass.id)}
                  className="flex-1 text-center py-0.8 border border-blue-200 text-blue-700 font-bold rounded-lg text-[9px] hover:bg-blue-100 transition cursor-pointer">
                  Mark Return
                </button>
                <button
                  onClick={() => onShowQR(activePass)}
                  className="flex-1 text-center py-0.8 border border-blue-300 bg-blue-100 text-blue-800 font-bold rounded-lg text-[9px] hover:bg-blue-200 transition cursor-pointer">
                  View QR
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center text-slate-400 text-[10px] font-semibold py-6">
              No active pass currently
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Bell className="w-2.5 h-2.5" /> Alerts
          </h3>
          <div className="space-y-1.5">
            {alerts.map(a => (
              <div key={a.id} className={`flex items-start justify-between gap-1.5 p-1.5 ${a.bg} border ${a.border} rounded-lg`}>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold ${a.color} leading-tight`}>{a.text}</p>
                  <p className="text-[8px] text-slate-500 font-semibold mt-0.2 leading-tight">{a.sub}</p>
                </div>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${a.bg} ${a.color} border ${a.border} whitespace-nowrap flex-shrink-0`}>{a.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <BarChart2 className="w-2.5 h-2.5" /> Outpass Activity (Weekly)
        </h3>
        <div className="flex items-end gap-3 h-14">
          {weekData.map(d => (
            <div key={d.w} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end gap-0.2 h-10">
                <div className="flex-1 bg-indigo-500 rounded-t-sm transition-all duration-500" style={{ height: `${(d.outpass / maxVal) * 100}%` }} title={`Outpass: ${d.outpass}`} />
                <div className="flex-1 bg-rose-400 rounded-t-sm transition-all duration-500" style={{ height: `${(d.leave / maxVal) * 100}%` }} title={`Leave: ${d.leave}`} />
                {d.late > 0 && <div className="flex-1 bg-amber-400 rounded-t-sm transition-all duration-500" style={{ height: `${(d.late / maxVal) * 100}%` }} title={`Late: ${d.late}`} />}
              </div>
              <span className="text-[8px] font-bold text-slate-400">{d.w}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1.5">
          {[{ color: 'bg-indigo-500', label: 'Outpass' }, { color: 'bg-rose-400', label: 'Leave' }, { color: 'bg-amber-400', label: 'Late return' }].map(l => (
            <span key={l.label} className="flex items-center gap-1 text-[8px] text-slate-500 font-semibold">
              <span className={`w-1.5 h-1.5 rounded-sm ${l.color}`} />{l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── WARDEN VIEW ───────────────────────────────────────────────────────────────

const WardenView: React.FC = () => {
  const [pendingList, setPendingList] = useState<WardenPending[]>([]);
  const [currentlyOut, setCurrentlyOut] = useState<CurrentlyOut[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWardenData = async () => {
    setLoading(true);
    try {
      const [pendingRes, outsideRes] = await Promise.all([
        api.get('/school/hostel/outpass/pending'),
        api.get('/school/hostel/outpass/outside')
      ]);
      if (pendingRes.data.success) {
        setPendingList(pendingRes.data.data);
      }
      if (outsideRes.data.success) {
        setCurrentlyOut(outsideRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching warden data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      let res;
      if (action === 'approve') {
        res = await api.post(`/school/hostel/outpass/${id}/approve`);
      } else {
        res = await api.post(`/school/hostel/outpass/${id}/reject`, {
          rejection_reason: reason || 'Rejected by Warden'
        });
      }
      if (res.data.success) {
        toast.success(action === 'approve' ? 'Pass approved successfully.' : 'Pass rejected.');
        fetchWardenData();
      } else {
        toast.error(res.data.message || 'Operation failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const lateCount = currentlyOut.filter(s => s.is_late).length;

  if (loading) {
    return <div className="text-center py-6 text-[10px] font-bold text-slate-500">Loading Warden view data...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {[
          { label: 'Pending',      value: pendingList.length, sub: 'Need approval',   color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
          { label: 'Out now',      value: currentlyOut.length,sub: 'Students outside', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
          { label: 'Late today',   value: lateCount,          sub: 'Past return time', color: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200' },
          { label: 'Approved today', value: 23,               sub: 'Total approved',   color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 flex flex-col justify-center`}>
            <span className={`text-lg font-black ${s.color} leading-none`}>{s.value}</span>
            <span className={`text-[8px] font-bold ${s.color} uppercase tracking-wide mt-0.5 leading-none`}>{s.label}</span>
            <span className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ClipboardList className="w-3 h-3" /> Pending approvals
          {pendingList.length > 0 && (
            <span className="ml-auto px-1 py-0.2 bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-bold rounded-full">{pendingList.length}</span>
          )}
        </h3>
        {pendingList.length === 0 ? (
          <div className="text-center text-slate-400 text-[10px] font-semibold py-4">All requests processed ✓</div>
        ) : (
          <div className="space-y-1.5">
            {pendingList.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    {p.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-900 leading-tight">{p.student_name}</span>
                      <span className="text-[8px] text-slate-400 font-semibold leading-tight">Room {p.room}</span>
                      <PassTypeBadge type={p.pass_type} small />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-600 font-semibold mt-0.5 leading-none">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" /> <span className="truncate">{p.destination}</span>
                    </div>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5 leading-none">Applied {p.applied_at} · Out: {p.checkout} · Return: {p.return_by}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAction(p.id, 'approve')}
                    className="flex items-center gap-0.5 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] cursor-pointer border-0 transition">
                    <Check className="w-2.5 h-2.5" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason !== null && reason.trim() !== '') {
                        handleAction(p.id, 'reject', reason);
                      } else if (reason !== null) {
                        toast.error('Rejection reason is required');
                      }
                    }}
                    className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-lg text-[9px] cursor-pointer transition">
                    <X className="w-2.5 h-2.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Currently Outside */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <DoorOpen className="w-3 h-3" /> Currently outside
        </h3>
        {currentlyOut.length === 0 ? (
          <div className="text-center text-slate-400 text-[10px] font-semibold py-4">No students outside hostel currently.</div>
        ) : (
          <div className="space-y-1">
            {currentlyOut.map(s => (
              <div key={s.id} className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[9px] flex items-center justify-center flex-shrink-0">
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 leading-tight">{s.student_name}</span>
                  <span className="text-[8px] text-slate-400 font-semibold ml-1.5">Room {s.room}</span>
                  <div className="text-[8px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 leading-none">
                    <PassTypeBadge type={s.pass_type} small />
                    <span>· Return by: {s.return_by}</span>
                  </div>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${
                  s.is_late
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {s.is_late ? 'Late' : 'On time'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── RULES TAB ─────────────────────────────────────────────────────────────────

const RulesTab: React.FC = () => {
  const passTypes = [
    { type: 'local' as PassType, desc: 'Same-day, return by 10:30 PM', badge: 'Instant', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200' },
    { type: 'overnight' as PassType, desc: 'Max 1 night, parent SMS required', badge: 'Warden', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200' },
    { type: 'leave' as PassType, desc: 'Multi-day, 48h prior notice needed', badge: 'Warden + HOD', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200' },
    { type: 'medical' as PassType, desc: "Doctor's certificate mandatory", badge: 'Priority', badgeColor: 'bg-rose-100 text-rose-700 border-rose-200' },
  ];

  const timings = [
    { day: 'Normal days', time: '10:30 PM' },
    { day: 'Exam week', time: '10:00 PM' },
    { day: 'Sundays', time: '11:00 PM' },
  ];

  const fines = [
    { offence: 'Late return (1h)', amount: '₹100', color: 'text-amber-700' },
    { offence: 'Late return (2h+)', amount: '₹300', color: 'text-orange-700' },
    { offence: 'No outpass', amount: '₹500', color: 'text-rose-700' },
  ];

  const approvalFlow = [
    { step: 1, label: 'Student submits request', detail: 'Online form with details', color: 'bg-indigo-500' },
    { step: 2, label: 'Parent SMS Verification', detail: 'Auto-sent for overnight/leave', color: 'bg-purple-500' },
    { step: 3, label: 'Warden Approval', detail: 'Processed in 2–4 hours', color: 'bg-blue-500' },
    { step: 4, label: 'Gate Scan & Leave', detail: 'Scan QR at gate for check-out', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-2">
      {/* Pass types */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Outpass types & limits
        </h3>
        <div className="divide-y divide-slate-100">
          {passTypes.map(pt => {
            const c = passTypeConfig[pt.type];
            const Icon = c.icon;
            return (
              <div key={pt.type} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <div className={`p-1 ${c.bg} ${c.border} border rounded-md`}>
                    <Icon className={`w-3 h-3 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">{c.label}</p>
                    <p className="text-[9px] text-slate-500 font-semibold leading-tight">{pt.desc}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${pt.badgeColor}`}>{pt.badge}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Gate timings */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <DoorOpen className="w-3 h-3" /> Gate timings
          </h3>
          <div className="divide-y divide-slate-100">
            {timings.map(t => (
              <div key={t.day} className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
                <span className="text-[10px] font-semibold text-slate-700">{t.day}</span>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 leading-none">{t.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fines */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
          <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Fines
          </h3>
          <div className="divide-y divide-slate-100">
            {fines.map(f => (
              <div key={f.offence} className="flex justify-between items-center py-1 first:pt-0 last:pb-0">
                <span className="text-[10px] font-semibold text-slate-700">{f.offence}</span>
                <span className={`text-[9px] font-bold ${f.color} leading-none`}>{f.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approval flow */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Approval flow
        </h3>
        <div className="flex flex-col gap-0">
          {approvalFlow.map((step, i) => (
            <div key={step.step} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className={`w-4.5 h-4.5 rounded-full ${step.color} text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0`}>
                  {step.step}
                </div>
                {i < approvalFlow.length - 1 && <div className="w-0.5 h-3.5 bg-slate-200" />}
              </div>
              <div className="pb-1.5">
                <p className="text-[10px] font-bold text-slate-900 leading-tight">{step.label}</p>
                <p className="text-[8px] text-slate-500 font-semibold leading-none mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const OutpassManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [passes, setPasses] = useState<Pass[]>([]);
  const [qrPass, setQrPass] = useState<Pass | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Dashboard specific state
  const [stats, setStats] = useState({ this_month: 0, pending: 0, leave_days_used: 0, leave_balance: 12 });
  const [activePass, setActivePass] = useState<Pass | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);

  const isGateOpen = true; // Could be dynamic

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'apply',      label: '+ Apply',       icon: Plus },
    { id: 'my-passes',  label: 'My Passes',     icon: ClipboardList, badge: passes.filter(p => p.status === 'Active').length || undefined },
    { id: 'warden',     label: 'Warden View',   icon: ShieldCheck },
    { id: 'rules',      label: 'Rules',         icon: BookOpen },
  ];

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/school/hostel/outpass/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        setActivePass(res.data.data.active_pass);
        setAlerts(res.data.data.alerts);
        setWeekData(res.data.data.week_data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/hostel/outpass/list');
      if (res.data.success) {
        setPasses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching passes list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'my-passes') {
      fetchPasses();
    }
  }, [activeTab]);

  const handleMarkReturn = async (id: string) => {
    try {
      const res = await api.post(`/school/hostel/outpass/${id}/return`);
      if (res.data.success) {
        toast.success('Marked as returned! Entry recorded at gate.');
        fetchDashboardData();
        fetchPasses();
      } else {
        toast.error(res.data.message || 'Operation failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark return');
    }
  };

  const filteredPasses = filterStatus === 'all'
    ? passes
    : passes.filter(p => p.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="flex flex-col gap-1.5 p-1.5 md:p-2 text-[10px] font-sans antialiased text-slate-800 bg-slate-50 h-screen overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1 gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <LogOut className="w-3 h-3" />
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-900 leading-none">Outpass &amp; Leave Management</h1>
            <p className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">Shri Ram Boys Hostel · Room 204 · Aditya Rathore</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold border ${
          isGateOpen
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <span className={`w-1 h-1 rounded-full ${isGateOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          Gate {isGateOpen ? 'Open' : 'Closed'}
        </span>
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

      {/* Tab content - scrollable container */}
      <div className="flex-1 overflow-y-auto pr-0.5">

        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            activePass={activePass}
            alerts={alerts}
            weekData={weekData}
            onTabChange={setActiveTab}
            onMarkReturn={handleMarkReturn}
            onShowQR={setQrPass}
          />
        )}

        {activeTab === 'apply' && (
          <ApplyForm onSuccess={() => setActiveTab('my-passes')} />
        )}

        {activeTab === 'my-passes' && (
          <div className="space-y-1.5">
            {/* Filter chips */}
            <div className="flex flex-wrap gap-1">
              {['all', 'Active', 'Approved', 'Pending', 'Returned', 'Rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2 py-0.5 rounded-lg border font-bold text-[9px] transition cursor-pointer ${
                    filterStatus === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s === 'all' ? 'All passes' : s}
                  {s !== 'all' && (
                    <span className="ml-0.5 text-[8px]">({passes.filter(p => p.status === s).length})</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">
                Loading passes...
              </div>
            ) : filteredPasses.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-semibold text-[10px]">
                No passes found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {filteredPasses.map(pass => (
                  <PassCard key={pass.id} pass={pass} onShowQR={setQrPass} onMarkReturn={handleMarkReturn} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'warden' && <WardenView />}

        {activeTab === 'rules' && <RulesTab />}

      </div>

      {/* QR Modal */}
      {qrPass && <QRModal pass={qrPass} onClose={() => setQrPass(null)} />}
    </div>
  );
};

export default OutpassManager;
