import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  BookOpen, Search, Plus, Trash2, X, RotateCcw,
  AlertCircle, Loader2, Upload, Download,
  Clock, Edit2, FileSpreadsheet, ChevronDown, ChevronRight,
  Layers, CheckCircle, Target, BarChart3
} from 'lucide-react';
import Select from 'react-select';

// Styles matching react-select premium layout
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 or gray-200
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
   TYPES
═══════════════════════════════════════ */
interface SubjectOpt { id: number; name: string; code: string; class_id: number; }
interface MasterOption { m_id: number; m_name: string; }
interface AcadYear { id: number; year_name: string; is_current: boolean; }

interface Chapter {
  id: number;
  curriculum_id: number;
  chapter_no: number;
  title: string;
  description: string | null;
  learning_objectives: string | null;
  estimated_hours: number;
  teaching_methodology: string | null;
  resources_materials: string | null;
  assessment_type: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_date: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Curriculum {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  class_id: number;
  subject_id: number;
  board_framework: string | null;
  total_chapters: number;
  total_hours: number;
  description: string | null;
  is_active: boolean;
  notes: string | null;
  class_name?: string;
  subject?: { id: number; name: string; code: string } | null;
  academic_year?: AcadYear | null;
  chapters?: Chapter[];
  chapters_count?: number;
  completed_chapters?: number;
  total_est_hours?: number;
  completion_percent?: number;
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
   CONSTANTS
═══════════════════════════════════════ */
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'Custom'];
const METHODOLOGIES = ['Lecture', 'Lab / Practical', 'Activity Based', 'Project Based', 'Flipped Classroom', 'Discussion', 'Demonstration', 'Self Study'];
const ASSESSMENT_TYPES = ['Written Exam', 'MCQ', 'Practical', 'Viva', 'Assignment', 'Project', 'Presentation', 'Observation'];

const EMPTY_FORM = {
  class_id: '',
  subject_id: '',
  academic_year_id: '',
  board_framework: '',
  description: '',
  notes: '',
  is_active: true,
};

const EMPTY_CHAPTER = {
  chapter_no: 1,
  title: '',
  description: '',
  learning_objectives: '',
  estimated_hours: 4,
  teaching_methodology: '',
  resources_materials: '',
  assessment_type: '',
  status: 'pending' as const,
};

export default function SyllabusManager() {
  /* ── data state ── */
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [filteredData, setFilteredData] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── masters ── */
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);
  const [acadYears, setAcadYears] = useState<AcadYear[]>([]);
  const [currentYr, setCurrentYr] = useState<AcadYear | null>(null);

  /* ── filters ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBoard, setFilterBoard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAcadYear, setFilterAcadYear] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  /* ── sort ── */
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ── selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* ── modals ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Curriculum | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  /* ── expanded row for chapters ── */
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  /* ── chapter modal ── */
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState<any>({ ...EMPTY_CHAPTER });
  const [chapterParentId, setChapterParentId] = useState<number | null>(null);

  /* ═══ API CALLS ═══ */

  const fetchMasters = useCallback(async () => {
    try {
      const res = await api.get('/school/curricula/masters');
      if (res.data.success) {
        setClasses(res.data.classes || []);
        setSubjects(res.data.subjects || []);
        setAcadYears(res.data.acad_years || []);
        setCurrentYr(res.data.current_year || null);
      }
    } catch { toast.error('Failed to load master data'); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/curricula', { params: { trashed: showTrashed ? '1' : '0' } });
      if (res.data.success) {
        setCurricula(res.data.data || []);
      }
    } catch { toast.error('Failed to load curricula'); }
    setLoading(false);
  }, [showTrashed]);

  useEffect(() => { fetchMasters(); }, [fetchMasters]);
  useEffect(() => { fetchData(); setSelectedIds([]); setExpandedId(null); }, [fetchData]);

  /* ═══ FILTERING ═══ */
  useEffect(() => {
    let arr = [...curricula];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(c =>
        (c.class_name || '').toLowerCase().includes(q) ||
        (c.subject?.name || '').toLowerCase().includes(q) ||
        (c.subject?.code || '').toLowerCase().includes(q) ||
        (c.board_framework || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    }
    if (filterClass) arr = arr.filter(c => String(c.class_id) === filterClass);
    if (filterSubject) arr = arr.filter(c => String(c.subject_id) === filterSubject);
    if (filterBoard) arr = arr.filter(c => c.board_framework === filterBoard);
    if (filterAcadYear) arr = arr.filter(c => String(c.academic_year_id) === filterAcadYear);
    if (filterStatus === 'active') arr = arr.filter(c => c.is_active);
    if (filterStatus === 'inactive') arr = arr.filter(c => !c.is_active);

    // sort
    if (sortField) {
      arr.sort((a, b) => {
        let va: any = '', vb: any = '';
        if (sortField === 'class_name') { va = a.class_name || ''; vb = b.class_name || ''; }
        else if (sortField === 'subject_name') { va = a.subject?.name || ''; vb = b.subject?.name || ''; }
        else if (sortField === 'board_framework') { va = a.board_framework || ''; vb = b.board_framework || ''; }
        else if (sortField === 'chapters_count') { va = a.chapters_count || 0; vb = b.chapters_count || 0; }
        else if (sortField === 'completion_percent') { va = a.completion_percent || 0; vb = b.completion_percent || 0; }
        else if (sortField === 'is_active') { va = a.is_active ? 1 : 0; vb = b.is_active ? 1 : 0; }
        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(arr);
    setCurrentPage(1);
  }, [curricula, searchTerm, filterClass, filterSubject, filterBoard, filterStatus, filterAcadYear, sortField, sortDir]);

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

  const openEditModal = (item: Curriculum) => {
    setEditingItem(item);
    setFormData({
      class_id: String(item.class_id),
      subject_id: String(item.subject_id),
      academic_year_id: item.academic_year_id ? String(item.academic_year_id) : '',
      board_framework: item.board_framework || '',
      description: item.description || '',
      notes: item.notes || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id) {
      toast.error('Please select Class and Subject');
      return;
    }
    try {
      const payload = {
        ...formData,
        class_id: parseInt(formData.class_id),
        subject_id: parseInt(formData.subject_id),
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null,
      };
      if (editingItem) {
        await api.put(`/school/curricula/${editingItem.id}`, payload);
        toast.success('Curriculum updated');
      } else {
        await api.post('/school/curricula', payload);
        toast.success('Curriculum created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/curricula/${id}/toggle-status`);
      setCurricula(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this curriculum to trash?')) return;
    try {
      await api.delete(`/school/curricula/${id}`);
      toast.success('Moved to trash');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/curricula/${id}/restore`);
      toast.success('Restored');
      fetchData();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete? This cannot be undone.')) return;
    try {
      await api.delete(`/school/curricula/${id}/force`);
      toast.success('Permanently deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  /* ═══ BULK ACTIONS ═══ */
  const handleBulkStatus = async (status: string) => {
    try {
      await api.post('/school/curricula/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} item(s) set to ${status}`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk status failed'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} item(s)?`)) return;
    try {
      await api.post('/school/curricula/bulk-delete', { ids: selectedIds, force: showTrashed });
      toast.success('Deleted');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkRestore = async () => {
    try {
      await api.post('/school/curricula/bulk-restore', { ids: selectedIds });
      toast.success('Restored');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk restore failed'); }
  };

  /* ═══ CHAPTERS (EXPAND ROW) ═══ */
  const toggleExpandRow = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedChapters([]);
      return;
    }
    setExpandedId(id);
    setLoadingChapters(true);
    try {
      const res = await api.get(`/school/curricula/${id}/chapters`);
      if (res.data.success) setExpandedChapters(res.data.data || []);
    } catch { toast.error('Failed to load chapters'); }
    setLoadingChapters(false);
  };

  const openAddChapter = (curriculumId: number) => {
    setChapterParentId(curriculumId);
    setEditingChapter(null);
    const nextNo = expandedChapters.length > 0 ? Math.max(...expandedChapters.map(c => c.chapter_no)) + 1 : 1;
    setChapterForm({ ...EMPTY_CHAPTER, chapter_no: nextNo });
    setIsChapterModalOpen(true);
  };

  const openEditChapter = (curriculumId: number, chapter: Chapter) => {
    setChapterParentId(curriculumId);
    setEditingChapter(chapter);
    setChapterForm({
      chapter_no: chapter.chapter_no,
      title: chapter.title,
      description: chapter.description || '',
      learning_objectives: chapter.learning_objectives || '',
      estimated_hours: chapter.estimated_hours,
      teaching_methodology: chapter.teaching_methodology || '',
      resources_materials: chapter.resources_materials || '',
      assessment_type: chapter.assessment_type || '',
      status: chapter.status,
    });
    setIsChapterModalOpen(true);
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) { toast.error('Enter chapter title'); return; }
    if (!chapterParentId) return;
    try {
      if (editingChapter) {
        await api.put(`/school/curricula/${chapterParentId}/chapters/${editingChapter.id}`, chapterForm);
        toast.success('Chapter updated');
      } else {
        await api.post(`/school/curricula/${chapterParentId}/chapters`, chapterForm);
        toast.success('Chapter added');
      }
      setIsChapterModalOpen(false);
      // reload chapters
      const res = await api.get(`/school/curricula/${chapterParentId}/chapters`);
      if (res.data.success) setExpandedChapters(res.data.data || []);
      fetchData(); // refresh parent stats
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Chapter operation failed');
    }
  };

  const handleDeleteChapter = async (curriculumId: number, chapterId: number) => {
    if (!window.confirm('Delete this chapter permanently?')) return;
    try {
      await api.delete(`/school/curricula/${curriculumId}/chapters/${chapterId}`);
      toast.success('Chapter deleted');
      setExpandedChapters(prev => prev.filter(c => c.id !== chapterId));
      fetchData();
    } catch { toast.error('Delete chapter failed'); }
  };

  const handleToggleChapterStatus = async (curriculumId: number, chapterId: number) => {
    try {
      const res = await api.patch(`/school/curricula/${curriculumId}/chapters/${chapterId}/toggle-status`);
      if (res.data.success) {
        setExpandedChapters(prev => prev.map(c => c.id === chapterId ? { ...c, ...res.data.data } : c));
        fetchData();
      }
    } catch { toast.error('Toggle failed'); }
  };

  /* ═══ IMPORT / EXPORT / SAMPLE ═══ */
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
        board: row['Board'] || row['board'] || '',
        description: row['Description'] || row['description'] || '',
        notes: row['Notes'] || row['notes'] || '',
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
      const res = await api.post('/school/curricula/bulk-import', { rows: importPreview });
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
    const rows = filteredData.map(c => ({
      'Class': c.class_name || '',
      'Subject': c.subject?.name || '',
      'Code': c.subject?.code || '',
      'Board': c.board_framework || '',
      'Academic Year': c.academic_year?.year_name || '',
      'Chapters': c.chapters_count || 0,
      'Total Hours': c.total_est_hours || 0,
      'Completion %': c.completion_percent || 0,
      'Status': c.is_active ? 'Active' : 'Inactive',
      'Description': c.description || '',
      'Notes': c.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Curricula');
    XLSX.writeFile(wb, `Curricula_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported successfully');
  };

  const handleSampleDownload = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Curricula');
    const helper = wb.addWorksheet('_Lists');
    helper.state = 'hidden';

    // populate helper lists
    const classNames = classes.map(c => c.m_name);
    const subjectNames = subjects.map(s => s.name);

    classNames.forEach((n, i) => { helper.getCell(`A${i + 1}`).value = n; });
    subjectNames.forEach((n, i) => { helper.getCell(`B${i + 1}`).value = n; });
    BOARDS.forEach((n, i) => { helper.getCell(`C${i + 1}`).value = n; });
    ['Active', 'Inactive'].forEach((n, i) => { helper.getCell(`D${i + 1}`).value = n; });

    ws.columns = [
      { header: 'Class', key: 'class', width: 18 },
      { header: 'Subject', key: 'subject', width: 22 },
      { header: 'Board', key: 'board', width: 18 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // style header
    ws.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      cell.alignment = { horizontal: 'center' };
    });

    // sample row
    ws.addRow({ class: classNames[0] || 'Class 10', subject: subjectNames[0] || 'Mathematics', board: 'CBSE', description: 'Sample description', notes: '', status: 'Active' });

    // add dropdown validations for rows 2-100
    for (let r = 2; r <= 100; r++) {
      ws.getCell(`A${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$A$1:$A$${Math.max(classNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`B${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$B$1:$B$${Math.max(subjectNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`C${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$C$1:$C$${BOARDS.length}`], showErrorMessage: true };
      ws.getCell(`F${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$D$1:$D$2`], showErrorMessage: true };
    }

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'Curricula_Sample_Template.xlsx');
    toast.success('Sample template downloaded');
  };

  /* ═══ HELPERS ═══ */
  const getClassName = (classId: number) => {
    const c = classes.find(cl => cl.m_id === classId);
    return c ? c.m_name : 'Unknown';
  };

  const activeCount = useMemo(() => curricula.filter(c => c.is_active).length, [curricula]);
  const totalChaptersCount = useMemo(() => curricula.reduce((sum, c) => sum + (c.chapters_count || 0), 0), [curricula]);

  const filteredSubjects = useMemo(() => {
    if (formData.class_id) {
      return subjects.filter(s => String(s.class_id) === String(formData.class_id));
    }
    return subjects;
  }, [subjects, formData.class_id]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
      in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
    };
    const labels: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${map[status] || map.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const hasFilters = searchTerm || filterClass || filterSubject || filterBoard || filterStatus || filterAcadYear;

  // Memoized filter and form options for SearchableSelect
  const classFilterOptions = useMemo(() => [
    { value: '', label: 'All Classes' },
    ...classes.map(c => ({ value: c.m_id, label: c.m_name }))
  ], [classes]);

  const boardFilterOptions = useMemo(() => [
    { value: '', label: 'All Boards' },
    ...BOARDS.map(b => ({ value: b, label: b }))
  ], []);

  const yearFilterOptions = useMemo(() => [
    { value: '', label: 'All Years' },
    ...acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') }))
  ], [acadYears]);

  const statusFilterOptions = useMemo(() => [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ], []);

  const classFormOptions = useMemo(() => classes.map(c => ({ value: c.m_id, label: c.m_name })), [classes]);

  const subjectFormOptions = useMemo(() => filteredSubjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || 'N/A'})` })), [filteredSubjects]);

  const yearFormOptions = useMemo(() => acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') })), [acadYears]);

  const boardFormOptions = useMemo(() => BOARDS.map(b => ({ value: b, label: b })), []);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="space-y-3 text-xs text-gray-700">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Curriculum & Syllabus Design</h3>
            <p className="text-[12px] text-gray-500">Define class-wise chapters, teaching objectives, and track syllabus completion progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{curricula.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{activeCount}</span>
          </div>
          <div className="bg-blue-50/60 border border-blue-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">Chapters</span>
            <span className="text-xs font-bold text-blue-700">{totalChaptersCount}</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Filters and Controls */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search class, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-36 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800 h-[28px]"
            />
          </div>

          {/* Class searchable select */}
          <SearchableSelect
            options={classFilterOptions}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="All Classes"
            compact
            className="w-32"
          />

          {/* Board searchable select */}
          <SearchableSelect
            options={boardFilterOptions}
            value={filterBoard}
            onChange={setFilterBoard}
            placeholder="All Boards"
            compact
            className="w-28"
          />

          {/* Academic Year searchable select */}
          <SearchableSelect
            options={yearFilterOptions}
            value={filterAcadYear}
            onChange={setFilterAcadYear}
            placeholder="All Years"
            compact
            className="w-28"
          />

          {/* Status searchable select */}
          <SearchableSelect
            options={statusFilterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Status"
            compact
            className="w-24"
          />

          {/* Show limits */}
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
              onClick={() => { setSearchTerm(''); setFilterClass(''); setFilterSubject(''); setFilterBoard(''); setFilterStatus(''); setFilterAcadYear(''); }}
              className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline ml-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right side: Action Buttons */}
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
          <span>You are viewing deleted curricula. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs shadow-sm">
          <div className="text-blue-800 font-semibold">{selectedIds.length} curriculum(s) selected</div>
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

      {/* ── TABLE ── */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-gray-400 font-medium">Loading curricula...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
                <th className="py-2 px-2.5 w-8 text-center">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" />
                </th>
                <th className="py-2 px-2.5 w-8"></th>
                <th onClick={() => handleSort('class_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Class</span><span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span></div>
                </th>
                <th onClick={() => handleSort('subject_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Subject</span><span className="text-gray-400 font-normal">{getSortIcon('subject_name')}</span></div>
                </th>
                <th onClick={() => handleSort('board_framework')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Board</span><span className="text-gray-400 font-normal">{getSortIcon('board_framework')}</span></div>
                </th>
                <th onClick={() => handleSort('chapters_count')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24 text-center">
                  <div className="flex items-center justify-center gap-1"><span>Chapters</span><span className="text-gray-400 font-normal">{getSortIcon('chapters_count')}</span></div>
                </th>
                <th className="py-2 px-2.5 w-24 text-center">Hours</th>
                <th onClick={() => handleSort('completion_percent')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-28 text-center">
                  <div className="flex items-center justify-center gap-1"><span>Progress</span><span className="text-gray-400 font-normal">{getSortIcon('completion_percent')}</span></div>
                </th>
                <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center select-none">
                  <div className="flex items-center justify-center gap-1"><span>Status</span><span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span></div>
                </th>
                <th className="py-2 px-2.5 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Layers className="w-10 h-10 text-gray-300" />
                      <h4 className="text-[13px] font-bold text-gray-900">No curricula found</h4>
                      <p className="text-xs text-gray-400">Get started by creating a curriculum or importing from Excel.</p>
                      {!showTrashed && (
                        <button onClick={openAddModal}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition mt-1">
                          Add Curriculum
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-blue-50/10 transition-colors text-gray-700">
                      <td className="py-1.5 px-2.5 text-center">
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" />
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <button onClick={() => toggleExpandRow(item.id)} className="p-0.5 hover:bg-gray-100 rounded transition">
                          {expandedId === item.id ? <ChevronDown className="w-3.5 h-3.5 text-blue-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-gray-800">
                        <div>{item.class_name || getClassName(item.class_id)}</div>
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
                      <td className="py-1.5 px-2.5">
                        {item.board_framework ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            {item.board_framework}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-600 font-medium">
                          <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.chapters_count || 0}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.total_est_hours || 0}h</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                (item.completion_percent || 0) === 100 ? 'bg-green-500' :
                                (item.completion_percent || 0) > 50 ? 'bg-blue-500' :
                                (item.completion_percent || 0) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${item.completion_percent || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 min-w-[28px]">{item.completion_percent || 0}%</span>
                        </div>
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

                    {/* ── EXPANDED CHAPTER SUB-TABLE ── */}
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <div className="bg-indigo-50/30 border-t border-b border-indigo-100 px-6 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[12px] font-bold text-indigo-800 flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-500" />
                                Chapters — {item.class_name} / {item.subject?.name}
                              </h4>
                              {!showTrashed && (
                                <button onClick={() => openAddChapter(item.id)}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-semibold transition">
                                  <Plus className="w-3 h-3" /> Add Chapter
                                </button>
                              )}
                            </div>

                            {loadingChapters ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                              </div>
                            ) : expandedChapters.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-xs">
                                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                No chapters defined yet. Add the first chapter.
                              </div>
                            ) : (
                              <table className="w-full text-[10px] border-collapse">
                                <thead>
                                  <tr className="text-[8px] uppercase font-bold text-indigo-600 border-b border-indigo-200/60">
                                    <th className="py-1.5 px-2 w-12 text-center">#</th>
                                    <th className="py-1.5 px-2">Title</th>
                                    <th className="py-1.5 px-2 w-16 text-center">Hours</th>
                                    <th className="py-1.5 px-2 w-24">Method</th>
                                    <th className="py-1.5 px-2 w-24">Assessment</th>
                                    <th className="py-1.5 px-2 w-20 text-center">Status</th>
                                    <th className="py-1.5 px-2 w-16 text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-100/50">
                                  {expandedChapters.map(ch => (
                                    <tr key={ch.id} className="hover:bg-white/60 transition-colors">
                                      <td className="py-1.5 px-2 text-center font-bold text-indigo-700">{ch.chapter_no}</td>
                                      <td className="py-1.5 px-2 font-semibold text-gray-800">
                                        <div>{ch.title}</div>
                                        {ch.description && <div className="text-[9px] font-normal text-slate-400 truncate max-w-[300px]">{ch.description}</div>}
                                      </td>
                                      <td className="py-1.5 px-2 text-center font-medium text-slate-600">{ch.estimated_hours}h</td>
                                      <td className="py-1.5 px-2 text-slate-500">{ch.teaching_methodology || '—'}</td>
                                      <td className="py-1.5 px-2 text-slate-500">{ch.assessment_type || '—'}</td>
                                      <td className="py-1.5 px-2 text-center">
                                        <button onClick={() => handleToggleChapterStatus(item.id, ch.id)} className="cursor-pointer" title="Click to cycle status">
                                          {getStatusBadge(ch.status)}
                                        </button>
                                      </td>
                                      <td className="py-1.5 px-2 text-center">
                                        <div className="flex items-center justify-center gap-0.5">
                                          {!showTrashed && (
                                            <>
                                              <button onClick={() => openEditChapter(item.id, ch)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button onClick={() => handleDeleteChapter(item.id, ch.id)} className="p-0.5 text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
            of <span className="font-semibold text-gray-800">{filteredData.length}</span> curricula
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
         ADD/EDIT CURRICULUM MODAL
      ═══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{editingItem ? 'Edit Curriculum' : 'Add New Curriculum'}</h3>
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
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Board / Framework</label>
                  <SearchableSelect
                    options={boardFormOptions}
                    value={formData.board_framework}
                    onChange={(val) => setFormData((p: any) => ({ ...p, board_framework: val }))}
                    placeholder="Select Board"
                    isClearable
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" placeholder="Curriculum overview..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={(e) => setFormData((p: any) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" placeholder="Internal notes..." />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
                <button type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow font-semibold text-xs hover:from-indigo-700 hover:to-blue-700 transition">
                  {editingItem ? 'Save Changes' : 'Create Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         ADD/EDIT CHAPTER MODAL
      ═══════════════════════════════════════ */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{editingChapter ? 'Edit Chapter' : 'Add Chapter'}</h3>
              <button onClick={() => setIsChapterModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleChapterSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Chapter No. *</label>
                  <input type="number" min="1" value={chapterForm.chapter_no}
                    onChange={(e) => setChapterForm((p: any) => ({ ...p, chapter_no: parseInt(e.target.value) || 1 }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Est. Hours</label>
                  <input type="number" min="1" max="100" value={chapterForm.estimated_hours}
                    onChange={(e) => setChapterForm((p: any) => ({ ...p, estimated_hours: parseInt(e.target.value) || 4 }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Status</label>
                  <select value={chapterForm.status} onChange={(e) => setChapterForm((p: any) => ({ ...p, status: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Chapter Title *</label>
                <input type="text" value={chapterForm.title} onChange={(e) => setChapterForm((p: any) => ({ ...p, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="e.g. Real Numbers, Kinematics" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Topics / Description</label>
                <textarea rows={2} value={chapterForm.description} onChange={(e) => setChapterForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="Topics covered in this chapter..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Learning Objectives</label>
                <textarea rows={2} value={chapterForm.learning_objectives} onChange={(e) => setChapterForm((p: any) => ({ ...p, learning_objectives: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="What students should learn..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Teaching Method</label>
                  <select value={chapterForm.teaching_methodology} onChange={(e) => setChapterForm((p: any) => ({ ...p, teaching_methodology: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white">
                    <option value="">Select Method</option>
                    {METHODOLOGIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Assessment Type</label>
                  <select value={chapterForm.assessment_type} onChange={(e) => setChapterForm((p: any) => ({ ...p, assessment_type: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white">
                    <option value="">Select Type</option>
                    {ASSESSMENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Resources / Materials</label>
                <textarea rows={2} value={chapterForm.resources_materials} onChange={(e) => setChapterForm((p: any) => ({ ...p, resources_materials: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" placeholder="Textbook pages, lab equipment, reference links..." />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => setIsChapterModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
                <button type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow font-semibold text-xs hover:from-violet-700 hover:to-indigo-700 transition">
                  {editingChapter ? 'Save Changes' : 'Add Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         IMPORT PREVIEW MODAL
      ═══════════════════════════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden">
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
                    <th className="py-1.5 px-2 border border-gray-200">Board</th>
                    <th className="py-1.5 px-2 border border-gray-200">Description</th>
                    <th className="py-1.5 px-2 border border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1 px-2 border border-gray-200 text-center font-bold">{i + 1}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.class}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.subject}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.board}</td>
                      <td className="py-1 px-2 border border-gray-200 truncate max-w-[200px]">{row.description}</td>
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
