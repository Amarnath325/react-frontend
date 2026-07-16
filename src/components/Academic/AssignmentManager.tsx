import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Award, FileText, Calendar, Edit3, Trash2, Plus, Search,
  RotateCcw, AlertCircle, Loader2, Upload, FileSpreadsheet,
  X, CheckSquare, Clock, BookOpen, ChevronDown, ChevronUp, Download, Settings
} from 'lucide-react';
import Select from 'react-select';

/* ═══════════════════════════════════════
   TYPES & SCHEMAS
═══════════════════════════════════════ */
interface MasterOption { m_id: number; m_name: string; }
interface SubjectOpt { id: number; name: string; code: string; class_id: number; }
interface AcadYear { id: number; year_name: string; is_current: boolean; }

interface StudentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  submitted_file: string | null;
  submitted_date: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  status: 'Pending' | 'Submitted' | 'Graded';
  student?: {
    id: number;
    roll_number: string | null;
    user?: { id: number; first_name: string; last_name: string } | null;
  } | null;
}

interface Assignment {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  class_id: number;
  subject_id: number;
  title: string;
  instructions: string | null;
  max_marks: number;
  passing_marks: number;
  due_date: string;
  is_active: boolean;
  class_name?: string;
  subject?: { id: number; name: string; code: string } | null;
  academic_year?: AcadYear | null;
  submissions: StudentSubmission[];
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
const EMPTY_FORM = {
  class_id: '',
  subject_id: '',
  academic_year_id: '',
  title: '',
  instructions: '',
  max_marks: 50,
  passing_marks: 17,
  due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  is_active: true,
};

export default function AssignmentManager() {
  /* ── data state ── */
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredData, setFilteredData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── masters state ── */
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);
  const [acadYears, setAcadYears] = useState<AcadYear[]>([]);
  const [currentYr, setCurrentYr] = useState<AcadYear | null>(null);

  /* ── filters state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterAcadYear, setFilterAcadYear] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── sorting ── */
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /* ── selection ── */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  /* ── modals ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });

  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradingForm, setGradingForm] = useState({ marks_obtained: 0, feedback: '' });
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<StudentSubmission | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  /* ═══ API CALLS ═══ */

  const fetchMasters = useCallback(async () => {
    try {
      const res = await api.get('/school/assignments/masters');
      if (res.data.success) {
        setClasses(res.data.classes || []);
        setSubjects(res.data.subjects || []);
        setAcadYears(res.data.acad_years || []);
        setCurrentYr(res.data.current_year || null);
      }
    } catch { toast.error('Failed to load master options'); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/assignments', { params: { trashed: showTrashed ? '1' : '0' } });
      if (res.data.success) {
        setAssignments(res.data.data || []);
      }
    } catch { toast.error('Failed to load assignment blueprints'); }
    setLoading(false);
  }, [showTrashed]);

  useEffect(() => { fetchMasters(); }, [fetchMasters]);
  useEffect(() => { fetchData(); setSelectedIds([]); }, [fetchData]);

  /* ═══ FILTER & SORT ═══ */
  useEffect(() => {
    let arr = [...assignments];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.instructions || '').toLowerCase().includes(q) ||
        (a.class_name || '').toLowerCase().includes(q) ||
        (a.subject?.name || '').toLowerCase().includes(q)
      );
    }
    if (filterClass) arr = arr.filter(a => String(a.class_id) === filterClass);
    if (filterSubject) arr = arr.filter(a => String(a.subject_id) === filterSubject);
    if (filterAcadYear) arr = arr.filter(a => String(a.academic_year_id) === filterAcadYear);

    // sort
    if (sortField) {
      arr.sort((a, b) => {
        let va: any = '', vb: any = '';
        if (sortField === 'class_name') { va = a.class_name || ''; vb = b.class_name || ''; }
        else if (sortField === 'subject_name') { va = a.subject?.name || ''; vb = b.subject?.name || ''; }
        else if (sortField === 'title') { va = a.title || ''; vb = b.title || ''; }
        else if (sortField === 'due_date') { va = a.due_date || ''; vb = b.due_date || ''; }
        else if (sortField === 'is_active') { va = a.is_active ? 1 : 0; vb = b.is_active ? 1 : 0; }

        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(arr);
    setCurrentPage(1);
  }, [assignments, searchTerm, filterClass, filterSubject, filterAcadYear, sortField, sortDir]);

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

  /* ═══ SELECTION & EXPANSION ═══ */
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.includes(d.id));
  const handleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(paginatedData.map(d => d.id));
  };
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExpandRow = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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

  const openEditModal = (item: Assignment) => {
    setEditingItem(item);
    setFormData({
      class_id: String(item.class_id),
      subject_id: String(item.subject_id),
      academic_year_id: item.academic_year_id ? String(item.academic_year_id) : '',
      title: item.title || '',
      instructions: item.instructions || '',
      max_marks: item.max_marks || 50,
      passing_marks: item.passing_marks || 17,
      due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.title || !formData.due_date) {
      toast.error('Class, Subject, Title, and Due Date are required.');
      return;
    }
    if (formData.passing_marks > formData.max_marks) {
      toast.error('Passing marks cannot exceed maximum marks.');
      return;
    }
    try {
      const payload = {
        ...formData,
        class_id: parseInt(formData.class_id),
        subject_id: parseInt(formData.subject_id),
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null,
        max_marks: parseInt(formData.max_marks),
        passing_marks: parseInt(formData.passing_marks),
      };
      if (editingItem) {
        await api.put(`/school/assignments/${editingItem.id}`, payload);
        toast.success('Assignment details updated');
      } else {
        await api.post('/school/assignments', payload);
        toast.success('Assignment published with student submissions placeholders');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/school/assignments/${id}/toggle-status`);
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Move this assignment to trash? All related submissions will be hidden.')) return;
    try {
      await api.delete(`/school/assignments/${id}`);
      toast.success('Moved to trash');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/school/assignments/${id}/restore`);
      toast.success('Restored');
      fetchData();
    } catch { toast.error('Restore failed'); }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Permanently delete this assignment and all student submissions? This action is irreversible.')) return;
    try {
      await api.delete(`/school/assignments/${id}/force`);
      toast.success('Permanently deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  /* ═══ GRADING ACTIONS ═══ */
  const handleOpenGrading = (assign: Assignment, sub: StudentSubmission) => {
    setActiveAssignment(assign);
    setActiveSubmission(sub);
    setGradingForm({
      marks_obtained: sub.marks_obtained || 0,
      feedback: sub.feedback || '',
    });
    setIsGradingModalOpen(true);
  };

  const handleSaveGradesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !activeSubmission) return;
    if (gradingForm.marks_obtained < 0 || gradingForm.marks_obtained > activeAssignment.max_marks) {
      toast.error(`Marks must be between 0 and ${activeAssignment.max_marks}`);
      return;
    }
    try {
      await api.post(`/school/assignments/${activeAssignment.id}/submissions/${activeSubmission.id}/grade`, {
        marks_obtained: gradingForm.marks_obtained,
        feedback: gradingForm.feedback,
      });
      toast.success('Grades recorded successfully');
      setIsGradingModalOpen(false);
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  /* ═══ BULK ACTIONS ═══ */
  const handleBulkStatus = async (status: string) => {
    try {
      await api.post('/school/assignments/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} item(s) status updated`);
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk update failed'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} assignments?`)) return;
    try {
      await api.post('/school/assignments/bulk-delete', { ids: selectedIds, force: showTrashed });
      toast.success('Deleted successfully');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkRestore = async () => {
    try {
      await api.post('/school/assignments/bulk-restore', { ids: selectedIds });
      toast.success('Restored');
      setSelectedIds([]);
      fetchData();
    } catch { toast.error('Bulk restore failed'); }
  };

  /* ═══ IMPORT / EXPORT / TEMPLATE ═══ */
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
        title: row['Assignment Title'] || row['title'] || '',
        due_date: row['Due Date'] || row['date'] || '',
        max_marks: row['Max Marks'] || 50,
        passing_marks: row['Passing Marks'] || 17,
        instructions: row['Instructions'] || '',
        status: row['Status'] || 'Active',
      }));
      setImportPreview(preview);
      setIsImportModalOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    try {
      const res = await api.post('/school/assignments/bulk-import', { rows: importPreview });
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
    const rows = filteredData.map(a => ({
      'Class': a.class_name || '',
      'Subject': a.subject?.name || '',
      'Assignment Title': a.title || '',
      'Due Date': a.due_date ? new Date(a.due_date).toISOString().split('T')[0] : '',
      'Max Marks': a.max_marks || 50,
      'Passing Marks': a.passing_marks || 17,
      'Evaluated Submissions': a.submissions.filter(s => s.status === 'Graded').length,
      'Total Submissions': a.submissions.length,
      'Status': a.is_active ? 'Active' : 'Inactive',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assignments');
    XLSX.writeFile(wb, `Assignments_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export completed successfully');
  };

  const handleSampleDownload = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Assignments');
    const helper = wb.addWorksheet('_Lists');
    helper.state = 'hidden';

    // lists
    const classNames = classes.map(c => c.m_name);
    const subjectNames = subjects.map(s => s.name);

    classNames.forEach((n, i) => { helper.getCell(`A${i + 1}`).value = n; });
    subjectNames.forEach((n, i) => { helper.getCell(`B${i + 1}`).value = n; });
    ['Active', 'Inactive'].forEach((n, i) => { helper.getCell(`C${i + 1}`).value = n; });

    ws.columns = [
      { header: 'Class', key: 'class', width: 18 },
      { header: 'Subject', key: 'subject', width: 22 },
      { header: 'Assignment Title', key: 'title', width: 25 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Max Marks', key: 'max_marks', width: 14 },
      { header: 'Passing Marks', key: 'passing_marks', width: 16 },
      { header: 'Instructions', key: 'instructions', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // style
    ws.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
      cell.alignment = { horizontal: 'center' };
    });

    // sample row
    ws.addRow({
      class: classNames[0] || 'Class 10',
      subject: subjectNames[0] || 'Mathematics',
      title: 'Trigonometric Identities & Heights Application Project',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      max_marks: 50,
      passing_marks: 17,
      instructions: 'Prepare trigonometric identities booklet.',
      status: 'Active'
    });

    // validator cells
    for (let r = 2; r <= 100; r++) {
      ws.getCell(`A${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$A$1:$A$${Math.max(classNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`B${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$B$1:$B$${Math.max(subjectNames.length, 1)}`], showErrorMessage: true };
      ws.getCell(`H${r}`).dataValidation = { type: 'list', formulae: [`'_Lists'!$C$1:$C$2`], showErrorMessage: true };
    }

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), 'Assignments_Sample_Template.xlsx');
    toast.success('Sample template downloaded');
  };

  /* ═══ MEMOIZED SELECT OPTION LISTS ═══ */

  const classFilterOptions = useMemo(() => [
    { value: '', label: 'All Classes' },
    ...classes.map(c => ({ value: c.m_id, label: c.m_name }))
  ], [classes]);

  const subjectFilterOptions = useMemo(() => [
    { value: '', label: 'All Subjects' },
    ...subjects.map(s => ({ value: s.id, label: s.name }))
  ], [subjects]);

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

  const yearFormOptions = useMemo(() => acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') })), [acadYears]);

  const hasFilters = searchTerm || filterClass || filterSubject || filterAcadYear;

  const stats = useMemo(() => {
    const totalSubmissions = assignments.reduce((acc, a) => acc + a.submissions.length, 0);
    const totalGraded = assignments.reduce((acc, a) => acc + a.submissions.filter(s => s.status === 'Graded').length, 0);
    return {
      total: assignments.length,
      submissions: totalSubmissions,
      graded: totalGraded,
    };
  }, [assignments]);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="space-y-3 text-xs text-gray-700">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Assignment Management</h3>
            <p className="text-[12px] text-gray-500">Coordinate class projects, monitor student uploads, and record grading scores with feedback notes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Projects</span>
            <span className="text-xs font-bold text-slate-700">{stats.total}</span>
          </div>
          <div className="bg-sky-50/60 border border-sky-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-sky-500">Submissions</span>
            <span className="text-xs font-bold text-sky-700">{stats.submissions}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Evaluated</span>
            <span className="text-xs font-bold text-emerald-700">{stats.graded}</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left filters */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search assignment title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-36 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800 h-[28px]"
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
            <ToggleSwitch checked={showTrashed} onChange={() => { setShowTrashed(!showTrashed); setSelectedIds([]); setExpandedIds([]); }} />
            <span className="text-[10px] font-semibold text-gray-600 select-none">Trashed</span>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setFilterClass(''); setFilterSubject(''); setFilterAcadYear(''); }}
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
          <span>You are viewing deleted assignment blueprints. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs shadow-sm">
          <div className="text-blue-800 font-semibold">{selectedIds.length} assignment(s) selected</div>
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

      {/* ── DATA TABLE & NESTED SUBMISSIONS ── */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-gray-400 font-medium">Loading assignments log...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
                <th className="py-2 px-2.5 w-8 text-center" />
                <th className="py-2 px-2 text-center w-8">
                  <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer" />
                </th>
                <th onClick={() => handleSort('class_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Class</span><span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span></div>
                </th>
                <th onClick={() => handleSort('subject_name')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Subject</span><span className="text-gray-400 font-normal">{getSortIcon('subject_name')}</span></div>
                </th>
                <th onClick={() => handleSort('title')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none">
                  <div className="flex items-center gap-1"><span>Assignment Title & instructions</span><span className="text-gray-400 font-normal">{getSortIcon('title')}</span></div>
                </th>
                <th onClick={() => handleSort('due_date')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition text-center select-none w-24">
                  <div className="flex items-center justify-center gap-1"><span>Due Date</span><span className="text-gray-400 font-normal">{getSortIcon('due_date')}</span></div>
                </th>
                <th className="py-2 px-2.5 w-24 text-center">Marks Scheme</th>
                <th className="py-2 px-2.5 w-32 text-center">Grading Compliance</th>
                <th onClick={() => handleSort('is_active')} className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-20 text-center select-none">
                  <div className="flex items-center justify-center gap-1"><span>Status</span><span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span></div>
                </th>
                <th className="py-2 px-2.5 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Award className="w-10 h-10 text-gray-300" />
                      <h4 className="text-[13px] font-bold text-gray-900">No assignments published</h4>
                      <p className="text-xs text-gray-400">Publish a new academic project or homework assignment to start grading.</p>
                      {!showTrashed && (
                        <button onClick={openAddModal}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition mt-1">
                          Create Assignment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const isExpanded = expandedIds.includes(item.id);
                  const totalSub = item.submissions.length;
                  const gradedSub = item.submissions.filter(s => s.status === 'Graded').length;
                  const percent = totalSub > 0 ? Math.round((gradedSub / totalSub) * 100) : 0;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-blue-50/10 transition-colors text-gray-700">
                        <td className="py-1.5 px-2.5 text-center">
                          <button onClick={() => toggleExpandRow(item.id)} className="p-1 text-slate-400 hover:text-slate-600 rounded transition bg-slate-50 border border-slate-200">
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="py-1.5 px-2 text-center">
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
                        <td className="py-1.5 px-2.5 max-w-xs">
                          <div className="font-semibold text-gray-800 line-clamp-1">{item.title}</div>
                          {item.instructions && <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{item.instructions}</div>}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-semibold">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '—'}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-semibold">
                          <div className="text-[10px] text-slate-800">{item.max_marks} Max</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{item.passing_marks} Min Pass</div>
                        </td>
                        <td className="py-1.5 px-2.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                              <span>{gradedSub} / {totalSub} Graded</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1">
                              <div className={`h-1 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                            </div>
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
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Submissions Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="bg-slate-50/50 p-3 border-l-4 border-indigo-500">
                            <div className="bg-white rounded border border-slate-150 p-3 shadow-inner">
                              <h4 className="font-bold text-[10px] uppercase text-indigo-800 tracking-wider mb-2.5 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Student Submissions Registry ({item.submissions.length})
                              </h4>
                              {item.submissions.length === 0 ? (
                                <p className="text-gray-400 text-xs italic">No student submissions logged for this class.</p>
                              ) : (
                                <table className="w-full text-left text-[10px] border-collapse bg-white">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[8px] pb-1.5">
                                      <th className="pb-2">Student Name</th>
                                      <th className="pb-2 w-28">Roll No.</th>
                                      <th className="pb-2">Submitted File</th>
                                      <th className="pb-2 text-center w-24">Marks Obtained</th>
                                      <th className="pb-2">Feedback Notes</th>
                                      <th className="pb-2 text-center w-28">Review Status</th>
                                      <th className="pb-2 text-center w-24">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-gray-700">
                                    {item.submissions.map((sub) => {
                                      const studentName = sub.student?.user ? `${sub.student.user.first_name} ${sub.student.user.last_name}` : `Demo Student ${sub.id}`;
                                      const rollNo = sub.student?.roll_number || 'N/A';
                                      return (
                                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="py-2 font-semibold text-slate-800">{studentName}</td>
                                          <td className="py-2 text-slate-400 font-bold">{rollNo}</td>
                                          <td className="py-2">
                                            {sub.submitted_file ? (
                                              <a href={sub.submitted_file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer">
                                                <FileText className="w-3 h-3" />
                                                <span className="font-semibold">{sub.submitted_file}</span>
                                              </a>
                                            ) : (
                                              <span className="text-slate-300 italic">Not submitted</span>
                                            )}
                                          </td>
                                          <td className="py-2 text-center font-bold text-slate-850">
                                            {sub.status === 'Graded' ? `${sub.marks_obtained} / ${item.max_marks}` : '—'}
                                          </td>
                                          <td className="py-2 text-slate-500 italic max-w-xs truncate" title={sub.feedback || ''}>
                                            {sub.feedback || '—'}
                                          </td>
                                          <td className="py-2 text-center">
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                              sub.status === 'Graded' ? 'bg-green-50 text-green-700 border-green-200' :
                                              sub.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                              'bg-slate-100 text-slate-550 border border-slate-200 text-slate-500'
                                            }`}>
                                              {sub.status}
                                            </span>
                                          </td>
                                          <td className="py-2 text-center">
                                            {!showTrashed && sub.status !== 'Pending' ? (
                                              <button
                                                onClick={() => handleOpenGrading(item, sub)}
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded transition"
                                              >
                                                {sub.status === 'Graded' ? 'Edit Grade' : 'Grade File'}
                                              </button>
                                            ) : (
                                              <span className="text-slate-400 italic">No action</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
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
            of <span className="font-semibold text-gray-800">{filteredData.length}</span> assignments
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
         PUBLISH / EDIT ASSIGNMENT MODAL
      ═══════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">{editingItem ? 'Edit Assignment details' : 'Publish Assignment Blueprint'}</h3>
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
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((p: any) => ({ ...p, due_date: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_marks}
                    onChange={(e) => setFormData((p: any) => ({ ...p, max_marks: parseInt(e.target.value) || 50 }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.passing_marks}
                    onChange={(e) => setFormData((p: any) => ({ ...p, passing_marks: parseInt(e.target.value) || 17 }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Assignment Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  placeholder="e.g. Trigonometric Applications Project"
                  onChange={(e) => setFormData((p: any) => ({ ...p, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Instructions / Project Requirements</label>
                <textarea
                  rows={4}
                  value={formData.instructions}
                  placeholder="Describe step by step execution methods, required drawings, worksheets references..."
                  onChange={(e) => setFormData((p: any) => ({ ...p, instructions: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
                <button type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow font-semibold text-xs hover:from-indigo-700 hover:to-blue-700 transition">
                  {editingItem ? 'Save Changes' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         GRADING PANEL MODAL
      ═══════════════════════════════════════ */}
      {isGradingModalOpen && activeSubmission && activeAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Record Student Grade</h3>
              <button onClick={() => setIsGradingModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveGradesSubmit} className="p-5 space-y-3">
              <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-lg text-[10px] space-y-1 text-slate-500 font-semibold uppercase">
                <div>Student: <span className="text-slate-800 font-bold">{activeSubmission.student?.user ? `${activeSubmission.student.user.first_name} ${activeSubmission.student.user.last_name}` : `Demo Student ${activeSubmission.id}`}</span></div>
                <div>Submitted File: <span className="text-blue-600 font-bold underline">{activeSubmission.submitted_file}</span></div>
                {activeSubmission.submitted_date && <div>Uploaded Date: <span className="text-slate-800">{new Date(activeSubmission.submitted_date).toLocaleString()}</span></div>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Marks Obtained (Out of {activeAssignment.max_marks}) *</label>
                <input
                  type="number"
                  min="0"
                  max={activeAssignment.max_marks}
                  value={gradingForm.marks_obtained}
                  onChange={(e) => setGradingForm(p => ({ ...p, marks_obtained: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700 h-[34px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Evaluator Feedback Comment</label>
                <textarea
                  rows={3}
                  value={gradingForm.feedback}
                  placeholder="Explain spelling, formatting, calculation remarks..."
                  onChange={(e) => setGradingForm(p => ({ ...p, feedback: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => setIsGradingModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-semibold text-xs">Cancel</button>
                <button type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow font-semibold text-xs hover:from-indigo-700 hover:to-blue-700 transition">
                  Save Evaluation
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
                    <th className="py-1.5 px-2 border border-gray-200">Title</th>
                    <th className="py-1.5 px-2 border border-gray-200 text-center">Due Date</th>
                    <th className="py-1.5 px-2 border border-gray-200 text-center">Max Marks</th>
                    <th className="py-1.5 px-2 border border-gray-200 text-center">Passing Marks</th>
                    <th className="py-1.5 px-2 border border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1 px-2 border border-gray-200 text-center font-bold">{i + 1}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.class}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.subject}</td>
                      <td className="py-1 px-2 border border-gray-200">{row.title}</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{row.due_date}</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{row.max_marks}</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{row.passing_marks}</td>
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
