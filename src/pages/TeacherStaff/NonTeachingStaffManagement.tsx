import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  Wrench,
  UserCheck,
  UserX,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Check,
  X,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface Staff {
  id: number;
  employee_id: string;
  designation: string | null;
  department: string | null;
  qualification: string | null;
  role_category: string | null;
  experience_years: number;
  joining_date: string | null;
  salary: number | null;
  shift: string | null;
  responsibilities: string | null;
  is_active: boolean;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    gender: string;
    date_of_birth: string;
    address: string;
    is_active: boolean;
  };
}

const ROLE_CATEGORIES = ['Administrative', 'Support', 'Maintenance', 'Security', 'Transport', 'Housekeeping', 'Lab Assistant', 'IT Support', 'Library', 'Accounts', 'Other'];
const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'General', 'Rotational'];
const DEPARTMENTS = ['Administration', 'Accounts', 'Library', 'IT', 'Maintenance', 'Security', 'Transport', 'Housekeeping', 'Laboratory', 'Sports', 'Other'];

const PAGE_SIZE = 10;

export default function NonTeachingStaffManagement() {
  const [staff, setStaff]           = useState<Staff[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [alert, setAlert]           = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]         = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [page, setPage]             = useState(1);

  // Modal States
  const [showModal, setShowModal]   = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem]   = useState<Staff | null>(null);
  const [viewingItem, setViewingItem]   = useState<Staff | null>(null);
  const [selectedDelete, setSelectedDelete] = useState<Staff | null>(null);

  // Form State
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', mobile: '', gender: '',
    date_of_birth: '', address: '',
    employee_id: '', designation: '', department: '', qualification: '',
    role_category: '', experience_years: '', joining_date: '', salary: '',
    shift: '', responsibilities: '', is_active: true,
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlertMsg = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/non-teaching-staff');
      if (res.data.success) setStaff(res.data.data || []);
    } catch {
      showAlertMsg('err', 'Failed to load non-teaching staff');
    } finally {
      setLoading(false);
    }
  }, [showAlertMsg]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ════════ FORM HELPERS ════════ */
  const resetForm = () => setForm({
    first_name: '', last_name: '', email: '', mobile: '', gender: '',
    date_of_birth: '', address: '',
    employee_id: '', designation: '', department: '', qualification: '',
    role_category: '', experience_years: '', joining_date: '', salary: '',
    shift: '', responsibilities: '', is_active: true,
  });

  const openAdd = () => { setEditingItem(null); resetForm(); setShowModal(true); };

  const openEdit = (s: Staff) => {
    setEditingItem(s);
    setForm({
      first_name: s.user?.first_name || '',
      last_name: s.user?.last_name || '',
      email: s.user?.email || '',
      mobile: s.user?.mobile || '',
      gender: s.user?.gender || '',
      date_of_birth: s.user?.date_of_birth ? s.user.date_of_birth.split('T')[0] : '',
      address: s.user?.address || '',
      employee_id: s.employee_id || '',
      designation: s.designation || '',
      department: s.department || '',
      qualification: s.qualification || '',
      role_category: s.role_category || '',
      experience_years: s.experience_years?.toString() || '',
      joining_date: s.joining_date || '',
      salary: s.salary?.toString() || '',
      shift: s.shift || '',
      responsibilities: s.responsibilities || '',
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const openView = (s: Staff) => { setViewingItem(s); setShowViewModal(true); };

  const openDelete = (s: Staff) => { setSelectedDelete(s); setShowDeleteModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.email || !form.mobile || !form.employee_id) {
      showAlertMsg('err', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_data: {
          first_name: form.first_name,
          last_name: form.last_name || null,
          email: form.email,
          mobile: form.mobile,
          gender: form.gender || null,
          date_of_birth: form.date_of_birth || null,
          address: form.address || null,
        },
        staff_data: {
          employee_id: form.employee_id,
          designation: form.designation || null,
          department: form.department || null,
          qualification: form.qualification || null,
          role_category: form.role_category || null,
          experience_years: form.experience_years ? parseInt(form.experience_years) : 0,
          joining_date: form.joining_date || null,
          salary: form.salary ? parseFloat(form.salary) : null,
          shift: form.shift || null,
          responsibilities: form.responsibilities || null,
          is_active: form.is_active,
        },
      };

      if (editingItem) {
        const res = await api.put(`/school/non-teaching-staff/${editingItem.id}`, payload);
        if (res.data.success) showAlertMsg('ok', 'Staff member updated successfully');
      } else {
        const res = await api.post('/school/non-teaching-staff', payload);
        if (res.data.success) showAlertMsg('ok', 'Staff member created successfully');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      showAlertMsg('err', err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s: Staff) => {
    try {
      const res = await api.patch(`/school/non-teaching-staff/${s.id}/toggle-status`);
      if (res.data.success) { showAlertMsg('ok', 'Status updated'); fetchStaff(); }
    } catch { showAlertMsg('err', 'Failed to toggle status'); }
  };

  const handleDelete = async () => {
    if (!selectedDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/non-teaching-staff/${selectedDelete.id}`);
      if (res.data.success) {
        showAlertMsg('ok', 'Staff member deleted');
        setShowDeleteModal(false);
        setSelectedDelete(null);
        fetchStaff();
      }
    } catch { showAlertMsg('err', 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  /* ════════ FILTER + PAGINATE ════════ */
  const filtered = staff.filter(s => {
    const fn = `${s.user?.first_name ?? ''} ${s.user?.last_name ?? ''}`.toLowerCase();
    const code = (s.employee_id || '').toLowerCase();
    const email = (s.user?.email || '').toLowerCase();
    const desg = (s.designation || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();
    const matchesSearch = !search ||
      fn.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      desg.includes(search.toLowerCase()) ||
      dept.includes(search.toLowerCase());
    const matchesCat = !filterCategory || s.role_category === filterCategory;
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = s.is_active;
    else if (filterStatus === 'inactive') matchesStatus = !s.is_active;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ════════ UI ════════ */
  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
        }`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* ════════════ HEADER ════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </span>
            <span>Non-Teaching Staff Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage administrative, support, maintenance, security, and other non-teaching staff records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStaff} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" /><span>Refresh</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
            <Plus className="w-4 h-4" /><span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* ════════════ METRIC CARDS ════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: Wrench, label: 'Total Staff', value: staff.length, bg: 'bg-orange-50', text: 'text-orange-600' },
          { icon: UserCheck, label: 'Active', value: staff.filter(e => e.is_active).length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: UserX, label: 'Inactive', value: staff.filter(e => !e.is_active).length, bg: 'bg-rose-50', text: 'text-rose-600' },
          { icon: Briefcase, label: 'Categories', value: Array.from(new Set(staff.map(e => e.role_category).filter(Boolean))).length, bg: 'bg-sky-50', text: 'text-sky-600' },
          { icon: Clock, label: 'Shifts', value: Array.from(new Set(staff.map(e => e.shift).filter(Boolean))).length, bg: 'bg-purple-50', text: 'text-purple-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg ${s.bg} ${s.text}`}><Icon className="w-4 h-4" /></div>
            </div>
          );
        })}
      </div>

      {/* ════════════ CONTROLS ════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm"
            placeholder="Search by name, employee code, email, designation, or department..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
            value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {ROLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ════════════ TABLE ════════════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {staff.length === 0 ? 'No non-teaching staff records added yet' : 'No matching staff found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {staff.length === 0 ? 'Click "Add Staff" to register the first non-teaching staff member' : 'Try adjusting your search or filters'}
          </p>
          {staff.length === 0 && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>Add First Staff Member</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Staff Details</th>
                  <th className="py-3 px-4">Emp Code</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((s, idx) => {
                  const fn = `${s.user?.first_name ?? ''} ${s.user?.last_name ?? ''}`.trim() || 'N/A';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {fn.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-850 block hover:text-orange-600 transition cursor-pointer" onClick={() => openView(s)}>{fn}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{s.user?.email}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">📱 {s.user?.mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{s.employee_id || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{s.designation || '—'}</td>
                      <td className="py-3 px-4">
                        {s.role_category ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-sky-50 text-sky-700 border border-sky-100">{s.role_category}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {s.department ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-violet-50 text-violet-700 border border-violet-100">{s.department}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {s.shift ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-100">{s.shift}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-orange-600 font-bold">
                        {s.experience_years != null ? `${s.experience_years} Yrs` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {s.salary ? `₹${Number(s.salary).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                          s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openView(s)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-orange-650 transition" title="View"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(s)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-650 transition" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleToggle(s)} className={`p-1 hover:bg-slate-100 rounded transition ${s.is_active ? 'text-slate-400 hover:text-rose-650' : 'text-slate-400 hover:text-emerald-650'}`} title={s.is_active ? 'Deactivate' : 'Activate'}>
                            {s.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => openDelete(s)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-650 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} staff members
            </span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                .map((pg, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pg - prev > 1;
                  return (
                    <React.Fragment key={pg}>
                      {showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}
                      <button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button>
                    </React.Fragment>
                  );
                })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ ADD / EDIT MODAL ════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                {editingItem ? 'Edit Staff Member' : 'Add Non-Teaching Staff'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Personal Information */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">First Name <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="Enter first name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Last Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="Enter last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email <span className="text-rose-500">*</span></label>
                    <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="Enter email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="Enter mobile number" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 cursor-pointer" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" rows={2} placeholder="Enter address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Employment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee ID <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="e.g. NTS-001" value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="e.g. Office Assistant" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role Category</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 cursor-pointer" value={form.role_category} onChange={e => setForm(p => ({ ...p, role_category: e.target.value }))}>
                      <option value="">Select Category</option>
                      {ROLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 cursor-pointer" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qualification</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="e.g. 12th Pass" value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Experience (Years)</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" min="0" placeholder="0" value={form.experience_years} onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Joining Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" value={form.joining_date} onChange={e => setForm(p => ({ ...p, joining_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Salary (₹)</label>
                    <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" min="0" step="0.01" placeholder="0.00" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shift</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 cursor-pointer" value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}>
                      <option value="">Select Shift</option>
                      {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                      <span className="text-xs font-semibold text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsibilities</label>
                  <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" rows={2} placeholder="Describe key responsibilities..." value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : editingItem ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ VIEW MODAL ════════════ */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-600" /> Staff Profile
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-50 border-2 border-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center flex-shrink-0">
                  {`${viewingItem.user?.first_name ?? ''}`.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{viewingItem.user?.first_name} {viewingItem.user?.last_name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{viewingItem.user?.email}</p>
                  <p className="text-[11px] text-slate-500 font-mono">📱 {viewingItem.user?.mobile}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Employee ID', viewingItem.employee_id],
                  ['Designation', viewingItem.designation],
                  ['Department', viewingItem.department],
                  ['Category', viewingItem.role_category],
                  ['Qualification', viewingItem.qualification],
                  ['Experience', viewingItem.experience_years != null ? `${viewingItem.experience_years} Years` : null],
                  ['Joining Date', viewingItem.joining_date ? new Date(viewingItem.joining_date).toLocaleDateString('en-IN') : null],
                  ['Salary', viewingItem.salary ? `₹${Number(viewingItem.salary).toLocaleString('en-IN')}` : null],
                  ['Shift', viewingItem.shift],
                  ['Status', viewingItem.is_active ? 'Active' : 'Inactive'],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5">{value || '—'}</span>
                  </div>
                ))}
              </div>
              {viewingItem.responsibilities && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Responsibilities</span>
                  <p className="text-xs text-slate-700 mt-1">{viewingItem.responsibilities}</p>
                </div>
              )}
              {viewingItem.user?.address && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Address</span>
                  <p className="text-xs text-slate-700 mt-1">{viewingItem.user.address}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => { setShowViewModal(false); openEdit(viewingItem); }} className="px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition">Edit</button>
              <button onClick={() => setShowViewModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ DELETE MODAL ════════════ */}
      {showDeleteModal && selectedDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to remove <strong className="text-slate-700">{selectedDelete.user?.first_name} {selectedDelete.user?.last_name}</strong>?
              </p>
              <p className="text-[10px] text-slate-400 mt-1">This action cannot be undone.</p>
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
