import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  GraduationCap,
  UserCheck,
  UserX,
  Award,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Check,
  X,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface Teacher {
  id: number;
  employee_id: string;
  qualification: string;
  specialization: string;
  experience_years: number;
  joining_date: string;
  department: string;
  salary: number;
  is_class_teacher: boolean;
  assigned_class_id: number | null;
  assigned_class_name: string | null;
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

const O = {
  department: ['Science', 'English', 'Mathematics', 'Administration', 'Social Studies', 'Hindi', 'Sanskrit', 'Physical Education', 'Computer Science', 'Art & Craft', 'Music & Dance', 'Other']
};

const PAGE_SIZE = 10;

export default function TeacherManagement() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [alert, setAlert]         = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);

  const [search, setSearch]       = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]           = useState(1);

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selected, setSelected]   = useState<Teacher | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/teachers');
      if (res.data.success) {
        setTeachers(res.data.data || []);
      }
    } catch {
      showAlert('err', 'Failed to load teaching staff');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openAdd = () => {
    navigate('/teachers/employee-master/add');
  };

  const openEdit = (t: Teacher) => {
    navigate(`/teachers/employee-master/edit/${t.id}`);
  };

  const openView = (t: Teacher) => {
    navigate(`/teachers/employee-master/view/${t.id}`);
  };

  const openDelete = (t: Teacher) => {
    setSelected(t);
    setDeleteModal(true);
  };

  const handleToggle = async (t: Teacher) => {
    try {
      const res = await api.patch(`/school/teachers/${t.id}/toggle-status`);
      if (res.data.success) {
        showAlert('ok', 'Status updated successfully');
        fetchTeachers();
      }
    } catch {
      showAlert('err', 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/school/teachers/${selected.id}`);
      if (res.data.success) {
        showAlert('ok', 'Teacher record deleted successfully');
        setDeleteModal(false);
        setSelected(null);
        fetchTeachers();
      }
    } catch {
      showAlert('err', 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = teachers.filter(t => {
    const fn = `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.toLowerCase();
    const code = (t.employee_id || '').toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const dept = (t.department || '').toLowerCase();
    const matchesSearch = !search ||
      fn.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      dept.includes(search.toLowerCase());

    const matchesDept = !filterDept || t.department === filterDept;

    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = t.is_active;
    else if (filterStatus === 'inactive') matchesStatus = !t.is_active;
    else if (filterStatus === 'ct') matchesStatus = t.is_class_teacher;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          alert.type === 'err'
            ? 'bg-rose-50 border-rose-100 text-rose-700'
            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
        }`}>
          <span className="text-sm">{alert.type === 'err' ? '⚠️' : '✅'}</span>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* ════════════ HEADER ROW ════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span>Teaching Staff Management</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Manage all teaching staff records, qualifications, departments, and class assignments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTeachers} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
            <Plus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      {/* ════════════ METRIC CARDS ════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: GraduationCap, label: 'Total Teachers', value: teachers.length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: UserCheck, label: 'Active', value: teachers.filter(e => e.is_active).length, bg: 'bg-sky-50', text: 'text-sky-600' },
          { icon: UserX, label: 'Inactive', value: teachers.filter(e => !e.is_active).length, bg: 'bg-rose-50', text: 'text-rose-600' },
          { icon: ShieldCheck, label: 'Class Teachers', value: teachers.filter(e => e.is_class_teacher).length, bg: 'bg-purple-50', text: 'text-purple-600' },
          { icon: BookOpen, label: 'Departments', value: Array.from(new Set(teachers.map(e => e.department).filter(Boolean))).length, bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg ${s.bg} ${s.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════ CONTROLS ════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
            placeholder="Search by name, employee code, email, or department..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={filterDept}
            onChange={e => { setFilterDept(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {O.department.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="ct">Class Teachers</option>
          </select>
        </div>
      </div>

      {/* ════════════ TABLE SECTION ════════════ */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {teachers.length === 0 ? 'No teaching staff records added yet' : 'No matching teachers found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {teachers.length === 0 ? 'Click "Add Teacher" to register the first teaching staff member' : 'Try adjusting your search criteria or filter selections'}
          </p>
          {teachers.length === 0 && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" />
              <span>Add First Teacher</span>
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
                  <th className="py-3 px-4">Teacher Details</th>
                  <th className="py-3 px-4">Emp Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {paginated.map((t, idx) => {
                  const fn = `${t.user?.first_name ?? ''} ${t.user?.last_name ?? ''}`.trim() || 'N/A';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {fn.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-850 block hover:text-emerald-600 transition cursor-pointer" onClick={() => openView(t)}>
                              {fn}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{t.user?.email}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">📱 {t.user?.mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">{t.employee_id || '—'}</td>
                      <td className="py-3 px-4">
                        {t.department ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-sky-50 text-sky-700 border border-sky-100">
                            {t.department}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700 block">{t.qualification || '—'}</span>
                        {t.specialization && (
                          <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{t.specialization}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">
                        {t.experience_years != null ? `${t.experience_years} Yrs` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {t.joining_date ? new Date(t.joining_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {t.salary ? `₹${Number(t.salary).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          t.is_class_teacher
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-slate-100 text-slate-650'
                        }`}>
                          {t.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                        </span>
                        {t.is_class_teacher && t.assigned_class_name && (
                          <span className="block text-[9px] text-purple-500 mt-0.5 font-semibold">
                            {t.assigned_class_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                          t.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openView(t)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-650 transition"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-650 transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(t)}
                            className={`p-1 hover:bg-slate-100 rounded transition ${
                              t.is_active ? 'text-slate-400 hover:text-rose-650' : 'text-slate-400 hover:text-emerald-650'
                            }`}
                            title={t.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {t.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => openDelete(t)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-650 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ════════════ PAGINATION ROW ════════════ */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} teachers
            </span>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
                .map((pg, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pg - prev > 1;
                  return (
                    <React.Fragment key={pg}>
                      {showEllipsis && <span className="text-slate-400 px-1 text-xs">...</span>}
                      <button
                        className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${
                          pg === page
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ CONFIRM DELETE MODAL ════════════ */}
      {deleteModal && selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to permanently remove <strong className="text-slate-700">{selected.user?.first_name} {selected.user?.last_name}</strong>?
              </p>
              <p className="text-[10px] text-slate-400 mt-1">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
