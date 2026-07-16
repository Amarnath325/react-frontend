import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CreditCard, Users, Plus, Edit2, Trash2, Loader2, X, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, BarChart3, ArrowLeft, Save,
  RefreshCw, Filter, Copy, Printer, AlertCircle, TrendingUp,
  UserPlus, Zap, Activity, Calendar, Award
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface StaffMember {
  id: number; staff_type: string; name: string; employee_id: string;
  department: string | null; designation: string | null;
  blood_group: string | null; photo_url: string | null;
}

interface IDCard {
  id: number; school_id: number; staff_id: number; staff_type: string;
  staff_name: string; designation: string | null; department: string | null;
  employee_id: string | null; blood_group: string | null; photo_url: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  card_number: string; card_type: string; card_color: string;
  academic_year: string | null; issue_date: string | null; expiry_date: string | null;
  printed_at: string | null; issued_at: string | null;
  surrendered_at: string | null; lost_reported_at: string | null;
  status: string; replaces_card_id: number | null; remarks: string | null;
  created_at: string;
}

interface Stats {
  total: number; pending: number; printed: number; issued: number;
  expired: number; lost: number; surrendered: number;
}

interface Analytics {
  by_status: { status: string; cnt: number }[];
  by_type: { card_type: string; cnt: number }[];
  by_dept: { department: string; cnt: number; issued: number }[];
  expiring_soon: { id: number; staff_name: string; employee_id: string; department: string; card_number: string; expiry_date: string; status: string }[];
  by_month: { month: number; cnt: number }[];
}

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const CARD_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; gradient: string }> = {
  blue:   { bg: 'bg-blue-600',   border: 'border-blue-700',   text: 'text-white', accent: 'bg-blue-500',   gradient: 'from-blue-600 to-blue-800'   },
  green:  { bg: 'bg-emerald-600',border: 'border-emerald-700',text: 'text-white', accent: 'bg-emerald-500',gradient: 'from-emerald-600 to-emerald-800'},
  red:    { bg: 'bg-rose-600',   border: 'border-rose-700',   text: 'text-white', accent: 'bg-rose-500',   gradient: 'from-rose-600 to-rose-800'   },
  orange: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', accent: 'bg-orange-400', gradient: 'from-orange-500 to-orange-700' },
  purple: { bg: 'bg-violet-600', border: 'border-violet-700', text: 'text-white', accent: 'bg-violet-500', gradient: 'from-violet-600 to-violet-800' },
  black:  { bg: 'bg-slate-800',  border: 'border-slate-900',  text: 'text-white', accent: 'bg-slate-700',  gradient: 'from-slate-700 to-slate-900'  },
  teal:   { bg: 'bg-teal-600',   border: 'border-teal-700',   text: 'text-white', accent: 'bg-teal-500',   gradient: 'from-teal-600 to-teal-800'   },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-100',   icon: <Clock className="w-3 h-3" />         },
  printed:    { label: 'Printed',    color: 'text-sky-700',    bg: 'bg-sky-100',     icon: <Printer className="w-3 h-3" />       },
  issued:     { label: 'Issued',     color: 'text-emerald-700',bg: 'bg-emerald-100', icon: <CheckCircle2 className="w-3 h-3" />  },
  expired:    { label: 'Expired',    color: 'text-slate-600',  bg: 'bg-slate-100',   icon: <AlertCircle className="w-3 h-3" />   },
  lost:       { label: 'Lost',       color: 'text-rose-700',   bg: 'bg-rose-100',    icon: <AlertTriangle className="w-3 h-3" /> },
  surrendered:{ label: 'Surrendered',color: 'text-orange-700', bg: 'bg-orange-100',  icon: <ArrowLeft className="w-3 h-3" />     },
  replaced:   { label: 'Replaced',   color: 'text-violet-700', bg: 'bg-violet-100',  icon: <RefreshCw className="w-3 h-3" />     },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100',     icon: <X className="w-3 h-3" />             },
};

const CARD_TYPES  = ['regular', 'duplicate', 'replacement', 'temporary'];
const CARD_COLORS_LIST = ['blue', 'green', 'red', 'orange', 'purple', 'black', 'teal'];
const STATUSES    = ['pending', 'printed', 'issued', 'expired', 'lost', 'surrendered', 'replaced', 'cancelled'];
const MONTHS      = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
  { key: 'cards',     label: '🪪 Cards'      },
  { key: 'analytics', label: '📊 Analytics'  },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ══════════════════════════════════════════════════════════
   HELPER COMPONENTS
══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const ini = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['bg-violet-100 text-violet-700', 'bg-indigo-100 text-indigo-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];
  const c = cols[(name || ' ').charCodeAt(0) % cols.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-9 h-9 text-xs';
  return <div className={`${sz} rounded-full ${c} flex items-center justify-center font-black shrink-0`}>{ini}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color} ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   ID CARD VISUAL COMPONENT
══════════════════════════════════════════════════════════ */
function IDCardPreview({ card, schoolName = 'School' }: { card: Partial<IDCard>; schoolName?: string }) {
  const cc = CARD_COLORS[card.card_color || 'blue'];
  const name = card.staff_name || 'Staff Name';
  const ini = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`w-72 h-44 rounded-2xl bg-gradient-to-br ${cc.gradient} shadow-2xl overflow-hidden relative shrink-0`}
      style={{ fontFamily: 'system-ui' }}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div>
          <p className="text-white/90 font-black text-[10px] uppercase tracking-widest">{schoolName}</p>
          <p className="text-white/60 text-[8px]">Staff Identity Card</p>
        </div>
        <div className="bg-white/20 rounded-full px-2 py-0.5">
          <p className="text-white text-[9px] font-bold">{card.card_type?.toUpperCase() || 'REGULAR'}</p>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        {/* Photo / Avatar */}
        {card.photo_url ? (
          <img src={card.photo_url} alt={name} className="w-14 h-14 rounded-xl object-cover border-2 border-white/40 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/25 border-2 border-white/40 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl">{ini}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm truncate">{name}</p>
          <p className="text-white/75 text-[10px] truncate">{card.designation || 'Staff'}</p>
          <p className="text-white/60 text-[9px] truncate">{card.department || '—'}</p>
          <div className="flex items-center gap-2 mt-1">
            {card.blood_group && <span className="bg-rose-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{card.blood_group}</span>}
            {card.academic_year && <span className="bg-white/20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{card.academic_year}</span>}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm">
        <div>
          <p className="text-white/50 text-[7px] uppercase">Card No.</p>
          <p className="text-white font-black text-[10px] tracking-wider">{card.card_number || 'ID000000'}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-[7px] uppercase">Emp. ID</p>
          <p className="text-white font-bold text-[10px]">{card.employee_id || '—'}</p>
        </div>
        {card.expiry_date && (
          <div className="text-right">
            <p className="text-white/50 text-[7px] uppercase">Valid Upto</p>
            <p className="text-white font-bold text-[10px]">{card.expiry_date}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DEFAULT FORM STATE
══════════════════════════════════════════════════════════ */
const defaultCard = { card_type: 'regular', card_color: 'blue', academic_year: new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1).slice(2) };

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function IDCardManagement() {
  const [tab, setTab] = useState<TabKey>('cards');

  /* Masters */
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [withoutCard, setWithoutCard] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);

  /* List */
  const [cards, setCards] = useState<IDCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* Filters */
  const [fStatus, setFStatus]     = useState('');
  const [fType, setFType]         = useState('');
  const [fDept, setFDept]         = useState('');
  const [fSearch, setFSearch]     = useState('');

  /* Selected for bulk */
  const [selected, setSelected] = useState<Set<number>>(new Set());

  /* Modals */
  const [issueModal, setIssueModal]   = useState<any | null>(null);
  const [issueBusy, setIssueBusy]     = useState(false);
  const [editModal, setEditModal]     = useState<any | null>(null);
  const [editBusy, setEditBusy]       = useState(false);
  const [statusModal, setStatusModal] = useState<any | null>(null);
  const [statusBusy, setStatusBusy]   = useState(false);
  const [replaceModal, setReplaceModal] = useState<IDCard | null>(null);
  const [replaceBusy, setReplaceBusy]   = useState(false);
  const [replaceForm, setReplaceForm]   = useState({ card_type: 'replacement', reason: '', expiry_date: '', card_color: 'blue' });
  const [bulkModal, setBulkModal]     = useState(false);
  const [bulkBusy, setBulkBusy]       = useState(false);
  const [bulkForm, setBulkForm]       = useState({ staff_type: 'Teacher', academic_year: defaultCard.academic_year, expiry_date: '', card_color: 'blue' });
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkSearch, setBulkSearch]   = useState('');
  const [previewCard, setPreviewCard] = useState<IDCard | null>(null);

  /* Analytics */
  const [analytics, setAnalytics]     = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /* ─── Load Masters ─── */
  const loadMasters = useCallback(() => {
    api.get('/school/id-cards/masters').then(res => {
      if (res.data.success) {
        setStaff(res.data.staff || []);
        setStats(res.data.stats);
        setWithoutCard(res.data.without_card);
        setDepartments(res.data.departments || []);
      }
    });
  }, []);

  useEffect(() => { loadMasters(); }, [loadMasters]);

  /* ─── Load Cards ─── */
  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { per_page: 20, page };
      if (fStatus) params.status     = fStatus;
      if (fType)   params.card_type  = fType;
      if (fDept)   params.department = fDept;
      if (fSearch) params.search     = fSearch;
      const res = await api.get('/school/id-cards', { params });
      if (res.data.success) {
        setCards(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
        setPages(res.data.meta?.last_page || 1);
      }
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  }, [page, fStatus, fType, fDept, fSearch]);

  useEffect(() => { if (tab === 'cards') loadCards(); }, [tab, loadCards]);

  /* ─── Load Analytics ─── */
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/school/id-cards/analytics');
      if (res.data.success) setAnalytics(res.data);
    } catch { toast.error('Failed'); }
    finally { setLoadingAnalytics(false); }
  }, []);

  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  /* ─── Issue Single Card ─── */
  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModal) return;
    setIssueBusy(true);
    try {
      const res = await api.post('/school/id-cards', issueModal);
      if (res.data.success) {
        toast.success(res.data.message);
        setIssueModal(null);
        loadCards(); loadMasters();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setIssueBusy(false); }
  };

  /* ─── Edit Card ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditBusy(true);
    try {
      await api.put(`/school/id-cards/${editModal.id}`, editModal);
      toast.success('Card updated');
      setEditModal(null); loadCards();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEditBusy(false); }
  };

  /* ─── Change Status ─── */
  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;
    setStatusBusy(true);
    try {
      const res = await api.post(`/school/id-cards/${statusModal.id}/status`, { status: statusModal.newStatus, remarks: statusModal.remarks });
      if (res.data.success) {
        toast.success(res.data.message);
        setStatusModal(null); loadCards(); loadMasters();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setStatusBusy(false); }
  };

  /* ─── Replace Card ─── */
  const handleReplace = async () => {
    if (!replaceModal) return;
    setReplaceBusy(true);
    try {
      const res = await api.post(`/school/id-cards/${replaceModal.id}/replace`, replaceForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setReplaceModal(null); loadCards(); loadMasters();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setReplaceBusy(false); }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this card record?')) return;
    try { await api.delete(`/school/id-cards/${id}`); toast.success('Deleted'); loadCards(); loadMasters(); }
    catch { toast.error('Failed'); }
  };

  /* ─── Bulk Status ─── */
  const handleBulkStatus = async (newStatus: string) => {
    if (selected.size === 0 || !confirm(`Mark ${selected.size} card(s) as "${newStatus}"?`)) return;
    try {
      const res = await api.post('/school/id-cards/bulk-status', { ids: Array.from(selected), status: newStatus });
      if (res.data.success) { toast.success(res.data.message); setSelected(new Set()); loadCards(); loadMasters(); }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  /* ─── Bulk Issue ─── */
  const handleBulkIssue = async () => {
    if (bulkSelected.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await api.post('/school/id-cards/bulk-issue', {
        ...bulkForm, staff_ids: Array.from(bulkSelected),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setBulkModal(false); setBulkSelected(new Set());
        loadCards(); loadMasters();
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBulkBusy(false); }
  };

  /* ─── Select all / toggle ─── */
  const toggleAll = () => {
    if (selected.size === cards.length) setSelected(new Set());
    else setSelected(new Set(cards.map(c => c.id)));
  };

  /* ─── Staff without card for bulk issue ─── */
  const activeCardStaffIds = new Set(
    cards.filter(c => ['pending', 'printed', 'issued'].includes(c.status)).map(c => c.staff_id)
  );
  const staffForBulk = staff.filter(s => s.staff_type === bulkForm.staff_type && !activeCardStaffIds.has(s.id));
  const filteredBulkStaff = staffForBulk.filter(s =>
    !bulkSearch || s.name.toLowerCase().includes(bulkSearch.toLowerCase()) || (s.department || '').toLowerCase().includes(bulkSearch.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════
     CARD PREVIEW MODAL
  ══════════════════════════════════════════════════════════ */
  if (previewCard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setPreviewCard(null)} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-base font-bold text-slate-900">ID Card Preview — {previewCard.staff_name}</h2>
          <StatusBadge status={previewCard.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Visual */}
          <div className="flex flex-col items-center gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold text-center mb-3">Front Side</p>
              <IDCardPreview card={previewCard} />
            </div>

            {/* Back side */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold text-center mb-3">Back Side</p>
              <div className="w-72 h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 shadow-xl overflow-hidden relative p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Emergency Contact</p>
                  <p className="text-xs font-bold text-slate-700">{previewCard.emergency_contact_name || '—'}</p>
                  <p className="text-xs text-slate-600">{previewCard.emergency_contact_phone || '—'}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[8px] text-slate-400 leading-relaxed">
                    If found, please return to the school office. This card is the property of the school.
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase">Issued</p>
                    <p className="text-[10px] font-bold text-slate-700">{previewCard.issued_at || previewCard.issue_date || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400 uppercase">Valid Upto</p>
                    <p className="text-[10px] font-bold text-slate-700">{previewCard.expiry_date || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap justify-center">
              {!['issued', 'expired', 'surrendered', 'replaced', 'cancelled'].includes(previewCard.status) && (
                <button onClick={() => {
                  setStatusModal({ id: previewCard.id, newStatus: previewCard.status === 'pending' ? 'printed' : 'issued', remarks: '' });
                  setPreviewCard(null);
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark {previewCard.status === 'pending' ? 'Printed' : 'Issued'}
                </button>
              )}
              <button onClick={() => { setEditModal(previewCard); setPreviewCard(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              {['issued', 'printed'].includes(previewCard.status) && (
                <button onClick={() => { setReplaceModal(previewCard); setReplaceForm({ card_type: 'replacement', reason: '', expiry_date: '', card_color: previewCard.card_color }); setPreviewCard(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-violet-700 transition">
                  <RefreshCw className="w-3.5 h-3.5" /> Replace Card
                </button>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Card Details</h3>
            {[
              { label: 'Card Number',   val: previewCard.card_number },
              { label: 'Card Type',     val: previewCard.card_type },
              { label: 'Academic Year', val: previewCard.academic_year || '—' },
              { label: 'Staff',         val: `${previewCard.staff_name} (${previewCard.staff_type})` },
              { label: 'Employee ID',   val: previewCard.employee_id || '—' },
              { label: 'Designation',   val: previewCard.designation || '—' },
              { label: 'Department',    val: previewCard.department || '—' },
              { label: 'Blood Group',   val: previewCard.blood_group || '—' },
              { label: 'Issue Date',    val: previewCard.issue_date || '—' },
              { label: 'Expiry Date',   val: previewCard.expiry_date || '—' },
              { label: 'Printed On',    val: previewCard.printed_at || '—' },
              { label: 'Issued On',     val: previewCard.issued_at || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                <span className="text-[10px] text-slate-400 font-semibold">{row.label}</span>
                <span className="text-xs font-bold text-slate-700 capitalize">{row.val}</span>
              </div>
            ))}
            {previewCard.remarks && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Remarks</p>
                <p className="text-xs text-slate-600">{previewCard.remarks}</p>
              </div>
            )}
          </div>
        </div>
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
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CreditCard className="w-5 h-5" /></span>
            ID Card Allocation Desk
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Issue, track, and manage staff ID cards — print, distribute, replace, and monitor expiry.</p>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${tab === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: 'Total',       val: stats.total,       color: 'text-slate-700',   bg: 'bg-slate-50',    ring: 'ring-slate-200'   },
            { label: 'Pending',     val: stats.pending,     color: 'text-amber-700',   bg: 'bg-amber-50',    ring: 'ring-amber-200'   },
            { label: 'Printed',     val: stats.printed,     color: 'text-sky-700',     bg: 'bg-sky-50',      ring: 'ring-sky-200'     },
            { label: 'Issued',      val: stats.issued,      color: 'text-emerald-700', bg: 'bg-emerald-50',  ring: 'ring-emerald-200' },
            { label: 'Expired',     val: stats.expired,     color: 'text-slate-500',   bg: 'bg-slate-50',    ring: 'ring-slate-200'   },
            { label: 'Lost',        val: stats.lost,        color: 'text-rose-700',    bg: 'bg-rose-50',     ring: 'ring-rose-200'    },
            { label: 'Surrendered', val: stats.surrendered, color: 'text-orange-700',  bg: 'bg-orange-50',   ring: 'ring-orange-200'  },
            { label: 'No Card',     val: withoutCard,       color: 'text-violet-700',  bg: 'bg-violet-50',   ring: 'ring-violet-200'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 ring-1 ${s.ring} shadow-sm`}>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB: CARDS ═══ */}
      {tab === 'cards' && (
        <div className="space-y-3">
          {/* Filters + Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center">
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
            </select>
            <select value={fType} onChange={e => setFType(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm capitalize">
              <option value="">All Types</option>
              {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={fDept} onChange={e => setFDept(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 shadow-sm">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="text" placeholder="Search name / emp ID / card no..." value={fSearch} onChange={e => setFSearch(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 shadow-sm flex-1 min-w-32" />
            <button onClick={() => { setPage(1); loadCards(); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition hover:bg-indigo-700">
              <Filter className="w-3.5 h-3.5" /> Search
            </button>

            <div className="flex gap-1 ml-auto">
              <button onClick={() => { setBulkModal(true); setBulkSelected(new Set()); setBulkSearch(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                <UserPlus className="w-3.5 h-3.5" /> Bulk Issue
              </button>
              <button onClick={() => setIssueModal({ ...defaultCard })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                <Plus className="w-3.5 h-3.5" /> Issue Card
              </button>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-indigo-700">{selected.size} selected</span>
              {[
                { label: '🖨 Mark Printed', status: 'printed', color: 'bg-sky-600 hover:bg-sky-700 text-white' },
                { label: '✅ Mark Issued',  status: 'issued',  color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                { label: '❌ Mark Lost',    status: 'lost',    color: 'bg-rose-600 hover:bg-rose-700 text-white' },
                { label: '↩ Surrendered',   status: 'surrendered', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
              ].map(a => (
                <button key={a.status} onClick={() => handleBulkStatus(a.status)} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${a.color}`}>{a.label}</button>
              ))}
              <button onClick={() => setSelected(new Set())} className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded-lg transition ml-auto">Clear</button>
            </div>
          )}

          {/* Cards grid */}
          {loading ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : cards.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200 rounded-xl">
              <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No ID cards found. Issue cards to get started.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={selected.size === cards.length && cards.length > 0} onChange={toggleAll} />
                  Select All ({cards.length})
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map(card => {
                  const cc = CARD_COLORS[card.card_color] || CARD_COLORS.blue;
                  const isSelected = selected.has(card.id);
                  const daysToExpiry = card.expiry_date ? Math.floor((new Date(card.expiry_date).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <div key={card.id}
                      className={`bg-white rounded-2xl shadow-sm border-2 transition overflow-hidden group ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
                      {/* Colored top stripe */}
                      <div className={`h-2 bg-gradient-to-r ${cc.gradient}`} />
                      <div className="p-3">
                        {/* Top row */}
                        <div className="flex items-start gap-2 mb-2">
                          <input type="checkbox" checked={isSelected} onChange={() => {
                            const next = new Set(selected);
                            if (isSelected) next.delete(card.id); else next.add(card.id);
                            setSelected(next);
                          }} className="mt-0.5 shrink-0" />
                          <Avatar name={card.staff_name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{card.staff_name}</p>
                            <p className="text-[9px] text-slate-400">{card.employee_id} · {card.designation || card.staff_type}</p>
                            <p className="text-[9px] text-slate-400 truncate">{card.department || '—'}</p>
                          </div>
                          <StatusBadge status={card.status} />
                        </div>

                        {/* Card info */}
                        <div className={`bg-gradient-to-r ${cc.gradient} rounded-xl px-3 py-2 mb-2`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white/60 text-[8px] uppercase">Card No.</p>
                              <p className="text-white font-black text-[11px] tracking-wider">{card.card_number}</p>
                            </div>
                            {card.blood_group && <span className="bg-rose-500/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">{card.blood_group}</span>}
                            <div className="text-right">
                              <p className="text-white/60 text-[8px] uppercase">Type</p>
                              <p className="text-white font-bold text-[10px] capitalize">{card.card_type}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 mb-2">
                          {card.issue_date && <span>📅 {card.issue_date}</span>}
                          {card.expiry_date && (
                            <span className={daysToExpiry !== null && daysToExpiry < 30 ? 'text-rose-600 font-bold' : ''}>
                              ⏳ Exp: {card.expiry_date}
                              {daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry < 30 && ` (${daysToExpiry}d)`}
                              {daysToExpiry !== null && daysToExpiry < 0 && ' (Expired)'}
                            </span>
                          )}
                          {card.academic_year && <span>📚 {card.academic_year}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 pt-2 border-t border-slate-50">
                          <button onClick={() => setPreviewCard(card)}
                            className="flex-1 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center justify-center gap-1">
                            <CreditCard className="w-3 h-3" /> Preview
                          </button>
                          <button onClick={() => setStatusModal({ id: card.id, newStatus: '', remarks: '' })}
                            className="flex-1 py-1 text-[10px] font-bold text-violet-600 hover:bg-violet-50 rounded-lg transition flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" /> Status
                          </button>
                          <button onClick={() => setEditModal(card)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          {['issued', 'printed'].includes(card.status) && (
                            <button onClick={() => { setReplaceModal(card); setReplaceForm({ card_type: 'replacement', reason: '', expiry_date: '', card_color: card.card_color }); }}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><RefreshCw className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelete(card.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Page {page} of {pages} · {total} cards</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">← Prev</button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-30 hover:bg-slate-50 transition">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: ANALYTICS ═══ */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={loadAnalytics} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-indigo-700 transition">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {loadingAnalytics ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* By Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-500" /> By Status</h3>
                  {analytics.by_status.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-2">
                      {analytics.by_status.map(s => {
                        const max = Math.max(...analytics.by_status.map(x => x.cnt));
                        const sc = STATUS_CFG[s.status] || { label: s.status, color: 'text-slate-600', bg: 'bg-slate-100', icon: null };
                        return (
                          <div key={s.status}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className={`font-bold ${sc.color}`}>{sc.label}</span>
                              <span className="text-slate-400">{s.cnt}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${sc.color.replace('text-', 'bg-').replace('-700', '-400').replace('-600', '-400').replace('-500', '-400')} rounded-full`} style={{ width: `${(s.cnt / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Card Type */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-violet-500" /> By Card Type</h3>
                  {analytics.by_type.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No data</p> : (
                    <div className="space-y-3">
                      {analytics.by_type.map(t => {
                        const total_cnt = analytics.by_type.reduce((s, x) => s + x.cnt, 0);
                        const pct = total_cnt > 0 ? Math.round((t.cnt / total_cnt) * 100) : 0;
                        const cols = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-amber-500'];
                        const idx = CARD_TYPES.indexOf(t.card_type);
                        return (
                          <div key={t.card_type}>
                            <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700 capitalize">{t.card_type}</span><span className="text-slate-400">{t.cnt} ({pct}%)</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${cols[idx % cols.length]} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Expiring Soon */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Expiring in 30 Days ({analytics.expiring_soon.length})</h3>
                  {analytics.expiring_soon.length === 0 ? (
                    <div className="text-center py-4"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" /><p className="text-xs text-emerald-600">No cards expiring soon!</p></div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {analytics.expiring_soon.map(c => {
                        const days = Math.floor((new Date(c.expiry_date).getTime() - Date.now()) / 86400000);
                        return (
                          <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-rose-100">
                            <Avatar name={c.staff_name} size="sm" />
                            <div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-slate-800 truncate">{c.staff_name}</p><p className="text-[9px] text-slate-400">{c.card_number}</p></div>
                            <span className={`text-[9px] font-black shrink-0 ${days <= 7 ? 'text-rose-700' : 'text-amber-700'}`}>{days}d</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* By Department */}
              {analytics.by_dept.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-sky-500" /> Cards by Department</h3>
                  <div className="space-y-2">
                    {analytics.by_dept.map(d => {
                      const max = Math.max(...analytics.by_dept.map(x => x.cnt));
                      const issuedPct = d.cnt > 0 ? (d.issued / d.cnt) * 100 : 0;
                      return (
                        <div key={d.department} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-700 w-32 truncate shrink-0">{d.department}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${issuedPct * (d.cnt / max)}%` }} />
                            <div className="h-full bg-indigo-300 rounded-full" style={{ width: `${(100 - issuedPct) * (d.cnt / max)}%` }} />
                          </div>
                          <div className="flex gap-2 text-[9px] shrink-0">
                            <span className="text-emerald-700 font-bold">{d.issued} issued</span>
                            <span className="text-slate-400">/ {d.cnt} total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 text-[9px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm inline-block" />Issued</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-300 rounded-sm inline-block" />Pending/Other</span>
                  </div>
                </div>
              )}

              {/* Monthly issued trend */}
              {analytics.by_month.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Monthly Cards Issued — {new Date().getFullYear()}</h3>
                  <div className="flex items-end gap-1.5 h-24">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const d = analytics.by_month.find(x => x.month === month);
                      const maxVal = Math.max(...analytics.by_month.map(x => x.cnt), 1);
                      const h = d ? Math.max(4, (d.cnt / maxVal) * 80) : 2;
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full rounded-t-lg transition-all ${d && d.cnt > 0 ? 'bg-gradient-to-t from-indigo-600 to-violet-500' : 'bg-slate-100'}`} style={{ height: `${h}px` }} />
                          {d && d.cnt > 0 && <span className="text-[8px] text-indigo-700 font-bold">{d.cnt}</span>}
                          <span className="text-[8px] text-slate-400">{MONTHS[month]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ══════════ ISSUE CARD MODAL ══════════ */}
      {issueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Issue New ID Card</h3>
              <button onClick={() => setIssueModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Live preview */}
            <div className="px-6 pt-4 flex justify-center">
              <IDCardPreview card={{
                ...issueModal,
                staff_name: staff.find(s => s.id === issueModal.staff_id && s.staff_type === issueModal.staff_type)?.name || 'Staff Name',
                designation: staff.find(s => s.id === issueModal.staff_id && s.staff_type === issueModal.staff_type)?.designation || issueModal.designation,
                department: staff.find(s => s.id === issueModal.staff_id && s.staff_type === issueModal.staff_type)?.department || issueModal.department,
                employee_id: staff.find(s => s.id === issueModal.staff_id && s.staff_type === issueModal.staff_type)?.employee_id || issueModal.employee_id,
                blood_group: staff.find(s => s.id === issueModal.staff_id && s.staff_type === issueModal.staff_type)?.blood_group || issueModal.blood_group,
              }} />
            </div>

            <form onSubmit={handleIssue} className="p-6 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Member *</label>
                <select required value={issueModal.staff_id ? `${issueModal.staff_id}_${issueModal.staff_type}` : ''} onChange={e => {
                  if (!e.target.value) return;
                  const [id, type] = e.target.value.split('_');
                  const s = staff.find(x => x.id === parseInt(id) && x.staff_type === type);
                  setIssueModal((m: any) => ({ ...m, staff_id: parseInt(id), staff_type: type, blood_group: s?.blood_group || m.blood_group }));
                }} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                  <option value="">Select staff member...</option>
                  {staff.map(s => <option key={`${s.id}_${s.staff_type}`} value={`${s.id}_${s.staff_type}`}>{s.name} ({s.staff_type} · {s.department})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Type</label>
                  <select value={issueModal.card_type || 'regular'} onChange={e => setIssueModal((m: any) => ({ ...m, card_type: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Color</label>
                  <select value={issueModal.card_color || 'blue'} onChange={e => setIssueModal((m: any) => ({ ...m, card_color: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {CARD_COLORS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                  <input value={issueModal.academic_year || ''} onChange={e => setIssueModal((m: any) => ({ ...m, academic_year: e.target.value }))} placeholder="e.g. 2025-26"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Group</label>
                  <input value={issueModal.blood_group || ''} onChange={e => setIssueModal((m: any) => ({ ...m, blood_group: e.target.value }))} placeholder="A+, B-, O+"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Issue Date</label>
                  <input type="date" value={issueModal.issue_date || ''} onChange={e => setIssueModal((m: any) => ({ ...m, issue_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                  <input type="date" value={issueModal.expiry_date || ''} onChange={e => setIssueModal((m: any) => ({ ...m, expiry_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Contact</label>
                  <input value={issueModal.emergency_contact_name || ''} onChange={e => setIssueModal((m: any) => ({ ...m, emergency_contact_name: e.target.value }))} placeholder="Name"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Phone</label>
                  <input value={issueModal.emergency_contact_phone || ''} onChange={e => setIssueModal((m: any) => ({ ...m, emergency_contact_phone: e.target.value }))} placeholder="Phone"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                <textarea rows={2} value={issueModal.remarks || ''} onChange={e => setIssueModal((m: any) => ({ ...m, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIssueModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={issueBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {issueBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Issue Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ EDIT CARD MODAL ══════════ */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold">Edit Card — {editModal.card_number}</h3>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Color</label>
                  <select value={editModal.card_color || 'blue'} onChange={e => setEditModal((m: any) => ({ ...m, card_color: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {CARD_COLORS_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Group</label>
                  <input value={editModal.blood_group || ''} onChange={e => setEditModal((m: any) => ({ ...m, blood_group: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                  <input value={editModal.academic_year || ''} onChange={e => setEditModal((m: any) => ({ ...m, academic_year: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                  <input type="date" value={editModal.expiry_date || ''} onChange={e => setEditModal((m: any) => ({ ...m, expiry_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Contact</label>
                  <input value={editModal.emergency_contact_name || ''} onChange={e => setEditModal((m: any) => ({ ...m, emergency_contact_name: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Emergency Phone</label>
                  <input value={editModal.emergency_contact_phone || ''} onChange={e => setEditModal((m: any) => ({ ...m, emergency_contact_phone: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                <textarea rows={2} value={editModal.remarks || ''} onChange={e => setEditModal((m: any) => ({ ...m, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setEditModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={editBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {editBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ STATUS MODAL ══════════ */}
      {statusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">Update Card Status</h3>
              <button onClick={() => setStatusModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleChangeStatus} className="p-5 space-y-3">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Status *</label>
                <select required value={statusModal.newStatus} onChange={e => setStatusModal((m: any) => ({ ...m, newStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400">
                  <option value="">Select...</option>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
                </select></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                <textarea rows={2} value={statusModal.remarks || ''} onChange={e => setStatusModal((m: any) => ({ ...m, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setStatusModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={statusBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50">
                  {statusBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ REPLACE CARD MODAL ══════════ */}
      {replaceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold">Replace Card — {replaceModal.card_number}</h3>
              <button onClick={() => setReplaceModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This will mark the current card as <strong>Replaced</strong> and issue a new card for <strong>{replaceModal.staff_name}</strong>.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Card Type</label>
                  <select value={replaceForm.card_type} onChange={e => setReplaceForm(f => ({ ...f, card_type: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {['duplicate', 'replacement', 'temporary'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Color</label>
                  <select value={replaceForm.card_color} onChange={e => setReplaceForm(f => ({ ...f, card_color: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-400 capitalize">
                    {CARD_COLORS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Expiry Date</label>
                <input type="date" value={replaceForm.expiry_date} onChange={e => setReplaceForm(f => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</label>
                <textarea rows={2} value={replaceForm.reason} onChange={e => setReplaceForm(f => ({ ...f, reason: e.target.value }))} placeholder="Lost, damaged, name change..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button type="button" onClick={() => setReplaceModal(null)} className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleReplace} disabled={replaceBusy} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {replaceBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Replace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ BULK ISSUE MODAL ══════════ */}
      {bulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold flex items-center gap-2"><UserPlus className="w-4 h-4 text-violet-500" /> Bulk Issue Cards</h3>
              <button onClick={() => setBulkModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-5 py-3 border-b border-slate-50 grid grid-cols-2 gap-2">
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Staff Type</label>
                <select value={bulkForm.staff_type} onChange={e => { setBulkForm(f => ({ ...f, staff_type: e.target.value })); setBulkSelected(new Set()); }}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400">
                  <option value="Teacher">Teachers</option><option value="NonTeaching">Non-Teaching</option>
                </select></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
                <input value={bulkForm.academic_year} onChange={e => setBulkForm(f => ({ ...f, academic_year: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400" /></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Color</label>
                <select value={bulkForm.card_color} onChange={e => setBulkForm(f => ({ ...f, card_color: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-violet-400 capitalize">
                  {CARD_COLORS_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                <input type="date" value={bulkForm.expiry_date} onChange={e => setBulkForm(f => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400" /></div>
            </div>
            <div className="px-4 py-2 border-b border-slate-50 flex items-center gap-2">
              <input type="text" placeholder="Search staff..." value={bulkSearch} onChange={e => setBulkSearch(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400" />
              <button onClick={() => {
                if (bulkSelected.size === filteredBulkStaff.length) setBulkSelected(new Set());
                else setBulkSelected(new Set(filteredBulkStaff.map(s => s.id)));
              }} className="text-[10px] text-violet-600 font-bold px-2 py-1 bg-violet-50 rounded-lg hover:bg-violet-100 transition">
                {bulkSelected.size === filteredBulkStaff.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredBulkStaff.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {staff.filter(s => s.staff_type === bulkForm.staff_type).length === 0 ? 'No staff found.' : 'All staff already have active cards.'}
                </div>
              ) : filteredBulkStaff.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition border ${bulkSelected.has(s.id) ? 'bg-violet-50 border-violet-200' : 'border-transparent hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={bulkSelected.has(s.id)} onChange={() => {
                    const next = new Set(bulkSelected);
                    if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                    setBulkSelected(next);
                  }} />
                  <Avatar name={s.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{s.name}</p>
                    <p className="text-[9px] text-slate-400">{s.department} · {s.designation || s.staff_type}</p>
                  </div>
                  {s.blood_group && <span className="text-[9px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">{s.blood_group}</span>}
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{bulkSelected.size} of {filteredBulkStaff.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setBulkModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleBulkIssue} disabled={bulkBusy || bulkSelected.size === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
                  {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Issue {bulkSelected.size > 0 ? `(${bulkSelected.size})` : ''} Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
