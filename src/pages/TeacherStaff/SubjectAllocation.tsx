import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  BookOpen, Search, Plus, Trash2, X, RotateCcw,
  AlertCircle, Loader2, Upload, Download,
  Clock, MapPin, Edit2, FileSpreadsheet
} from 'lucide-react';

/* ═══════════════════════════════════════
   TYPES
═══════════════════════════════════════ */
interface Subject {
  id: number;
  name: string;
  code: string;
  subject_type: string;
  class_id: number;
  is_elective: boolean;
  is_active: boolean;
}

interface Teacher {
  id: number;
  name: string;
  employee_id: string;
  department?: string;
  designation?: string;
}

interface SectionOpt {
  id: number;
  name: string;
  class_id: number;
}

interface AcadYear {
  id: number;
  year_name: string;
  is_current: boolean;
}

interface Allocation {
  id: number;
  school_id: number;
  academic_year_id: number | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number;
  weekly_periods: number | null;
  classroom_lab: string | null;
  is_active: boolean;
  notes: string | null;
  deleted_at: string | null;
  subject?: Subject;
  teacher?: {
    id: number;
    employee_id: string;
    user?: { first_name: string; last_name: string };
  };
  academic_year?: { id: number; year_name: string; is_current: boolean };
  section?: { id: number; name: string };
  class_model?: { m_id: number; m_name: string };
}

interface MasterOption {
  value: number;
  label: string;
}

/* ═══════════════════════════════════════
   TOGGLE SWITCH COMPONENT (COMPACT DESIGN)
═══════════════════════════════════════ */
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
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

const EMPTY_FORM = {
  class_id: '',
  section_id: '',
  subject_id: '',
  teacher_id: '',
  academic_year_id: '',
  weekly_periods: '',
  classroom_lab: '',
  notes: '',
  is_active: true,
};

export default function SubjectAllocation() {
  /* ── data state ── */
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Allocation | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* ── masters dropdown lists ── */
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [sections, setSections] = useState<SectionOpt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [acadYears, setAcadYears] = useState<AcadYear[]>([]);
  const [currentYr, setCurrentYr] = useState<AcadYear | null>(null);

  /* ── filters state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterAcadYear, setFilterAcadYear] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showTrashed, setShowTrashed] = useState(false);

  /* ── pagination state ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ── sorting state ── */
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  /* ── forms ── */
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  /* ── import state ── */
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  /* ═══ FETCH MASTER DATA ═══ */
  const fetchMasters = useCallback(async () => {
    try {
      const res = await api.get('/school/subject-allocations/masters');
      if (res.data.success) {
        setClasses((res.data.classes || []).map((c: any) => ({ value: c.m_id, label: c.m_name })));
        setSections(res.data.sections || []);
        setSubjects(res.data.subjects || []);
        setTeachers(res.data.teachers || []);
        setAcadYears(res.data.acad_years || []);
        setCurrentYr(res.data.current_year || null);
        if (res.data.current_year) {
          setFilterAcadYear(String(res.data.current_year.id));
          setFormData(prev => ({ ...prev, academic_year_id: String(res.data.current_year.id) }));
        }
      }
    } catch {
      toast.error('Failed to load master data');
    }
  }, []);

  /* ═══ FETCH ALLOCATIONS ═══ */
  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/school/subject-allocations', {
        params: {
          only_trashed: showTrashed ? true : undefined,
        }
      });
      if (res.data.success) {
        setAllocations(res.data.data || []);
      }
    } catch {
      toast.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  }, [showTrashed]);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  /* ═══ SORTING & FILTER DATA ═══ */
  useEffect(() => {
    let result = [...allocations];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(item => {
        const subjectName = item.subject?.name?.toLowerCase() || '';
        const subjectCode = item.subject?.code?.toLowerCase() || '';
        const teacherName = item.teacher?.user ? `${item.teacher.user.first_name} ${item.teacher.user.last_name || ''}`.toLowerCase() : '';
        const room = item.classroom_lab?.toLowerCase() || '';
        return subjectName.includes(s) || subjectCode.includes(s) || teacherName.includes(s) || room.includes(s);
      });
    }

    if (filterClass) {
      result = result.filter(item => String(item.class_id) === filterClass);
    }

    if (filterTeacher) {
      result = result.filter(item => String(item.teacher_id) === filterTeacher);
    }

    if (filterAcadYear) {
      result = result.filter(item => String(item.academic_year_id) === filterAcadYear);
    }

    if (filterStatus) {
      result = result.filter(item => String(item.is_active) === filterStatus);
    }

    // Sort result
    result.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Allocation] ?? '';
      let bVal: any = b[sortColumn as keyof Allocation] ?? '';

      // Nested resolution
      if (sortColumn === 'class_name') {
        aVal = getClassName(a.class_id);
        bVal = getClassName(b.class_id);
      } else if (sortColumn === 'subject_name') {
        aVal = a.subject?.name || '';
        bVal = b.subject?.name || '';
      } else if (sortColumn === 'teacher_name') {
        aVal = getTeacherName(a);
        bVal = getTeacherName(b);
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAllocations(result);
    setCurrentPage(1);
  }, [allocations, searchTerm, filterClass, filterTeacher, filterAcadYear, filterStatus, sortColumn, sortDirection]);

  // Clean selection on pagination/filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, filterClass, filterTeacher, filterAcadYear, filterStatus, showTrashed, currentPage, itemsPerPage]);

  /* ═══ HELPER FORMATTERS ═══ */
  const getClassName = (id: number) => {
    const cls = classes.find(c => c.value === id);
    return cls?.label || `Class ${id}`;
  };

  const getTeacherName = (item: Allocation) => {
    return item.teacher?.user
      ? `${item.teacher.user.first_name} ${item.teacher.user.last_name || ''}`.trim()
      : 'Unknown';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  /* ═══ SECTIONS & SUBJECT OPTIONS DYNAMIC MAPPING ═══ */
  const availableSections = useMemo(() => {
    if (!formData.class_id) return [];
    return sections
      .filter(s => String(s.class_id) === String(formData.class_id))
      .map(s => ({ value: s.id, label: s.name }));
  }, [sections, formData.class_id]);

  const availableSubjects = useMemo(() => {
    if (!formData.class_id) return [];
    return subjects
      .filter(s => String(s.class_id) === String(formData.class_id))
      .map(s => ({ value: s.id, label: `${s.name} (${s.code || 'N/A'})` }));
  }, [subjects, formData.class_id]);

  const teacherOptions = useMemo(() => {
    return teachers.map(t => ({ value: t.id, label: `${t.name} (${t.employee_id})` }));
  }, [teachers]);

  const yearOptions = useMemo(() => {
    return acadYears.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (Current)' : '') }));
  }, [acadYears]);

  /* ═══ PAGINATION HELPERS ═══ */
  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1;
    return Math.ceil(filteredAllocations.length / itemsPerPage);
  }, [filteredAllocations, itemsPerPage]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredAllocations;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAllocations.slice(start, start + itemsPerPage);
  }, [filteredAllocations, currentPage, itemsPerPage]);

  /* ═══ BULK / SINGLE SELECTION ═══ */
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const pageIds = paginatedData.map(d => d.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(d => selectedIds.includes(d.id));

  /* ═══ CRUD HANDLERS ═══ */
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      academic_year_id: currentYr ? String(currentYr.id) : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Allocation) => {
    setEditingItem(item);
    setFormData({
      class_id: String(item.class_id),
      section_id: item.section_id ? String(item.section_id) : '',
      subject_id: String(item.subject_id),
      teacher_id: String(item.teacher_id),
      academic_year_id: item.academic_year_id ? String(item.academic_year_id) : '',
      weekly_periods: item.weekly_periods ? String(item.weekly_periods) : '',
      classroom_lab: item.classroom_lab || '',
      notes: item.notes || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.subject_id || !formData.teacher_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    const payload = {
      class_id: Number(formData.class_id),
      section_id: formData.section_id ? Number(formData.section_id) : null,
      subject_id: Number(formData.subject_id),
      teacher_id: Number(formData.teacher_id),
      academic_year_id: formData.academic_year_id ? Number(formData.academic_year_id) : null,
      weekly_periods: formData.weekly_periods ? Number(formData.weekly_periods) : null,
      classroom_lab: formData.classroom_lab || null,
      notes: formData.notes || null,
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        await api.put(`/school/subject-allocations/${editingItem.id}`, payload);
        toast.success('Allocation updated successfully');
      } else {
        await api.post('/school/subject-allocations', payload);
        toast.success('Subject teacher allocated successfully');
      }
      setIsModalOpen(false);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await api.patch(`/school/subject-allocations/${id}/toggle-status`);
      if (res.data.success) {
        toast.success('Status updated');
        fetchAllocations();
      }
    } catch {
      toast.error('Failed to change status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      const res = await api.delete(`/school/subject-allocations/${id}`);
      if (res.data.success) {
        toast.success('Deleted successfully');
        fetchAllocations();
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await api.post(`/school/subject-allocations/${id}/restore`);
      if (res.data.success) {
        toast.success('Restored successfully');
        fetchAllocations();
      }
    } catch {
      toast.error('Restore failed');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('This will permanently delete the allocation. Are you sure?')) return;
    try {
      const res = await api.delete(`/school/subject-allocations/${id}/force`);
      if (res.data.success) {
        toast.success('Permanently deleted');
        fetchAllocations();
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  /* ═══ BULK HANDLERS ═══ */
  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/school/subject-allocations/bulk-status', {
        ids: selectedIds,
        status,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchAllocations();
      }
    } catch {
      toast.error('Bulk status update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const msg = showTrashed
      ? `Are you sure you want to permanently delete these ${selectedIds.length} allocations?`
      : `Are you sure you want to delete these ${selectedIds.length} allocations?`;
    if (!window.confirm(msg)) return;

    try {
      const res = await api.post('/school/subject-allocations/bulk-delete', {
        ids: selectedIds,
        force: showTrashed,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchAllocations();
      }
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} allocations?`)) return;

    try {
      const res = await api.post('/school/subject-allocations/bulk-restore', {
        ids: selectedIds,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchAllocations();
      }
    } catch {
      toast.error('Bulk restore failed');
    }
  };

  /* ═══ IMPORT / EXPORT / SAMPLE EXCEL GENERATION ═══ */
  const handleExport = () => {
    try {
      const data = filteredAllocations.map(item => ({
        'Class': getClassName(item.class_id),
        'Section': item.section?.name || 'All Sections',
        'Subject Name': item.subject?.name || '',
        'Subject Code': item.subject?.code || '',
        'Teacher Name': getTeacherName(item),
        'Periods Per Week': item.weekly_periods || '',
        'Classroom / Lab': item.classroom_lab || '',
        'Status': item.is_active ? 'Active' : 'Inactive',
        'Notes': item.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Allocations');
      XLSX.writeFile(wb, `subject_allocations_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const classLabels = classes.map(c => c.label);
      const sectionLabels = sections.map(s => `${getClassName(s.class_id)} - ${s.name}`);
      const subjectLabels = subjects.map(s => `${getClassName(s.class_id)}: ${s.name} (${s.code || 'N/A'})`);
      const teacherLabels = teachers.map(t => `${t.name} (${t.employee_id})`);
      const statusValues = ['Active', 'Inactive'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Allocations');

      worksheet.columns = [
        { header: 'Class Name', key: 'Class', width: 20 },
        { header: 'Section Name', key: 'Section', width: 25 },
        { header: 'Subject Name (Code)', key: 'Subject', width: 35 },
        { header: 'Teacher Name (ID)', key: 'Teacher', width: 30 },
        { header: 'Periods Per Week', key: 'Periods', width: 18 },
        { header: 'Classroom / Lab', key: 'Room', width: 18 },
        { header: 'Status', key: 'Status', width: 12 },
      ];

      // Insert mock data row for illustration
      if (classLabels.length > 0 && teacherLabels.length > 0) {
        worksheet.getCell('A2').value = classLabels[0];
        worksheet.getCell('B2').value = sections.find(s => s.class_id === classes[0].value)?.name || 'All Sections';
        const classSubj = subjects.find(s => s.class_id === classes[0].value);
        worksheet.getCell('C2').value = classSubj ? `${classLabels[0]}: ${classSubj.name} (${classSubj.code || 'N/A'})` : '';
        worksheet.getCell('D2').value = teacherLabels[0];
        worksheet.getCell('E2').value = 6;
        worksheet.getCell('F2').value = 'Room 302';
        worksheet.getCell('G2').value = 'Active';
      }

      // Write lists data to helper columns P, Q, R, S, T
      worksheet.getCell('P1').value = 'Class_List';
      worksheet.getCell('Q1').value = 'Section_List';
      worksheet.getCell('R1').value = 'Subject_List';
      worksheet.getCell('S1').value = 'Teacher_List';
      worksheet.getCell('T1').value = 'Status_List';

      classLabels.forEach((val, idx) => { worksheet.getCell(`P${idx + 2}`).value = val; });
      sectionLabels.forEach((val, idx) => { worksheet.getCell(`Q${idx + 2}`).value = val; });
      subjectLabels.forEach((val, idx) => { worksheet.getCell(`R${idx + 2}`).value = val; });
      teacherLabels.forEach((val, idx) => { worksheet.getCell(`S${idx + 2}`).value = val; });
      statusValues.forEach((val, idx) => { worksheet.getCell(`T${idx + 2}`).value = val; });

      // Hide helper columns P to T
      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;
      worksheet.getColumn('S').hidden = true;
      worksheet.getColumn('T').hidden = true;

      // Apply data validation for 100 rows
      for (let r = 2; r <= 100; r++) {
        worksheet.getCell(`A${r}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`'Allocations'!$P$2:$P$${1 + classLabels.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid class from the dropdown list.',
        };

        worksheet.getCell(`B${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Allocations'!$Q$2:$Q$${1 + sectionLabels.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid section or leave empty.',
        };

        worksheet.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`'Allocations'!$R$2:$R$${1 + subjectLabels.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid subject.',
        };

        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`'Allocations'!$S$2:$S$${1 + teacherLabels.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid teacher.',
        };

        worksheet.getCell(`G${r}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`'Allocations'!$T$2:$T$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_subject_allocations.xlsx');
      toast.success('Sample file downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate sample file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRows = jsonData.filter(row => row['Class Name'] && row['Subject Name (Code)'] && row['Teacher Name (ID)']);

        if (validRows.length === 0) {
          toast.error('No valid records found in spreadsheet.');
          return;
        }

        setImportData(validRows);
        setImportPreview(validRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch {
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const processImport = async () => {
    setImporting(true);
    let ok = 0, fail = 0;

    for (const row of importData) {
      try {
        // Resolve Class ID
        const matchClass = classes.find(c => c.label === row['Class Name']);
        if (!matchClass) { fail++; continue; }

        // Resolve Section ID (Optional)
        let secId: number | null = null;
        if (row['Section Name']) {
          const matchSec = sections.find(s => s.name === row['Section Name'] && s.class_id === matchClass.value);
          if (matchSec) secId = matchSec.id;
        }

        // Resolve Subject ID
        const matchSubj = subjects.find(s => {
          const formatted = `${getClassName(s.class_id)}: ${s.name} (${s.code || 'N/A'})`;
          return formatted === row['Subject Name (Code)'];
        });
        if (!matchSubj) { fail++; continue; }

        // Resolve Teacher ID
        const matchTch = teachers.find(t => `${t.name} (${t.employee_id})` === row['Teacher Name (ID)']);
        if (!matchTch) { fail++; continue; }

        const submitPayload = {
          class_id: matchClass.value,
          section_id: secId,
          subject_id: matchSubj.id,
          teacher_id: matchTch.id,
          academic_year_id: currentYr ? currentYr.id : null,
          weekly_periods: row['Periods Per Week'] ? Number(row['Periods Per Week']) : null,
          classroom_lab: row['Classroom / Lab'] || null,
          is_active: row['Status']?.toLowerCase() !== 'inactive',
        };

        await api.post('/school/subject-allocations', submitPayload);
        ok++;
      } catch {
        fail++;
      }
    }

    toast.success(`Import completed: ${ok} succeeded, ${fail} failed`);
    setIsImportModalOpen(false);
    fetchAllocations();
    setImporting(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
    setFilterTeacher('');
    setFilterStatus('');
  };

  const hasFilters = searchTerm || filterClass || filterTeacher || filterStatus;

  const activeCount = useMemo(() => {
    return allocations.filter(a => a.is_active).length;
  }, [allocations]);

  return (
    <div className="space-y-3 text-xs text-gray-700">
      {/* ── HEADER AREA (MATCHING DEPARTMENT MANAGEMENT ICON + TITLE + SUBTITLE LAYOUT) ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-650 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Teacher Subject Allocation</h3>
            <p className="text-[12px] text-gray-500">Assign subjects, sections, and classroom responsibilities to teaching staff</p>
          </div>
        </div>

        {/* Dynamic header stats badge */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{allocations.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR AREA (EXACTLY MATCHES DEPARTMENT MANAGEMENT COLOR, GAP, ALIGNMENT, BUTTONS) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search by teacher, subject, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-48 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-800"
            />
          </div>

          {/* Class select */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white font-semibold text-gray-700 min-w-[110px]"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {/* Teacher select */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white font-semibold text-gray-700 min-w-[120px]"
          >
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {/* Academic Year select */}
          <select
            value={filterAcadYear}
            onChange={(e) => setFilterAcadYear(e.target.value)}
            className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white font-semibold text-gray-700 min-w-[100px]"
          >
            <option value="">All Years</option>
            {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>

          {/* Status select */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white font-semibold text-gray-700 min-w-[90px]"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 select-none">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-gray-750 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>

          {/* Show Trashed Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => {
                setShowTrashed(prev => !prev);
                setSelectedIds([]);
              }}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-4.5' : 'translate-x-1'}`} />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right side: Action Buttons matching Department Manager styling */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
            title="Download Excel Sample Template"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Sample
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
            <Upload className="w-3.5 h-3.5 text-gray-500" /> Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" /> Export
          </button>

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>
      </div>

      {/* ── TRASHED WARNING AREA ── */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>You are viewing deleted allocations. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs shadow-sm">
          <div className="text-blue-800 font-semibold">
            {selectedIds.length} allocation(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button
                  onClick={() => handleBulkStatus('active')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-105 text-green-705 font-medium transition"
                >
                  Active
                </button>
                <button
                  onClick={() => handleBulkStatus('inactive')}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-105 text-red-700 font-medium transition"
                >
                  Inactive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-105 text-green-700 font-medium transition"
                >
                  Restore
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-705 font-medium transition"
                >
                  Delete Permanently
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 bg-gray-250 text-gray-700 rounded hover:bg-gray-300 font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── TABLE VIEW CONTAINING DYNAMIC SORTING BADGES ── */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-gray-400 font-medium">Loading allocation records...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
                <th className="py-2 px-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('class_name')}
                  className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Class & Section</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('subject_name')}
                  className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Subject</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('subject_name')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('teacher_name')}
                  className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Assigned Teacher</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('teacher_name')}</span>
                  </div>
                </th>
                <th className="py-2 px-2.5 w-28">Periods / Week</th>
                <th className="py-2 px-2.5 w-28">Classroom / Lab</th>
                <th
                  onClick={() => handleSort('is_active')}
                  className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition w-24 text-center select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span>
                  </div>
                </th>
                <th className="py-2 px-2.5 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <BookOpen className="w-10 h-10 text-gray-300" />
                      <h4 className="text-[13px] font-bold text-gray-900">No allocations found</h4>
                      <p className="text-xs text-gray-400">Get started by creating a subject allocation or importing from Excel.</p>
                      {!showTrashed && (
                        <button
                          onClick={openAddModal}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition mt-1"
                        >
                          Add Allocation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                    <td className="py-1.5 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="py-1.5 px-2.5 font-semibold text-gray-800">
                      <div>{getClassName(item.class_id)}</div>
                      {item.section && <div className="text-[9px] font-normal text-slate-400">Section {item.section.name}</div>}
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
                    <td className="py-1.5 px-2.5 font-semibold text-gray-800">
                      {getTeacherName(item)}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="flex items-center gap-1 text-slate-505 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.weekly_periods ? `${item.weekly_periods} periods` : '—'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="flex items-center gap-1 text-slate-505 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.classroom_lab || '—'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ToggleSwitch
                          checked={item.is_active}
                          onChange={() => handleToggleStatus(item.id)}
                          disabled={showTrashed}
                        />
                        <span className={`text-[10px] font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {showTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded hover:text-green-650 transition"
                              title="Restore"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                              title="Delete"
                            >
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

      {/* Pagination Controls */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-2 rounded-lg shadow-sm text-xs select-none">
          <span className="text-gray-500">
            Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredAllocations.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{filteredAllocations.length}</span> allocations
          </span>

          <div className="flex items-center gap-1 font-semibold">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition"
            >
              ‹
            </button>
            <span className="text-[11px] text-gray-650 px-1.5">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] hover:bg-gray-50 transition"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT ALLOCATION MODAL ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-150 transform transition-all duration-200">
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold">{editingItem ? 'Edit Subject Allocation' : 'Add New Subject Allocation'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-2.5">
              {/* Class Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Class Name *</label>
                <select
                  required
                  value={formData.class_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value, section_id: '', subject_id: '' }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  <option value="">Select Class *</option>
                  {classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Section (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Section (Optional)</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, section_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  <option value="">All Sections</option>
                  {availableSections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Subject *</label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  <option value="">Select Subject *</option>
                  {availableSubjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Assigned Teacher *</label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  <option value="">Select Teacher *</option>
                  {teacherOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Weekly Periods & Classroom Lab */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Periods / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.weekly_periods}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekly_periods: e.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Classroom / Lab</label>
                  <input
                    type="text"
                    value={formData.classroom_lab}
                    onChange={(e) => setFormData(prev => ({ ...prev, classroom_lab: e.target.value }))}
                    placeholder="e.g. Room 302"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional responsibility instructions..."
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white resize-none font-medium"
                />
              </div>

              {/* Toggle is_active */}
              <div className="flex items-center justify-between bg-slate-50 border border-gray-250 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700">
                <span>Active Status</span>
                <ToggleSwitch
                  checked={formData.is_active}
                  onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 text-xs font-semibold border border-gray-200 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EXCEL IMPORT PREVIEW MODAL ── */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-150 transform transition-all duration-200">
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 flex justify-between items-center text-white">
              <h3 className="text-sm font-bold">Import Allocations Preview</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50 space-y-3">
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex justify-between items-center">
                <span className="font-medium">Total spreadsheet rows found: <strong>{importData.length}</strong></span>
                <span className="text-[10px] font-bold bg-blue-150 px-2 py-0.5 rounded tracking-wide uppercase">Preview showing up to 5 rows</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 font-semibold text-gray-500 uppercase text-[9px]">
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3">Subject Name (Code)</th>
                      <th className="py-2 px-3">Teacher Name (ID)</th>
                      <th className="py-2 px-3">Periods</th>
                      <th className="py-2 px-3">Classroom / Lab</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/45 text-gray-600">
                        <td className="py-2 px-3 font-semibold text-gray-800">{row['Class Name']}</td>
                        <td className="py-2 px-3">{row['Section Name'] || 'All'}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{row['Subject Name (Code)']}</td>
                        <td className="py-2 px-3">{row['Teacher Name (ID)']}</td>
                        <td className="py-2 px-3 font-semibold text-gray-800">{row['Periods Per Week']}</td>
                        <td className="py-2 px-3">{row['Classroom / Lab'] || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${row['Status']?.toLowerCase() !== 'inactive' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-650'}`}>
                            {row['Status'] || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                disabled={importing}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-650 hover:bg-blue-700 rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Import All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
