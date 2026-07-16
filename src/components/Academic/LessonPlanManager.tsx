import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  BookOpen, Calendar, User, Eye, Plus, Check, X,
  Trash2, Search, RotateCcw, AlertCircle, Loader2,
  Upload, Download, FileSpreadsheet, CheckSquare, Clock, Edit2
} from 'lucide-react';
import Select from 'react-select';

/* ═══════════════════════════════════════
   TYPES & SCHEMAS
═══════════════════════════════════════ */
interface MasterOption { m_id: number; m_name: string; }
interface SubjectOpt { id: number; name: string; code: string; class_id: number; }
interface TeacherOpt { id: number; name: string; employee_id: string; }
interface AcadYear { id: number; year_name: string; is_current: boolean; }

interface LessonPlan {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  plan_date: string;
  chapter_title: string;
  topic_title: string;
  objectives: string | null;
  methodology: string | null;
  homework_task: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  feedback: string | null;
  is_active: boolean;
  class_name?: string;
  subject?: { id: number; name: string; code: string } | null;
  teacher?: { id: number; employee_id: string; user?: { id: number; first_name: string; last_name: string } } | null;
  academic_year?: AcadYear | null;
  deleted_at?: string | null;
}

/* ═══════════════════════════════════════
   TOGGLE SWITCH COMPONENT
═══════════════════════════════════════ */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      className={`
        relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? 'bg-green-500' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-4.5' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

/* ═══════════════════════════════════════
   REACT SELECT CUSTOM STYLING
═══════════════════════════════════════ */
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '34px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 12px',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '12px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '12px',
    color: '#111827',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '12px',
    padding: '8px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '4px',
    zIndex: 9999,
  }),
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem', // rounded-md
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    height: '28px',
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0',
    padding: '0',
    fontSize: '11px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '11px',
    color: '#111827',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '26px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#2563eb'
      : state.isFocused
        ? '#f3f4f6'
        : 'transparent',
    color: state.isSelected ? '#ffffff' : '#374151',
    fontSize: '11px',
    padding: '6px 8px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#2563eb' : '#e5e7eb',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e5e7eb',
    marginTop: '2px',
    zIndex: 9999,
  }),
};

interface SearchableSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  isClearable?: boolean;
  className?: string;
  compact?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  className = "",
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected) => onChange(selected ? String(selected.value) : '')}
        placeholder={placeholder}
        isClearable={isClearable}
        styles={compact ? compactSelectStyles : customSelectStyles}
        className={compact ? "text-[11px]" : "text-[12px]"}
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const EMPTY_FORM = {
  class_id: '',
  subject_id: '',
  teacher_id: '',
  academic_year_id: '',
  plan_date: new Date().toISOString().split('T')[0],
  chapter_title: '',
  topic_title: '',
  objectives: '',
  methodology: '',
  homework_task: '',
  is_active: true,
};

export default function LessonPlanManager() {
  /* ── data state ── */
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [filteredData, setFilteredData] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── masters state ── */
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [acadYears, setAcadYears] = useState<AcadYear[]>([]);
  const [currentYr, setCurrentYr] = useState<AcadYear | null>(null);

  /* ── filters state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAcadYear, setFilterAcadYear] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  /* ── sort state ── */
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ── selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* ── modals ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LessonPlan | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  /* ═══ API CALLS ═══ */

  const fetchMasters = useCallback(async () => {
    try {
      const res = await api.get('/school/lesson-plans/masters');
      if (res.data.success) {
        setClasses(res.data.classes || []);
        setSubjects(res.data.subjects || []);
        setTeachers(res.data.teachers || []);
        setAcadYears(res.data.acad_years || []);
        setCurrentYr(res.data.current_year || null);
      }
    } catch { toast.error('Failed to load master data'); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/lesson-plans', { params: { trashed: showTrashed ? '1' : '0' } });
      if (res.data.success) {
        setPlans(res.data.data || []);
      }
    } catch { toast.error('Failed to load lesson plans'); }
    setLoading(false);
  }, [showTrashed]);

  useEffect(() => { fetchMasters(); }, [fetchMasters]);
  useEffect(() => { fetchData(); setSelectedIds([]); }, [fetchData]);

  /* ═══ FILTERING & SORTING ═══ */
  useEffect(() => {
    let arr = [...plans];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(p =>
        (p.chapter_title || '').toLowerCase().includes(q) ||
        (p.topic_title || '').toLowerCase().includes(q) ||
        (p.class_name || '').toLowerCase().includes(q) ||
        (p.subject?.name || '').toLowerCase().includes(q) ||
        (p.subject?.code || '').toLowerCase().includes(q) ||
        (p.teacher?.user ? `${p.teacher.user.first_name} ${p.teacher.user.last_name}` : '').toLowerCase().includes(q)
      );
    }
    if (filterClass) arr = arr.filter(p => String(p.class_id) === filterClass);
    if (filterSubject) arr = arr.filter(p => String(p.subject_id) === filterSubject);
    if (filterTeacher) arr = arr.filter(p => String(p.teacher_id) === filterTeacher);
    if (filterStatus) arr = arr.filter(p => p.approval_status === filterStatus);
    if (filterAcadYear) arr = arr.filter(p => String(p.academic_year_id) === filterAcadYear);

    // sort
    if (sortField) {
      arr.sort((a, b) => {
        let va: any = '', vb: any = '';
        if (sortField === 'class_name') { va = a.class_name || ''; vb = b.class_name || ''; }
        else if (sortField === 'subject_name') { va = a.subject?.name || ''; vb = b.subject?.name || ''; }
        else if (sortField === 'teacher_name') {
          va = a.teacher?.user ? `${a.teacher.user.first_name} ${a.teacher.user.last_name}` : '';
          vb = b.teacher?.user ? `${b.teacher.user.first_name} ${b.teacher.user.last_name}` : '';
        }
        else if (sortField === 'plan_date') { va = a.plan_date || ''; vb = b.plan_date || ''; }
        else if (sortField === 'approval_status') { va = a.approval_status || ''; vb = b.approval_status || ''; }
        else if (sortField === 'is_active') { va = a.is_active ? 1 : 0; vb = b.is_active ? 1 : 0; }

        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(arr);
    setCurrentPage(1);
  }, [plans, searchTerm, filterClass, filterSubject, filterTeacher, filterStatus, filterAcadYear, sortField, sortDir]);

  /* ═══ PAGINATION ═══ */
  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1;
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData, itemsPerPage]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  /* ═══ SORT ═══ */
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };
  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  /* ═══ SELECTION ═══ */
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.includes(d.id));
  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(paginatedData.map(d => d.id));
  };
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /* ═══ CRUD ═══ */
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      academic_year_id: currentYr ? String(currentYr.id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: LessonPlan) => {
    setEditingItem(item);
    setFormData({
      class_id: String(item.class_id),
      subject_id: String(item.subject_id),
      teacher_id: String(item.teacher_id),
      academic_year_id: item.academic_year_id ? String(item.academic_year_id) : '',
      plan_date: item.plan_date ? new Date(item.plan_date).toISOString().split('T')[0] : '',
      chapter_title: item.chapter_title || '',
      topic_title: item.topic_title || '',
      objectives: item.objectives || '',
      methodology: item.methodology || '',
      homework_task: item.homework_task || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.teacher_id || !formData.plan_date) {
      toast.error('Class, Subject, Teacher, and Date are required.');
      return;
    }
    try {
      const payload = {
        ...formData,
        class_id: parseInt(formData.class_id),
        subject_id: parseInt(formData.subject_id),
        teacher_id: parseInt(formData.teacher_id),
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null,
      };
      if (editingItem) {
        await api.put(`/school/lesson-plans/${editingItem.id}`, payload);
        toast.success('Lesson plan updated');
      } else {
        await api.post('/school/lesson-plans', payload);
        toast.success('Lesson plan submitted for approval');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/lesson-plans/${id}/toggle-status`);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this lesson plan to trash?')) return;
    try {
      await api.delete(`/school/lesson-plans/${id}`);
      toast.success('Moved to trash');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/lesson-plans/${id}/restore`);
      toast.success('Restored');
      fetchData();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete? This action is irreversible.')) return;
    try {
      await api.delete(`/school/lesson-plans/${id}/force`);
      toast.success('Permanently deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  /* ═══ REVIEW / APPROVAL ACTIONS ═══ */
  const handleApprove = async (id: number) => {
    try {
      await api.post(`/school/lesson-plans/${id}/approve`, { feedback: feedbackText });
      toast.success('Lesson plan approved');
      setIsViewModalOpen(false);
      fetchData();
    } catch { toast.error('Approval failed'); }
  };

  const handleReject = async (id: number) => {
    if (!feedbackText.trim()) {
      toast.error('Feedback comments are required to request revision/rejection');
      return;
    }
    try {
      await api.post(`/school/lesson-plans/${id}/reject`, { feedback: feedbackText });
      toast.success('Revision feedback sent successfully');
      setIsViewModalOpen(false);
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  /* ═══ BULK ACTIONS ═══ */
  const handleBulkStatus = async (status: string) => {
    try {
      await api.post('/school/lesson-plans/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} item(s) status updated`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk update failed'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} items?`)) return;
    try {
      await api.post('/school/lesson-plans/bulk-delete', { ids: selectedIds, force: showTrashed });
      toast.success('Deleted successfully');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkRestore = async () => {
    try {
      await api.post('/school/lesson-plans/bulk-restore', { ids: selectedIds });
      toast.success('Restored');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk restore failed'); }
  };

  /* ═══ IMPORT / EXPORT / SAMPLE TEMPLATE ═══ */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws);
      const preview = json.map((row: any) => ({
        class: row['Class'] || row['class'] || '',
        subject: row['Subject'] || row['subject'] || '',
        teacher: row['Teacher'] || row['teacher'] || '',
        date: row['Plan Date'] || row['date'] || '',
        chapter_title: row['Chapter Title'] || row['chapter'] || '',
        topic_title: row['Topic Title'] || row['topic'] || '',
        objectives: row['Objectives'] || row['objectives'] || '',
        methodology: row['Methodology'] || row['methodology'] || '',
        homework_task: row['Homework Task'] || row['homework'] || '',
        status: row['Status'] || row['status'] || 'Active',
      }));
      setImportPreview(preview);
      setIsImportModalOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    try {
      const res = await api.post('/school/lesson-plans/bulk-import', { rows: importPreview });
      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.errors?.length) res.data.errors.forEach((e: string) => toast.error(e));
      }
      setIsImportModalOpen(false);
      setImportPreview([]);
      fetchData();
    } catch { toast.error('Import failed'); }
  };

  const handleExport = () => {
    if (filteredData.length === 0) { toast.error('No data to export'); return; }
    const rows = filteredData.map(p => ({
      'Class': p.class_name || '',
      'Subject': p.subject?.name || '',
      'Teacher': p.teacher?.user ? `${p.teacher.user.first_name} ${p.teacher.user.last_name}` : 'Unknown',
      'Plan Date': p.plan_date ? new Date(p.plan_date).toISOString().split('T')[0] : '',
      'Chapter Title': p.chapter_title || '',
      'Topic Title': p.topic_title || '',
      'Objectives': p.objectives || '',
      'Methodology': p.methodology || '',
      'Homework Task': p.homework_task || '',
      'Approval Status': p.approval_status || 'pending',
      'Status': p.is_active ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lesson Plans');
    XLSX.writeFile(wb, `Lesson_Plans_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export completed successfully');
  };

  const handleSampleDownload = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Lesson Plans');
    const helper = wb.addWorksheet('_Lists');
    helper.state = 'hidden';

    // helper values
    const classNames = classes.map(c => c.m_name);
    const subjectNames = subjects.map(s => s.name);
    const teacherNames = teachers.map(t => t.name);

    classNames.forEach((n, i) => { helper.getCell(`A${i + 1}`).value = n; });
    subjectNames.forEach((n, i) => { helper.getCell(`B${i + 1}`).value = n; });
    teacherNames.forEach((n, i) => { helper.getCell(`C${i + 1}`).value = n; });
    ['Active', 'Inactive'].forEach((n, i) => { helper.getCell(`D${i + 1}`).value = n; });

    ws.columns = [
      { header: 'Class', key: 'class', width: 18 },
      { header: 'Subject', key: 'subject', width: 22 },
      { header: 'Teacher', key: 'teacher', width: 22 },
      { header: 'Plan Date', key: 'date', width: 14 },
      { header: 'Chapter Title', key: 'chapter_title', width: 25 },
      { header: 'Topic Title', key: 'topic_title', width: 25 },
      { header: 'Objectives', key: 'objectives', width: 30 },
      { header: 'Methodology', key: 'methodology', width: 30 },
      { header: 'Homework Task', key: 'homework_task', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // header color
    ws.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      cell.alignment = { horizontal: 'center' };
    });

    // sample row
    ws.addRow({
      class: classNames[0] || 'Class 10',
      subject: subjectNames[0] || 'Mathematics',
      teacher: teacherNames[0] || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      chapter_title: 'Chapter 3: Quadratic Equations',
      topic_title: 'Roots of Equation',
      objectives: 'Understand roots calculations.',
      methodology: 'Interactive class worksheets.',
      homework_task: 'Solve exercises.',
      status: 'Active'
    });

    // validation mapping rows 2-100
    for (let r = 2; r <= 100; r++) {
      ws.getCell(`A${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$A$1:$A$${Math.max(classNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`B${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$B$1:$B$${Math.max(subjectNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`C${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$C$1:$C$${Math.max(teacherNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`J${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$D$1:$D$2`], showErrorMessage: true };
    }

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'Lesson_Plans_Sample_Template.xlsx');
    toast.success('Sample template downloaded');
  };

  /* ═══ MEMOIZED SELECT OPTIONS ═══ */

  const classFilterOptions = useMemo(() => [
    { value: '', label: 'All Classes' },
    ...classes.map(c => ({ value: c.m_id, label: c.m_name }))
  ], [classes]);

  const subjectFilterOptions = useMemo(() => [
    { value: '', label: 'All Subjects' },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ], [subjects]);

  const teacherFilterOptions = useMemo(() => [
    { value: '', label: 'All Teachers' },
    ...teachers.map(t => ({ value: t.id, label: t.name }))
  ], [teachers]);

  const yearFilterOptions = useMemo(() => [
    { value: '', label: 'All Years' },
    ...acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') }))
  ], [acadYears]);

  const classFormOptions = useMemo(() => classes.map(c => ({ value: c.m_id, label: c.m_name })), [classes]);

  const filteredSubjects = useMemo(() => {
    if (formData.class_id) {
      return subjects.filter(s => String(s.class_id) === String(formData.class_id));
    }
    return subjects;
  }, [subjects, formData.class_id]);

  const subjectFormOptions = useMemo(() => filteredSubjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || 'N/A'})` })), [filteredSubjects]);

  const teacherFormOptions = useMemo(() => teachers.map(t => ({ value: t.id, label: t.name })), [teachers]);

  const yearFormOptions = useMemo(() => acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') })), [acadYears]);

  const hasFilters = searchTerm || filterClass || filterSubject || filterTeacher || filterStatus || filterAcadYear;

  const stats = useMemo(() => {
    return {
      total: plans.length,
      approved: plans.filter(p => p.approval_status === 'approved').length,
      pending: plans.filter(p => p.approval_status === 'pending').length,
    };
  }, [plans]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    const labels: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Revision Required' };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${map[status] || map.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="space-y-3 text-xs text-gray-700">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Lesson Planner & Approval</h3>
            <p className="text-[12px] text-gray-500">Design class-wise lesson blueprints, manage homework assignments, and coordinate syllabus approvals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{stats.total}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Approved</span>
            <span className="text-xs font-bold text-emerald-700">{stats.approved}</span>
          </div>
          <div className="bg-amber-50/60 border border-amber-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-amber-500">Pending</span>
            <span className="text-xs font-bold text-amber-700">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search chapters, topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-40 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800 h-[28px]"
            />
          </div>

          <SearchableSelect
            options={classFilterOptions}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="All Classes"
            compact
            className="w-32"
          />

          <SearchableSelect
            options={subjectFilterOptions}
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="All Subjects"
            compact
            className="w-32"
          />

          <SearchableSelect
            options={teacherFilterOptions}
            value={filterTeacher}
            onChange={setFilterTeacher}
            placeholder="All Teachers"
            compact
            className="w-36"
          />

          <SearchableSelect
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Status"
            compact
            className="w-24"
          />

          <SearchableSelect
            options={yearFilterOptions}
            value={filterAcadYear}
            onChange={setFilterAcadYear}
            placeholder="All Years"
            compact
            className="w-28"
          />

          {/* Limits */}
          <div className="flex items-center bg-white border border-gray-300 rounded px-1.5 py-0.5 select-none h-[28px]">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs font-semibold text-gray-750 bg-transparent focus:outline-none cursor-pointer"
            >
              {[10, 15, 25, 50, -1].map(n => <option key={n} value={n}>{n === -1 ? 'All' : n}</option>)}
            </select>
          </div>

          {/* Trashed toggle */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-300 rounded h-[28px]">
            <ToggleSwitch checked={showTrashed} onChange={() => { setShowTrashed(!showTrashed); setSelectedIds([]); }} />
            <span className="text-[10px] font-semibold text-gray-600 select-none">Trashed</span>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setFilterClass(''); setFilterSubject(''); setFilterTeacher(''); setFilterStatus(''); setFilterAcadYear(''); }}
              className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline ml-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleSampleDownload}
            className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-medium h-[28px]">
            <Download className="w-3.5 h-3.5 text-gray-500" /> Sample
          </button>

          <label className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-medium cursor-pointer h-[28px]">
            <Upload className="w-3.5 h-3.5 text-gray-500" /> Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
          </label>

          <button onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 transition text-xs font-medium h-[28px]">
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" /> Export
          </button>

          {!showTrashed && (
            <button onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium h-[28px]">
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>
      </div>

      {/* ── TRASHED WARNING ── */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>You are viewing deleted lesson plans. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs shadow-sm">
          <div className="text-blue-800 font-semibold">{selectedIds.length} plan(s) selected</div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button onClick={() => handleBulkStatus('active')} className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-50 text-green-700 font-medium transition">Active</button>
                <button onClick={() => handleBulkStatus('inactive')} className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-50 text-red-700 font-medium transition">Inactive</button>
                <button onClick={handleBulkDelete} className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition">Delete</button>
              </>
            ) : (
              <>
                <button onClick={handleBulkRestore} className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-50 text-green-700 font-medium transition">Restore</button>
                <button onClick={handleBulkDelete} className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition">Delete Permanently</button>
              </>
            )}
            <button onClick={() => setSelectedIds([])} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition">Cancel</button>
          </div>
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-gray-400 font-medium">Loading lesson plan records...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
                <th className="py-2 px-2.5 w-8 text-center">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" />
                </th>
                <th onClick={() => handleSort('class_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Class</span><span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span></div>
                </th>
                <th onClick={() => handleSort('subject_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Subject</span><span className="text-gray-400 font-normal">{getSortIcon('subject_name')}</span></div>
                </th>
                <th className="py-2 px-2.5">Topic & Chapter</th>
                <th onClick={() => handleSort('teacher_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Teacher</span><span className="text-gray-400 font-normal">{getSortIcon('teacher_name')}</span></div>
                </th>
                <th onClick={() => handleSort('plan_date')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24 text-center">
                  <div className="flex items-center justify-center gap-1"><span>Plan Date</span><span className="text-gray-400 font-normal">{getSortIcon('plan_date')}</span></div>
                </th>
                <th onClick={() => handleSort('approval_status')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-28 text-center select-none">
                  <div className="flex items-center justify-center gap-1"><span>Approval Status</span><span className="text-gray-400 font-normal">{getSortIcon('approval_status')}</span></div>
                </th>
                <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center select-none">
                  <div className="flex items-center justify-center gap-1"><span>Status</span><span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span></div>
                </th>
                <th className="py-2 px-2.5 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <BookOpen className="w-10 h-10 text-gray-300" />
                      <h4 className="text-[13px] font-bold text-gray-900">No lesson plans found</h4>
                      <p className="text-xs text-gray-400">Add a new lesson blueprint or import one to get started.</p>
                      {!showTrashed && (
                        <button onClick={openAddModal}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition mt-1">
                          Add Lesson Plan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                    <td className="py-1.5 px-2.5 text-center">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" />
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-gray-800">
                      <div>{item.class_name || 'Unknown'}</div>
                      {item.academic_year && <div className="text-[9px] font-normal text-slate-400">{item.academic_year.year_name}</div>}
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <div>
                          <span>{item.subject?.name || 'Unknown'}</span>
                          {item.subject?.code && <span className="font-mono text-[9px] text-slate-400 font-normal bg-slate-100 px-1 rounded ml-1.5">{item.subject.code}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 max-w-xs truncate">
                      <div className="font-semibold text-gray-800">{item.topic_title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{item.chapter_title}</div>
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-gray-800">
                      {item.teacher?.user ? `${item.teacher.user.first_name} ${item.teacher.user.last_name}` : 'Unknown'}
                    </td>
                    <td className="py-1.5 px-2.5 text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.plan_date ? new Date(item.plan_date).toISOString().split('T')[0] : '—'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      {getStatusBadge(item.approval_status)}
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ToggleSwitch checked={item.is_active} onChange={() => handleToggleStatus(item.id)} disabled={showTrashed} />
                        <span className={`text-[10px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setActivePlan(item);
                            setFeedbackText(item.feedback || '');
                            setIsViewModalOpen(true);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="View Details & Review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {showTrashed ? (
                          <>
                            <button onClick={() => handleRestore(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded transition" title="Restore">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleForceDelete(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition" title="Delete permanently">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEditModal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition" title="Delete">
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
        )}
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-2 rounded-lg shadow-sm text-xs select-none">
          <span className="text-gray-500">
            Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span>{' '}
            of <span className="font-semibold text-gray-800">{filteredData.length}</span> plans
          </span>
          <div className="flex items-center gap-1 font-semibold">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition">«</button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-2 py-0.5 border rounded text-[11px] transition ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition">»</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         CREATE / EDIT LESSON PLAN MODAL
      ═══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{editingItem ? 'Edit Lesson Plan' : 'Submit Lesson Plan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Class *</label>
                  <SearchableSelect
                    options={classFormOptions}
                    value={formData.class_id}
                    onChange={(val) => setFormData((p: any) => ({ ...p, class_id: val, subject_id: '' }))}
                    placeholder="Select Class"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Subject *</label>
                  <SearchableSelect
                    options={subjectFormOptions}
                    value={formData.subject_id}
                    onChange={(val) => setFormData((p: any) => ({ ...p, subject_id: val }))}
                    placeholder="Select Subject"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Teacher *</label>
                  <SearchableSelect
                    options={teacherFormOptions}
                    value={formData.teacher_id}
                    onChange={(val) => setFormData((p: any) => ({ ...p, teacher_id: val }))}
                    placeholder="Select Teacher"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Plan Date *</label>
                  <input
                    type="date"
                    value={formData.plan_date}
                    onChange={(e) => setFormData((p: any) => ({ ...p, plan_date: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Academic Year</label>
                  <SearchableSelect
                    options={yearFormOptions}
                    value={formData.academic_year_id}
                    onChange={(val) => setFormData((p: any) => ({ ...p, academic_year_id: val }))}
                    placeholder="Select Year"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Chapter Title *</label>
                  <input
                    type="text"
                    value={formData.chapter_title}
                    placeholder="e.g. Chapter 3: Quadratic Equations"
                    onChange={(e) => setFormData((p: any) => ({ ...p, chapter_title: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Topic Title *</label>
                <input
                  type="text"
                  value={formData.topic_title}
                  placeholder="e.g. Solution by Factorization Method"
                  onChange={(e) => setFormData((p: any) => ({ ...p, topic_title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Objectives</label>
                <textarea
                  rows={2}
                  value={formData.objectives}
                  placeholder="What will students learn..."
                  onChange={(e) => setFormData((p: any) => ({ ...p, objectives: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Methodology</label>
                <textarea
                  rows={2}
                  value={formData.methodology}
                  placeholder="Classroom activities, lab experiments, visual aids..."
                  onChange={(e) => setFormData((p: any) => ({ ...p, methodology: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Homework Task</label>
                <input
                  type="text"
                  value={formData.homework_task}
                  placeholder="e.g. Exercise 4.2 questions 1-5"
                  onChange={(e) => setFormData((p: any) => ({ ...p, homework_task: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
                <button type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow font-semibold text-xs hover:from-indigo-700 hover:to-blue-700 transition">
                  {editingItem ? 'Save Changes' : 'Submit Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         VIEW DETAILS & REVIEW/APPROVAL MODAL
      ═══════════════════════════════════════ */}
      {isViewModalOpen && activePlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Lesson Plan Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Class & Subject</span>
                  <span className="font-bold text-slate-800">{activePlan.class_name} — {activePlan.subject?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Assigned Teacher</span>
                  <span className="font-bold text-slate-800">
                    {activePlan.teacher?.user ? `${activePlan.teacher.user.first_name} ${activePlan.teacher.user.last_name}` : 'Unknown'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Plan Date</span>
                  <span className="font-bold text-slate-800">{activePlan.plan_date ? new Date(activePlan.plan_date).toISOString().split('T')[0] : '—'}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Approval Status</span>
                  <div>{getStatusBadge(activePlan.approval_status)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Topic Details</h4>
                <p className="font-bold text-slate-800 text-sm">{activePlan.topic_title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{activePlan.chapter_title}</p>
              </div>

              {activePlan.objectives && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Learning Objectives</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{activePlan.objectives}</p>
                </div>
              )}

              {activePlan.methodology && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Teaching Methodology</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{activePlan.methodology}</p>
                </div>
              )}

              {activePlan.homework_task && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Homework Assignment</h4>
                  <p className="text-slate-700 text-xs font-semibold">{activePlan.homework_task}</p>
                </div>
              )}

              {activePlan.feedback && (
                <div className="bg-blue-50 border border-blue-150 p-2.5 rounded-lg text-xs">
                  <span className="font-bold text-blue-800 block mb-0.5">Review Feedback Note:</span>
                  <span className="text-blue-700">{activePlan.feedback}</span>
                </div>
              )}

              {/* Coordinator Review Action Group */}
              {activePlan.approval_status === 'pending' && !showTrashed && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Coordinator Feedback Comment</label>
                    <textarea
                      rows={2}
                      placeholder="Add review notes or revision feedback..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleReject(activePlan.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      Request Revision
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(activePlan.id)}
                      className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      Approve Blueprint
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         IMPORT PREVIEW MODAL
      ═══════════════════════════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Import Preview — {importPreview.length} row(s)</h3>
              <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <table className="w-full text-[10px] border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-[8px] uppercase font-bold text-gray-600">
                    <th className="py-1.5 px-2 border border-gray-200">#</th>
                    <th className="py-1.5 px-2 border border-gray-200">Class</th>
                    <th className="py-1.5 px-2 border border-gray-200">Subject</th>
                    <th className="py-1.5 px-2 border border-gray-200">Teacher</th>
                    <th className="py-1.5 px-2 border border-gray-200">Date</th>
                    <th className="py-1.5 px-2 border border-gray-200">Chapter</th>
                    <th className="py-1.5 px-2 border border-gray-200">Topic</th>
                    <th className="py-1.5 px-2 border border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1 px-2 border border-gray-200 text-center font-bold">{i + 1}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.class}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.subject}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.teacher}</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{row.date}</td>
                      <td className="py-1 px-2 border border-gray-200 truncate max-w-[120px]">{row.chapter_title}</td>
                      <td className="py-1 px-2 border border-gray-200 truncate max-w-[120px]">{row.topic_title}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
              <button onClick={handleConfirmImport}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow font-semibold text-xs hover:from-emerald-700 hover:to-teal-700 transition">
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
