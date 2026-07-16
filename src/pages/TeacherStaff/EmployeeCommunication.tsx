import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Send, Plus, Edit2, Trash2, Loader2, X, ChevronRight,
  Clock, AlertTriangle, BarChart3, ArrowLeft,
  Filter, Megaphone, Bell, Calendar,
  CheckSquare, ShieldCheck, BookOpen, Inbox,
  CheckCircle, ExternalLink
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface StaffMember {
  id: number; staff_type: string; name: string; employee_id: string;
  department: string | null; designation: string | null;
}

interface CommStats {
  total: number; draft: number; sent: number; scheduled: number; archived: number;
}

interface RecipientStat {
  total: number; read_count: number; ack_count: number;
}

interface Communication {
  id: number; school_id: number; title: string; body: string; comm_type: string;
  priority: string; target_audience: string; target_department: string | null;
  target_staff_ids: any; attachment_url: string | null; attachment_name: string | null;
  external_link: string | null; status: string; scheduled_at: string | null;
  sent_at: string | null; requires_acknowledgement: boolean;
  acknowledge_deadline: string | null; created_by: number | null;
  sent_by: number | null; total_recipients: number; created_at: string;
  recipient_stats?: RecipientStat;
  // Inbox specific mapping
  recipient_row_id?: number; is_read?: boolean; read_at?: string | null;
  is_acknowledged?: boolean; acknowledged_at?: string | null;
}

interface RecipientRow {
  id: number; communication_id: number; staff_id: number; staff_type: string;
  is_read: boolean; read_at: string | null; is_acknowledged: boolean;
  acknowledged_at: string | null; acknowledgement_note: string | null;
  delivered_in_app: boolean; delivered_email: boolean; delivered_sms: boolean;
  name: string; employee_id: string; department: string;
}

interface CommunicationDetail {
  communication: Communication;
  recipients: RecipientRow[];
}

interface Analytics {
  by_type: { comm_type: string; cnt: number }[];
  by_priority: { priority: string; cnt: number }[];
  engagement: { total_delivered: number; total_read: number; total_ack: number } | null;
  by_month: { month: number; cnt: number }[];
  alerts: { id: number; title: string; comm_type: string; sent_at: string; total_recipients: number; ack_count: number; ack_rate: number }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const COMM_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  announcement:   { label: 'Announcement',  color: 'text-indigo-700', bg: 'bg-indigo-50',    icon: '📢' },
  notice:         { label: 'Notice',        color: 'text-sky-700',    bg: 'bg-sky-50',       icon: '📋' },
  circular:       { label: 'Circular',      color: 'text-violet-700', bg: 'bg-violet-50',    icon: '📜' },
  alert:          { label: 'Alert',         color: 'text-rose-700',   bg: 'bg-rose-50',      icon: '🚨' },
  reminder:       { label: 'Reminder',      color: 'text-amber-700',  bg: 'bg-amber-50',     icon: '⏰' },
  policy_update:  { label: 'Policy Update',  color: 'text-emerald-700',bg: 'bg-emerald-50',  icon: '⚖️' },
  event_invite:   { label: 'Event Invite',  color: 'text-fuchsia-700',bg: 'bg-fuchsia-50',  icon: '📅' },
  congratulation: { label: 'Celebration',   color: 'text-pink-700',   bg: 'bg-pink-50',      icon: '🎉' },
  warning:        { label: 'Warning',       color: 'text-orange-700', bg: 'bg-orange-50',    icon: '⚠️' },
  general:        { label: 'General',       color: 'text-slate-700',  bg: 'bg-slate-50',     icon: '✉️' },
};

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  low:    { label: 'Low',      color: 'text-slate-600',  bg: 'bg-slate-100',   icon: '⚪' },
  normal: { label: 'Normal',   color: 'text-sky-700',    bg: 'bg-sky-100',     icon: '🟢' },
  high:   { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100',  icon: '🟠' },
  urgent: { label: 'Urgent',   color: 'text-rose-700',   bg: 'bg-rose-100',    icon: '🔴' },
};

const AUDIENCE_CFG: Record<string, string> = {
  all_staff:         'All Staff 👥',
  teachers_only:     'Teachers Only 👨‍🏫',
  non_teaching_only: 'Non-Teaching Only 🛠️',
  department:        'Department-specific 🏢',
  individual:        'Specific Staff 👤',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'text-slate-500',  bg: 'bg-slate-100'  },
  scheduled: { label: 'Scheduled', color: 'text-amber-700',  bg: 'bg-amber-100'  },
  sent:      { label: 'Sent',      color: 'text-emerald-700',bg: 'bg-emerald-100'},
  archived:  { label: 'Archived',  color: 'text-slate-400',  bg: 'bg-slate-50'   },
};

const defaultForm = { comm_type: 'announcement', priority: 'normal', target_audience: 'all_staff', status: 'sent', requires_acknowledgement: false };

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function EmployeeCommunication() {
  const [tab, setTab] = useState<'inbox' | 'outbox' | 'analytics'>('inbox');

  /* Masters */
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<CommStats | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  /* Inbox (Received Messages) */
  const [inbox, setInbox] = useState<Communication[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [inboxDetail, setInboxDetail] = useState<Communication | null>(null);
  const [ackNote, setAckNote] = useState('');
  const [ackBusy, setAckBusy] = useState(false);

  /* Outbox (Sent/Draft Broadcasts) */
  const [outbox, setOutbox] = useState<Communication[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingOutbox, setLoadingOutbox] = useState(false);

  /* Filters for Outbox */
  const [fStatus, setFStatus] = useState('');
  const [fType, setFType]     = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fSearch, setFSearch] = useState('');

  /* Outbox Detail View */
  const [outboxDetailId, setOutboxDetailId] = useState<number | null>(null);
  const [outboxDetail, setOutboxDetail] = useState<CommunicationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* Modals */
  const [composeModal, setComposeModal] = useState<any | null>(null);
  const [composeBusy, setComposeBusy]   = useState(false);
  const [editModal, setEditModal]       = useState<any | null>(null);
  const [editBusy, setEditBusy]         = useState(false);

  /* Selected individuals list for compose */
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set()); // e.g. "id_type"
  const [staffSearch, setStaffSearch] = useState('');

  /* Analytics */
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /* ─── Load Masters ─── */
  const loadMasters = useCallback(() => {
    api.get('/school/communications/masters').then(res => {
      if (res.data.success) {
        setStaff(res.data.staff || []);
        setStats(res.data.stats);
        setDepartments(res.data.departments || []);
      }
    });
  }, []);

  useEffect(() => { loadMasters(); }, [loadMasters]);

  /* ─── Load Inbox ─── */
  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    try {
      const res = await api.get('/school/communications/my-inbox');
      if (res.data.success) setInbox(res.data.data || []);
    } catch { toast.error('Failed to load inbox'); }
    finally { setLoadingInbox(false); }
  }, []);

  useEffect(() => { if (tab === 'inbox') loadInbox(); }, [tab, loadInbox]);

  /* ─── Mark Read / Acknowledge Inbox Item ─── */
  const handleInboxAction = async (item: Communication, action: 'read' | 'acknowledge') => {
    if (!item.recipient_row_id) return;
    if (action === 'acknowledge') setAckBusy(true);
    try {
      const res = await api.post(`/school/communications/my-inbox/${item.recipient_row_id}/action`, {
        action, note: action === 'acknowledge' ? ackNote : null
      });
      if (res.data.success) {
        toast.success(action === 'acknowledge' ? 'Acknowledged successfully' : 'Marked read');
        setAckNote('');
        // Refresh detail view in inbox
        if (inboxDetail && inboxDetail.id === item.id) {
          setInboxDetail(prev => prev ? {
            ...prev,
            is_read: true,
            is_acknowledged: action === 'acknowledge' ? true : prev.is_acknowledged,
            acknowledged_at: action === 'acknowledge' ? new Date().toISOString() : prev.acknowledged_at
          } : null);
        }
        loadInbox();
      }
    } catch { toast.error('Action failed'); }
    finally { setAckBusy(false); }
  };

  /* Open inbox details */
  const openInboxItem = (item: Communication) => {
    setInboxDetail(item);
    if (!item.is_read) {
      handleInboxAction(item, 'read');
    }
  };

  /* ─── Load Outbox ─── */
  const loadOutbox = useCallback(async () => {
    setLoadingOutbox(true);
    try {
      const params: any = { per_page: 15, page };
      if (fStatus)   params.status   = fStatus;
      if (fType)     params.comm_type = fType;
      if (fPriority) params.priority = fPriority;
      if (fSearch)   params.search   = fSearch;
      const res = await api.get('/school/communications', { params });
      if (res.data.success) {
        setOutbox(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
        setPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load broadcasts'); }
    finally { setLoadingOutbox(false); }
  }, [page, fStatus, fType, fPriority, fSearch]);

  useEffect(() => { if (tab === 'outbox' && !outboxDetailId) loadOutbox(); }, [tab, outboxDetailId, loadOutbox]);

  /* ─── Load Outbox Detail ─── */
  const loadOutboxDetail = useCallback(async (id: number) => {
    setOutboxDetailId(id);
    setLoadingDetail(true);
    setOutboxDetail(null);
    try {
      const res = await api.get(`/school/communications/${id}`);
      if (res.data.success) setOutboxDetail(res.data);
    } catch { toast.error('Failed to load details'); }
    finally { setLoadingDetail(false); }
  }, []);

  /* ─── Load Analytics ─── */
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/school/communications/analytics');
      if (res.data.success) setAnalytics(res.data);
    } catch { toast.error('Failed'); }
    finally { setLoadingAnalytics(false); }
  }, []);

  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  /* ─── Create Broadcast ─── */
  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeModal) return;
    setComposeBusy(true);

    const payload = { ...composeModal };
    if (payload.target_audience === 'individual') {
      payload.target_staff_ids = Array.from(selectedStaff).map(s => {
        const [id, type] = s.split('_');
        return { id: parseInt(id), staff_type: type };
      });
    }

    try {
      await api.post('/school/communications', payload);
      toast.success('Broadcast created successfully!');
      setComposeModal(null); setSelectedStaff(new Set());
      loadOutbox(); loadMasters();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setComposeBusy(false); }
  };

  /* ─── Edit Broadcast ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditBusy(true);

    const payload = { ...editModal };
    if (payload.target_audience === 'individual') {
      payload.target_staff_ids = Array.from(selectedStaff).map(s => {
        const [id, type] = s.split('_');
        return { id: parseInt(id), staff_type: type };
      });
    }

    try {
      await api.put(`/school/communications/${editModal.id}`, payload);
      toast.success('Broadcast updated');
      setEditModal(null); setSelectedStaff(new Set());
      outboxDetailId ? loadOutboxDetail(outboxDetailId) : loadOutbox();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditBusy(false); }
  };

  /* ─── Send Immediately ─── */
  const handleSendNow = async (id: number) => {
    if (!confirm('Are you sure you want to send this broadcast now?')) return;
    try {
      const res = await api.post(`/school/communications/${id}/send`);
      if (res.data.success) {
        toast.success(res.data.message);
        outboxDetailId ? loadOutboxDetail(outboxDetailId) : loadOutbox();
        loadMasters();
      }
    } catch { toast.error('Failed to send'); }
  };

  /* ─── Delete Broadcast ─── */
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await api.delete(`/school/communications/${id}`);
      toast.success('Broadcast deleted');
      setOutboxDetailId(null);
      loadOutbox(); loadMasters();
    } catch { toast.error('Failed'); }
  };

  /* Helper to populate selected staff during edit */
  const startEdit = (c: Communication) => {
    setSelectedStaff(new Set((c.target_staff_ids || []).map((x: any) => `${x.id}_${x.staff_type}`)));
    setEditModal(c);
  };

  /* Filter staff for individual selection */
  const filteredStaff = staff.filter(s =>
    !staffSearch || s.name.toLowerCase().includes(staffSearch.toLowerCase()) || (s.department || '').toLowerCase().includes(staffSearch.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════
     INBOX DETAIL VIEW (Received message detail)
  ══════════════════════════════════════════════════════════ */
  if (inboxDetail) {
    const c = inboxDetail;
    const typeCfg = COMM_TYPES[c.comm_type] || COMM_TYPES.general;
    const priorityCfg = PRIORITY_CFG[c.priority] || PRIORITY_CFG.normal;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setInboxDetail(null); loadInbox(); }} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-base font-bold text-slate-900 truncate flex-1">{c.title}</h2>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.icon} {typeCfg.label}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Announcement Message Body */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-bold"><Calendar className="w-3.5 h-3.5 text-slate-300" /> Sent: {new Date(c.sent_at || c.created_at).toLocaleString('en-IN')}</span>
                <span className={`flex items-center gap-1 font-bold ${priorityCfg.color}`}>{priorityCfg.icon} Priority: {priorityCfg.label}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
              {c.attachment_url && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between mt-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Attachment</p>
                    <p className="text-xs font-bold text-slate-700">{c.attachment_name || 'Attached File'}</p>
                  </div>
                  <a href={c.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">
                    <BookOpen className="w-3 h-3" /> View / Download
                  </a>
                </div>
              )}
              {c.external_link && (
                <div className="pt-2">
                  <a href={c.external_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> Visit External Link
                  </a>
                </div>
              )}
            </div>

            {/* Acknowledgement Desk */}
            {c.requires_acknowledgement && (
              <div className={`rounded-2xl p-5 border shadow-sm ${c.is_acknowledged ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Acknowledgement Desk
                </h3>
                {c.is_acknowledged ? (
                  <div>
                    <p className="text-xs">You acknowledged this message on <strong>{new Date(c.acknowledged_at!).toLocaleString('en-IN')}</strong>.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs">
                      This broadcast requires your explicit acknowledgement.
                      {c.acknowledge_deadline && <span> Please complete before deadline: <strong>{new Date(c.acknowledge_deadline).toLocaleString('en-IN')}</strong></span>}
                    </p>
                    <div>
                      <label className="block text-[10px] font-bold text-rose-700 uppercase mb-1">Response Note (Optional)</label>
                      <textarea rows={2} value={ackNote} onChange={e => setAckNote(e.target.value)} placeholder="Type any remarks here..."
                        className="w-full px-3 py-2 border border-rose-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-rose-400 resize-none" />
                    </div>
                    <button onClick={() => handleInboxAction(c, 'acknowledge')} disabled={ackBusy}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                      {ackBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />} Acknowledge Broadcast
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Sender Detail */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Sender</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-black uppercase">
                  AD
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">HR / School Admin</p>
                  <p className="text-[9px] text-slate-400">Broadcast Desk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     OUTBOX DETAIL VIEW (Sent/Draft broadcast details)
  ══════════════════════════════════════════════════════════ */
  if (outboxDetailId) {
    const c = outboxDetail?.communication;
    const list = outboxDetail?.recipients || [];
    const typeCfg = c ? COMM_TYPES[c.comm_type] : null;
    const priorityCfg = c ? PRIORITY_CFG[c.priority] : null;

    // Delivery stats
    const totalRecipients = list.length;
    const readCount = list.filter(r => r.is_read).length;
    const ackCount = list.filter(r => r.is_acknowledged).length;
    const readPct = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;
    const ackPct = totalRecipients > 0 ? Math.round((ackCount / totalRecipients) * 100) : 0;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setOutboxDetailId(null); setOutboxDetail(null); loadOutbox(); }} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          {loadingDetail ? <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /> : c ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">{c.title}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${typeCfg?.bg} ${typeCfg?.color}`}>{typeCfg?.icon} {typeCfg?.label}</span>
              <div className="flex gap-1.5 ml-auto">
                {c.status === 'draft' && (
                  <button onClick={() => handleSendNow(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                    <Send className="w-3.5 h-3.5" /> Send Now
                  </button>
                )}
                {c.status !== 'sent' && (
                  <button onClick={() => startEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Draft
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {!loadingDetail && c && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Message Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message Content</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                {c.attachment_url && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs mt-3">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Attachment</p>
                      <p className="font-bold text-slate-700">{c.attachment_name || 'File'}</p>
                    </div>
                    <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">View File</a>
                  </div>
                )}
              </div>

              {/* Delivery stats cards */}
              {c.status === 'sent' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-indigo-700">{totalRecipients}</p>
                    <p className="text-[9px] text-indigo-500 font-bold uppercase">Total Targets</p>
                  </div>
                  <div className="bg-sky-50 border border-sky-150 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-sky-700">{readPct}%</p>
                    <p className="text-[9px] text-sky-500 font-bold uppercase">Read Rate ({readCount})</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-emerald-700">{ackPct}%</p>
                    <p className="text-[9px] text-emerald-500 font-bold uppercase">Ack Rate ({ackCount})</p>
                  </div>
                </div>
              )}

              {/* Recipients detail grid */}
              {c.status === 'sent' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recipients Tracking List</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black">
                        <tr>
                          <th className="px-4 py-2.5">Staff</th>
                          <th className="px-4 py-2.5">Department</th>
                          <th className="px-4 py-2.5">Read Status</th>
                          <th className="px-4 py-2.5">Acknowledgement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {list.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-slate-400">No recipients delivered.</td></tr>
                        ) : list.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-slate-800">{r.name}</p>
                              <p className="text-[9px] text-slate-400">{r.employee_id} · {r.staff_type}</p>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{r.department}</td>
                            <td className="px-4 py-2.5">
                              {r.is_read ? (
                                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[10px] font-bold">Read {new Date(r.read_at!).toLocaleDateString('en-IN')}</span>
                              ) : (
                                <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">Unread</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {r.is_acknowledged ? (
                                <div className="space-y-0.5">
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Ack {new Date(r.acknowledged_at!).toLocaleDateString('en-IN')}</span>
                                  {r.acknowledgement_note && <p className="text-[9px] text-slate-500 italic max-w-xs truncate" title={r.acknowledgement_note}>"{r.acknowledgement_note}"</p>}
                                </div>
                              ) : c.requires_acknowledgement ? (
                                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">Pending</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Target Details</h3>
                {[
                  { label: 'Target Audience', val: AUDIENCE_CFG[c.target_audience] || c.target_audience },
                  { label: 'Department',      val: c.target_department || '—' },
                  { label: 'Priority',        val: null, badge: <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityCfg?.bg} ${priorityCfg?.color}`}>{priorityCfg?.icon} {priorityCfg?.label}</span> },
                  { label: 'Status',          val: null, badge: <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_CFG[c.status]?.bg} ${STATUS_CFG[c.status]?.color}`}>{STATUS_CFG[c.status]?.label}</span> },
                  { label: 'Recipients Count', val: c.total_recipients },
                  { label: 'Scheduled At',     val: c.scheduled_at || '—' },
                  { label: 'Requires Ack',     val: c.requires_acknowledgement ? 'Yes ✅' : 'No' },
                  { label: 'Ack Deadline',     val: c.acknowledge_deadline || '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0 text-xs">
                    <span className="text-slate-400 font-semibold">{row.label}</span>
                    {row.badge || <span className="font-bold text-slate-700">{row.val}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Megaphone className="w-5 h-5" /></span>
            Employee Communication Desk
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Send notices, policy updates, circulars, alerts, and track read rates and digital acknowledgements.</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'inbox',     label: '📥 Message Inbox',    count: inbox.filter(i => !i.is_read).length },
            { key: 'outbox',    label: '📤 Outbox Broadcaster' },
            { key: 'analytics', label: '📊 Stats Desk' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${tab === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB 1: INBOX (Personal Staff Inbox) ═══ */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          {loadingInbox ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-2xl">
              <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No broadcasts in your inbox.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inbox.map(item => {
                const typeCfg = COMM_TYPES[item.comm_type] || COMM_TYPES.general;
                const pCfg    = PRIORITY_CFG[item.priority] || PRIORITY_CFG.normal;
                return (
                  <div key={item.recipient_row_id} onClick={() => openInboxItem(item)}
                    className={`bg-white border hover:shadow-md rounded-2xl p-4 shadow-sm transition cursor-pointer group flex items-start gap-3.5 ${!item.is_read ? 'border-l-4 border-l-indigo-600 border-slate-200' : 'border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${typeCfg.bg} border border-slate-100`}>
                      {typeCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`text-sm truncate ${!item.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{item.title}</h3>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                        {item.requires_acknowledgement && !item.is_acknowledged && (
                          <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-rose-100">⚠️ Requires Ack</span>
                        )}
                        {item.is_acknowledged && (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">✓ Acknowledged</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mb-1">{item.body}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(item.sent_at || item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span className={`flex items-center gap-0.5 ${pCfg.color}`}>{pCfg.icon} {pCfg.label}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition shrink-0 self-center" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: OUTBOX BROADCASTER PANEL ═══ */}
      {tab === 'outbox' && (
        <div className="space-y-3">
          {/* Outbox KPI Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Total Messages', val: stats.total,     color: 'text-slate-700',   bg: 'bg-slate-50',    ring: 'ring-slate-200' },
                { label: 'Drafts',         val: stats.draft,     color: 'text-slate-500',   bg: 'bg-slate-100',   ring: 'ring-slate-200' },
                { label: 'Sent',           val: stats.sent,      color: 'text-emerald-700', bg: 'bg-emerald-50',  ring: 'ring-emerald-200' },
                { label: 'Scheduled',      val: stats.scheduled, color: 'text-amber-700',   bg: 'bg-amber-50',    ring: 'ring-amber-200' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 ring-1 ${s.ring} shadow-sm`}>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
                  <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Outbox filters & Compose button */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm">
              <option value="">All Status</option>
              {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
            </select>
            <select value={fType} onChange={e => setFType(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm capitalize">
              <option value="">All Types</option>
              {Object.keys(COMM_TYPES).map(t => <option key={t} value={t}>{COMM_TYPES[t].icon} {COMM_TYPES[t].label}</option>)}
            </select>
            <select value={fPriority} onChange={e => setFPriority(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm capitalize">
              <option value="">All Priority</option>
              {Object.keys(PRIORITY_CFG).map(p => <option key={p} value={p}>{PRIORITY_CFG[p].icon} {PRIORITY_CFG[p].label}</option>)}
            </select>
            <input type="text" placeholder="Search title or body..." value={fSearch} onChange={e => setFSearch(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 shadow-sm flex-1 min-w-32" />
            <button onClick={() => { setPage(1); loadOutbox(); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition hover:bg-indigo-700">
              <Filter className="w-3.5 h-3.5" /> Search
            </button>
            <button onClick={() => setComposeModal({ ...defaultForm })}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
              <Plus className="w-3.5 h-3.5" /> Compose Message
            </button>
          </div>

          {/* Outbox List */}
          {loadingOutbox ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : outbox.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-2xl">
              <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No broadcasts found. Create your first broadcast notification.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outbox.map(c => {
                const typeCfg = COMM_TYPES[c.comm_type] || COMM_TYPES.general;
                const pCfg    = PRIORITY_CFG[c.priority] || PRIORITY_CFG.normal;
                const reads   = c.recipient_stats?.read_count || 0;
                const acks    = c.recipient_stats?.ack_count || 0;
                const totalR  = c.total_recipients || 0;
                const readPct = totalR > 0 ? Math.round((reads / totalR) * 100) : 0;
                const ackPct  = totalR > 0 ? Math.round((acks / totalR) * 100) : 0;

                return (
                  <div key={c.id} onClick={() => loadOutboxDetail(c.id)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-4 shadow-sm transition cursor-pointer group flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${typeCfg.bg} border border-slate-100`}>
                      {typeCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{c.title}</h3>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CFG[c.status]?.bg} ${STATUS_CFG[c.status]?.color}`}>{STATUS_CFG[c.status]?.label}</span>
                        {c.requires_acknowledgement && <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">🔒 Req. Ack</span>}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">{c.body}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                        <span className="capitalize">Target: <strong>{c.target_audience.replace('_', ' ')}</strong></span>
                        {c.sent_at && <span>📅 Sent: {new Date(c.sent_at).toLocaleDateString('en-IN')}</span>}
                        {c.scheduled_at && <span className="text-amber-600 font-bold">⏰ Scheduled: {new Date(c.scheduled_at).toLocaleDateString('en-IN')}</span>}
                        <span className={`flex items-center gap-0.5 ${pCfg.color}`}>{pCfg.icon} {pCfg.label}</span>
                      </div>
                    </div>
                    {/* Mini analytics bar */}
                    {c.status === 'sent' && (
                      <div className="hidden sm:flex items-center gap-4 text-center shrink-0 border-l border-slate-100 pl-4 py-1">
                        <div>
                          <p className="text-xs font-black text-slate-700">{totalR}</p>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">Targets</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-sky-700">{readPct}%</p>
                          <p className="text-[8px] text-sky-400 uppercase font-bold">Read ({reads})</p>
                        </div>
                        {c.requires_acknowledgement && (
                          <div>
                            <p className="text-xs font-black text-emerald-700">{ackPct}%</p>
                            <p className="text-[8px] text-emerald-400 uppercase font-bold">Ack ({acks})</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {c.status !== 'sent' && (
                        <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition shrink-0 self-center" />
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">Page {page} of {pages} · {total} broadcasts</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 3: STATS & ANALYTICS DESK ═══ */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          {loadingAnalytics ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Top stats block */}
              {analytics.engagement && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
                    <Megaphone className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-black text-indigo-700">{analytics.engagement.total_delivered}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Messages Delivered</p>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center">
                    <BookOpen className="w-6 h-6 text-sky-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-black text-sky-700">
                      {analytics.engagement.total_delivered > 0 ? Math.round((analytics.engagement.total_read / analytics.engagement.total_delivered) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">Overall Read Rate ({analytics.engagement.total_read})</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-black text-emerald-700">
                      {analytics.engagement.total_delivered > 0 ? Math.round((analytics.engagement.total_ack / analytics.engagement.total_delivered) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Overall Ack Rate ({analytics.engagement.total_ack})</p>
                  </div>
                </div>
              )}

              {/* Low Ack alert warnings */}
              {analytics.alerts.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Urgent: Low Acknowledgement Broadcasts
                  </h3>
                  <div className="space-y-2">
                    {analytics.alerts.map(a => (
                      <div key={a.id} onClick={() => loadOutboxDetail(a.id)}
                        className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100 cursor-pointer hover:border-rose-300 transition">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                          <p className="text-[9px] text-slate-400">Sent on {new Date(a.sent_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <p className="text-xs font-black text-rose-600">{a.ack_rate}%</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Ack Rate ({a.ack_count} / {a.total_recipients})</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Communication Types */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Broadcasts by Type</h3>
                  {analytics.by_type.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2.5">
                      {analytics.by_type.map(t => {
                        const max = Math.max(...analytics.by_type.map(x => x.cnt));
                        const cfg = COMM_TYPES[t.comm_type] || COMM_TYPES.general;
                        return (
                          <div key={t.comm_type}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="font-bold text-slate-700 capitalize">{cfg.icon} {cfg.label}</span>
                              <span className="text-slate-400 font-bold">{t.cnt}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${cfg.color.replace('text-', 'bg-').replace('-700', '-400').replace('-600', '-400')} rounded-full`} style={{ width: `${(t.cnt / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Priority distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-rose-500" /> Broadcasts by Priority</h3>
                  {analytics.by_priority.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-3">
                      {['urgent', 'high', 'normal', 'low'].map(p => {
                        const d = analytics.by_priority.find(x => x.priority === p);
                        const total_cnt = analytics.by_priority.reduce((s, x) => s + x.cnt, 0);
                        const cnt = d?.cnt || 0;
                        const pct = total_cnt > 0 ? Math.round((cnt / total_cnt) * 100) : 0;
                        const cfg = PRIORITY_CFG[p];
                        return (
                          <div key={p}>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className={`${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                              <span className="text-slate-500">{cnt} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${cfg.color.replace('text-', 'bg-').replace('-700', '-400').replace('-600', '-400')} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ══════════ COMPOSE MESSAGE MODAL ══════════ */}
      {composeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold flex items-center gap-2"><Megaphone className="w-4.5 h-4.5 text-indigo-600" /> Compose Staff Broadcast</h3>
              <button onClick={() => setComposeModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCompose} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title / Subject *</label>
                <input required maxLength={250} value={composeModal.title || ''} onChange={e => setComposeModal((m: any) => ({ ...m, title: e.target.value }))}
                  placeholder="Summary of notice..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message Body *</label>
                <textarea required rows={5} value={composeModal.body || ''} onChange={e => setComposeModal((m: any) => ({ ...m, body: e.target.value }))}
                  placeholder="Type details of your circular, policy update, or general announcement..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Broadcast Type *</label>
                  <select required value={composeModal.comm_type} onChange={e => setComposeModal((m: any) => ({ ...m, comm_type: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {Object.keys(COMM_TYPES).map(t => <option key={t} value={t}>{COMM_TYPES[t].icon} {COMM_TYPES[t].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                  <select value={composeModal.priority} onChange={e => setComposeModal((m: any) => ({ ...m, priority: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {Object.keys(PRIORITY_CFG).map(p => <option key={p} value={p}>{PRIORITY_CFG[p].icon} {PRIORITY_CFG[p].label}</option>)}
                  </select>
                </div>
              </div>

              {/* Targeting audience settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Audience *</label>
                  <select required value={composeModal.target_audience} onChange={e => setComposeModal((m: any) => ({ ...m, target_audience: e.target.value, target_department: '', target_staff_ids: [] }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    {Object.keys(AUDIENCE_CFG).map(a => <option key={a} value={a}>{AUDIENCE_CFG[a]}</option>)}
                  </select>
                </div>
                {composeModal.target_audience === 'department' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Department *</label>
                    <select required value={composeModal.target_department || ''} onChange={e => setComposeModal((m: any) => ({ ...m, target_department: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                      <option value="">Choose department...</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                {composeModal.target_audience === 'individual' && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Target Staff ({selectedStaff.size}) *</label>
                    <input type="text" placeholder="Filter staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 mb-2" />
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white border border-slate-100 rounded-xl p-2">
                      {filteredStaff.map(s => {
                        const key = `${s.id}_${s.staff_type}`;
                        const selected = selectedStaff.has(key);
                        return (
                          <label key={key} className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${selected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={selected} onChange={() => {
                              const next = new Set(selectedStaff);
                              if (selected) next.delete(key); else next.add(key);
                              setSelectedStaff(next);
                            }} />
                            <span>{s.name} ({s.staff_type} · {s.department})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Acknowledge settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-150 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={composeModal.requires_acknowledgement} onChange={e => setComposeModal((m: any) => ({ ...m, requires_acknowledgement: e.target.checked }))} />
                  ⚠️ Require Digital Acknowledge
                </label>
                {composeModal.requires_acknowledgement && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Acknowledgement Deadline</label>
                    <input type="datetime-local" required onChange={e => {
                      const iso = e.target.value ? new Date(e.target.value).toISOString().slice(0, 19).replace('T', ' ') : '';
                      setComposeModal((m: any) => ({ ...m, acknowledge_deadline: iso }));
                    }} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                  </div>
                )}
              </div>

              {/* Meta attachments / links */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attachment Name</label>
                  <input value={composeModal.attachment_name || ''} onChange={e => setComposeModal((m: any) => ({ ...m, attachment_name: e.target.value }))}
                    placeholder="e.g. Handbook / Circular PDF" className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attachment URL</label>
                  <input value={composeModal.attachment_url || ''} onChange={e => setComposeModal((m: any) => ({ ...m, attachment_url: e.target.value }))}
                    placeholder="Link to file..." className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">External Link</label>
                  <input value={composeModal.external_link || ''} onChange={e => setComposeModal((m: any) => ({ ...m, external_link: e.target.value }))}
                    placeholder="https://..." className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
              </div>

              {/* Status control */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status" checked={composeModal.status === 'sent'} onChange={() => setComposeModal((m: any) => ({ ...m, status: 'sent', scheduled_at: null }))} />
                    Send Now
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status" checked={composeModal.status === 'draft'} onChange={() => setComposeModal((m: any) => ({ ...m, status: 'draft', scheduled_at: null }))} />
                    Save as Draft
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status" checked={composeModal.status === 'scheduled'} onChange={() => setComposeModal((m: any) => ({ ...m, status: 'scheduled' }))} />
                    Schedule
                  </label>
                </div>
                {composeModal.status === 'scheduled' && (
                  <div>
                    <input type="datetime-local" required onChange={e => {
                      const iso = e.target.value ? new Date(e.target.value).toISOString().slice(0, 19).replace('T', ' ') : '';
                      setComposeModal((m: any) => ({ ...m, scheduled_at: iso }));
                    }} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setComposeModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={composeBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {composeBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {composeModal.status === 'sent' ? 'Send Broadcast' : 'Save Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ EDIT MESSAGE MODAL ══════════ */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold">Edit Draft Broadcast</h3>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title / Subject *</label>
                <input required maxLength={250} value={editModal.title || ''} onChange={e => setEditModal((m: any) => ({ ...m, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message Body *</label>
                <textarea required rows={5} value={editModal.body || ''} onChange={e => setEditModal((m: any) => ({ ...m, body: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Broadcast Type *</label>
                  <select required value={editModal.comm_type} onChange={e => setEditModal((m: any) => ({ ...m, comm_type: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {Object.keys(COMM_TYPES).map(t => <option key={t} value={t}>{COMM_TYPES[t].icon} {COMM_TYPES[t].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                  <select value={editModal.priority} onChange={e => setEditModal((m: any) => ({ ...m, priority: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {Object.keys(PRIORITY_CFG).map(p => <option key={p} value={p}>{PRIORITY_CFG[p].icon} {PRIORITY_CFG[p].label}</option>)}
                  </select>
                </div>
              </div>

              {/* Targeting settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Audience *</label>
                  <select required value={editModal.target_audience} onChange={e => setEditModal((m: any) => ({ ...m, target_audience: e.target.value, target_department: '', target_staff_ids: [] }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                    {Object.keys(AUDIENCE_CFG).map(a => <option key={a} value={a}>{AUDIENCE_CFG[a]}</option>)}
                  </select>
                </div>
                {editModal.target_audience === 'department' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Department *</label>
                    <select required value={editModal.target_department || ''} onChange={e => setEditModal((m: any) => ({ ...m, target_department: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                {editModal.target_audience === 'individual' && (
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Target Staff ({selectedStaff.size}) *</label>
                    <input type="text" placeholder="Filter staff..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 mb-2" />
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-white border border-slate-100 rounded-xl p-2">
                      {filteredStaff.map(s => {
                        const key = `${s.id}_${s.staff_type}`;
                        const selected = selectedStaff.has(key);
                        return (
                          <label key={key} className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${selected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={selected} onChange={() => {
                              const next = new Set(selectedStaff);
                              if (selected) next.delete(key); else next.add(key);
                              setSelectedStaff(next);
                            }} />
                            <span>{s.name} ({s.staff_type} · {s.department})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Acknowledge settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-150 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={editModal.requires_acknowledgement} onChange={e => setEditModal((m: any) => ({ ...m, requires_acknowledgement: e.target.checked }))} />
                  ⚠️ Require Digital Acknowledge
                </label>
                {editModal.requires_acknowledgement && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Acknowledgement Deadline</label>
                    <input type="datetime-local" value={editModal.acknowledge_deadline ? new Date(editModal.acknowledge_deadline).toISOString().slice(0, 16) : ''}
                      onChange={e => {
                        const iso = e.target.value ? new Date(e.target.value).toISOString().slice(0, 19).replace('T', ' ') : '';
                        setEditModal((m: any) => ({ ...m, acknowledge_deadline: iso }));
                      }} className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                  </div>
                )}
              </div>

              {/* Meta attachments / links */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attachment Name</label>
                  <input value={editModal.attachment_name || ''} onChange={e => setEditModal((m: any) => ({ ...m, attachment_name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attachment URL</label>
                  <input value={editModal.attachment_url || ''} onChange={e => setEditModal((m: any) => ({ ...m, attachment_url: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">External Link</label>
                  <input value={editModal.external_link || ''} onChange={e => setEditModal((m: any) => ({ ...m, external_link: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
              </div>

              {/* Status control */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status_edit" checked={editModal.status === 'sent'} onChange={() => setEditModal((m: any) => ({ ...m, status: 'sent', scheduled_at: null }))} />
                    Send Now
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status_edit" checked={editModal.status === 'draft'} onChange={() => setEditModal((m: any) => ({ ...m, status: 'draft', scheduled_at: null }))} />
                    Save as Draft
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input type="radio" name="status_edit" checked={editModal.status === 'scheduled'} onChange={() => setEditModal((m: any) => ({ ...m, status: 'scheduled' }))} />
                    Schedule
                  </label>
                </div>
                {editModal.status === 'scheduled' && (
                  <div>
                    <input type="datetime-local" value={editModal.scheduled_at ? new Date(editModal.scheduled_at).toISOString().slice(0, 16) : ''}
                      onChange={e => {
                        const iso = e.target.value ? new Date(e.target.value).toISOString().slice(0, 19).replace('T', ' ') : '';
                        setEditModal((m: any) => ({ ...m, scheduled_at: iso }));
                      }} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={editBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {editBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
