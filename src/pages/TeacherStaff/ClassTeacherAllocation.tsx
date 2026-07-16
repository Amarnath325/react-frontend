import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
  GraduationCap, Search, Plus, Trash2, RefreshCw, X, RotateCcw,
  Archive, ChevronLeft, ChevronRight, Users, BookOpen,
  CheckCircle2, AlertCircle, Loader2,
  Upload, Download, FileSpreadsheet
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Assignment {
  id: number;
  school_id: number;
  academic_year_id: number;
  class_id: number;
  section_id: number | null;
  teacher_id: number;
  is_active: boolean;
  deleted_at: string | null;
  class?: { m_id: number; m_name: string; m_val: string };
  section?: { id: number; name: string };
  teacher?: {
    id: number;
    employee_id: string;
    user?: { first_name: string; last_name: string };
  };
  academic_year?: { id: number; year_name: string; is_current: boolean };
}

interface ClassOption  { m_id: number; m_name: string; m_val: string; }
interface SectionOpt   { id: number; name: string; class_id: number; }
interface TeacherOpt   { id: number; employee_id: string; user?: { first_name: string; last_name: string }; }
interface AcadYearOpt  { id: number; year_name: string; is_current: boolean; }

const PAGE_SIZE = 12;

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ClassTeacherAllocation() {
  /* ── data ── */
  const [items,       setItems]     = useState<Assignment[]>([]);
  const [classes,     setClasses]   = useState<ClassOption[]>([]);
  const [sections,    setSections]  = useState<SectionOpt[]>([]);
  const [teachers,    setTeachers]  = useState<TeacherOpt[]>([]);
  const [acadYears,   setAcadYears] = useState<AcadYearOpt[]>([]);

  /* ── ui state ── */
  const [loading,     setLoading]   = useState(true);
  const [saving,      setSaving]    = useState(false);
  const [alert,       setAlert]     = useState<{ type: 'err' | 'ok'; msg: string } | null>(null);
  const [page,        setPage]      = useState(1);
  const [search,      setSearch]    = useState('');
  const [filterClass, setFClass]    = useState('');
  const [filterAcad,  setFAcad]     = useState('');
  const [showTrashed, setTrashed]   = useState(false);
  const [selectedIds, setSelected]  = useState<Set<number>>(new Set());

  /* ── modals ── */
  const [showAddModal,  setShowAdd]     = useState(false);
  const [showDelModal,  setShowDel]     = useState(false);
  const [showImport,    setShowImport]  = useState(false);
  const [deleteTarget,  setDeleteTarget]= useState<Assignment | null>(null);
  const [deleting,      setDeleting]    = useState(false);

  /* ── form ── */
  const [formClassId,   setFormClass]   = useState('');
  const [formSectionId, setFormSection] = useState('');
  const [formTeacherId, setFormTeacher] = useState('');
  const [formAcadId,    setFormAcad]    = useState('');

  /* ── import ── */
  const [importFile,    setImportFile]  = useState<File | null>(null);
  const [importing,     setImporting]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ═══ HELPERS ═══ */
  const showAlert = useCallback((type: 'err' | 'ok', msg: string) => {
    setAlert({ type, msg });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), 4500);
  }, []);

  const teacherName = (t?: TeacherOpt) =>
    t?.user ? `${t.user.first_name} ${t.user.last_name}`.trim() : '—';

  /* ═══ FETCH ═══ */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (showTrashed) params.only_trashed = true;
      if (filterAcad)  params.academic_year_id = filterAcad;
      const res = await api.get('/school/class-teachers', { params });
      if (res.data.success) setItems(res.data.data || []);
    } catch { showAlert('err', 'Failed to load assignments'); }
    finally { setLoading(false); }
  }, [showAlert, showTrashed, filterAcad]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [clsRes, tchRes, ayRes, secRes] = await Promise.all([
        api.get('/master/classes'),
        api.get('/school/teachers'),
        api.get('/school/academic-years'),
        api.get('/school/sections'),
      ]);
      if (clsRes.data) {
        const cData = clsRes.data.data || clsRes.data || [];
        if (typeof cData === 'object' && !Array.isArray(cData)) {
          setClasses(Object.entries(cData).map(([id, name]) => ({ m_id: parseInt(id), m_name: name as string, m_val: '' })));
        } else {
          setClasses(cData);
        }
      }
      if (tchRes.data)     setTeachers(tchRes.data.data || tchRes.data || []);
      if (ayRes.data)      setAcadYears(ayRes.data.data || ayRes.data || []);
      if (secRes.data)     setSections(secRes.data.data || secRes.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchItems(); setSelected(new Set()); setPage(1); }, [fetchItems]);
  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  /* ═══ FILTERED SECTIONS (by selected class) ═══ */
  const filteredSections = formClassId
    ? sections.filter(s => String(s.class_id) === formClassId)
    : sections;

  /* ═══ ADD ═══ */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formTeacherId) {
      showAlert('err', 'Class and Teacher are required'); return;
    }
    setSaving(true);
    try {
      const res = await api.post('/school/class-teachers', {
        class_id:        parseInt(formClassId),
        section_id:      formSectionId ? parseInt(formSectionId) : null,
        teacher_id:      parseInt(formTeacherId),
        academic_year_id:formAcadId  ? parseInt(formAcadId)  : null,
      });
      if (res.data.success) {
        showAlert('ok', 'Teacher assigned successfully');
        setShowAdd(false);
        resetForm();
        fetchItems();
      }
    } catch (err: any) {
      showAlert('err', err.response?.data?.message || 'Assignment failed');
    } finally { setSaving(false); }
  };

  const resetForm = () => { setFormClass(''); setFormSection(''); setFormTeacher(''); setFormAcad(''); };

  /* ═══ DELETE / RESTORE ═══ */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/school/class-teachers/${deleteTarget.id}`);
      showAlert('ok', 'Assignment removed'); setShowDel(false); fetchItems();
    } catch { showAlert('err', 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleRestore     = async (id: number) => { try { await api.post(`/school/class-teachers/${id}/restore`); showAlert('ok','Restored'); fetchItems(); } catch { showAlert('err','Failed'); } };
  const handleForceDelete = async (id: number) => { if (!confirm('Permanently delete?')) return; try { await api.delete(`/school/class-teachers/${id}/force`); showAlert('ok','Permanently deleted'); fetchItems(); } catch { showAlert('err','Failed'); } };

  /* ═══ BULK ═══ */

  const toggleSelect    = (id: number) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const bulkDelete = async (force = false) => {
    if (!confirm(force ? 'Permanently delete selected?' : 'Remove selected assignments?')) return;
    try {
      const res = await api.post('/school/class-teachers/bulk-delete', { ids: Array.from(selectedIds), force });
      if (res.data.success) { showAlert('ok', res.data.message); setSelected(new Set()); fetchItems(); }
    } catch { showAlert('err', 'Bulk delete failed'); }
  };

  const bulkRestore = async () => {
    try {
      const res = await api.post('/school/class-teachers/bulk-restore', { ids: Array.from(selectedIds) });
      if (res.data.success) { showAlert('ok', res.data.message); setSelected(new Set()); fetchItems(); }
    } catch { showAlert('err', 'Bulk restore failed'); }
  };

  /* ═══ IMPORT ═══ */
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const buf  = await importFile.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const payload = rows.map(r => ({
        class_id:        parseInt(String(r['class_id'] || r['Class ID'] || '')),
        section_id:      r['section_id'] || r['Section ID'] ? parseInt(String(r['section_id'] || r['Section ID'])) : null,
        teacher_id:      parseInt(String(r['teacher_id'] || r['Teacher ID'] || '')),
        academic_year_id:r['academic_year_id'] || r['Academic Year ID'] ? parseInt(String(r['academic_year_id'] || r['Academic Year ID'])) : null,
      })).filter(r => r.class_id && r.teacher_id);

      if (!payload.length) { showAlert('err', 'No valid rows found in file'); setImporting(false); return; }

      const res = await api.post('/school/class-teachers/bulk-import', { data: payload });
      if (res.data.success) {
        showAlert('ok', `Import complete: ${res.data.imported_count} assigned, ${res.data.error_count} failed`);
        setShowImport(false); setImportFile(null); fetchItems();
      }
    } catch (err: any) { showAlert('err', err.response?.data?.message || 'Import failed'); }
    finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const ws_data = [
      ['class_id', 'section_id', 'teacher_id', 'academic_year_id'],
      [1, 1, 1, ''],
      [2, '', 2, ''],
    ];
    const ws = { '!ref': 'A1:D3' } as Record<string, unknown>;
    ws_data.forEach((row, ri) => row.forEach((cell, ci) => {
      const addr = `${String.fromCharCode(65 + ci)}${ri + 1}`;
      ws[addr] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
    }));
    const wb = { SheetNames: ['Template'], Sheets: { Template: ws } };
    import('xlsx').then(XLSX => {
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'class_teacher_template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    });
  };

  /* ═══ FILTER + PAGINATE ═══ */
  const filtered = items.filter(item => {
    const name = teacherName(item.teacher).toLowerCase();
    const cls  = item.class?.m_name || '';
    const sec  = item.section?.name || '';
    const ms   = search.toLowerCase();
    const matchSearch = !search || name.includes(ms) || cls.toLowerCase().includes(ms) || sec.toLowerCase().includes(ms) || (item.teacher?.employee_id || '').toLowerCase().includes(ms);
    const matchClass  = !filterClass || String(item.class_id) === filterClass;
    return matchSearch && matchClass;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ═══ METRICS ═══ */
  const currentYear = acadYears.find(y => y.is_current);
  const thisYearItems = items.filter(i => i.academic_year_id === currentYear?.id);
  const classCount = new Set(items.map(i => i.class_id)).size;

  /* ═══ CARD VIEW ═══ */
  const AssignmentCard = ({ item }: { item: Assignment }) => {
    const name = teacherName(item.teacher);
    const cls  = item.class?.m_name || `Class ${item.class_id}`;
    const sec  = item.section?.name;
    const yr   = item.academic_year?.year_name || '';
    const isCurrent = item.academic_year?.is_current;

    return (
      <div className={`bg-white border rounded-xl p-4 shadow-sm transition hover:shadow-md ${selectedIds.has(item.id) ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-200'}`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-slate-300" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          {isCurrent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px]"><CheckCircle2 className="w-2.5 h-2.5" /> Current</span>}
        </div>

        {/* Class + Section */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">{cls}</span>
            {sec && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[10px]">§ {sec}</span>}
          </div>
          {yr && <span className="text-[10px] text-slate-400 font-mono">{yr}</span>}
        </div>

        {/* Teacher */}
        <div className="flex items-center gap-2 mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
            {name.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{item.teacher?.employee_id || '—'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 mt-3 pt-2.5 border-t border-slate-100">
          {showTrashed ? (
            <>
              <button onClick={() => handleRestore(item.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200">
                <RotateCcw className="w-3 h-3" /> Restore
              </button>
              <button onClick={() => handleForceDelete(item.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          ) : (
            <button onClick={() => { setDeleteTarget(item); setShowDel(true); }} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-slate-200 hover:border-rose-200">
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {alert && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${alert.type === 'err' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          <span>{alert.type === 'err' ? '⚠️' : '✅'}</span><span>{alert.msg}</span>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><GraduationCap className="w-5 h-5" /></span>
            <span>Class Teacher Allocation</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs">Assign class teachers to classes and sections for each academic year. Each class-section can have only one active class teacher.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTrashed(!showTrashed)} className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition border ${showTrashed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Archive className="w-3.5 h-3.5" /><span>{showTrashed ? 'Active Records' : 'Trashed'}</span>
          </button>
          <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition">
            <Upload className="w-3.5 h-3.5" /><span>Import</span>
          </button>
          {!showTrashed && (
            <button onClick={() => { resetForm(); setShowAdd(true); }} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /><span>Assign Teacher</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Assignments', value: items.length,           bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <GraduationCap className="w-3.5 h-3.5" /> },
          { label: 'This Year',         value: thisYearItems.length,   bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: 'Classes Covered',   value: classCount,             bg: 'bg-sky-50', text: 'text-sky-600', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { label: 'Active Teachers',   value: new Set(items.map(i => i.teacher_id)).size, bg: 'bg-violet-50', text: 'text-violet-600', icon: <Users className="w-3.5 h-3.5" /> },
        ].map(s => (
          <div key={s.label} className="bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{s.label}</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">{s.value}</span>
            </div>
            <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ═══ CONTROLS ═══ */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm"
            placeholder="Search by teacher name, employee ID, class, section..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm cursor-pointer"
            value={filterClass} onChange={e => { setFClass(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.m_id} value={String(c.m_id)}>{c.m_name}</option>)}
          </select>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm cursor-pointer"
            value={filterAcad} onChange={e => { setFAcad(e.target.value); setPage(1); }}>
            <option value="">All Years</option>
            {acadYears.map(y => <option key={y.id} value={String(y.id)}>{y.year_name}{y.is_current ? ' ★' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ BULK BAR ═══ */}
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
            <button onClick={() => bulkDelete(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove Assignments</button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-indigo-500 hover:text-indigo-700 transition"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ═══ GRID / EMPTY ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading assignments...</span>
          </div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-7 h-7" /></div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">{items.length === 0 ? (showTrashed ? 'No trashed records' : 'No class teachers assigned yet') : 'No matching assignments'}</h3>
          <p className="text-xs text-slate-500">{items.length === 0 && !showTrashed ? 'Click "Assign Teacher" to allocate a class teacher to a class or section' : 'Try adjusting your search or filters'}</p>
          {items.length === 0 && !showTrashed && (
            <button onClick={() => { resetForm(); setShowAdd(true); }} className="mt-5 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition">
              <Plus className="w-4 h-4" /> Assign Teacher
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(item => <AssignmentCard key={item.id} item={item} />)}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === 1} onClick={() => setPage(p => p-1)}><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1).map((pg, idx, arr) => {
                const e = arr[idx-1] && pg - arr[idx-1] > 1;
                return (
                  <React.Fragment key={pg}>
                    {e && <span className="text-slate-400 px-1 text-xs">...</span>}
                    <button className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-bold transition ${pg === page ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`} onClick={() => setPage(pg)}>{pg}</button>
                  </React.Fragment>
                );
              })}
              <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition" disabled={page === totalPages} onClick={() => setPage(p => p+1)}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </>
      )}

      {/* ═══ INFO PANEL: Assignment Rules ═══ */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-800 space-y-1">
          <p className="font-bold">Assignment Rules</p>
          <ul className="list-disc ml-4 space-y-0.5 font-medium text-indigo-700">
            <li>Each class-section can have only <strong>one active class teacher</strong> per academic year.</li>
            <li>Assigning a new teacher to a class-section <strong>automatically removes</strong> the previous assignment.</li>
            <li>Each teacher can be class teacher of <strong>only one class-section</strong> per academic year.</li>
            <li>The teacher's <em>is_class_teacher</em> flag is managed automatically on assignment/removal.</li>
          </ul>
        </div>
      </div>

      {/* ═══════ ASSIGN MODAL ═══════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" /> Assign Class Teacher</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {/* Academic Year */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Academic Year <span className="text-slate-400 font-normal">(defaults to current)</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  value={formAcadId} onChange={e => setFormAcad(e.target.value)}>
                  <option value="">Current Academic Year</option>
                  {acadYears.map(y => <option key={y.id} value={String(y.id)}>{y.year_name}{y.is_current ? ' (Current)' : ''}</option>)}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Class <span className="text-rose-500">*</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  value={formClassId} onChange={e => { setFormClass(e.target.value); setFormSection(''); }} required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.m_id} value={String(c.m_id)}>{c.m_name}</option>)}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Section <span className="text-slate-400 font-normal">(optional)</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  value={formSectionId} onChange={e => setFormSection(e.target.value)} disabled={!formClassId || filteredSections.length === 0}>
                  <option value="">No Specific Section (Whole Class)</option>
                  {filteredSections.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
                {formClassId && filteredSections.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">No sections found for this class. Assignment will apply to the whole class.</p>
                )}
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teacher <span className="text-rose-500">*</span></label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  value={formTeacherId} onChange={e => setFormTeacher(e.target.value)} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => {
                    const name = teacherName(t);
                    return <option key={t.id} value={String(t.id)}>{name} ({t.employee_id})</option>;
                  })}
                </select>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  If this class-section already has a teacher, they will be automatically replaced. If this teacher is already assigned elsewhere, that assignment will also be removed.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning...</> : <><GraduationCap className="w-3.5 h-3.5" /> Assign Teacher</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ DELETE CONFIRM MODAL ═══════ */}
      {showDelModal && deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-bold text-slate-800">Remove Assignment</h3>
              <p className="text-xs text-slate-500 mt-2">
                Remove <strong className="text-slate-700">{teacherName(deleteTarget.teacher)}</strong> as class teacher of{' '}
                <strong className="text-slate-700">{deleteTarget.class?.m_name}{deleteTarget.section ? ` - ${deleteTarget.section.name}` : ''}</strong>?
              </p>
              <p className="text-[10px] text-amber-600 mt-2 font-medium">This will update the teacher's class teacher status accordingly.</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDel(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition" disabled={deleting}>Cancel</button>
              <button onClick={confirmDelete} className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition" disabled={deleting}>
                {deleting ? 'Removing...' : 'Remove Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ IMPORT MODAL ═══════ */}
      {showImport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Bulk Import Assignments</h3>
              <button onClick={() => { setShowImport(false); setImportFile(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <p className="text-[11px] text-indigo-800 font-semibold mb-1">Required Excel Columns:</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-indigo-700 font-mono">
                  <span>• class_id (required)</span>
                  <span>• teacher_id (required)</span>
                  <span>• section_id (optional)</span>
                  <span>• academic_year_id (optional)</span>
                </div>
              </div>

              <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                <Download className="w-3.5 h-3.5 text-indigo-500" /> Download Template
              </button>

              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); }}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
              >
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                {importFile ? (
                  <div>
                    <p className="text-xs font-bold text-indigo-700">{importFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">Drop Excel file here or click to browse</p>
                    <p className="text-[10px] text-slate-400 mt-1">.xlsx, .xls files supported</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setImportFile(e.target.files?.[0] || null)} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowImport(false); setImportFile(null); }} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleImport} disabled={!importFile || importing} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                  {importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</> : <><Upload className="w-3.5 h-3.5" /> Import</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
