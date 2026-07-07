import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Edit3, Trash2, Plus, XCircle, RefreshCw, Save,
  ChevronRight, ChevronLeft, User, Tag, Users, CheckCircle,
  ClipboardList, BarChart3, AlertCircle, Check, X,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Category {
  m_id: number;
  m_group: string;
  m_name: string;
  m_alias_name: string | null;
  m_description: string | null;
  m_type: string | null;
}

interface StudentItem {
  id: number;
  full_name: string;
  admission_number: string;
  roll_number: string;
  class_name: string;
  section: string;
  category: string | null;
  photo_url: string | null;
  user: { email: string; mobile: string; is_active: boolean } | null;
  father_name: string | null;
  father_mobile: string | null;
}

// ─── Category Form Modal ──────────────────────────────────────────────────
function CategoryFormModal({
  category,
  onClose,
  onSuccess,
}: {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    m_name:        category?.m_name        ?? '',
    m_alias_name:  category?.m_alias_name  ?? '',
    m_description: category?.m_description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.m_name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/school/masters/${category!.m_id}`, form);
        toast.success('Category updated!');
      } else {
        await api.post('/school/masters', { ...form, m_group: 'CATEGORY' });
        toast.success('Category created!');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? e.response?.data?.errors?.m_name?.[0] ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">{isEdit ? 'Edit Category' : 'Add New Category'}</h3>
              <p className="text-[10px] text-gray-400 font-medium">Student classification master</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none">
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Category Name <span className="text-red-500">*</span></label>
            <input
              value={form.m_name}
              onChange={e => set('m_name', e.target.value)}
              placeholder="e.g. General, OBC, SC, ST, EWS"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-purple-400 bg-white transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Short Code / Alias</label>
            <input
              value={form.m_alias_name}
              onChange={e => set('m_alias_name', e.target.value)}
              placeholder="e.g. GEN, OBC, SC"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-purple-400 bg-white transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Description / Notes</label>
            <textarea
              value={form.m_description}
              onChange={e => set('m_description', e.target.value)}
              placeholder="Optional description about this category..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-purple-400 bg-white transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-transparent transition outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-60 cursor-pointer border-none outline-none"
          >
            <Save size={12} /> {saving ? 'Saving…' : isEdit ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────
function ConfirmDelete({ category, onClose, onConfirm }: { category: Category; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1300 }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Delete Category</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Are you sure you want to delete <strong>"{category.m_name}"</strong>? Students assigned to this category will lose their classification.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-[11px] font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer bg-transparent transition outline-none">Cancel</button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
            className="px-5 py-1.5 text-[11px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition cursor-pointer border-none outline-none"
          >
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category Color Map ────────────────────────────────────────────────────
const CAT_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-sky-600',
  'from-pink-500 to-fuchsia-600',
  'from-lime-500 to-green-600',
];

// ─── Main Component ────────────────────────────────────────────────────────
export default function StudentCategoryManagement() {
  type ActiveTab = 'categories' | 'students';
  const [activeTab, setActiveTab] = useState<ActiveTab>('categories');

  // ── Category Masters State
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catSearch, setCatSearch]   = useState('');
  const [formTarget, setFormTarget] = useState<Category | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ── Students by Category State
  const [students, setStudents]   = useState<StudentItem[]>([]);
  const [stdLoading, setStdLoading] = useState(false);
  const [stdSearch, setStdSearch]   = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [perPage]               = useState(15);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load categories ───────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await api.get('/master/group/CATEGORY');
      if (res.data?.success) {
        setCategories(res.data.data ?? []);
      }
    } catch (e: any) {
      toast.error('Failed to load categories');
    } finally {
      setCatLoading(false);
    }
  }, []);

  // ── Load students ─────────────────────────────────────────────────────────
  const loadStudents = useCallback(async (p = 1) => {
    setStdLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (stdSearch)   params.search = stdSearch;
      if (selectedCat) params.category = selectedCat;

      const res = await api.get('/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data ?? []);
        setPage(res.data.current_page ?? 1);
        setLastPage(res.data.last_page ?? 1);
        setTotal(res.data.total ?? 0);
      }
    } catch (e: any) {
      toast.error('Failed to load students');
    } finally {
      setStdLoading(false);
    }
  }, [stdSearch, selectedCat, perPage]);

  // ── Load category counts ──────────────────────────────────────────────────
  const loadCatCounts = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { per_page: 9999 } });
      if (res.data?.success) {
        const counts: Record<string, number> = {};
        (res.data.data ?? []).forEach((s: StudentItem) => {
          const cat = s.category ?? 'Unassigned';
          counts[cat] = (counts[cat] ?? 0) + 1;
        });
        setCatCounts(counts);
      }
    } catch {}
  }, []);

  useEffect(() => { loadCategories(); loadCatCounts(); }, [loadCategories, loadCatCounts]);

  useEffect(() => {
    if (activeTab === 'students') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => loadStudents(1), 300);
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }
  }, [activeTab, loadStudents]);

  // ── Delete category ───────────────────────────────────────────────────────
  const handleDelete = async (cat: Category) => {
    try {
      await api.delete(`/school/masters/${cat.m_id}`);
      toast.success(`"${cat.m_name}" deleted`);
      loadCategories();
      loadCatCounts();
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const filteredCats = categories.filter(c =>
    !catSearch || c.m_name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const pageRange = () => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(lastPage, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="text-xs bg-slate-50 h-[calc(100vh-32px)] lg:h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      {/* Modals */}
      {(formTarget === 'new' || (formTarget && formTarget !== 'new')) && (
        <CategoryFormModal
          category={formTarget === 'new' ? null : (formTarget as Category)}
          onClose={() => setFormTarget(null)}
          onSuccess={() => { loadCategories(); loadCatCounts(); }}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}

      <div className="flex flex-col h-full gap-3 px-4 py-3 overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 leading-tight">Student Category Management</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Manage student classification groups and view enrollment distribution by category
            </p>
          </div>
          {activeTab === 'categories' && (
            <button
              onClick={() => setFormTarget('new')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition cursor-pointer border-none outline-none"
            >
              <Plus size={13} /> Add Category
            </button>
          )}
        </div>

        {/* ── Summary Cards (always visible) ──────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {/* Total categories */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-80">Total Categories</p>
              <p className="text-xl font-extrabold mt-0.5">{categories.length}</p>
            </div>
            <div className="opacity-50"><Tag size={18} /></div>
          </div>
          {/* Top 3 categories */}
          {Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count], i) => (
              <div
                key={name}
                className={`bg-gradient-to-br ${CAT_COLORS[i % CAT_COLORS.length]} text-white rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer`}
                onClick={() => { setSelectedCat(name); setActiveTab('students'); }}
                title={`View ${name} students`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80">{name}</p>
                  <p className="text-xl font-extrabold mt-0.5">{count}</p>
                  <p className="text-[9px] opacity-70 font-semibold">students</p>
                </div>
                <div className="opacity-50"><Users size={18} /></div>
              </div>
            ))
          }
        </div>

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {[
            { id: 'categories', label: 'Category Masters',      icon: <Tag size={12} /> },
            { id: 'students',   label: 'Students by Category',  icon: <Users size={12} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ActiveTab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer border-none outline-none transition ${
                activeTab === t.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — Category Masters Table                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">

            {/* Filter bar */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
                />
              </div>
              <span className="text-[10px] text-gray-400 font-semibold ml-auto">
                {filteredCats.length} categories
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-4 py-2 w-8">#</th>
                    <th className="px-4 py-2">Category Name</th>
                    <th className="px-4 py-2">Short Code</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-center">Students</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                          <p className="text-gray-400 font-semibold">Loading categories…</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Tag size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-extrabold">No categories found</p>
                        <button
                          onClick={() => setFormTarget('new')}
                          className="mt-3 px-4 py-1.5 text-[11px] font-bold bg-purple-600 text-white rounded-lg cursor-pointer border-none outline-none hover:bg-purple-700 transition"
                        >
                          + Add First Category
                        </button>
                      </td>
                    </tr>
                  ) : filteredCats.map((cat, idx) => {
                    const count = catCounts[cat.m_name] ?? 0;
                    const color = CAT_COLORS[idx % CAT_COLORS.length];
                    return (
                      <tr key={cat.m_id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                        <td className="px-4 py-2.5">
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[9px] font-extrabold`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${color}`} />
                            <span className="font-extrabold text-slate-800">{cat.m_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          {cat.m_alias_name ? (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg">{cat.m_alias_name}</span>
                          ) : (
                            <span className="text-gray-300 text-[10px] italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-[200px]">
                          <p className="truncate">{cat.m_description || <span className="italic text-gray-300">No description</span>}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => { setSelectedCat(cat.m_name); setActiveTab('students'); }}
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer border-none outline-none transition ${
                              count > 0
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-400 cursor-default'
                            }`}
                          >
                            <Users size={9} /> {count} {count === 1 ? 'student' : 'students'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setFormTarget(cat)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition cursor-pointer bg-transparent border-none outline-none"
                              title="Edit category"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer bg-transparent border-none outline-none"
                              title="Delete category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            {!catLoading && filteredCats.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center gap-3">
                {filteredCats.map((cat, idx) => (
                  <div key={cat.m_id} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${CAT_COLORS[idx % CAT_COLORS.length]}`} />
                    <span className="text-[10px] font-bold text-gray-600">{cat.m_name}</span>
                    <span className="text-[9px] text-gray-400">({catCounts[cat.m_name] ?? 0})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — Students by Category                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Filter bar */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={stdSearch}
                  onChange={e => setStdSearch(e.target.value)}
                  placeholder="Search name, adm. no..."
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg w-full outline-none focus:border-purple-400 bg-slate-50"
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCat('')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition outline-none ${
                    selectedCat === ''
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat, idx) => (
                  <button
                    key={cat.m_id}
                    onClick={() => setSelectedCat(cat.m_name)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition outline-none ${
                      selectedCat === cat.m_name
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {cat.m_name} {catCounts[cat.m_name] ? `(${catCounts[cat.m_name]})` : ''}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setStdSearch(''); setSelectedCat(''); }}
                className="flex items-center gap-1 ml-auto text-[11px] font-bold text-gray-400 hover:text-purple-600 bg-transparent border-none cursor-pointer transition outline-none"
              >
                <RefreshCw size={12} /> Clear
              </button>
            </div>

            {/* Student Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 font-extrabold uppercase">
                  <tr>
                    <th className="px-4 py-2 w-10">Photo</th>
                    <th className="px-4 py-2">Student Name</th>
                    <th className="px-4 py-2">Adm. No / Roll</th>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Parent Contact</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stdLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-7 h-7 border-b-2 border-purple-500 rounded-full animate-spin" />
                          <p className="text-gray-400 font-semibold">Loading students…</p>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Users size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-extrabold">No students found</p>
                        <p className="text-[10px] text-gray-300 mt-1">Try selecting a different category</p>
                      </td>
                    </tr>
                  ) : students.map((std, idx) => {
                    const catIdx = categories.findIndex(c => c.m_name === std.category);
                    const catColor = catIdx >= 0 ? CAT_COLORS[catIdx % CAT_COLORS.length] : 'from-gray-400 to-gray-500';
                    return (
                      <tr key={std.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition">
                        <td className="px-4 py-2">
                          {std.photo_url ? (
                            <img src={std.photo_url} alt="Photo" className="w-8 h-8 rounded-lg object-cover border border-purple-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-400 border border-purple-100">
                              <User size={14} />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-bold text-slate-800">{std.full_name}</p>
                          <p className="text-[10px] text-gray-400">{std.user?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-mono font-extrabold text-[10px] text-purple-600">{std.admission_number || '—'}</p>
                          {std.roll_number && <p className="text-[10px] text-gray-400">Roll: {std.roll_number}</p>}
                        </td>
                        <td className="px-4 py-2">
                          <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                            {std.class_name ?? '—'}
                          </span>
                          {std.section && <p className="text-[9px] text-gray-400 mt-0.5">Sec: {std.section}</p>}
                        </td>
                        <td className="px-4 py-2">
                          {std.category ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold text-white bg-gradient-to-r ${catColor} px-2.5 py-0.5 rounded-full`}>
                              {std.category}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic font-semibold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <p className="font-semibold text-slate-700">{std.father_name ?? '—'}</p>
                          <p className="text-[10px] text-gray-400">{std.user?.mobile ?? std.father_mobile ?? '—'}</p>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            std.user?.is_active
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${std.user?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            {std.user?.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!stdLoading && students.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {selectedCat && <span className="font-bold text-purple-600 mr-1">[{selectedCat}]</span>}
                  Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => loadStudents(page - 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronLeft size={14} />
                  </button>
                  {pageRange().map(p => (
                    <button
                      key={p}
                      onClick={() => loadStudents(p)}
                      className={`w-6 h-6 rounded text-[10px] font-bold cursor-pointer border-none outline-none transition ${p === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600 bg-transparent'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= lastPage} onClick={() => loadStudents(page + 1)} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer bg-transparent border-none outline-none">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
