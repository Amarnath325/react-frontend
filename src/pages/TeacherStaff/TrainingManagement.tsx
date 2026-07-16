import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, Calendar, Plus, Edit2, Trash2, Loader2, X,
  ChevronRight, CheckCircle2, Clock, BarChart3, ArrowLeft, Save,
  RefreshCw, Star, Award, Wifi, MapPin, UserPlus, ClipboardList,
  TrendingUp, Target, Trophy, Filter, Download, Activity, Zap
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface StaffMember { id: number; staff_type: string; name: string; employee_id: string; department: string | null; }

interface Program {
  id: number; title: string; program_type: string; category: string | null;
  description: string | null; organizer: string | null; venue: string | null;
  mode: string; platform: string | null;
  start_date: string; end_date: string; start_time: string | null; end_time: string | null;
  duration_hours: number; max_participants: number | null; target_staff: string;
  status: string; cost_per_head: number | null; total_budget: number | null;
  certificate_issued: string; resource_person: string | null; learning_outcomes: string | null;
  participant_stats: { total: number; attended: number; enrolled: number; avg_rating: number | null } | null;
}

interface Participant {
  id: number; program_id: number; staff_id: number; staff_type: string;
  enrollment_status: string; certificate_received: boolean;
  feedback_rating: number | null; feedback_remarks: string | null;
  score: number | null; grade: string | null; notes: string | null;
  enrolled_at: string | null; attended_at: string | null;
  staff_name: string; employee_id: string; department: string | null;
}

interface ProgramDetail {
  program: Program;
  participants: Participant[];
  stats: { total: number; attended: number; enrolled: number; absent: number; certificates: number; avg_rating: number | null; avg_score: number | null };
}

interface Analytics {
  by_type: { program_type: string; cnt: number; total_hours: number }[];
  by_category: { category: string; cnt: number }[];
  by_month: { month: number; cnt: number; hours: number }[];
  by_mode: { mode: string; cnt: number }[];
  top_programs: { id: number; title: string; program_type: string; start_date: string; duration_hours: number; attendee_count: number; avg_rating: number | null }[];
  top_staff: { staff_name: string; department: string; programs_attended: number; total_hours: number; certificates: number }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const PROGRAM_TYPES = ['training', 'workshop', 'seminar', 'webinar', 'conference', 'certification', 'induction', 'refresher'];
const CATEGORIES    = ['Subject Knowledge', 'Pedagogy', 'ICT', 'Leadership', 'Soft Skills', 'Admin', 'Safety', 'Other'];
const MODES         = ['offline', 'online', 'hybrid'];
const STATUSES      = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const CERT_OPTIONS  = ['yes', 'no', 'pending'];
const ENR_STATUSES  = ['enrolled', 'attended', 'absent', 'cancelled', 'waitlisted'];

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  training:      { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  emoji: '📚' },
  workshop:      { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  emoji: '🔧' },
  seminar:       { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     emoji: '🎤' },
  webinar:       { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    emoji: '💻' },
  conference:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', emoji: '🏛️' },
  certification: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   emoji: '🏆' },
  induction:     { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    emoji: '🚀' },
  refresher:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  emoji: '🔄' },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-sky-700',    bg: 'bg-sky-100'    },
  ongoing:   { label: 'Ongoing',   color: 'text-violet-700', bg: 'bg-violet-100' },
  completed: { label: 'Completed', color: 'text-emerald-700',bg: 'bg-emerald-100'},
  cancelled: { label: 'Cancelled', color: 'text-rose-700',   bg: 'bg-rose-100'   },
  postponed: { label: 'Postponed', color: 'text-amber-700',  bg: 'bg-amber-100'  },
};

const ENR_CFG: Record<string, { label: string; color: string; bg: string }> = {
  enrolled:   { label: 'Enrolled',    color: 'text-sky-700',    bg: 'bg-sky-100'    },
  attended:   { label: 'Attended',    color: 'text-emerald-700',bg: 'bg-emerald-100'},
  absent:     { label: 'Absent',      color: 'text-rose-700',   bg: 'bg-rose-100'   },
  cancelled:  { label: 'Cancelled',   color: 'text-slate-500',  bg: 'bg-slate-100'  },
  waitlisted: { label: 'Waitlisted',  color: 'text-amber-700',  bg: 'bg-amber-100'  },
};

const TABS = [
  { key: 'programs',   label: '📋 Programs'    },
  { key: 'analytics',  label: '📊 Analytics'   },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const ini = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['bg-violet-100 text-violet-700','bg-indigo-100 text-indigo-700','bg-sky-100 text-sky-700','bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700'];
  const c = cols[(name || ' ').charCodeAt(0) % cols.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${c} flex items-center justify-center font-black shrink-0`}>{ini}</div>;
}

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', emoji: '📖' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {c.emoji} {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color} ${c.bg}`}>{c.label}</span>;
}

function EnrBadge({ status }: { status: string }) {
  const c = ENR_CFG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color} ${c.bg}`}>{c.label}</span>;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-[10px] text-slate-500 ml-0.5">{rating}</span>
    </div>
  );
}

function MiniBar({ val, max, color = 'bg-violet-500' }: { val: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DEFAULT PROGRAM FORM STATE
══════════════════════════════════════════════════════════ */
const defaultProgram: Partial<Program> = {
  program_type: 'training', mode: 'offline', status: 'scheduled',
  target_staff: 'all', certificate_issued: 'no', duration_hours: 0,
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function TrainingManagement() {
  const [tab, setTab] = useState<TabKey>('programs');

  /* Masters */
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [programStats, setProgramStats] = useState<any>(null);
  const [participantStats, setParticipantStats] = useState<any>(null);

  /* Programs list */
  const [programs, setPrograms] = useState<Program[]>([]);
  const [progTotal, setProgTotal] = useState(0);
  const [progPages, setProgPages] = useState(1);
  const [progPage, setProgPage] = useState(1);
  const [loadingProgs, setLoadingProgs] = useState(false);

  /* Filters */
  const [filterType, setFilterType]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMode, setFilterMode]     = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  /* Program modal */
  const [programModal, setProgramModal] = useState<Partial<Program> | null>(null);
  const [programBusy, setProgramBusy]   = useState(false);

  /* Detail view */
  const [detailId, setDetailId]       = useState<number | null>(null);
  const [detail, setDetail]           = useState<ProgramDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* Enroll modal */
  const [enrollModal, setEnrollModal]   = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set()); // "id_type"
  const [enrollBusy, setEnrollBusy]     = useState(false);

  /* Attendance bulk modal */
  const [attModal, setAttModal]         = useState(false);
  const [attChanges, setAttChanges]     = useState<Record<number, string>>({});
  const [attBusy, setAttBusy]           = useState(false);

  /* Participant edit modal */
  const [partModal, setPartModal]       = useState<Partial<Participant> | null>(null);
  const [partBusy, setPartBusy]         = useState(false);

  /* Analytics */
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsYear, setAnalyticsYear]       = useState(new Date().getFullYear());

  /* ═══ Load Masters ═══ */
  useEffect(() => {
    api.get('/school/training/masters').then(res => {
      if (res.data.success) {
        setStaff(res.data.staff || []);
        setProgramStats(res.data.program_stats);
        setParticipantStats(res.data.participant_stats);
      }
    });
  }, []);

  /* ═══ Load Programs ═══ */
  const loadPrograms = useCallback(async () => {
    setLoadingProgs(true);
    try {
      const params: any = { per_page: 20, page: progPage };
      if (filterType)   params.program_type = filterType;
      if (filterStatus) params.status       = filterStatus;
      if (filterMode)   params.mode         = filterMode;
      if (filterSearch) params.search       = filterSearch;
      const res = await api.get('/school/training/programs', { params });
      if (res.data.success) {
        setPrograms(res.data.data || []);
        setProgTotal(res.data.meta?.total || 0);
        setProgPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load programs'); }
    finally { setLoadingProgs(false); }
  }, [progPage, filterType, filterStatus, filterMode, filterSearch]);

  useEffect(() => { if (tab === 'programs') loadPrograms(); }, [tab, loadPrograms]);

  /* ═══ Load Analytics ═══ */
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/school/training/analytics', { params: { year: analyticsYear } });
      if (res.data.success) setAnalytics(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoadingAnalytics(false); }
  }, [analyticsYear]);

  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  /* ═══ Load Detail ═══ */
  const loadDetail = useCallback(async (id: number) => {
    setDetailId(id);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await api.get(`/school/training/programs/${id}`);
      if (res.data.success) {
        setDetail(res.data);
        const init: Record<number, string> = {};
        res.data.participants.forEach((p: Participant) => { init[p.id] = p.enrollment_status; });
        setAttChanges(init);
      }
    } catch { toast.error('Failed to load program'); }
    finally { setLoadingDetail(false); }
  }, []);

  /* ═══ Save Program ═══ */
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programModal) return;
    setProgramBusy(true);
    try {
      if (programModal.id) {
        await api.put(`/school/training/programs/${programModal.id}`, programModal);
        toast.success('Program updated');
      } else {
        await api.post('/school/training/programs', programModal);
        toast.success('Program created');
      }
      setProgramModal(null);
      loadPrograms();
      // Refresh masters stats
      api.get('/school/training/masters').then(res => { if (res.data.success) { setProgramStats(res.data.program_stats); setParticipantStats(res.data.participant_stats); } });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProgramBusy(false); }
  };

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Delete this program?')) return;
    try { await api.delete(`/school/training/programs/${id}`); toast.success('Deleted'); loadPrograms(); }
    catch { toast.error('Failed'); }
  };

  /* ═══ Enroll Participants ═══ */
  const handleEnroll = async () => {
    if (!detailId || selectedStaff.size === 0) return;
    setEnrollBusy(true);
    try {
      const participants = Array.from(selectedStaff).map(key => {
        const [id, type] = key.split('_');
        return { staff_id: parseInt(id), staff_type: type };
      });
      const res = await api.post(`/school/training/programs/${detailId}/enroll`, { participants });
      if (res.data.success) {
        toast.success(res.data.message);
        setEnrollModal(false);
        setSelectedStaff(new Set());
        loadDetail(detailId);
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEnrollBusy(false); }
  };

  /* ═══ Mark Attendance ═══ */
  const handleMarkAttendance = async () => {
    if (!detailId) return;
    setAttBusy(true);
    try {
      const attendance = Object.entries(attChanges).map(([pid, status]) => ({
        participant_id: parseInt(pid), status,
      }));
      const res = await api.post(`/school/training/programs/${detailId}/attendance`, { attendance });
      if (res.data.success) { toast.success('Attendance marked'); setAttModal(false); loadDetail(detailId); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAttBusy(false); }
  };

  /* ═══ Update Participant ═══ */
  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partModal) return;
    setPartBusy(true);
    try {
      await api.put(`/school/training/participants/${partModal.id}`, partModal);
      toast.success('Updated');
      setPartModal(null);
      detailId && loadDetail(detailId);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPartBusy(false); }
  };

  const handleRemoveParticipant = async (id: number) => {
    if (!confirm('Remove participant?')) return;
    try { await api.delete(`/school/training/participants/${id}`); toast.success('Removed'); detailId && loadDetail(detailId); }
    catch { toast.error('Failed'); }
  };

  /* ── Already enrolled IDs ── */
  const enrolledKeys = new Set(detail?.participants.map(p => `${p.staff_id}_${p.staff_type}`) || []);

  /* ══════════════════════════════════════════════════════════
     DETAIL VIEW
  ══════════════════════════════════════════════════════════ */
  if (detailId) {
    const prog = detail?.program;
    const stats = detail?.stats;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setDetailId(null); setDetail(null); }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          {loadingDetail ? <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /> : prog ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${TYPE_COLORS[prog.program_type]?.bg || 'bg-slate-50'}`}>
                {TYPE_COLORS[prog.program_type]?.emoji || '📖'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">{prog.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={prog.program_type} />
                  <StatusBadge status={prog.status} />
                  {prog.category && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{prog.category}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setEnrollModal(true); setEnrollSearch(''); setSelectedStaff(new Set()); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                  <UserPlus className="w-3.5 h-3.5" /> Enroll
                </button>
                <button onClick={() => setAttModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                  <ClipboardList className="w-3.5 h-3.5" /> Attendance
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {!loadingDetail && prog && stats && (
          <div className="space-y-3">
            {/* Program info + KPI row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Info card */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Dates</span><span className="font-semibold text-slate-700">{prog.start_date} → {prog.end_date}</span></div>
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Duration</span><span className="font-semibold text-slate-700">{prog.duration_hours}h</span></div>
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Mode</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      {prog.mode === 'online' ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} {prog.mode}
                    </span>
                  </div>
                  {prog.venue && <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Venue</span><span className="font-semibold text-slate-700">{prog.venue}</span></div>}
                  {prog.organizer && <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Organizer</span><span className="font-semibold text-slate-700">{prog.organizer}</span></div>}
                  {prog.resource_person && <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Resource Person</span><span className="font-semibold text-slate-700">{prog.resource_person}</span></div>}
                  {prog.max_participants && <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Max Seats</span><span className="font-semibold text-slate-700">{prog.max_participants}</span></div>}
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Certificate</span><span className={`font-semibold ${prog.certificate_issued === 'yes' ? 'text-emerald-700' : 'text-slate-500'}`}>{prog.certificate_issued}</span></div>
                  {prog.cost_per_head !== null && <div><span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Cost/Head</span><span className="font-semibold text-slate-700">₹{prog.cost_per_head}</span></div>}
                </div>
                {prog.learning_outcomes && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Learning Outcomes</p>
                    <p className="text-xs text-slate-600">{prog.learning_outcomes}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {[
                  { label: 'Total Enrolled', val: stats.total,       color: 'text-slate-700',   bg: 'bg-slate-50'    },
                  { label: 'Attended',       val: stats.attended,    color: 'text-emerald-700', bg: 'bg-emerald-50'  },
                  { label: 'Absent',         val: stats.absent,      color: 'text-rose-700',    bg: 'bg-rose-50'     },
                  { label: 'Certificates',   val: stats.certificates,color: 'text-amber-700',   bg: 'bg-amber-50'    },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center justify-between`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                    <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
                  </div>
                ))}
                {stats.avg_rating !== null && (
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Rating</span>
                    <StarRating rating={stats.avg_rating} />
                  </div>
                )}
              </div>
            </div>

            {/* Participants table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Participants ({stats.total})
                </h3>
              </div>
              {detail.participants.length === 0 ? (
                <div className="text-center py-10"><UserPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No participants enrolled yet.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="px-4 py-2.5 text-left">Staff</th>
                        <th className="px-3 py-2.5 text-left">Department</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                        <th className="px-3 py-2.5 text-center">Certificate</th>
                        <th className="px-3 py-2.5 text-center">Rating</th>
                        <th className="px-3 py-2.5 text-center">Score</th>
                        <th className="px-3 py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {detail.participants.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={p.staff_name} size="sm" />
                              <div><p className="font-bold text-slate-800">{p.staff_name}</p><p className="text-[9px] text-slate-400">{p.employee_id} · {p.staff_type}</p></div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">{p.department || '—'}</td>
                          <td className="px-3 py-2.5 text-center"><EnrBadge status={p.enrollment_status} /></td>
                          <td className="px-3 py-2.5 text-center">
                            {p.certificate_received ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center"><StarRating rating={p.feedback_rating} /></td>
                          <td className="px-3 py-2.5 text-center">
                            {p.score !== null ? <span className="font-bold text-violet-700">{p.score}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setPartModal(p)} className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleRemoveParticipant(p.id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
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

        {/* ENROLL MODAL */}
        {enrollModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">Enroll Participants</h3>
                <button onClick={() => setEnrollModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="px-4 py-3 border-b border-slate-50">
                <input type="text" placeholder="Search staff..." value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {staff
                  .filter(s => !enrolledKeys.has(`${s.id}_${s.staff_type}`))
                  .filter(s => !enrollSearch || s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || (s.department || '').toLowerCase().includes(enrollSearch.toLowerCase()))
                  .map(s => {
                    const key = `${s.id}_${s.staff_type}`;
                    const checked = selectedStaff.has(key);
                    return (
                      <label key={key} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${checked ? 'bg-violet-50 border border-violet-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          const next = new Set(selectedStaff);
                          if (checked) next.delete(key); else next.add(key);
                          setSelectedStaff(next);
                        }} className="rounded" />
                        <Avatar name={s.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{s.name}</p>
                          <p className="text-[9px] text-slate-400">{s.department} · {s.staff_type}</p>
                        </div>
                      </label>
                    );
                  })
                }
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{selectedStaff.size} selected</span>
                <div className="flex gap-2">
                  <button onClick={() => setEnrollModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button onClick={handleEnroll} disabled={enrollBusy || selectedStaff.size === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50">
                    {enrollBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Enroll {selectedStaff.size > 0 ? `(${selectedStaff.size})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE MODAL */}
        {attModal && detail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">Mark Attendance</h3>
                <button onClick={() => setAttModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Quick select all */}
                <div className="flex gap-2 pb-2 border-b border-slate-50">
                  <button onClick={() => { const all: Record<number, string> = {}; detail.participants.forEach(p => { all[p.id] = 'attended'; }); setAttChanges(all); }}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">Mark All Attended</button>
                  <button onClick={() => { const all: Record<number, string> = {}; detail.participants.forEach(p => { all[p.id] = 'absent'; }); setAttChanges(all); }}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200">Mark All Absent</button>
                </div>
                {detail.participants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition">
                    <Avatar name={p.staff_name} size="sm" />
                    <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800">{p.staff_name}</p></div>
                    <div className="flex gap-1">
                      {['attended', 'absent'].map(s => (
                        <button key={s} onClick={() => setAttChanges(prev => ({ ...prev, [p.id]: s }))}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${attChanges[p.id] === s
                            ? s === 'attended' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                          {s === 'attended' ? '✓ Present' : '✗ Absent'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
                <button onClick={() => setAttModal(false)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleMarkAttendance} disabled={attBusy}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50">
                  {attBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save Attendance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PARTICIPANT EDIT MODAL */}
        {partModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">Edit Participant — {partModal.staff_name}</h3>
                <button onClick={() => setPartModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUpdateParticipant} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select value={partModal.enrollment_status || 'enrolled'} onChange={e => setPartModal(m => m ? {...m, enrollment_status: e.target.value} : m)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                      {ENR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rating (1-5)</label>
                    <input type="number" min={1} max={5} value={partModal.feedback_rating || ''} onChange={e => setPartModal(m => m ? {...m, feedback_rating: parseInt(e.target.value) || null} : m)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Score</label>
                    <input type="number" step="0.01" value={partModal.score || ''} onChange={e => setPartModal(m => m ? {...m, score: parseFloat(e.target.value) || null} : m)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grade</label>
                    <input type="text" maxLength={10} value={partModal.grade || ''} onChange={e => setPartModal(m => m ? {...m, grade: e.target.value} : m)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                </div>
                <div><label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!partModal.certificate_received} onChange={e => setPartModal(m => m ? {...m, certificate_received: e.target.checked} : m)} />
                  <span className="text-xs font-semibold text-slate-700">Certificate Received</span></label></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Feedback Remarks</label>
                  <textarea rows={2} value={partModal.feedback_remarks || ''} onChange={e => setPartModal(m => m ? {...m, feedback_remarks: e.target.value} : m)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" /></div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button type="button" onClick={() => setPartModal(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={partBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50">
                    {partBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MAIN LIST VIEW
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violet-50 text-violet-600 rounded-lg"><BookOpen className="w-5 h-5" /></span>
            Training & Workshop Registry
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage training programs, workshops, seminars, participant enrollment, attendance, and analytics.</p>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {programStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Total Programs', val: programStats.total_programs, color: 'text-slate-700',   bg: 'bg-slate-50'    },
            { label: 'Completed',      val: programStats.completed,      color: 'text-emerald-700', bg: 'bg-emerald-50'  },
            { label: 'Ongoing',        val: programStats.ongoing,        color: 'text-violet-700',  bg: 'bg-violet-50'   },
            { label: 'Scheduled',      val: programStats.scheduled,      color: 'text-sky-700',     bg: 'bg-sky-50'      },
            { label: 'Total Hours',    val: `${programStats.total_hours}h`, color: 'text-indigo-700', bg: 'bg-indigo-50'  },
            { label: 'Avg Rating',     val: participantStats?.avg_rating ? `${participantStats.avg_rating}★` : '—', color: 'text-amber-700', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-white shadow-sm`}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ TAB: PROGRAMS ═══════════ */}
      {tab === 'programs' && (
        <div className="space-y-3">
          {/* Filters + Add button */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm capitalize">
              <option value="">All Types</option>
              {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
            </select>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm capitalize">
              <option value="">All Modes</option>
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="text" placeholder="Search title / organizer..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400 shadow-sm flex-1 min-w-32" />
            <button onClick={() => { setProgPage(1); loadPrograms(); }} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Search
            </button>
            <button onClick={() => setProgramModal({ ...defaultProgram })}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> New Program
            </button>
          </div>

          {/* Program cards */}
          {loadingProgs ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div>
          ) : programs.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No programs found. Create your first training program.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {programs.map(p => {
                const tc = TYPE_COLORS[p.program_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', emoji: '📖' };
                const ps = p.participant_stats;
                return (
                  <div key={p.id} className="bg-white border-2 border-slate-200 hover:border-violet-300 hover:shadow-md rounded-2xl p-4 shadow-sm transition cursor-pointer group"
                    onClick={() => loadDetail(p.id)}>
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${tc.bg} border ${tc.border}`}>
                        {tc.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-slate-800">{p.title}</h3>
                          <TypeBadge type={p.program_type} />
                          <StatusBadge status={p.status} />
                          {p.category && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{p.category}</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                          <span>📅 {p.start_date} → {p.end_date}</span>
                          <span>⏱ {p.duration_hours}h</span>
                          <span className="capitalize">{p.mode === 'online' ? '🌐' : p.mode === 'hybrid' ? '🔀' : '📍'} {p.mode}</span>
                          {p.organizer && <span>🏢 {p.organizer}</span>}
                          {p.resource_person && <span>👤 {p.resource_person}</span>}
                        </div>
                      </div>
                      <div className="hidden lg:flex items-center gap-5 shrink-0 text-center">
                        <div><p className="text-xl font-black text-slate-700">{ps?.total ?? 0}</p><p className="text-[9px] text-slate-400">Enrolled</p></div>
                        <div><p className="text-xl font-black text-emerald-700">{ps?.attended ?? 0}</p><p className="text-[9px] text-slate-400">Attended</p></div>
                        {ps?.avg_rating && <div><StarRating rating={ps.avg_rating} /><p className="text-[9px] text-slate-400 mt-0.5">Rating</p></div>}
                        {p.certificate_issued === 'yes' && <div className="text-lg">🏆</div>}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setProgramModal(p)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProgram(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition shrink-0 self-center" />
                    </div>
                    {/* Attendance mini-bar */}
                    {ps && ps.total > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all" style={{ width: `${(ps.attended / ps.total) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>{ps.attended} attended</span>
                          <span>{Math.round((ps.attended / ps.total) * 100)}% attendance</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Pagination */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Page {progPage} of {progPages} · {progTotal} programs</span>
                <div className="flex gap-2">
                  <button disabled={progPage <= 1} onClick={() => setProgPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                  <button disabled={progPage >= progPages} onClick={() => setProgPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB: ANALYTICS ═══════════ */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select value={analyticsYear} onChange={e => setAnalyticsYear(parseInt(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 shadow-sm">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadAnalytics} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* By Type */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-violet-500" /> By Program Type</h3>
                  {analytics.by_type.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.by_type.map(t => {
                        const max = Math.max(...analytics.by_type.map(x => x.cnt));
                        const tc = TYPE_COLORS[t.program_type];
                        return (
                          <div key={t.program_type}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm">{tc?.emoji || '📖'}</span>
                              <div className="flex-1 flex justify-between text-[10px]">
                                <span className="font-bold text-slate-700 capitalize">{t.program_type}</span>
                                <span className="text-slate-400">{t.cnt} · {t.total_hours}h</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-6">
                              <div className={`h-full ${tc?.text.replace('text-', 'bg-') || 'bg-violet-500'} rounded-full`} style={{ width: `${(t.cnt / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Category */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-indigo-500" /> By Category</h3>
                  {analytics.by_category.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.by_category.map((c, i) => {
                        const max = Math.max(...analytics.by_category.map(x => x.cnt));
                        const cols = ['bg-violet-500','bg-indigo-500','bg-sky-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
                        return (
                          <div key={c.category}>
                            <div className="flex justify-between text-[10px] mb-0.5 font-semibold text-slate-600"><span>{c.category}</span><span>{c.cnt}</span></div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${cols[i % cols.length]} rounded-full`} style={{ width: `${(c.cnt / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Mode */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-sky-500" /> Delivery Mode</h3>
                  {analytics.by_mode.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-4">
                      {analytics.by_mode.map(m => {
                        const total = analytics.by_mode.reduce((s, x) => s + x.cnt, 0);
                        const pct = total > 0 ? Math.round((m.cnt / total) * 100) : 0;
                        const modeIcon = m.mode === 'online' ? '🌐' : m.mode === 'hybrid' ? '🔀' : '📍';
                        const modeColor = m.mode === 'online' ? 'bg-sky-500' : m.mode === 'hybrid' ? 'bg-violet-500' : 'bg-emerald-500';
                        return (
                          <div key={m.mode}>
                            <div className="flex justify-between text-xs mb-1 font-semibold text-slate-600">
                              <span>{modeIcon} {m.mode}</span>
                              <span>{m.cnt} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${modeColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly trend */}
              {analytics.by_month.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Monthly Programs — {analyticsYear}</h3>
                  <div className="flex items-end gap-1.5 h-24">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const d = analytics.by_month.find(x => x.month === month);
                      const maxCnt = Math.max(...analytics.by_month.map(x => x.cnt), 1);
                      const h = d ? Math.max(4, (d.cnt / maxCnt) * 80) : 2;
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full rounded-t-lg transition-all ${d && d.cnt > 0 ? 'bg-gradient-to-t from-violet-600 to-indigo-500' : 'bg-slate-100'}`} style={{ height: `${h}px` }}
                            title={d ? `${MONTHS[month]}: ${d.cnt} programs, ${d.hours}h` : MONTHS[month]} />
                          {d && d.cnt > 0 && <span className="text-[8px] text-violet-700 font-bold">{d.cnt}</span>}
                          <span className="text-[8px] text-slate-400">{MONTHS[month]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Programs */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Top Programs by Attendance</h3>
                  {analytics.top_programs.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.top_programs.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-xs font-black w-5 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                          <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{p.title}</p><p className="text-[9px] text-slate-400">{p.start_date} · {p.duration_hours}h</p></div>
                          <div className="text-center shrink-0"><p className="text-sm font-black text-emerald-700">{p.attendee_count}</p><p className="text-[8px] text-slate-400">attended</p></div>
                          {p.avg_rating && <StarRating rating={p.avg_rating} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Staff */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Most Trained Staff</h3>
                  {analytics.top_staff.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.top_staff.slice(0, 5).map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-black w-5 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                          <Avatar name={s.staff_name} size="sm" />
                          <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{s.staff_name}</p><p className="text-[9px] text-slate-400">{s.department}</p></div>
                          <div className="text-center shrink-0"><p className="text-sm font-black text-violet-700">{s.programs_attended}</p><p className="text-[8px] text-slate-400">programs</p></div>
                          <div className="text-center shrink-0"><p className="text-sm font-black text-indigo-700">{s.total_hours}h</p><p className="text-[8px] text-slate-400">hours</p></div>
                          {s.certificates > 0 && <span className="text-base" title={`${s.certificates} certificate(s)`}>🏆</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* PROGRAM MODAL */}
      {programModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold">{programModal.id ? 'Edit Program' : 'New Training / Workshop'}</h3>
              <button onClick={() => setProgramModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title *</label>
                <input required value={programModal.title || ''} onChange={e => setProgramModal(m => m ? {...m, title: e.target.value} : m)}
                  placeholder="e.g. Advanced Pedagogy Workshop 2026" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type *</label>
                  <select required value={programModal.program_type || 'training'} onChange={e => setProgramModal(m => m ? {...m, program_type: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white capitalize">
                    {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select value={programModal.category || ''} onChange={e => setProgramModal(m => m ? {...m, category: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mode</label>
                  <select value={programModal.mode || 'offline'} onChange={e => setProgramModal(m => m ? {...m, mode: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white capitalize">
                    {MODES.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date *</label>
                  <input required type="date" value={programModal.start_date || ''} onChange={e => setProgramModal(m => m ? {...m, start_date: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date *</label>
                  <input required type="date" value={programModal.end_date || ''} onChange={e => setProgramModal(m => m ? {...m, end_date: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration (hrs)</label>
                  <input type="number" min={0} value={programModal.duration_hours ?? 0} onChange={e => setProgramModal(m => m ? {...m, duration_hours: parseInt(e.target.value) || 0} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Seats</label>
                  <input type="number" min={1} value={programModal.max_participants || ''} onChange={e => setProgramModal(m => m ? {...m, max_participants: parseInt(e.target.value) || null} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Staff</label>
                  <select value={programModal.target_staff || 'all'} onChange={e => setProgramModal(m => m ? {...m, target_staff: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    <option value="all">All Staff</option><option value="Teacher">Teachers</option><option value="NonTeaching">Non-Teaching</option></select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Certificate</label>
                  <select value={programModal.certificate_issued || 'no'} onChange={e => setProgramModal(m => m ? {...m, certificate_issued: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    {CERT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Organizer</label>
                  <input value={programModal.organizer || ''} onChange={e => setProgramModal(m => m ? {...m, organizer: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resource Person</label>
                  <input value={programModal.resource_person || ''} onChange={e => setProgramModal(m => m ? {...m, resource_person: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>

              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Venue / Platform</label>
                <input value={programModal.venue || ''} onChange={e => setProgramModal(m => m ? {...m, venue: e.target.value} : m)}
                  placeholder="Location or online link" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cost Per Head (₹)</label>
                  <input type="number" step="0.01" value={programModal.cost_per_head || ''} onChange={e => setProgramModal(m => m ? {...m, cost_per_head: parseFloat(e.target.value) || null} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Budget (₹)</label>
                  <input type="number" step="0.01" value={programModal.total_budget || ''} onChange={e => setProgramModal(m => m ? {...m, total_budget: parseFloat(e.target.value) || null} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
              </div>

              {programModal.id && (
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select value={programModal.status || 'scheduled'} onChange={e => setProgramModal(m => m ? {...m, status: e.target.value} : m)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}</select></div>
              )}

              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea rows={2} value={programModal.description || ''} onChange={e => setProgramModal(m => m ? {...m, description: e.target.value} : m)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" /></div>

              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Learning Outcomes</label>
                <textarea rows={2} value={programModal.learning_outcomes || ''} onChange={e => setProgramModal(m => m ? {...m, learning_outcomes: e.target.value} : m)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" /></div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setProgramModal(null)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={programBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {programBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
