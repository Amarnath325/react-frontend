import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Select from 'react-select';
import {
  Calendar, ClipboardList, Plus, Search, Edit3, Trash2, RotateCcw,
  Upload, Download, FileSpreadsheet, Loader2, AlertCircle,
  CheckSquare, ChevronUp, ChevronDown, BookOpen, Clock, Home, Users,
  Activity, Archive, TrendingUp, X, Filter, RefreshCw, ChevronLeft, ChevronRight,
  MapPin, CheckCircle
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface ExamSchedule {
  id: number;
  examination_id: number;
  examination_name: string;
  academic_year_id: number;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string | null;
  invigilator_teacher_id: number | null;
  invigilator_name: string;
  max_marks: number;
  passing_marks: number;
  is_active: boolean;
  deleted_at?: string | null;
  created_at?: string;
}

interface ExaminationOption {
  id: number;
  name: string;
  class_id: number;
  class_name: string;
  academic_year_id: number;
  academic_year_label: string;
}

interface SubjectOption {
  id: number;
  name: string;
  code: string;
  class_id: number;
  max_marks: number;
  passing_marks: number;
}

interface TeacherOption {
  id: number;
  name: string;
}

interface MasterOption {
  value: string;
  label: string;
}

interface Stats {
  total: number;
  today: number;
  invigilators: number;
  rooms: number;
  trashed: number;
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────────────────────────── */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange()}
    disabled={disabled}
    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1
      ${checked ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
    />
  </button>
);

/* ─────────────────────────────────────────────────────────────
   REACT-SELECT STYLES
───────────────────────────────────────────────────────────── */
const selectStyles = {
  control: (b: any, s: any) => ({
    ...b,
    borderRadius: '0.375rem',
    borderColor: s.isFocused ? '#6366f1' : '#e5e7eb',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#fff',
    '&:hover': { borderColor: s.isFocused ? '#6366f1' : '#d1d5db' },
  }),
  valueContainer: (b: any) => ({ ...b, padding: '0 8px', height: '28px', display: 'flex', alignItems: 'center' }),
  input: (b: any) => ({ ...b, margin: '0', padding: '0', fontSize: '11px' }),
  placeholder: (b: any) => ({ ...b, fontSize: '11px', color: '#9ca3af' }),
  singleValue: (b: any) => ({ ...b, fontSize: '11px', color: '#111827' }),
  indicatorsContainer: (b: any) => ({ ...b, height: '26px' }),
  option: (b: any, s: any) => ({
    ...b,
    backgroundColor: s.isSelected ? '#6366f1' : s.isFocused ? '#f3f4f6' : 'transparent',
    color: s.isSelected ? '#fff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
  }),
  menu: (b: any) => ({ ...b, borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '2px', zIndex: 9999 }),
  clearIndicator: (b: any) => ({ ...b, padding: '2px' }),
  dropdownIndicator: (b: any) => ({ ...b, padding: '2px' }),
};

const SSelect: React.FC<{
  options: MasterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select...', isClearable = true, className = 'w-40' }) => {
  const selected = options.find(o => o.value === value) || null;
  return (
    <div className={className}>
      <Select
        options={options}
        value={selected}
        onChange={opt => onChange((opt as MasterOption)?.value || '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STATS CARD
───────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${bg} min-w-0`}>
    <div className={`p-1.5 rounded-md ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SORT HEADER
───────────────────────────────────────────────────────────── */
const SortTh: React.FC<{
  field: string;
  label: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (f: string) => void;
  className?: string;
}> = ({ field, label, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`py-2 px-2.5 cursor-pointer hover:bg-indigo-50 transition select-none ${className}`}
    onClick={() => onSort(field)}
  >
    <span className="flex items-center gap-0.5">
      {label}
      {sortField === field
        ? sortDir === 'asc'
          ? <ChevronUp className="w-3 h-3 text-indigo-600 flex-shrink-0" />
          : <ChevronDown className="w-3 h-3 text-indigo-600 flex-shrink-0" />
        : <span className="text-gray-300 text-[10px]">↕</span>}
    </span>
  </th>
);

const EMPTY_FORM = {
  examination_id: '',
  subject_id: '',
  exam_date: '',
  start_time: '',
  end_time: '',
  room_no: '',
  invigilator_teacher_id: '',
  max_marks: '',
  passing_marks: '',
  is_active: true,
};

/* ─────────────────────────────────────────────────────────────
   MAIN MODULE COMPONENT
───────────────────────────────────────────────────────────── */
  export default function ExamScheduleManager() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, invigilators: 0, rooms: 0, trashed: 0 });

  /* ── Master lists loaded from API ── */
  const [examinations, setExaminations] = useState<ExaminationOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [academicYears, setAcademicYears] = useState<MasterOption[]>([]);
  const [classes, setClasses] = useState<MasterOption[]>([]);

  /* ── Filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── Sorting ── */
  const [sortField, setSortField] = useState('exam_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ── Selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  /* ── Form Modal ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);

  /* ── Excel Import ── */
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  /* ════════════════ FETCH DATA ════════════════ */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/school/exam-schedules/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/exam-schedules', {
        params: { trashed: showTrashed ? '1' : '0' },
      });
      if (res.data.success) setSchedules(res.data.data || []);
    } catch {
      toast.error('Failed to load exam schedules');
    }
    setLoading(false);
  }, [showTrashed]);

  const fetchMasters = useCallback(async () => {
    try {
      const [exRes, subRes, tRes, ayRes, clRes] = await Promise.all([
        api.get('/school/examinations', { params: { trashed: '0' } }),
        api.get('/school/subjects', { params: { only_trashed: '0' } }),
        api.get('/school/teachers', { params: { only_trashed: '0' } }),
        api.get('/school/academic-years'),
        api.get('/master/classes'),
      ]);

      if (exRes.data.success) {
        setExaminations(exRes.data.data || []);
      }
      if (subRes.data.success) {
        setSubjects(subRes.data.data || []);
      }
      if (tRes.data.success) {
        const arr = (tRes.data.data || []).map((t: any) => ({
          id: t.id,
          name: t.user ? `${t.user.first_name} ${t.user.last_name || ''}`.trim() : `Teacher ID: ${t.id}`
        }));
        setTeachers(arr);
      }
      if (ayRes.data.success) {
        const data = ayRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((y: any) => ({ value: String(y.id), label: y.name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setAcademicYears(arr);
      }
      if (clRes.data.success) {
        const data = clRes.data.data;
        const arr = Array.isArray(data)
          ? data.map((c: any) => ({ value: String(c.id || c.m_id), label: c.name || c.m_name }))
          : Object.entries(data).map(([id, name]) => ({ value: id, label: name as string }));
        setClasses(arr);
      }
    } catch {
      toast.error('Failed to load master metadata');
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchSchedules();
    fetchStats();
    setSelectedIds([]);
  }, [fetchSchedules, fetchStats]);

  /* ── Auto-populate max/passing marks on subject change in add mode ── */
  useEffect(() => {
    if (!editingItem && formData.subject_id) {
      const sub = subjects.find(s => String(s.id) === formData.subject_id);
      if (sub) {
        setFormData(prev => ({
          ...prev,
          max_marks: String(sub.max_marks || 100),
          passing_marks: String(sub.passing_marks || 33)
        }));
      }
    }
  }, [formData.subject_id, subjects, editingItem]);

  /* ════════════════ DYNAMIC FORM DROPDOWNS ════════════════ */
  const filteredSubjectsForForm = useMemo(() => {
    if (!formData.examination_id) return [];
    const selectedExam = examinations.find(e => String(e.id) === formData.examination_id);
    if (!selectedExam) return [];
    return subjects.filter(s => String(s.class_id) === String(selectedExam.class_id));
  }, [formData.examination_id, examinations, subjects]);

  /* ════════════════ FILTER & SORT ════════════════ */
  const filtered = useMemo(() => {
    let arr = [...schedules];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(s =>
        s.examination_name.toLowerCase().includes(q) ||
        s.subject_name.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q) ||
        (s.room_no || '').toLowerCase().includes(q) ||
        s.invigilator_name.toLowerCase().includes(q)
      );
    }

    if (filterAcademicYear) arr = arr.filter(s => String(s.academic_year_id) === filterAcademicYear);
    if (filterClass) arr = arr.filter(s => String(s.class_id) === filterClass);
    if (filterExam) arr = arr.filter(s => String(s.examination_id) === filterExam);
    if (filterSubject) arr = arr.filter(s => String(s.subject_id) === filterSubject);
    if (filterStatus !== '') arr = arr.filter(s => s.is_active === (filterStatus === '1'));

    arr.sort((a: any, b: any) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return arr;
  }, [schedules, searchTerm, filterAcademicYear, filterClass, filterExam, filterSubject, filterStatus, sortField, sortDir]);

  const totalPages = useMemo(() => itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);

  const paginated = useMemo(() => {
    if (itemsPerPage === -1) return filtered;
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  /* ════════════════ SORT HANDLER ════════════════ */
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const isAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.includes(r.id));
  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(paginated.map(r => r.id));
  const handleSelectRow = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const hasFilters = searchTerm || filterAcademicYear || filterClass || filterExam || filterSubject || filterStatus;
  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
    setFilterClass('');
    setFilterExam('');
    setFilterSubject('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  /* ════════════════ IN-FORM CONFLICT CHECKS (FRONTEND UX) ════════════════ */
  const scheduleConflicts = useMemo(() => {
    if (!formData.exam_date || !formData.start_time || !formData.end_time || !isModalOpen) return null;
    const s1 = new Date(`1970-01-01T${formData.start_time}`).getTime();
    const e1 = new Date(`1970-01-01T${formData.end_time}`).getTime();
    if (isNaN(s1) || isNaN(e1) || s1 >= e1) return null;

    const classIdOfExam = formData.examination_id ? examinations.find(e => String(e.id) === formData.examination_id)?.class_id : null;

    for (const s of schedules) {
      if (editingItem && s.id === editingItem.id) continue;
      if (s.exam_date !== formData.exam_date) continue;

      const s2 = new Date(`1970-01-01T${s.start_time}`).getTime();
      const e2 = new Date(`1970-01-01T${s.end_time}`).getTime();

      if (s1 < e2 && s2 < e1) {
        // Room conflict
        if (formData.room_no && s.room_no && formData.room_no.trim().toLowerCase() === s.room_no.trim().toLowerCase()) {
          return `⚠️ Room "${s.room_no}" is already booked for ${s.examination_name} (${s.subject_name}) during this slot.`;
        }
        // Invigilator conflict
        if (formData.invigilator_teacher_id && s.invigilator_teacher_id && String(formData.invigilator_teacher_id) === String(s.invigilator_teacher_id)) {
          return `⚠️ Teacher is already scheduled for invigilation duty in Room ${s.room_no || 'N/A'}.`;
        }
        // Class conflict
        if (classIdOfExam && s.class_id === classIdOfExam) {
          return `⚠️ This class already has another examination scheduled during this time slot.`;
        }
      }
    }
    return null;
  }, [formData, schedules, examinations, editingItem, isModalOpen]);

  /* ════════════════ CRUD ACTIONS ════════════════ */
  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (item: ExamSchedule) => {
    setEditingItem(item);
    setFormData({
      examination_id: String(item.examination_id),
      subject_id: String(item.subject_id),
      exam_date: item.exam_date || '',
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      room_no: item.room_no || '',
      invigilator_teacher_id: String(item.invigilator_teacher_id || ''),
      max_marks: String(item.max_marks),
      passing_marks: String(item.passing_marks),
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examination_id || !formData.subject_id || !formData.exam_date || !formData.start_time || !formData.end_time || !formData.max_marks || !formData.passing_marks) {
      toast.error('Please fill all required fields');
      return;
    }
    if (Number(formData.passing_marks) > Number(formData.max_marks)) {
      toast.error('Passing marks cannot exceed maximum marks');
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        examination_id: Number(formData.examination_id),
        subject_id: Number(formData.subject_id),
        exam_date: formData.exam_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_no: formData.room_no ? formData.room_no.trim() : null,
        invigilator_teacher_id: formData.invigilator_teacher_id ? Number(formData.invigilator_teacher_id) : null,
        max_marks: Number(formData.max_marks),
        passing_marks: Number(formData.passing_marks),
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.put(`/school/exam-schedules/${editingItem.id}`, payload);
        toast.success('Exam schedule updated successfully');
      } else {
        await api.post('/school/exam-schedules', payload);
        toast.success('Exam schedule created successfully');
      }
      setIsModalOpen(false);
      fetchSchedules();
      fetchStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save exam schedule');
    }
    setFormSaving(false);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/exam-schedules/${id}/toggle-status`);
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
      fetchStats();
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Move schedule for "${name}" to trash?`)) return;
    try {
      await api.delete(`/school/exam-schedules/${id}`);
      toast.success('Moved to trash');
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/exam-schedules/${id}/restore`);
      toast.success('Exam schedule restored');
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete schedule for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/school/exam-schedules/${id}/force`);
      toast.success('Permanently deleted');
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Force delete failed'); }
  };

  /* ════════════════ BULK OPERATIONS ════════════════ */
  const handleBulkStatus = async (status: boolean) => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-schedules/bulk-status', { ids: selectedIds, is_active: status });
      toast.success(`${selectedIds.length} schedule(s) status updated`);
      setSelectedIds([]);
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Bulk status update failed'); }
    setBulkUpdating(false);
  };

  const handleBulkDelete = async (force = false) => {
    if (!selectedIds.length) return;
    const msg = force
      ? `Permanently delete ${selectedIds.length} exam schedule(s)? This cannot be undone.`
      : `Move ${selectedIds.length} exam schedule(s) to trash?`;
    if (!window.confirm(msg)) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-schedules/bulk-delete', { ids: selectedIds, force });
      toast.success(force ? 'Permanently deleted' : 'Moved to trash');
      setSelectedIds([]);
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Bulk delete failed'); }
    setBulkUpdating(false);
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    setBulkUpdating(true);
    try {
      await api.post('/school/exam-schedules/bulk-restore', { ids: selectedIds });
      toast.success(`${selectedIds.length} schedule(s) restored`);
      setSelectedIds([]);
      fetchSchedules();
      fetchStats();
    } catch { toast.error('Bulk restore failed'); }
    setBulkUpdating(false);
  };

  /* ════════════════ EXPORT ════════════════ */
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Exam Schedules');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 6 },
        { header: 'Examination', key: 'examination', width: 26 },
        { header: 'Class', key: 'class', width: 12 },
        { header: 'Subject', key: 'subject', width: 22 },
        { header: 'Subject Code', key: 'code', width: 12 },
        { header: 'Exam Date', key: 'date', width: 14 },
        { header: 'Start Time', key: 'start', width: 12 },
        { header: 'End Time', key: 'end', width: 12 },
        { header: 'Room No', key: 'room', width: 12 },
        { header: 'Invigilator', key: 'invigilator', width: 24 },
        { header: 'Max Marks', key: 'max', width: 12 },
        { header: 'Passing Marks', key: 'pass', width: 14 },
        { header: 'Status', key: 'status', width: 10 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 22;

      filtered.forEach(row => {
        sheet.addRow({
          id: row.id,
          examination: row.examination_name,
          class: row.class_name,
          subject: row.subject_name,
          code: row.subject_code,
          date: row.exam_date,
          start: row.start_time,
          end: row.end_time,
          room: row.room_no || 'N/A',
          invigilator: row.invigilator_name,
          max: row.max_marks,
          pass: row.passing_marks,
          status: row.is_active ? 'Active' : 'Inactive',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `exam_schedules_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  /* ════════════════ SAMPLE DOWNLOAD ════════════════ */
  const handleSampleDownload = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Exam Schedules Import');
      sheet.columns = [
        { header: 'Examination ID *', key: 'examination_id', width: 16 },
        { header: 'Subject ID *', key: 'subject_id', width: 14 },
        { header: 'Exam Date * (YYYY-MM-DD)', key: 'exam_date', width: 26 },
        { header: 'Start Time * (HH:MM:SS)', key: 'start_time', width: 24 },
        { header: 'End Time * (HH:MM:SS)', key: 'end_time', width: 24 },
        { header: 'Room No', key: 'room_no', width: 14 },
        { header: 'Invigilator Teacher ID', key: 'invigilator_teacher_id', width: 22 },
        { header: 'Max Marks *', key: 'max_marks', width: 12 },
        { header: 'Passing Marks *', key: 'passing_marks', width: 16 },
        { header: 'Status (Active/Inactive)', key: 'status', width: 24 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 22;

      const exId = examinations[0]?.id || 1;
      const subId = subjects[0]?.id || 1;
      const teacherId = teachers[0]?.id || '';

      [
        [exId, subId, '2026-04-10', '09:00:00', '12:00:00', 'Room 101', teacherId, 100, 33, 'Active'],
        [exId, subId, '2026-04-12', '09:00:00', '12:00:00', 'Room 102', teacherId, 100, 33, 'Active'],
      ].forEach(row => sheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'exam_schedules_import_template.xlsx');
      toast.success('Sample template downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  /* ════════════════ IMPORT PARSING ════════════════ */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
        setImportRows(rows);
        setIsImportOpen(true);
      } catch {
        toast.error('Failed to parse excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      const parsedData = importRows.map(row => ({
        examination_id: Number(row['Examination ID *'] || row['examination_id'] || 0),
        subject_id: Number(row['Subject ID *'] || row['subject_id'] || 0),
        exam_date: String(row['Exam Date * (YYYY-MM-DD)'] || row['exam_date'] || ''),
        start_time: String(row['Start Time * (HH:MM:SS)'] || row['start_time'] || ''),
        end_time: String(row['End Time * (HH:MM:SS)'] || row['end_time'] || ''),
        room_no: String(row['Room No'] || row['room_no'] || '').trim() || null,
        invigilator_teacher_id: row['Invigilator Teacher ID'] || row['invigilator_teacher_id'] ? Number(row['Invigilator Teacher ID'] || row['invigilator_teacher_id']) : null,
        max_marks: Number(row['Max Marks *'] || row['max_marks'] || 100),
        passing_marks: Number(row['Passing Marks *'] || row['passing_marks'] || 33),
        is_active: String(row['Status (Active/Inactive)'] || row['status'] || 'Active').toLowerCase() !== 'inactive',
      }));

      const res = await api.post('/school/exam-schedules/bulk-import', { data: parsedData });
      if (res.data.success) {
        toast.success(`Import Complete: ${res.data.imported_count} imported, ${res.data.error_count} failed.`);
        setIsImportOpen(false);
        fetchSchedules();
        fetchStats();
      } else {
        toast.error(res.data.message || 'Import failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk import failed');
    }
    setImporting(false);
  };

  /* ════════════════ DATE & TIME FORMATTERS ════════════════ */
  const formatDate = (d: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length < 2) return t;
    const hour = Number(parts[0]);
    const min = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min} ${ampm}`;
  };

  /* ════════════════ SELECT WRAPPER FORMATTERS ════════════════ */
  const examSelectOptions = useMemo(() => examinations.map(e => ({ value: String(e.id), label: `${e.class_name} - ${e.name}` })), [examinations]);
  const subjectSelectOptions = useMemo(() => subjects.map(s => ({ value: String(s.id), label: s.name })), [subjects]);
  const formSubjectSelectOptions = useMemo(() => filteredSubjectsForForm.map(s => ({ value: String(s.id), label: `${s.name} (${s.code || 'N/A'})` })), [filteredSubjectsForForm]);
  const teacherSelectOptions = useMemo(() => teachers.map(t => ({ value: String(t.id), label: t.name })), [teachers]);
  const statusOptions: MasterOption[] = [
    { value: '1', label: 'Active' },
    { value: '0', label: 'Inactive' },
  ];

  /* ════════════════ RENDER JSX ════════════════ */
  return (
    <div className="p-4 space-y-3 text-xs">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Exam Schedule Management</h1>
            <p className="text-[10px] text-gray-500">Configure dates, classrooms, invigilators and paper marks mapping</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggles */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 text-[10px] font-bold ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 text-[10px] font-bold ${activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Timeline View
            </button>
          </div>
          <button
            onClick={() => { fetchSchedules(); fetchStats(); }}
            className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatCard
          label="Total Schedules"
          value={stats.total}
          icon={<ClipboardList className="w-3.5 h-3.5 text-white" />}
          color="bg-indigo-500"
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Exams Today"
          value={stats.today}
          icon={<Activity className="w-3.5 h-3.5 text-white" />}
          color="bg-green-500"
          bg="bg-green-50 border-green-100"
        />
        <StatCard
          label="Invigilators"
          value={stats.invigilators}
          icon={<Users className="w-3.5 h-3.5 text-white" />}
          color="bg-amber-500"
          bg="bg-amber-50 border-amber-100"
        />
        <StatCard
          label="Rooms Booked"
          value={stats.rooms}
          icon={<Home className="w-3.5 h-3.5 text-white" />}
          color="bg-blue-500"
          bg="bg-blue-50 border-blue-100"
        />
        <StatCard
          label="Trashed"
          value={stats.trashed}
          icon={<Archive className="w-3.5 h-3.5 text-white" />}
          color="bg-red-500"
          bg="bg-red-50 border-red-100"
        />
      </div>

      {/* ── Primary Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search schedule list..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-6 pr-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white h-7 w-44"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Items Limit */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 h-7">
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(e.target.value === 'all' ? -1 : Number(e.target.value)); setCurrentPage(1); }}
              className="text-[11px] font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Trashed toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2 py-0.5 h-7">
            <Archive className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-semibold">Trashed</span>
            <ToggleSwitch
              checked={showTrashed}
              onChange={() => { setShowTrashed(v => !v); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSampleDownload}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition text-[11px] font-medium h-7"
            title="Download sample template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sample
          </button>
          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition cursor-pointer text-[11px] font-medium h-7">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition text-[11px] font-medium h-7"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition text-[11px] font-semibold h-7 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-2 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase">
          <Filter className="w-3 h-3" />
          Filters:
        </div>
        <SSelect options={academicYears} value={filterAcademicYear} onChange={v => { setFilterAcademicYear(v); setCurrentPage(1); }} placeholder="Academic Year" className="w-36" />
        <SSelect options={classes} value={filterClass} onChange={v => { setFilterClass(v); setCurrentPage(1); }} placeholder="Class" className="w-32" />
        <SSelect options={examSelectOptions} value={filterExam} onChange={v => { setFilterExam(v); setCurrentPage(1); }} placeholder="Examination" className="w-48" />
        <SSelect options={subjectSelectOptions} value={filterSubject} onChange={v => { setFilterSubject(v); setCurrentPage(1); }} placeholder="Subject" className="w-36" />
        <SSelect options={statusOptions} value={filterStatus} onChange={v => { setFilterStatus(v); setCurrentPage(1); }} placeholder="Status" className="w-28" />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <span className="ml-auto text-[10px] text-gray-400 font-medium">
          {filtered.length} paper{filtered.length !== 1 ? 's' : ''} scheduled
        </span>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-[11px] text-indigo-800 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatus(true)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 hover:border-green-400 transition disabled:opacity-50 text-green-700 font-medium"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatus(false)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-amber-50 hover:border-amber-400 transition disabled:opacity-50 text-amber-700 font-medium"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkDelete(false)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-red-50 hover:border-red-400 transition disabled:opacity-50 text-red-600 font-medium"
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-indigo-300 rounded hover:bg-green-50 transition disabled:opacity-50 text-green-700 font-medium"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 bg-white border border-red-300 rounded hover:bg-red-50 transition disabled:opacity-50 text-red-700 font-medium"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Tab Views ── */}
      {activeTab === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Loading schedules...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wide">
                    <th className="py-2 px-2.5 w-7">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                      />
                    </th>
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <SortTh field="examination_name" label="Examination" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh field="class_name" label="Class" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh field="subject_name" label="Subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh field="exam_date" label="Exam Date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-2 px-2.5">Time</th>
                    <SortTh field="room_no" label="Room" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh field="invigilator_name" label="Invigilator" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh field="max_marks" label="Max Marks" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                    <SortTh field="passing_marks" label="Passing Marks" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                    <SortTh field="is_active" label="Status" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-center w-24" />
                    <th className="py-2 px-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="w-8 h-8 text-gray-300" />
                          <p className="font-semibold text-gray-600">No schedules found</p>
                          <p className="text-[10px] text-gray-400">Add a schedule or clear filters to view results.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item, idx) => (
                      <tr key={item.id} className={`hover:bg-indigo-50/30 transition ${selectedIds.includes(item.id) ? 'bg-indigo-50/50' : ''}`}>
                        <td className="py-1.5 px-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleSelectRow(item.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                          />
                        </td>
                        <td className="py-1.5 px-2.5 text-center text-gray-400 font-mono">
                          {itemsPerPage === -1 ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-gray-900">{item.examination_name}</td>
                        <td className="py-1.5 px-2.5 font-medium text-gray-800">{item.class_name}</td>
                        <td className="py-1.5 px-2.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{item.subject_name}</span>
                            <span className="text-[9px] text-gray-400">{item.subject_code}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 text-gray-600 font-medium">{formatDate(item.exam_date)}</td>
                        <td className="py-1.5 px-2.5 text-gray-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-indigo-600">
                          {item.room_no ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100 text-[10px]">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              {item.room_no}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-gray-700 font-medium">{item.invigilator_name || '—'}</td>
                        <td className="py-1.5 px-2.5 text-right font-semibold text-gray-900">{item.max_marks}</td>
                        <td className="py-1.5 px-2.5 text-right text-gray-600">{item.passing_marks}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          {!item.deleted_at ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <ToggleSwitch
                                checked={item.is_active}
                                onChange={() => handleToggleStatus(item.id)}
                              />
                              <span className={`text-[10px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-semibold">Trashed</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {!item.deleted_at ? (
                              <>
                                <button onClick={() => openEdit(item)} className="p-1 text-indigo-500 hover:bg-indigo-100 rounded transition" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(item.id, item.subject_name)} className="p-1 text-red-500 hover:bg-red-100 rounded transition" title="Move to Trash">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleRestore(item.id)} className="p-1 text-green-600 hover:bg-green-100 rounded transition" title="Restore">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleForceDelete(item.id, item.subject_name)} className="p-1 text-red-600 hover:bg-red-100 rounded transition" title="Delete Permanently">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Timeline / Calendar Grid view ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
              No schedules to display on timeline.
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-3.5 space-y-2 border-t-4 border-t-indigo-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs">{item.examination_name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">{item.class_name}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                    {item.subject_code}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium">{formatDate(item.exam_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono">{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Home className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Room: <strong className="text-gray-800 font-semibold">{item.room_no || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Invigilator: <strong className="text-gray-800 font-medium">{item.invigilator_name || 'N/A'}</strong></span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                  <span>Marks: <strong>{item.passing_marks}/{item.max_marks}</strong></span>
                  <span className={`font-semibold ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {activeTab === 'list' && !loading && totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px]">
          <p className="text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span>–
            <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of
            <span className="font-semibold text-gray-700">{filtered.length}</span> results
          </p>
          <nav className="isolate inline-flex -space-x-px rounded shadow-sm">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-2.5 py-0.5 font-semibold ${currentPage === page ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r px-1.5 py-0.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      )}

      {/* ════════════════════════════════════════
          ADD / EDIT MODAL (NON-SCROLLABLE)
      ════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {editingItem ? 'Edit Exam Schedule' : 'Add Exam Schedule'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              
              {/* Row 1: Examination Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Examination Name <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={examSelectOptions}
                  value={formData.examination_id}
                  onChange={v => setFormData(p => ({ ...p, examination_id: v, subject_id: '' }))}
                  placeholder="Select Examination"
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Row 2: Subject Select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <SSelect
                  options={formSubjectSelectOptions}
                  value={formData.subject_id}
                  onChange={v => setFormData(p => ({ ...p, subject_id: v }))}
                  placeholder={formData.examination_id ? "Select Subject" : "Please select an examination first"}
                  isClearable={false}
                  className="w-full text-xs"
                />
              </div>

              {/* Row 3: Date, Start & End Time */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={e => setFormData(p => ({ ...p, exam_date: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    min={formData.start_time}
                    onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Room No & Invigilator Teacher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Room No</label>
                  <input
                    type="text"
                    value={formData.room_no}
                    onChange={e => setFormData(p => ({ ...p, room_no: e.target.value }))}
                    placeholder="e.g. Hall A, Room 101"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Invigilator</label>
                  <SSelect
                    options={teacherSelectOptions}
                    value={formData.invigilator_teacher_id}
                    onChange={v => setFormData(p => ({ ...p, invigilator_teacher_id: v }))}
                    placeholder="Select Teacher"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              {/* Row 5: Max Marks + Passing Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Max Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={e => setFormData(p => ({ ...p, max_marks: e.target.value }))}
                    placeholder="100"
                    min={1}
                    max={1000}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Passing Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.passing_marks}
                    onChange={e => setFormData(p => ({ ...p, passing_marks: e.target.value }))}
                    placeholder="33"
                    min={0}
                    max={Number(formData.max_marks) || 1000}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Conflict Warnings UI Warning Box */}
              {scheduleConflicts && (
                <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[10px] font-semibold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{scheduleConflicts}</span>
                </div>
              )}

              {/* Row 6: Active Status row */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Active Status</span>
                <ToggleSwitch
                  checked={formData.is_active}
                  onChange={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                />
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-semibold disabled:opacity-60"
                >
                  {formSaving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <>{editingItem ? 'Update Schedule' : 'Schedule Exam'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white">Import Exam Schedules</h3>
                </div>
                <button onClick={() => setIsImportOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded border border-indigo-100 mb-4">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-800">Previewing {importRows.length} row(s) to import</p>
                  <p className="text-indigo-600">Ensure Examination IDs and Subject IDs are valid in the system.</p>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="bg-indigo-600 text-white font-semibold">
                      {importRows[0] && Object.keys(importRows[0]).map(k => <th key={k} className="p-2 whitespace-nowrap">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((v: any, j) => <td key={j} className="p-2 text-gray-700 whitespace-nowrap">{String(v)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-t border-gray-200 px-5 py-3 flex justify-end gap-2 flex-shrink-0">
              <button onClick={() => setIsImportOpen(false)} className="px-4 py-1.5 border border-gray-300 rounded text-xs">Cancel</button>
              <button onClick={handleImportSubmit} disabled={importing} className="px-5 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold">
                {importing ? 'Importing...' : `Import ${importRows.length} Records`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
