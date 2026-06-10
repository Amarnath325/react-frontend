import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem', // rounded-lg
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb', // blue-500 or gray-200
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '38px',
    backgroundColor: '#ffffff',
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
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
    fontSize: '13px',
    color: '#111827',
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: '13px',
    color: '#9ca3af',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '13px',
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
    fontSize: '13px',
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
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '13px',
    padding: '6px 12px',
  }),
};

const compactSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.375rem', // rounded-md
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '28px',
    backgroundColor: '#ffffff',
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
    transition: 'all 0.15s ease',
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: '0 8px',
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
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
  noOptionsMessage: (base: any) => ({
    ...base,
    fontSize: '11px',
    padding: '4px 8px',
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
  className = '',
  compact = false,
}) => {
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected: any) => {
          onChange(selected ? String(selected.value) : '');
        }}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={true}
        styles={compact ? compactSelectStyles : customSelectStyles}
        menuPosition="fixed"
        menuPlacement="auto"
        menuPortalTarget={document.body}
        className={compact ? 'text-[11px]' : 'text-[13px]'}
      />
    </div>
  );
};

interface ClassTeacherAssignment {
  id: number;
  school_id: number;
  academic_year_id: number;
  class_id: number;
  section_id?: number | null;
  teacher_id: number;
  is_active: boolean;
  class?: {
    m_id: number;
    m_name: string;
    m_alias_name?: string;
  };
  section?: {
    id: number;
    section: string;
  } | null;
  teacher?: {
    id: number;
    employee_id: string;
    user?: {
      first_name: string;
      last_name: string;
      email: string;
      mobile: string;
    };
  };
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
];

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const ClassTeacherManager: React.FC = () => {
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [filteredData, setFilteredData] = useState<ClassTeacherAssignment[]>([]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Search, filter & sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('class_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Trashing & check selection states
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Master options arrays
  const [classes, setClasses] = useState<{ value: number; label: string }[]>([]);
  const [teachers, setTeachers] = useState<{ value: number; label: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ value: number; label: string; is_current: boolean }[]>([]);

  // Excel import parsing states
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Section quick add & states
  const [sections, setSections] = useState<any[]>([]);
  const [showInlineSection, setShowInlineSection] = useState(false);
  const [inlineSectionName, setInlineSectionName] = useState('');
  const [inlineCapacity, setInlineCapacity] = useState(40);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    academic_year_id: '',
    class_id: '',
    section_id: '',
    teacher_id: '',
  });

  const isMounted = useRef(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch assignments silently on trashed view toggle
  useEffect(() => {
    if (isMounted.current) {
      fetchAssignmentsSilently();
    } else {
      isMounted.current = true;
    }
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [assignments, searchTerm, filterClass, sortColumn, sortDirection]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchClasses(),
        fetchTeachers(),
        fetchAcademicYears(),
        fetchSections(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/school/class-teachers?only_trashed=${showTrashed}`);
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load class teacher assignments');
    }
  };

  const fetchAssignmentsSilently = async () => {
    setTableLoading(true);
    try {
      await fetchAssignments();
      setSelectedIds([]);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        let classArray: { value: number; label: string }[] = [];
        if (Array.isArray(classesData)) {
          classArray = classesData.map((item: any) => ({
            value: item.id || item.m_id || item.value || 0,
            label: item.name || item.m_name || item.label || '',
          }));
        } else if (typeof classesData === 'object' && classesData !== null) {
          classArray = Object.entries(classesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
        }
        setClasses(classArray);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/school/teachers');
      if (response.data.success) {
        const teachersData = response.data.data.map((teacher: any) => ({
          value: teacher.id,
          label: `${teacher.user?.first_name || ''} ${teacher.user?.last_name || ''}`.trim() + ` (${teacher.employee_id || ''})`,
        }));
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/school/academic-years');
      if (response.data.success) {
        const years = response.data.data.map((y: any) => ({
          value: y.id,
          label: y.name,
          is_current: y.is_current,
        }));
        setAcademicYears(years);

        // Pre-select current academic year in form
        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) {
          setFormData(prev => ({ ...prev, academic_year_id: currentYear.value.toString() }));
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await api.get('/school/sections');
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...assignments];

    // Apply Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const teacherName = `${item.teacher?.user?.first_name || ''} ${item.teacher?.user?.last_name || ''}`.toLowerCase();
        const className = (item.class?.m_alias_name || item.class?.m_name || '').toLowerCase();
        const sectionName = (item.section?.section || '').toLowerCase();
        const employeeId = (item.teacher?.employee_id || '').toLowerCase();
        return teacherName.includes(lower) || className.includes(lower) || sectionName.includes(lower) || employeeId.includes(lower);
      });
    }

    // Apply Class Filter
    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortColumn === 'class_name') {
        const aSec = a.section?.section ? ` - ${a.section.section}` : '';
        const bSec = b.section?.section ? ` - ${b.section.section}` : '';
        aVal = (a.class?.m_alias_name || a.class?.m_name || '') + aSec;
        bVal = (b.class?.m_alias_name || b.class?.m_name || '') + bSec;
      } else if (sortColumn === 'teacher_name') {
        aVal = `${a.teacher?.user?.first_name || ''} ${a.teacher?.user?.last_name || ''}`;
        bVal = `${b.teacher?.user?.first_name || ''} ${b.teacher?.user?.last_name || ''}`;
      } else if (sortColumn === 'employee_id') {
        aVal = a.teacher?.employee_id || '';
        bVal = b.teacher?.employee_id || '';
      }

      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
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
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
  };

  // Pagination details
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAddModal = () => {
    const currentYear = academicYears.find(y => y.is_current);
    setFormData({
      academic_year_id: currentYear ? currentYear.value.toString() : '',
      class_id: '',
      section_id: '',
      teacher_id: '',
    });
    setShowInlineSection(false);
    setInlineSectionName('');
    setInlineCapacity(40);
    setIsModalOpen(true);
  };

  const handleCreateSectionInline = async () => {
    if (!inlineSectionName) {
      toast.error('Section name is required');
      return;
    }
    if (!formData.academic_year_id) {
      toast.error('Please select an Academic Year first');
      return;
    }
    if (!formData.class_id) {
      toast.error('Please select a Class first');
      return;
    }

    setInlineSubmitting(true);
    try {
      const response = await api.post('/school/sections', {
        academic_year_id: parseInt(formData.academic_year_id),
        class_id: parseInt(formData.class_id),
        section_name: inlineSectionName,
        capacity: inlineCapacity,
        is_active: true,
      });

      if (response.data.success) {
        toast.success('Section created successfully!');
        // Refresh section list
        const responseSections = await api.get('/school/sections');
        if (responseSections.data.success) {
          const updatedSections = responseSections.data.data;
          setSections(updatedSections);

          // Find the newly created section ID
          const newSec = response.data.data;
          if (newSec && newSec.id) {
            setFormData(prev => ({ ...prev, section_id: String(newSec.id) }));
          }
        }
        // Reset inline form
        setInlineSectionName('');
        setInlineCapacity(40);
        setShowInlineSection(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create section');
    } finally {
      setInlineSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.teacher_id) {
      toast.error('Please select both Class and Teacher');
      return;
    }

    setTableLoading(true);
    try {
      const response = await api.post('/school/class-teachers', {
        class_id: parseInt(formData.class_id),
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
        teacher_id: parseInt(formData.teacher_id),
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null,
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Class teacher assigned successfully');
        setIsModalOpen(false);
        await fetchAssignments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign class teacher');
    } finally {
      setTableLoading(false);
    }
  };

  // Row Selection logic
  const handleSelectAllToggle = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map(item => item.id));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = paginatedData.length > 0 && selectedIds.length === paginatedData.length;

  // Optimistic Single Actions
  const handleRemoveAssignment = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this class teacher assignment?')) {
      return;
    }

    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.delete(`/school/class-teachers/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || 'Assignment removed successfully');
      } else {
        setAssignments(previousAssignments);
        toast.error('Failed to remove assignment');
      }
    } catch (error: any) {
      setAssignments(previousAssignments);
      toast.error(error.response?.data?.message || 'Failed to remove assignment');
    }
  };

  const handleRestore = async (id: number) => {
    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.post(`/school/class-teachers/${id}/restore`);
      if (response.data.success) {
        toast.success(response.data.message || 'Assignment restored successfully');
      } else {
        setAssignments(previousAssignments);
        toast.error('Failed to restore assignment');
      }
    } catch (error: any) {
      setAssignments(previousAssignments);
      toast.error(error.response?.data?.message || 'Failed to restore assignment');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this assignment? This cannot be undone.')) {
      return;
    }

    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.delete(`/school/class-teachers/${id}/force`);
      if (response.data.success) {
        toast.success(response.data.message || 'Assignment permanently deleted');
      } else {
        setAssignments(previousAssignments);
        toast.error('Failed to permanently delete assignment');
      }
    } catch (error: any) {
      setAssignments(previousAssignments);
      toast.error(error.response?.data?.message || 'Failed to permanently delete assignment');
    }
  };

  // Optimistic Bulk Actions
  const handleBulkDelete = async (force = false) => {
    const promptMessage = force
      ? 'Are you sure you want to permanently delete the selected assignments? This cannot be undone.'
      : 'Are you sure you want to delete the selected assignments?';

    if (!window.confirm(promptMessage)) return;

    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(item => !selectedIds.includes(item.id)));
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const response = await api.post('/school/class-teachers/bulk-delete', {
        ids: idsToProcess,
        force: force
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk deletion completed successfully');
      } else {
        setAssignments(previousAssignments);
        setSelectedIds(idsToProcess);
        toast.error('Failed to delete selected assignments');
      }
    } catch (error: any) {
      setAssignments(previousAssignments);
      setSelectedIds(idsToProcess);
      toast.error(error.response?.data?.message || 'Failed to delete selected assignments');
    }
  };

  const handleBulkRestore = async () => {
    const previousAssignments = [...assignments];
    setAssignments(prev => prev.filter(item => !selectedIds.includes(item.id)));
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const response = await api.post('/school/class-teachers/bulk-restore', {
        ids: idsToProcess
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk restore completed successfully');
      } else {
        setAssignments(previousAssignments);
        setSelectedIds(idsToProcess);
        toast.error('Failed to restore selected assignments');
      }
    } catch (error: any) {
      setAssignments(previousAssignments);
      setSelectedIds(idsToProcess);
      toast.error(error.response?.data?.message || 'Failed to restore selected assignments');
    }
  };

  // Client-Side Excel Export
  const handleExport = () => {
    try {
      const data = filteredData.map(item => ({
        'Academic Year': academicYears.find(y => y.value === item.academic_year_id)?.label || '—',
        'Class': item.class?.m_alias_name || item.class?.m_name || '—',
        'Section': item.section?.section || '—',
        'Class Teacher': `${item.teacher?.user?.first_name || ''} ${item.teacher?.user?.last_name || ''}`.trim() || '—',
        'Employee ID': item.teacher?.employee_id || '—',
        'Email Address': item.teacher?.user?.email || '—',
        'Mobile No': item.teacher?.user?.mobile || '—',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Class Teachers');
      XLSX.writeFile(wb, `class_teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Client-Side Excel Sample Template Generation
  const downloadSampleFile = async () => {
    try {
      const academicYearValues = academicYears.map(y => y.label);
      const classValues = classes.map(c => c.label);
      const teacherValues = teachers.map(t => t.label);
      const uniqueSectionNames = Array.from(new Set(sections.map(s => s.section).filter(Boolean)));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Class Teachers');

      worksheet.columns = [
        { header: 'Academic Year', key: 'Academic Year', width: 20 },
        { header: 'Class', key: 'Class', width: 15 },
        { header: 'Section', key: 'Section', width: 12 },
        { header: 'Class Teacher', key: 'Class Teacher', width: 25 },
      ];

      // Add dummy row for reference
      worksheet.addRow({
        'Academic Year': academicYearValues[0] || '2025-2026',
        'Class': classValues[0] || 'Class 1',
        'Section': uniqueSectionNames[0] || 'A',
        'Class Teacher': teacherValues[0] || 'John Doe (T101)',
      });

      // Write option lists to helper columns P, Q, R, S
      worksheet.getCell('P1').value = 'Academic_Year_List';
      worksheet.getCell('Q1').value = 'Class_List';
      worksheet.getCell('R1').value = 'Teacher_List';
      worksheet.getCell('S1').value = 'Section_List';

      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      classValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });
      teacherValues.forEach((val, idx) => {
        worksheet.getCell(`R${idx + 2}`).value = val;
      });
      uniqueSectionNames.forEach((val, idx) => {
        worksheet.getCell(`S${idx + 2}`).value = val;
      });

      // Hide helper columns P to S
      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;
      worksheet.getColumn('S').hidden = true;

      // Apply data validation to rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        if (academicYearValues.length > 0) {
          worksheet.getCell(`A${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Class Teachers'!$P$2:$P$${1 + academicYearValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select an academic year from the dropdown list.',
          };
        }

        if (classValues.length > 0) {
          worksheet.getCell(`B${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Class Teachers'!$Q$2:$Q$${1 + classValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a class from the dropdown list.',
          };
        }

        if (uniqueSectionNames.length > 0) {
          worksheet.getCell(`C${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Class Teachers'!$S$2:$S$${1 + uniqueSectionNames.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a section from the dropdown list.',
          };
        }

        if (teacherValues.length > 0) {
          worksheet.getCell(`D${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Class Teachers'!$R$2:$R$${1 + teacherValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select a teacher from the dropdown list.',
          };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_class_teachers.xlsx');
      toast.success('Sample template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
    }
  };

  // Client-Side Excel File Upload Parser
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

        const validRows = jsonData.filter((row: any) => row['Academic Year'] && row['Class'] && row['Class Teacher']);

        if (validRows.length === 0) {
          toast.error('No valid data found in the file. Academic Year, Class, and Class Teacher are required.');
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
  };

  // Process Bulk Import Payload assembly
  const processImport = async () => {
    setImporting(true);
    const payload: any[] = [];
    let failed = 0;

    importData.forEach((row: any) => {
      const yearItem = academicYears.find(y => y.label.split(' ')[0] === String(row['Academic Year']).split(' ')[0]);
      const classItem = classes.find(c => c.label.toLowerCase() === String(row['Class']).toLowerCase());

      let sectionId: number | null = null;
      if (row['Section']) {
        const secStr = String(row['Section']).trim().toLowerCase();
        const sectionItem = sections.find(s =>
          classItem &&
          String(s.class_id) === String(classItem.value) &&
          String(s.section).toLowerCase() === secStr
        );
        if (sectionItem) {
          sectionId = sectionItem.id;
        }
      }

      // Teacher label might have the employee ID in parentheses, e.g. "John Doe (T101)"
      const teacherStr = String(row['Class Teacher']).toLowerCase();
      const teacherItem = teachers.find(t => {
        const label = t.label.toLowerCase();
        return label.includes(teacherStr) || teacherStr.includes(label);
      });

      if (classItem && teacherItem) {
        payload.push({
          academic_year_id: yearItem ? yearItem.value : null,
          class_id: classItem.value,
          section_id: sectionId,
          teacher_id: teacherItem.value,
        });
      } else {
        failed++;
      }
    });

    if (payload.length === 0) {
      toast.error('Could not map any Excel rows to database Classes and Teachers.');
      setImporting(false);
      return;
    }

    try {
      const response = await api.post('/school/class-teachers/bulk-import', { data: payload });
      if (response.data.success) {
        toast.success(`Import completed: ${response.data.imported_count} assigned, ${response.data.error_count + failed} failed`);
        setIsImportModalOpen(false);
        fetchAssignments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs text-gray-500 font-medium">Loading assignments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs relative">
      {/* Loading Overlay */}
      {tableLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Assign Teacher</h3>
          <p className="text-[12px] text-gray-500">Map teachers to classes for the current academic year</p>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 rounded px-2 py-0.5 text-center min-w-[70px]">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">Assignments</span>
          <span className="text-xs font-bold text-blue-700">{assignments.length}</span>
        </div>
      </div>

      {/* Toolbar Area */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search teacher, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-52 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Class Filter */}
          <SearchableSelect
            options={classes}
            value={filterClass}
            onChange={(val) => setFilterClass(val)}
            placeholder="All Classes"
            isClearable={true}
            className="w-40 text-xs"
            compact={true}
          />

          {/* Page Limit Selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? -1 : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Trashed view switch */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-[18px]' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {(searchTerm || filterClass) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
            title="Download Excel Sample Template"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Sample
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition cursor-pointer text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>

          {!showTrashed && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Assign Teacher
            </button>
          )}
        </div>
      </div>

      {/* Trashed Info Banner */}
      {showTrashed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted assignments. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs transition-all duration-300">
          <div className="text-blue-800 font-semibold">
            {selectedIds.length} item(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {showTrashed ? (
              <>
                <button
                  onClick={handleBulkRestore}
                  className="px-2.5 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
                >
                  Restore Selected
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
                >
                  Delete Permanently
                </button>
              </>
            ) : (
              <button
                onClick={() => handleBulkDelete(false)}
                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-250 rounded-lg bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/80 text-gray-700 font-semibold uppercase text-[9px] whitespace-nowrap">
              <th className="py-2 px-2.5 w-8 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllToggle}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('class_name')}
                className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Class</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('teacher_name')}
                className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Class Teacher</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('teacher_name')}</span>
                </div>
              </th>
              <th className="py-2 px-3">Email Address</th>
              <th className="py-2 px-3">Mobile No</th>
              <th className="py-2 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No Assignments Found</h4>
                    <p className="text-xs text-gray-500">There are no assignments configured in this view.</p>
                    {!showTrashed && (
                      <button
                        onClick={openAddModal}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                      >
                        Assign New Teacher
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const teacherName = `${item.teacher?.user?.first_name || ''} ${item.teacher?.user?.last_name || ''}`.trim() || 'Teacher';
                const initials = teacherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const avatarColor = getAvatarColor(teacherName);

                return (
                  <tr key={item.id} className="hover:bg-blue-50/10 transition-colors text-gray-700">
                    <td className="py-1.5 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-800">
                      {item.class?.m_alias_name || item.class?.m_name || '—'}
                      {item.section?.section ? ` - ${item.section.section}` : ''}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} text-white font-bold flex items-center justify-center text-[10px] shadow-sm`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-950">{teacherName}</div>
                          <div className="text-[9px] text-gray-400">ID: {item.teacher?.employee_id || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {item.teacher?.user?.email || '—'}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {item.teacher?.user?.mobile || '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {showTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 transition"
                              title="Restore Assignment"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleForceDelete(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                              title="Delete Permanently"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRemoveAssignment(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                            title="Remove Assignment"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="flex items-center justify-between border border-gray-250 bg-white px-4 py-2 rounded-lg shadow-sm text-xs mt-3">
          <span className="text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{filteredData.length}</span> entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              ‹
            </button>
            <span className="text-[11px] text-gray-650 px-1.5 font-medium">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-visible border border-gray-100 transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white rounded-t-xl">
              <h3 className="text-sm font-bold">Assign Teacher</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Academic Year select */}
                <div>
                  <label className={lbl}>Academic Year *</label>
                  <SearchableSelect
                    options={academicYears}
                    value={formData.academic_year_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, academic_year_id: val }))}
                    placeholder="Select Academic Year"
                    compact={true}
                  />
                </div>

                {/* Class select */}
                <div>
                  <label className={lbl}>Class *</label>
                  <SearchableSelect
                    options={classes}
                    value={formData.class_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, class_id: val, section_id: '' }))}
                    placeholder="Select Class"
                    compact={true}
                  />
                </div>

                {/* Section select with inline creator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      Section
                    </label>
                    {formData.class_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineSection(prev => !prev);
                          setInlineSectionName('');
                          setInlineCapacity(40);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline focus:outline-none"
                      >
                        {showInlineSection ? '✕ Cancel' : '+ Add New'}
                      </button>
                    )}
                  </div>
                  {showInlineSection ? (
                    <div className="bg-gray-50 border border-gray-250/70 rounded-lg p-2 mt-1 space-y-1.5">
                      <div className="font-bold text-[9px] text-gray-700 uppercase tracking-wide">Quick Add Section</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-gray-500 mb-0.5 uppercase">Section Name *</label>
                          <input
                            type="text"
                            value={inlineSectionName}
                            onChange={(e) => setInlineSectionName(e.target.value.toUpperCase())}
                            placeholder="e.g. A"
                            className="w-full px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-gray-500 mb-0.5 uppercase">Capacity</label>
                          <input
                            type="number"
                            value={inlineCapacity}
                            onChange={(e) => setInlineCapacity(parseInt(e.target.value) || 40)}
                            placeholder="40"
                            className="w-full px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={1}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineSection(false);
                            setInlineSectionName('');
                            setInlineCapacity(40);
                          }}
                          className="px-2 py-0.5 text-[9px] font-semibold border border-gray-300 rounded text-gray-700 hover:bg-gray-150 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateSectionInline}
                          disabled={inlineSubmitting}
                          className="px-2.5 py-0.5 text-[9px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {inlineSubmitting ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SearchableSelect
                      options={sections
                        .filter(s => String(s.class_id) === String(formData.class_id))
                        .map(s => ({ value: s.id, label: s.section }))}
                      value={formData.section_id}
                      onChange={(val) => setFormData(prev => ({ ...prev, section_id: val }))}
                      placeholder={formData.class_id ? "Select Section (Optional)" : "Select Class First"}
                      isClearable={true}
                      compact={true}
                    />
                  )}
                </div>

                {/* Teacher select */}
                <div>
                  <label className={lbl}>Teacher *</label>
                  <SearchableSelect
                    options={teachers}
                    value={formData.teacher_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, teacher_id: val }))}
                    placeholder="Select Teacher"
                    compact={true}
                  />
                </div>

                {/* Info Note */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-[10px] text-blue-700 leading-normal">
                  <strong>Note:</strong> Each class can only have one active class teacher, and each teacher can only be assigned to one class. Creating this assignment will automatically deactivate any overlapping active assignments.
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-base font-bold">Import Class Teachers Preview</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/85 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs text-gray-500">
                Below is a preview of the first 5 records parsed from your file. Confirm the import to save all parsed records ({importData.length} total).
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-55 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-4">Row</th>
                      <th className="py-2.5 px-4">Academic Year</th>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4">Section</th>
                      <th className="py-2.5 px-4">Class Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 text-gray-700">
                        <td className="py-2 px-4 font-semibold text-gray-400">{idx + 2}</td>
                        <td className="py-2 px-4">{row['Academic Year'] || '—'}</td>
                        <td className="py-2 px-4 font-medium">{row['Class'] || '—'}</td>
                        <td className="py-2 px-4 font-medium">{row['Section'] || '—'}</td>
                        <td className="py-2 px-4">{row['Class Teacher'] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold transition"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
                disabled={importing}
              >
                {importing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full inline-block" />
                    Importing...
                  </>
                ) : (
                  <>Confirm Import</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherManager;
