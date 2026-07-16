import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, AlertTriangle, CheckCircle2, Clock, ArrowLeft,
  Plus, Edit2, Trash2, Loader2, X, ChevronRight, Send, Star,
  TrendingUp, Filter, RefreshCw, Flag, Lock,
  EyeOff, BarChart3, Calendar, Shield, Zap, Activity
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface StaffMember { id: number; staff_type: string; name: string; employee_id: string; department: string | null; }

interface Grievance {
  id: number; school_id: number; staff_id: number; staff_type: string;
  subject: string; category: string; priority: string; description: string;
  supporting_evidence: string | null; against_whom: string | null;
  status: string; is_anonymous: boolean; assigned_to: number | null;
  resolution_notes: string | null; resolved_at: string | null; resolved_by: number | null;
  expected_resolution_date: string | null; is_escalated: boolean; escalated_at: string | null;
  satisfaction_rating: number | null; satisfaction_remarks: string | null;
  created_at: string; updated_at: string;
  // resolved by masters
  staff_name: string; employee_id: string; department: string | null;
  comment_count: number;
}

interface Comment {
  id: number; grievance_id: number; author_id: number; author_role: string;
  comment: string; comment_type: string; old_status: string | null; new_status: string | null;
  is_internal: boolean; created_at: string; author_name: string;
}

interface GrievanceDetail {
  grievance: Grievance;
  comments: Comment[];
}

interface Stats {
  total: number; open: number; under_review: number; resolved: number;
  closed: number; rejected: number; escalated: number;
  critical: number; high_priority: number; avg_satisfaction: number | null;
}

interface Analytics {
  by_category: { category: string; cnt: number; resolved_cnt: number }[];
  by_status: { status: string; cnt: number }[];
  by_priority: { priority: string; cnt: number }[];
  by_month: { month: number; total: number; resolved: number }[];
  avg_resolution_days: number | null;
  urgent: any[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const CATEGORIES = ['general', 'salary', 'workload', 'harassment', 'facilities', 'policy', 'leave', 'transfer', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES   = ['open', 'under_review', 'resolved', 'closed', 'rejected', 'escalated'];
const MONTHS     = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  low:      { label: 'Low',      color: 'text-slate-600',  bg: 'bg-slate-100',   border: 'border-slate-300',  icon: '⚪' },
  medium:   { label: 'Medium',   color: 'text-amber-700',  bg: 'bg-amber-100',   border: 'border-amber-300',  icon: '🟡' },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100',  border: 'border-orange-300', icon: '🟠' },
  critical: { label: 'Critical', color: 'text-rose-700',   bg: 'bg-rose-100',    border: 'border-rose-300',   icon: '🔴' },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open',         color: 'text-sky-700',    bg: 'bg-sky-100'    },
  under_review: { label: 'Under Review', color: 'text-violet-700', bg: 'bg-violet-100' },
  resolved:     { label: 'Resolved',     color: 'text-emerald-700',bg: 'bg-emerald-100'},
  closed:       { label: 'Closed',       color: 'text-slate-600',  bg: 'bg-slate-100'  },
  rejected:     { label: 'Rejected',     color: 'text-rose-700',   bg: 'bg-rose-100'   },
  escalated:    { label: 'Escalated',    color: 'text-orange-700', bg: 'bg-orange-100' },
};

const CAT_EMOJI: Record<string, string> = {
  general: '📋', salary: '💰', workload: '⚖️', harassment: '🚫',
  facilities: '🏢', policy: '📜', leave: '🗓️', transfer: '🔄', other: '❓',
};

const COMMENT_TYPE_CFG: Record<string, { color: string; bg: string; label: string }> = {
  comment:       { color: 'text-slate-700',  bg: 'bg-white',        label: 'Comment'     },
  status_change: { color: 'text-violet-700', bg: 'bg-violet-50',    label: 'Status'      },
  assignment:    { color: 'text-sky-700',    bg: 'bg-sky-50',       label: 'Assignment'  },
  resolution:    { color: 'text-emerald-700',bg: 'bg-emerald-50',   label: 'Resolved'    },
  escalation:    { color: 'text-orange-700', bg: 'bg-orange-50',    label: 'Escalated'   },
  internal_note: { color: 'text-amber-700',  bg: 'bg-amber-50',     label: 'Internal'    },
};

const TABS = [
  { key: 'grievances', label: '📋 Grievances' },
  { key: 'analytics',  label: '📊 Analytics'  },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const ini = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];
  const c = cols[(name || ' ').charCodeAt(0) % cols.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${c} flex items-center justify-center font-black shrink-0`}>{ini}</div>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.color} ${c.bg} ${c.border}`}>
      {c.icon} {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color} ${c.bg}`}>{c.label}</span>;
}

function StarRating({ rating, onRate }: { rating: number | null; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onClick={() => onRate && onRate(s)}
          onMouseEnter={() => onRate && setHover(s)}
          onMouseLeave={() => onRate && setHover(0)}
          className={`${onRate ? 'cursor-pointer' : 'cursor-default'}`}>
          <Star className={`w-4 h-4 ${s <= (hover || rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} transition`} />
        </button>
      ))}
      {rating && <span className="text-[10px] text-slate-500 ml-1">{rating}/5</span>}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const defaultGrievance = { category: 'general', priority: 'medium', is_anonymous: false };

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function GrievanceManagement() {
  const [tab, setTab] = useState<TabKey>('grievances');

  /* Masters */
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  /* List */
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* Filters */
  const [fStatus, setFStatus]     = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fSearch, setFSearch]     = useState('');

  /* Modals */
  const [raiseModal, setRaiseModal] = useState<any | null>(null);
  const [raiseBusy, setRaiseBusy]   = useState(false);

  /* Detail */
  const [detailId, setDetailId]       = useState<number | null>(null);
  const [detail, setDetail]           = useState<GrievanceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* Action modals in detail */
  const [statusModal, setStatusModal] = useState<any | null>(null);
  const [statusBusy, setStatusBusy]   = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingVal, setRatingVal]     = useState(0);
  const [ratingRemarks, setRatingRemarks] = useState('');
  const [ratingBusy, setRatingBusy]   = useState(false);

  /* Edit modal */
  const [editModal, setEditModal]   = useState<any | null>(null);
  const [editBusy, setEditBusy]     = useState(false);

  /* Analytics */
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsYear, setAnalyticsYear]       = useState(new Date().getFullYear());

  /* ─── Load Masters ─── */
  useEffect(() => {
    api.get('/school/grievances/masters').then(res => {
      if (res.data.success) {
        setStaff(res.data.staff || []);
        setStats(res.data.stats);
      }
    });
  }, []);

  /* ─── Load List ─── */
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 15, page };
      if (fStatus)   params.status   = fStatus;
      if (fPriority) params.priority = fPriority;
      if (fCategory) params.category = fCategory;
      if (fSearch)   params.search   = fSearch;
      const res = await api.get('/school/grievances', { params });
      if (res.data.success) {
        setGrievances(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
        setPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load grievances'); }
    finally { setLoading(false); }
  }, [page, fStatus, fPriority, fCategory, fSearch]);

  useEffect(() => { if (tab === 'grievances' && !detailId) loadList(); }, [tab, detailId, loadList]);

  /* ─── Load Detail ─── */
  const loadDetail = useCallback(async (id: number) => {
    setDetailId(id);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await api.get(`/school/grievances/${id}`);
      if (res.data.success) setDetail(res.data);
    } catch { toast.error('Failed to load grievance'); }
    finally { setLoadingDetail(false); }
  }, []);

  /* ─── Load Analytics ─── */
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/school/grievances/analytics', { params: { year: analyticsYear } });
      if (res.data.success) setAnalytics(res.data);
    } catch { toast.error('Failed'); }
    finally { setLoadingAnalytics(false); }
  }, [analyticsYear]);

  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  /* ─── Raise Grievance ─── */
  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raiseModal) return;
    setRaiseBusy(true);
    try {
      await api.post('/school/grievances', raiseModal);
      toast.success('Grievance raised successfully!');
      setRaiseModal(null);
      loadList();
      // refresh stats
      api.get('/school/grievances/masters').then(r => { if (r.data.success) setStats(r.data.stats); });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRaiseBusy(false); }
  };

  /* ─── Edit Grievance ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditBusy(true);
    try {
      await api.put(`/school/grievances/${editModal.id}`, editModal);
      toast.success('Updated');
      setEditModal(null);
      detailId && loadDetail(detailId);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditBusy(false); }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this grievance?')) return;
    try {
      await api.delete(`/school/grievances/${id}`);
      toast.success('Deleted');
      loadList();
    } catch { toast.error('Failed'); }
  };

  /* ─── Change Status ─── */
  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal || !detailId) return;
    setStatusBusy(true);
    try {
      const res = await api.post(`/school/grievances/${detailId}/status`, statusModal);
      if (res.data.success) {
        toast.success(res.data.message);
        setStatusModal(null);
        loadDetail(detailId);
        api.get('/school/grievances/masters').then(r => { if (r.data.success) setStats(r.data.stats); });
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setStatusBusy(false); }
  };

  /* ─── Add Comment ─── */
  const handleComment = async () => {
    if (!commentText.trim() || !detailId) return;
    setCommentBusy(true);
    try {
      await api.post(`/school/grievances/${detailId}/comments`, {
        comment: commentText, is_internal: commentInternal, author_role: 'hr',
      });
      toast.success('Comment added');
      setCommentText('');
      setCommentInternal(false);
      loadDetail(detailId);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCommentBusy(false); }
  };

  /* ─── Submit Rating ─── */
  const handleRate = async () => {
    if (!ratingVal || !detailId) return;
    setRatingBusy(true);
    try {
      const res = await api.post(`/school/grievances/${detailId}/rate`, { satisfaction_rating: ratingVal, satisfaction_remarks: ratingRemarks });
      if (res.data.success) { toast.success(res.data.message); setRatingModal(false); loadDetail(detailId); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRatingBusy(false); }
  };

  /* ══════════════════════════════════════════════════════════
     DETAIL VIEW
  ══════════════════════════════════════════════════════════ */
  if (detailId) {
    const g = detail?.grievance;
    const comments = detail?.comments || [];
    const pc = g ? PRIORITY_CFG[g.priority] : null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setDetailId(null); setDetail(null); loadList(); }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          {loadingDetail ? <div className="w-5 h-5 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /> : g ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${pc?.bg || 'bg-slate-50'} border ${pc?.border || 'border-slate-200'}`}>
                {CAT_EMOJI[g.category] || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">{g.subject}</h2>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <PriorityBadge priority={g.priority} />
                  <StatusBadge status={g.status} />
                  <span className="text-[10px] text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{CAT_EMOJI[g.category]} {g.category}</span>
                  {g.is_escalated && <span className="text-[10px] text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full font-bold">⬆ Escalated</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!['resolved', 'closed', 'rejected'].includes(g.status) && (
                  <button onClick={() => setStatusModal({ status: '', comment: '', resolution_notes: '', is_internal: false })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                    <Zap className="w-3.5 h-3.5" /> Update Status
                  </button>
                )}
                <button onClick={() => setEditModal(g)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {!loadingDetail && g && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: main content + comment thread */}
            <div className="lg:col-span-2 space-y-3">
              {/* Description */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{g.description}</p>
                {g.supporting_evidence && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Supporting Evidence</p>
                    <p className="text-xs text-slate-600">{g.supporting_evidence}</p>
                  </div>
                )}
                {g.against_whom && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Against</p>
                    <p className="text-xs font-semibold text-rose-700">{g.against_whom}</p>
                  </div>
                )}
              </div>

              {/* Resolution (if resolved/closed) */}
              {g.resolution_notes && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Notes
                  </h3>
                  <p className="text-sm text-emerald-800 leading-relaxed">{g.resolution_notes}</p>
                  {g.resolved_at && <p className="text-[10px] text-emerald-600 mt-1">Resolved on {g.resolved_at}</p>}
                </div>
              )}

              {/* Satisfaction rating block */}
              {['resolved', 'closed'].includes(g.status) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Resolution Satisfaction
                  </h3>
                  {g.satisfaction_rating ? (
                    <div>
                      <StarRating rating={g.satisfaction_rating} />
                      {g.satisfaction_remarks && <p className="text-xs text-amber-800 mt-1">{g.satisfaction_remarks}</p>}
                    </div>
                  ) : (
                    <button onClick={() => { setRatingModal(true); setRatingVal(0); setRatingRemarks(''); }}
                      className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Rate the resolution →
                    </button>
                  )}
                </div>
              )}

              {/* Comment Thread */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-violet-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-500" /> Timeline ({comments.filter(c => !c.is_internal).length})
                  </h3>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No comments yet.</p>
                  ) : comments.map(c => {
                    const tc = COMMENT_TYPE_CFG[c.comment_type] || COMMENT_TYPE_CFG.comment;
                    return (
                      <div key={c.id} className={`${c.is_internal ? 'border-l-2 border-amber-300 pl-3' : 'border-l-2 border-slate-100 pl-3'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tc.bg} ${tc.color}`}>{tc.label}</span>
                          {c.is_internal && <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Internal</span>}
                          <span className="text-[10px] font-bold text-slate-700">{c.author_name || 'System'}</span>
                          <span className="text-[9px] text-slate-400 ml-auto">{timeAgo(c.created_at)}</span>
                        </div>
                        {c.comment_type === 'status_change' && c.old_status && (
                          <p className="text-[10px] text-slate-500 mb-0.5">
                            <span className={`font-bold ${STATUS_CFG[c.old_status]?.color}`}>{STATUS_CFG[c.old_status]?.label}</span>
                            <span className="mx-1">→</span>
                            <span className={`font-bold ${STATUS_CFG[c.new_status!]?.color}`}>{STATUS_CFG[c.new_status!]?.label}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-700 leading-relaxed">{c.comment}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Add comment box */}
                <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-2">
                  <textarea rows={2} value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment or note..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
                      <input type="checkbox" checked={commentInternal} onChange={e => setCommentInternal(e.target.checked)} />
                      <Lock className="w-3 h-3 text-amber-500" /> Internal note (HR only)
                    </label>
                    <button onClick={handleComment} disabled={commentBusy || !commentText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-40">
                      {commentBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: info sidebar */}
            <div className="space-y-3">
              {/* Complainant */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Raised By</h3>
                <div className="flex items-center gap-3">
                  <Avatar name={g.staff_name} size="lg" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{g.staff_name}</p>
                    <p className="text-[10px] text-slate-500">{g.employee_id} · {g.staff_type}</p>
                    {g.department && <p className="text-[10px] text-slate-500">{g.department}</p>}
                    {g.is_anonymous && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Anonymous</span>}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Details</h3>
                {[
                  { label: 'Category',  val: `${CAT_EMOJI[g.category]} ${g.category}`,  cls: 'capitalize' },
                  { label: 'Priority',  val: null,   badge: <PriorityBadge priority={g.priority} /> },
                  { label: 'Status',    val: null,   badge: <StatusBadge status={g.status} /> },
                  { label: 'Raised On', val: new Date(g.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) },
                  { label: 'ETA',       val: g.expected_resolution_date || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">{row.label}</span>
                    {row.badge || <span className={`text-xs font-bold text-slate-700 ${row.cls || ''}`}>{row.val}</span>}
                  </div>
                ))}
              </div>

              {/* Quick status actions */}
              {!['resolved', 'closed', 'rejected'].includes(g.status) && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    {STATUSES.filter(s => s !== g.status && s !== 'open').map(s => {
                      const sc = STATUS_CFG[s];
                      return (
                        <button key={s} onClick={() => setStatusModal({ status: s, comment: '', resolution_notes: '', is_internal: false })}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition ${sc.color} ${sc.bg} border-transparent hover:border-current`}>
                          → Mark as {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATUS CHANGE MODAL */}
        {statusModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">Update Status</h3>
                <button onClick={() => setStatusModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleChangeStatus} className="p-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Status *</label>
                  <select required value={statusModal.status} onChange={e => setStatusModal((m: any) => ({ ...m, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 bg-white">
                    <option value="">Select status...</option>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comment</label>
                  <textarea rows={2} value={statusModal.comment} onChange={e => setStatusModal((m: any) => ({ ...m, comment: e.target.value }))}
                    placeholder="Add a note about this status change..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" />
                </div>
                {['resolved', 'closed'].includes(statusModal.status) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resolution Notes</label>
                    <textarea rows={3} value={statusModal.resolution_notes} onChange={e => setStatusModal((m: any) => ({ ...m, resolution_notes: e.target.value }))}
                      placeholder="Describe how the grievance was resolved..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input type="checkbox" checked={statusModal.is_internal} onChange={e => setStatusModal((m: any) => ({ ...m, is_internal: e.target.checked }))} />
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Mark as internal (HR only)
                </label>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button type="button" onClick={() => setStatusModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={statusBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50">
                    {statusBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RATING MODAL */}
        {ratingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold">Rate the Resolution</h3>
                <button onClick={() => setRatingModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-3">How satisfied are you with how your grievance was resolved?</p>
                  <div className="flex justify-center"><StarRating rating={ratingVal} onRate={setRatingVal} /></div>
                  {ratingVal > 0 && <p className="text-xs text-amber-600 font-bold mt-1">{['', 'Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'][ratingVal]}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks (optional)</label>
                  <textarea rows={2} value={ratingRemarks} onChange={e => setRatingRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setRatingModal(false)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button onClick={handleRate} disabled={ratingBusy || !ratingVal}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50">
                    {ratingBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />} Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-sm font-bold">Edit Grievance</h3>
                <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleEdit} className="p-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject *</label>
                  <input required value={editModal.subject || ''} onChange={e => setEditModal((m: any) => ({ ...m, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <select value={editModal.category || 'general'} onChange={e => setEditModal((m: any) => ({ ...m, category: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400 capitalize">
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                    <select value={editModal.priority || 'medium'} onChange={e => setEditModal((m: any) => ({ ...m, priority: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400 capitalize">
                      {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p]?.icon} {p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                  <textarea rows={4} value={editModal.description || ''} onChange={e => setEditModal((m: any) => ({ ...m, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Against Whom</label>
                  <input value={editModal.against_whom || ''} onChange={e => setEditModal((m: any) => ({ ...m, against_whom: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Resolution Date</label>
                  <input type="date" value={editModal.expected_resolution_date || ''} onChange={e => setEditModal((m: any) => ({ ...m, expected_resolution_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button type="button" onClick={() => setEditModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={editBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition disabled:opacity-50">
                    {editBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
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
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Shield className="w-5 h-5" /></span>
            Grievance Desk
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage staff complaints, track resolution, and monitor satisfaction.</p>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { label: 'Total',       val: stats.total,        color: 'text-slate-700',   bg: 'bg-slate-50',   ring: 'ring-slate-200'   },
            { label: 'Open',        val: stats.open,         color: 'text-sky-700',     bg: 'bg-sky-50',     ring: 'ring-sky-200'     },
            { label: 'Under Review',val: stats.under_review, color: 'text-violet-700',  bg: 'bg-violet-50',  ring: 'ring-violet-200'  },
            { label: 'Critical',    val: stats.critical,     color: 'text-rose-700',    bg: 'bg-rose-50',    ring: 'ring-rose-200'    },
            { label: 'Resolved',    val: stats.resolved,     color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 ring-1 ${s.ring} shadow-sm`}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB: GRIEVANCES ═══ */}
      {tab === 'grievances' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 shadow-sm">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>)}
            </select>
            <select value={fPriority} onChange={e => setFPriority(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 shadow-sm">
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p]?.icon} {PRIORITY_CFG[p]?.label}</option>)}
            </select>
            <select value={fCategory} onChange={e => setFCategory(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 shadow-sm capitalize">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
            </select>
            <input type="text" placeholder="Search subject..." value={fSearch} onChange={e => setFSearch(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-400 shadow-sm flex-1 min-w-32" />
            <button onClick={() => { setPage(1); loadList(); }} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition hover:bg-rose-700">
              <Filter className="w-3.5 h-3.5" /> Search
            </button>
            <button onClick={() => setRaiseModal({ ...defaultGrievance })}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Raise Grievance
            </button>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" /></div>
          ) : grievances.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No grievances found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grievances.map(g => {
                const pc = PRIORITY_CFG[g.priority];
                const daysOpen = Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000);
                return (
                  <div key={g.id}
                    className={`bg-white border-2 hover:shadow-md rounded-2xl p-4 shadow-sm transition cursor-pointer group ${g.priority === 'critical' ? 'border-rose-300 hover:border-rose-400' : g.priority === 'high' ? 'border-orange-200 hover:border-orange-300' : 'border-slate-200 hover:border-violet-300'}`}
                    onClick={() => loadDetail(g.id)}>
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${pc?.bg} border ${pc?.border}`}>
                        {CAT_EMOJI[g.category] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-slate-800 truncate">{g.subject}</h3>
                          <PriorityBadge priority={g.priority} />
                          <StatusBadge status={g.status} />
                          {g.is_escalated && <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full">⬆ Escalated</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Avatar name={g.staff_name} size="sm" />
                            <span className="font-semibold">{g.staff_name}</span>
                            {g.is_anonymous && <span className="italic">(anonymous)</span>}
                          </span>
                          <span>· {g.department || '—'} ·</span>
                          <span className="capitalize">{CAT_EMOJI[g.category]} {g.category}</span>
                          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(g.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          {daysOpen > 7 && !['resolved', 'closed'].includes(g.status) &&
                            <span className="text-rose-600 font-bold flex items-center gap-0.5"><Clock className="w-3 h-3" />{daysOpen}d open</span>}
                        </div>
                        {g.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{g.description}</p>}
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0 text-center">
                        {g.comment_count > 0 && (
                          <div><p className="text-sm font-black text-slate-600">{g.comment_count}</p><p className="text-[9px] text-slate-400">replies</p></div>
                        )}
                        {g.satisfaction_rating && <StarRating rating={g.satisfaction_rating} />}
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditModal(g)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition shrink-0 self-center" />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Page {page} of {pages} · {total} grievances</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: ANALYTICS ═══ */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select value={analyticsYear} onChange={e => setAnalyticsYear(parseInt(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-rose-400 shadow-sm">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadAnalytics} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-rose-700 transition">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingAnalytics ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" /></div>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Avg resolution + escalations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 text-center shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-emerald-700">{analytics.avg_resolution_days ?? '—'}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Avg Days to Resolve</p>
                </div>
                <div className="bg-orange-50 ring-1 ring-orange-200 rounded-xl p-4 text-center shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-orange-700">{stats?.escalated ?? 0}</p>
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Escalated</p>
                </div>
                <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4 text-center shadow-sm">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-amber-700">{stats?.avg_satisfaction ? `${stats.avg_satisfaction}★` : '—'}</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Avg Satisfaction</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* By Category */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-rose-500" /> By Category</h3>
                  {analytics.by_category.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.by_category.map(c => {
                        const max = Math.max(...analytics.by_category.map(x => x.cnt));
                        const resPct = c.cnt > 0 ? Math.round((c.resolved_cnt / c.cnt) * 100) : 0;
                        return (
                          <div key={c.category}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="font-bold text-slate-700 capitalize">{CAT_EMOJI[c.category]} {c.category}</span>
                              <span className="text-slate-400">{c.cnt} ({resPct}% resolved)</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(c.resolved_cnt / max) * 100}%` }} />
                              <div className="h-full bg-rose-300 rounded-full" style={{ width: `${((c.cnt - c.resolved_cnt) / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-3 text-[9px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />Resolved</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-300 rounded-full inline-block" />Pending</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* By Priority */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-orange-500" /> By Priority</h3>
                  {analytics.by_priority.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-3">
                      {['critical', 'high', 'medium', 'low'].map(p => {
                        const d = analytics.by_priority.find(x => x.priority === p);
                        const total_cnt = analytics.by_priority.reduce((s, x) => s + x.cnt, 0);
                        const cnt = d?.cnt || 0;
                        const pct = total_cnt > 0 ? Math.round((cnt / total_cnt) * 100) : 0;
                        const pc2 = PRIORITY_CFG[p];
                        return (
                          <div key={p}>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className={`${pc2.color}`}>{pc2.icon} {pc2.label}</span>
                              <span className="text-slate-500">{cnt} ({pct}%)</span>
                            </div>
                            <div className={`h-2 ${pc2.bg} rounded-full overflow-hidden border ${pc2.border}`}>
                              <div className={`h-full ${pc2.color.replace('text-', 'bg-')} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-violet-500" /> By Status</h3>
                  {analytics.by_status.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.by_status.map(s => {
                        const max = Math.max(...analytics.by_status.map(x => x.cnt));
                        const sc = STATUS_CFG[s.status] || { label: s.status, color: 'text-slate-600', bg: 'bg-slate-100' };
                        return (
                          <div key={s.status}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className={`font-bold ${sc.color}`}>{sc.label}</span>
                              <span className="text-slate-400">{s.cnt}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${sc.color.replace('text-', 'bg-').replace('-700', '-400').replace('-600', '-400')} rounded-full`} style={{ width: `${(s.cnt / max) * 100}%` }} />
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
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Monthly Trend — {analyticsYear}</h3>
                  <div className="flex items-end gap-1.5 h-24">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const d = analytics.by_month.find(x => x.month === month);
                      const maxVal = Math.max(...analytics.by_month.map(x => x.total), 1);
                      const totalH = d ? Math.max(4, (d.total / maxVal) * 80) : 2;
                      const resolvedH = d && d.total > 0 ? (d.resolved / d.total) * totalH : 0;
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col justify-end" style={{ height: `${totalH}px` }}>
                            {d && d.total > 0 && <>
                              <div className="w-full bg-rose-300 rounded-t-lg" style={{ height: `${totalH - resolvedH}px` }} title={`${MONTHS[month]}: ${d.total - d.resolved} unresolved`} />
                              <div className="w-full bg-emerald-400" style={{ height: `${resolvedH}px` }} title={`${d.resolved} resolved`} />
                            </>}
                            {(!d || d.total === 0) && <div className="w-full bg-slate-100 rounded-t-lg" style={{ height: '4px' }} />}
                          </div>
                          {d && d.total > 0 && <span className="text-[8px] text-slate-600 font-bold">{d.total}</span>}
                          <span className="text-[8px] text-slate-400">{MONTHS[month]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 text-[9px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm inline-block" />Resolved</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-300 rounded-sm inline-block" />Unresolved</span>
                  </div>
                </div>
              )}

              {/* Urgent list */}
              {analytics.urgent.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Urgent / Open Grievances
                  </h3>
                  <div className="space-y-2">
                    {analytics.urgent.map((g: any) => (
                      <div key={g.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-rose-100 cursor-pointer hover:border-rose-300 transition" onClick={() => loadDetail(g.id)}>
                        <PriorityBadge priority={g.priority} />
                        <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{g.subject}</p><p className="text-[9px] text-slate-400">{g.staff_name}</p></div>
                        <span className="text-[9px] text-rose-600 font-bold shrink-0">{Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000)}d open</span>
                        <ChevronRight className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* RAISE GRIEVANCE MODAL */}
      {raiseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-rose-500" /> Raise New Grievance</h3>
              <button onClick={() => setRaiseModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRaise} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Member *</label>
                <select required value={raiseModal.staff_id ? `${raiseModal.staff_id}_${raiseModal.staff_type}` : ''} onChange={e => {
                  const [id, type] = e.target.value.split('_');
                  setRaiseModal((m: any) => ({ ...m, staff_id: parseInt(id), staff_type: type }));
                }} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-rose-400">
                  <option value="">Select staff member...</option>
                  {staff.map(s => <option key={`${s.id}_${s.staff_type}`} value={`${s.id}_${s.staff_type}`}>{s.name} ({s.staff_type} · {s.department})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject *</label>
                <input required maxLength={250} value={raiseModal.subject || ''} onChange={e => setRaiseModal((m: any) => ({ ...m, subject: e.target.value }))}
                  placeholder="Brief summary of the grievance..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category *</label>
                  <select required value={raiseModal.category || 'general'} onChange={e => setRaiseModal((m: any) => ({ ...m, category: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-rose-400 capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                  <select value={raiseModal.priority || 'medium'} onChange={e => setRaiseModal((m: any) => ({ ...m, priority: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-rose-400 capitalize">
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p]?.icon} {p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description *</label>
                <textarea required rows={4} value={raiseModal.description || ''} onChange={e => setRaiseModal((m: any) => ({ ...m, description: e.target.value }))}
                  placeholder="Detailed description of the grievance..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Against Whom (if applicable)</label>
                <input value={raiseModal.against_whom || ''} onChange={e => setRaiseModal((m: any) => ({ ...m, against_whom: e.target.value }))}
                  placeholder="Name / designation of the person(s) involved..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supporting Evidence / References</label>
                <textarea rows={2} value={raiseModal.supporting_evidence || ''} onChange={e => setRaiseModal((m: any) => ({ ...m, supporting_evidence: e.target.value }))}
                  placeholder="Dates, incidents, references, witnesses..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Resolution Date</label>
                <input type="date" value={raiseModal.expected_resolution_date || ''} onChange={e => setRaiseModal((m: any) => ({ ...m, expected_resolution_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input type="checkbox" checked={!!raiseModal.is_anonymous} onChange={e => setRaiseModal((m: any) => ({ ...m, is_anonymous: e.target.checked }))} />
                <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Submit as Anonymous
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setRaiseModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={raiseBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {raiseBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />} Raise Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
