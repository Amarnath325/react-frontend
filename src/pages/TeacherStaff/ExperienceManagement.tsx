import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  Briefcase, Search, Plus, Trash2, Edit3, Eye, RefreshCw, X,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Shield,
  Building2, Calendar, RotateCcw, Archive, MapPin
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface Experience {
  id: number;
  school_id: number;
  staff_id: number;
  staff_type: string;
  organization_name: string;
  designation: string | null;
  department: string | null;
  employment_type: string | null;
  from_date: string;
  to_date: string | null;
  is_current: boolean;
  last_salary: number | null;
  responsibilities: string | null;
  leaving_reason: string | null;
  reference_person: string | null;
  reference_contact: string | null;
  remarks: string | null;
  is_verified: boolean;
  is_active: boolean;
  staff_name?: string;
  staff_employee_id?: string;
  computed_duration?: string;
  created_at?: string;
  deleted_at?: string | null;
}

interface StaffOption {
  id: number; name: string; employee_id: string; type: string; label: string;
}

const EMP_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'freelance', label: 'Freelance' },
];

const EMP_TYPE_COLORS: Record<string, string> = {
  full_time: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  part_time: 'bg-sky-50 text-sky-700 border-sky-100',
  contract: 'bg-amber-50 text-amber-700 border-amber-100',
  intern: 'bg-violet-50 text-violet-700 border-violet-100',
  freelance: 'bg-orange-50 text-orange-700 border-orange-100',
};

const PAGE_SIZE = 10;

export default function ExperienceManagement() {
  const [items, setItems] = useState<Experience[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch] = useState('');
  const [filterEmpType, setFilterEmpType] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [page, setPage] = useState(1);
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);
  const [viewItem, setViewItem] = useState<Experience | null>(null);
  const [deleteItem, setDeleteItem] = useState<Experience | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [form, setForm] = useState({
    staff_id: '', staff_type: '', organization_name: '', designation: '', department: '',
    employment_type: 'full_time', from_date: '', to_date: '', is_current: false,
    last_salary: '', responsibilities: '', leaving_reason: '',
    reference_person: '', reference_contact: '', remarks: '',
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlertMsg = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (showTrashed) params.only_trashed = true;
      const res = await api.get('/school/staff-experiences', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch { showAlertMsg('err', 'Failed to load experience records'); }
    finally { setLoading(false); }
  }, [showAlertMsg, showTrashed]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/school/staff-experiences/staff-list');
      if (res.data.success) setStaffList(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchItems(); setSelectedIds(new Set()); setPage(1); }, [fetchItems]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ════════ FORM HELPERS ════════ */
  const resetForm = () => setForm({
    staff_id: '', staff_type: '', organization_name: '', designation: '', department: '',
    employment_type: 'full_time', from_date: '', to_date: '', is_current: false,
    last_salary: '', responsibilities: '', leaving_reason: '',
    reference_person: '', reference_contact: '', remarks: '',
  });

  const openAdd = () => { setEditingItem(null); resetForm(); setShowModal(true); };

  const openEdit = (exp: Experience) => {
    setEditingItem(exp);
    setForm({
      staff_id: exp.staff_id.toString(), staff_type: exp.staff_type,
      organization_name: exp.organization_name, designation: exp.designation || '',
      department: exp.department || '', employment_type: exp.employment_type || 'full_time',
      from_date: exp.from_date?.split('T')[0] || '', to_date: exp.to_date?.split('T')[0] || '',
      is_current: exp.is_current, last_salary: exp.last_salary?.toString() || '',
      responsibilities: exp.responsibilities || '', leaving_reason: exp.leaving_reason || '',
      reference_person: exp.reference_person || '', reference_contact: exp.reference_contact || '',
      remarks: exp.remarks || '',
    });
    setShowModal(true);
  };

  const handleStaffSelect = (val: string) => {
    if (!val) { setForm(p => ({ ...p, staff_id: '', staff_type: '' })); return; }
    const [id, type] = val.split('|');
    setForm(p => ({ ...p, staff_id: id, staff_type: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id || !form.organization_name || !form.from_date) {
      showAlertMsg('err', 'Please fill all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = {
        staff_id: parseInt(form.staff_id), staff_type: form.staff_type,
        organization_name: form.organization_name,
        designation: form.designation || null, department: form.department || null,
        employment_type: form.employment_type || null,
        from_date: form.from_date, to_date: form.is_current ? null : (form.to_date || null),
        is_current: form.is_current, last_salary: form.last_salary ? parseFloat(form.last_salary) : null,
        responsibilities: form.responsibilities || null, leaving_reason: form.leaving_reason || null,
        reference_person: form.reference_person || null, reference_contact: form.reference_contact || null,
        remarks: form.remarks || null,
      };
      if (editingItem) {
        const res = await api.put(`/school/staff-experiences/${editingItem.id}`, payload);
        if (res.data.success) showAlertMsg('ok', 'Experience updated');
      } else {
        const res = await api.post('/school/staff-experiences', payload);
        if (res.data.success) showAlertMsg('ok', 'Experience added');
      }
      setShowModal(false); fetchItems();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleVerify = async (exp: Experience) => {
    try {
      const res = await api.patch(`/school/staff-experiences/${exp.id}/verify`);
      if (res.data.success) { showAlertMsg('ok', res.data.message); fetchItems(); }
    } catch { showAlertMsg('err', 'Verification failed'); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/staff-experiences/${deleteItem.id}`);
      if (res.data.success) { showAlertMsg('ok', 'Deleted'); setShowDeleteModal(false); fetchItems(); }
    } catch { showAlertMsg('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore = async (id: number) => {
    try { const res = await api.post(`/school/staff-experiences/${id}/restore`); if (res.data.success) { showAlertMsg('ok', 'Restored'); fetchItems(); } } catch { showAlertMsg('err', 'Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete? This cannot be undone.')) return;
    try { const res = await api.delete(`/school/staff-experiences/${id}/force`); if (res.data.success) { showAlertMsg('ok', 'Permanently deleted'); fetchItems(); } } catch { showAlertMsg('err', 'Failed'); }
  };

  /* ════════ BULK OPS ════════ */
  const toggleSelectAll = () => { selectedIds.size === paginated.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(paginated.map(i => i.id))); };
  const toggleSelect = (id: number) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };

  const bulkDelete = async (force = false) => {
    if (selectedIds.size === 0) return;
    if (!confirm(force ? 'Permanently delete selected?' : 'Delete selected?')) return;
    try { const res = await api.post('/school/staff-experiences/bulk-delete', { ids: Array.from(selectedIds), force }); if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); } } catch { showAlertMsg('err', 'Failed'); }
  };

  const bulkRestore = async () => {
    if (selectedIds.size === 0) return;
    try { const res = await api.post('/school/staff-experiences/bulk-restore', { ids: Array.from(selectedIds) }); if (res.data.success) { showAlertMsg('ok', res.data.message); setSelectedIds(new Set()); fetchItems(); } } catch { showAlertMsg('err', 'Failed'); }
  };

  /* ════════ HELPERS ════════ */
  const empTypeLabel = (v: string) => EMP_TYPES.find(t => t.value === v)?.label || v || '—';
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatSalary = (v: number | null) => v ? '₹' + v.toLocaleString('en-IN') : '—';

  // Compute total experience from all records
  const totalMonths = items.reduce((acc, exp) => {
    const from = new Date(exp.from_date);
    const to = exp.is_current ? new Date() : (exp.to_date ? new Date(exp.to_date) : from);
    const diff = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    return acc + Math.max(diff, 0);
  }, 0);
  const totalYears = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = items.filter(exp => {
    const matchSearch = !search ||
      exp.organization_name.toLowerCase().includes(search.toLowerCase()) ||
      (exp.designation || '').toLowerCase().includes(search.toLowerCase()) ||
      (exp.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (exp.staff_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (exp.staff_employee_id || '').toLowerCase().includes(search.toLowerCase());
    const matchEmpType = !filterEmpType || exp.employment_type === filterEmpType;
    let matchVerified = true;
    if (filterVerified === 'verified') matchVerified = exp.is_verified;
    else if (filterVerified === 'unverified') matchVerified = !exp.is_verified;
    return matchSearch && matchEmpType && matchVerified;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Briefcase className="w-5 h-5" /></span>
            <span>Experience History Registry</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Track and verify past employment records of teaching and non-teaching staff</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTrashed(!showTrashed)} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Show Active' : 'Trashed'}</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showTrashed && (
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>Add Experience</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════ METRIC CARDS ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Briefcase, label: 'Total Records', value: items.length, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { icon: Building2, label: 'Organizations', value: new Set(items.map(i => i.organization_name)).size, bg: 'bg-sky-50', text: 'text-sky-600' },
          { icon: Calendar, label: 'Total Experience', value: `${totalYears}y ${remainingMonths}m`, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: CheckCircle2, label: 'Verified', value: items.filter(i => i.is_verified).length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: Clock, label: 'Currently Working', value: items.filter(i => i.is_current).length, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
              </div>
              <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}><Icon className="w-3.5 h-3.5" /></div>
            </div>
          );
        })}
      </div>

      {/* ═══════ CONTROLS ═══════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
            placeholder="Search by organization, designation, staff name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
            value={filterEmpType} onChange={e => { setFilterEmpType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="w-full sm:w-32 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
            value={filterVerified} onChange={e => { setFilterVerified(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* ═══════ BULK ACTIONS ═══════ */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-indigo-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-indigo-200" />
          {showTrashed ? (
            <>
              <button onClick={bulkRestore} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restore</button>
              <button onClick={() => bulkDelete(true)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Permanent Delete</button>
            </>
          ) : (
            <button onClick={() => bulkDelete(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-white transition"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ═══════ TABLE ═══════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3"><Briefcase className="w-6 h-6" /></div>
          <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? (showTrashed ? 'No trashed records' : 'No experience records yet') : 'No matching records'}</h3>
          <p className="text-xs text-slate-500 mt-1">{items.length === 0 && !showTrashed ? 'Click "Add Experience" to create the first record' : 'Try adjusting your filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition"><Plus className="w-4 h-4" /> Add First Record</button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-3 w-10"><input type="checkbox" className="rounded border-slate-300" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} /></th>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Last Salary</th>
                  <th className="py-3 px-4 text-center">Verified</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((exp, idx) => (
                  <tr key={exp.id} className={`hover:bg-slate-50/30 transition-colors ${selectedIds.has(exp.id) ? 'bg-indigo-50/40' : ''}`}>
                    <td className="py-3 px-3"><input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(exp.id)} onChange={() => toggleSelect(exp.id)} /></td>
                    <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{exp.staff_name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{exp.staff_employee_id}</span>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${exp.staff_type === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {exp.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{exp.organization_name}</span>
                      {exp.department && <span className="text-[10px] text-slate-400 block mt-0.5">{exp.department}</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{exp.designation || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${EMP_TYPE_COLORS[exp.employment_type || ''] || 'bg-slate-100 text-slate-600'}`}>
                        {empTypeLabel(exp.employment_type || '')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-600 block font-mono">{formatDate(exp.from_date)}</span>
                      <span className="text-[11px] block font-mono">{exp.is_current ? <span className="text-emerald-600 font-bold">Present</span> : <span className="text-slate-500">{formatDate(exp.to_date)}</span>}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-600">{exp.computed_duration || '—'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{formatSalary(exp.last_salary)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${exp.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {exp.is_verified ? <><CheckCircle2 className="w-3 h-3" /> Verified</> : <><XCircle className="w-3 h-3" /> Pending</>}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {showTrashed ? (
                          <>
                            <button onClick={() => handleRestore(exp.id)} className="p-1 hover:bg-emerald-50 rounded text-slate-400 hover:text-emerald-600 transition" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleForceDelete(exp.id)} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition" title="Permanently Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setViewItem(exp); setShowView(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleVerify(exp)} className={`p-1 hover:bg-slate-100 rounded transition ${exp.is_verified ? 'text-emerald-500 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}`} title={exp.is_verified ? 'Unverify' : 'Verify'}><Shield className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openEdit(exp)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setDeleteItem(exp); setShowDeleteModal(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const prev = arr[idx - 1]; const showEllipsis = prev && pg - prev > 1;
                return (<React.Fragment key={pg}>{showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}<button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button></React.Fragment>);
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD/EDIT MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-600" /> {editingItem ? 'Edit Experience' : 'Add Experience'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Staff + Organization */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> Employment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff Member <span className="text-rose-500">*</span></label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={form.staff_id ? `${form.staff_id}|${form.staff_type}` : ''} onChange={e => handleStaffSelect(e.target.value)} required disabled={!!editingItem}>
                      <option value="">Select Staff Member</option>
                      {staffList.map(s => <option key={`${s.id}-${s.type}`} value={`${s.id}|${s.type}`}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Organization Name <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Delhi Public School" value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Senior Teacher" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Science Department" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employment Type</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))}>
                      {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Last Salary (₹)</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      min="0" placeholder="e.g. 35000" value={form.last_salary} onChange={e => setForm(p => ({ ...p, last_salary: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Calendar className="w-3 h-3" /> Duration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date <span className="text-rose-500">*</span></label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={form.from_date} onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={form.to_date} onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))} disabled={form.is_current} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_current} onChange={e => setForm(p => ({ ...p, is_current: e.target.checked, to_date: e.target.checked ? '' : p.to_date }))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700">Currently Working</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsibilities</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    rows={2} placeholder="Key responsibilities..." value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Leaving</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Better opportunity" value={form.leaving_reason} onChange={e => setForm(p => ({ ...p, leaving_reason: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference Person</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Name of reference" value={form.reference_person} onChange={e => setForm(p => ({ ...p, reference_person: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference Contact</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Phone / Email" value={form.reference_contact} onChange={e => setForm(p => ({ ...p, reference_contact: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ VIEW MODAL ═══════ */}
      {showView && viewItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-600" /> Experience Details</h3>
              <button onClick={() => setShowView(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Header card */}
              <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{viewItem.organization_name}</h4>
                  <p className="text-[11px] text-slate-500">{viewItem.designation || 'N/A'} {viewItem.department ? `· ${viewItem.department}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {viewItem.employment_type && <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${EMP_TYPE_COLORS[viewItem.employment_type]}`}>{empTypeLabel(viewItem.employment_type)}</span>}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${viewItem.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {viewItem.is_verified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                    {viewItem.is_current && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-100">Currently Working</span>}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Staff Member', viewItem.staff_name],
                  ['Staff Type', viewItem.staff_type === 'teacher' ? 'Teaching' : 'Non-Teaching'],
                  ['From Date', formatDate(viewItem.from_date)],
                  ['To Date', viewItem.is_current ? 'Present' : formatDate(viewItem.to_date)],
                  ['Duration', viewItem.computed_duration],
                  ['Last Salary', formatSalary(viewItem.last_salary)],
                  ['Leaving Reason', viewItem.leaving_reason],
                  ['Reference Person', viewItem.reference_person],
                  ['Reference Contact', viewItem.reference_contact],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {viewItem.responsibilities && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Responsibilities</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.responsibilities}</p>
                </div>
              )}
              {viewItem.remarks && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Remarks</span>
                  <p className="text-xs text-slate-700 mt-1">{viewItem.remarks}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowView(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE MODAL ═══════ */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Delete Experience Record</h3>
              <p className="text-xs text-slate-500 mt-2">Delete <strong className="text-slate-700">{deleteItem.organization_name}</strong> record for {deleteItem.staff_name}?</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
