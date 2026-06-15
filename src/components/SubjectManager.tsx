import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
interface SubjectData {
  id: number;
  school_id: number;
  class_id: number;
  name: string;
  code: string;
  subject_type: string;
  max_marks: number;
  passing_marks: number;
  theory_max_marks?: number | null;
  theory_passing_marks?: number | null;
  practical_max_marks?: number | null;
  practical_passing_marks?: number | null;
  is_elective: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  class_name?: string;
}

interface MasterOption {
  value: number;
  label: string;
}

const EMPTY_FORM = {
  class_id: '',
  name: '',
  code: '',
  subject_type: '',
  max_marks: 100,
  passing_marks: 33,
  theory_max_marks: '',
  theory_passing_marks: '',
  practical_max_marks: '',
  practical_passing_marks: '',
  is_elective: false,
  is_active: true,
};

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
    borderColorHover: state.isFocused ? '#3b82f6' : '#d1d5db',
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
  required?: boolean;
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
        className={compact ? "text-[11px]" : "text-[13px]"}
      />
    </div>
  );
};

// Toggle Switch Component (Compact size - matches Show Trashed switch size)
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

const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [filteredData, setFilteredData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubjectData | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterSubjectType, setFilterSubjectType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Master data states
  const [classes, setClasses] = useState<MasterOption[]>([]);
  const [subjectTypeOptions, setSubjectTypeOptions] = useState<MasterOption[]>([]);
  const [showTrashed, setShowTrashed] = useState(false);

  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // Bulk import state
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const getSubjectTypeLabel = (type: any) => {
    const sType = subjectTypeOptions.find(t => String(t.value) === String(type));
    return sType ? sType.label : (type || 'N/A');
  };

  const getSubjectTypeColor = (type: any) => {
    const label = getSubjectTypeLabel(type).toLowerCase();
    if (label.includes('theory') && label.includes('practical')) {
      return 'bg-violet-50 text-violet-700 border-violet-150';
    }
    if (label.includes('practical')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-150';
    }
    if (label.includes('theory')) {
      return 'bg-blue-50 text-blue-700 border-blue-150';
    }
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const isTheorySelected = () => {
    const selectedType = subjectTypeOptions.find(opt => String(opt.value) === String(formData.subject_type));
    if (!selectedType) return false;
    const label = selectedType.label.toLowerCase();
    return label.includes('theory');
  };

  const isPracticalSelected = () => {
    const selectedType = subjectTypeOptions.find(opt => String(opt.value) === String(formData.subject_type));
    if (!selectedType) return false;
    const label = selectedType.label.toLowerCase();
    return label.includes('practical');
  };

  const getTheoryError = () => {
    if (!isTheorySelected()) return null;
    const maxStr = formData.theory_max_marks;
    const passStr = formData.theory_passing_marks;
    if (maxStr && (Number(maxStr) < 0 || Number(maxStr) > 1000)) return "Theory Max Marks must be between 0 and 1000";
    if (passStr && (Number(passStr) < 0 || Number(passStr) > 1000)) return "Theory Passing Marks must be between 0 and 1000";
    if (maxStr && passStr && Number(passStr) > Number(maxStr)) {
      return "Theory Passing Marks cannot be greater than Theory Max Marks";
    }
    return null;
  };

  const getPracticalError = () => {
    if (!isPracticalSelected()) return null;
    const maxStr = formData.practical_max_marks;
    const passStr = formData.practical_passing_marks;
    if (maxStr && (Number(maxStr) < 0 || Number(maxStr) > 1000)) return "Practical Max Marks must be between 0 and 1000";
    if (passStr && (Number(passStr) < 0 || Number(passStr) > 1000)) return "Practical Passing Marks must be between 0 and 1000";
    if (maxStr && passStr && Number(passStr) > Number(maxStr)) {
      return "Practical Passing Marks cannot be greater than Practical Max Marks";
    }
    return null;
  };

  const getTotalError = () => {
    const max = Number(formData.max_marks) || 0;
    const pass = Number(formData.passing_marks) || 0;
    if (pass > max) {
      return "Total Passing Marks cannot be greater than Total Max Marks";
    }
    return null;
  };

  const hasValidationErrors = () => {
    return getTheoryError() !== null || getPracticalError() !== null || getTotalError() !== null;
  };

  useEffect(() => {
    const showTheory = isTheorySelected();
    const showPractical = isPracticalSelected();

    const theoryMax = showTheory ? (Number(formData.theory_max_marks) || 0) : 0;
    const practicalMax = showPractical ? (Number(formData.practical_max_marks) || 0) : 0;
    const theoryPass = showTheory ? (Number(formData.theory_passing_marks) || 0) : 0;
    const practicalPass = showPractical ? (Number(formData.practical_passing_marks) || 0) : 0;

    setFormData(prev => ({
      ...prev,
      max_marks: theoryMax + practicalMax,
      passing_marks: theoryPass + practicalPass,
    }));
  }, [
    formData.theory_max_marks,
    formData.practical_max_marks,
    formData.theory_passing_marks,
    formData.practical_passing_marks,
    formData.subject_type,
    subjectTypeOptions
  ]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [subjects, searchTerm, filterClass, filterSubjectType, filterStatus, sortColumn, sortDirection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubjects(),
        fetchClasses(),
        fetchSubjectTypes(),
      ]);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/school/subjects', {
        params: { only_trashed: showTrashed }
      });
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [showTrashed]);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, filterClass, filterSubjectType, filterStatus, showTrashed, currentPage]);

  const handleRestore = async (id: number) => {
    if (!confirm('Are you sure you want to restore this subject?')) return;
    try {
      const response = await api.post(`/school/subjects/${id}/restore`);
      if (response.data.success) {
        toast.success('Subject restored successfully');
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore subject');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this subject? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/subjects/${id}/force`);
      if (response.data.success) {
        toast.success('Subject permanently deleted');
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete subject');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/master/classes');
      if (response.data.success) {
        const classesData = response.data.data;
        let classArray: MasterOption[] = [];
        if (typeof classesData === 'object' && !Array.isArray(classesData)) {
          classArray = Object.entries(classesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
        }
        setClasses(classArray);
      }
    } catch { /* silent */ }
  };

  const fetchSubjectTypes = async () => {
    try {
      const response = await api.get('/master/subject-types');
      if (response.data.success) {
        const typesData = response.data.data;
        let typesArray: MasterOption[] = [];
        if (typeof typesData === 'object' && !Array.isArray(typesData)) {
          typesArray = Object.entries(typesData).map(([id, name]) => ({
            value: parseInt(id),
            label: name as string,
          }));
        }
        setSubjectTypeOptions(typesArray);
      }
    } catch { /* silent */ }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...subjects];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.class_name && item.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterClass) {
      filtered = filtered.filter(item => item.class_id.toString() === filterClass);
    }

    if (filterSubjectType) {
      filtered = filtered.filter(item => String(item.subject_type) === filterSubjectType);
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.is_active.toString() === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof SubjectData];
      let bVal: any = b[sortColumn as keyof SubjectData];

      if (sortColumn === 'class_name') {
        aVal = getClassName(a.class_id);
        bVal = getClassName(b.class_id);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (col: string) => {
    if (sortColumn !== col) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
    setFilterSubjectType('');
    setFilterStatus('');
  };

  const hasFilters = !!(searchTerm || filterClass || filterSubjectType || filterStatus);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedData.map(item => item.id);
      setSelectedIds(prev => {
        const newSelection = [...prev];
        pageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Accept only digits for mark fields
    if ([
      'theory_max_marks',
      'theory_passing_marks',
      'practical_max_marks',
      'practical_passing_marks',
      'max_marks',
      'passing_marks'
    ].includes(name)) {
      const cleanValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      ...EMPTY_FORM,
      subject_type: subjectTypeOptions[0]?.value.toString() || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SubjectData) => {
    setEditingItem(item);
    setFormData({
      class_id: item.class_id.toString(),
      name: item.name,
      code: item.code || '',
      subject_type: item.subject_type ? item.subject_type.toString() : '',
      max_marks: item.max_marks,
      passing_marks: item.passing_marks,
      theory_max_marks: item.theory_max_marks ? item.theory_max_marks.toString() : '',
      theory_passing_marks: item.theory_passing_marks ? item.theory_passing_marks.toString() : '',
      practical_max_marks: item.practical_max_marks ? item.practical_max_marks.toString() : '',
      practical_passing_marks: item.practical_passing_marks ? item.practical_passing_marks.toString() : '',
      is_elective: item.is_elective,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_id || !formData.name) {
      toast.error('Please fill all required fields');
      return;
    }

    const showTheory = isTheorySelected();
    const showPractical = isPracticalSelected();

    const validateMarkField = (val: string, fieldName: string, min: number, max: number) => {
      if (val === '') return true;
      const num = Number(val);
      if (isNaN(num)) {
        toast.error(`${fieldName} must be a number`);
        return false;
      }
      if (num < min || num > max) {
        toast.error(`${fieldName} must be between ${min} and ${max}`);
        return false;
      }
      return true;
    };

    if (showTheory) {
      if (!formData.theory_max_marks || !formData.theory_passing_marks) {
        toast.error('Please fill theory max and passing marks');
        return;
      }
      if (!validateMarkField(formData.theory_max_marks, 'Theory Max Marks', 0, 1000)) return;
      if (!validateMarkField(formData.theory_passing_marks, 'Theory Passing Marks', 0, 1000)) return;
      if (Number(formData.theory_passing_marks) > Number(formData.theory_max_marks)) {
        toast.error('Theory passing marks cannot be greater than theory max marks');
        return;
      }
    }

    if (showPractical) {
      if (!formData.practical_max_marks || !formData.practical_passing_marks) {
        toast.error('Please fill practical max and passing marks');
        return;
      }
      if (!validateMarkField(formData.practical_max_marks, 'Practical Max Marks', 0, 1000)) return;
      if (!validateMarkField(formData.practical_passing_marks, 'Practical Passing Marks', 0, 1000)) return;
      if (Number(formData.practical_passing_marks) > Number(formData.practical_max_marks)) {
        toast.error('Practical passing marks cannot be greater than practical max marks');
        return;
      }
    }

    if (Number(formData.passing_marks) > Number(formData.max_marks)) {
      toast.error('Total passing marks cannot be greater than total max marks');
      return;
    }

    try {
      const submitData = {
        class_id: parseInt(formData.class_id),
        name: formData.name,
        code: formData.code || null,
        subject_type: isNaN(Number(formData.subject_type)) ? formData.subject_type : parseInt(formData.subject_type),
        max_marks: Number(formData.max_marks),
        passing_marks: Number(formData.passing_marks),
        theory_max_marks: showTheory && formData.theory_max_marks !== '' ? Number(formData.theory_max_marks) : null,
        theory_passing_marks: showTheory && formData.theory_passing_marks !== '' ? Number(formData.theory_passing_marks) : null,
        practical_max_marks: showPractical && formData.practical_max_marks !== '' ? Number(formData.practical_max_marks) : null,
        practical_passing_marks: showPractical && formData.practical_passing_marks !== '' ? Number(formData.practical_passing_marks) : null,
        is_elective: formData.is_elective,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const response = await api.put(`/school/subjects/${editingItem.id}`, submitData);
        if (response.data.success) {
          toast.success('Subject updated successfully');
        }
      } else {
        const response = await api.post('/school/subjects', submitData);
        if (response.data.success) {
          toast.success('Subject created successfully');
        }
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    try {
      const response = await api.delete(`/school/subjects/${id}`);
      if (response.data.success) {
        toast.success('Subject deleted');
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/school/subjects/${id}/toggle-status`);
      if (response.data.success) {
        toast.success('Status updated');
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return;
    try {
      const response = await api.post('/school/subjects/bulk-status', {
        status,
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        setSelectedIds([]);
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmMessage = showTrashed
      ? `Are you sure you want to permanently delete these ${selectedIds.length} subjects? This action cannot be undone.`
      : `Are you sure you want to delete these ${selectedIds.length} subjects?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await api.post('/school/subjects/bulk-delete', {
        ids: selectedIds,
        force: showTrashed
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Subjects deleted successfully');
        setSelectedIds([]);
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete subjects');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to restore these ${selectedIds.length} subjects?`)) return;

    try {
      const response = await api.post('/school/subjects/bulk-restore', {
        ids: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Subjects restored successfully');
        setSelectedIds([]);
        fetchSubjects();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore subjects');
    }
  };

  const getClassName = (id: number) => {
    const cls = classes.find(c => c.value === id);
    return cls?.label || 'N/A';
  };

  // Excel Import/Export
  const handleExport = () => {
    try {
      const data = filteredData.map(item => ({
        'Class': getClassName(item.class_id),
        'Subject Name': item.name,
        'Subject Code': item.code || '-',
        'Subject Type': getSubjectTypeLabel(item.subject_type),
        'Max Marks': item.max_marks,
        'Passing Marks': item.passing_marks,
        'Elective': item.is_elective ? 'Yes' : 'No',
        'Status': item.is_active ? 'Active' : 'Inactive',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
      XLSX.writeFile(wb, `subjects_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  const downloadSampleFile = async () => {
    try {
      const classValues = classes.length > 0
        ? classes.map(c => c.label)
        : ['Class 1', 'Class 2'];
      const subjectTypeValues = subjectTypeOptions.length > 0
        ? subjectTypeOptions.map(t => t.label)
        : ['Theory', 'Practical', 'Theory + Practical'];
      const electiveValues = ['Yes', 'No'];
      const statusValues = ['Active', 'Inactive'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Subjects');

      // Set column headers and widths
      worksheet.columns = [
        { header: 'Class', key: 'Class', width: 15 },
        { header: 'Subject Name', key: 'Subject Name', width: 25 },
        { header: 'Subject Code', key: 'Subject Code', width: 15 },
        { header: 'Subject Type', key: 'Subject Type', width: 20 },
        { header: 'Theory Max Marks', key: 'Theory Max Marks', width: 18 },
        { header: 'Theory Passing Marks', key: 'Theory Passing Marks', width: 20 },
        { header: 'Practical Max Marks', key: 'Practical Max Marks', width: 18 },
        { header: 'Practical Passing Marks', key: 'Practical Passing Marks', width: 20 },
        { header: 'Max Marks', key: 'Max Marks', width: 12 },
        { header: 'Passing Marks', key: 'Passing Marks', width: 15 },
        { header: 'Elective', key: 'Elective', width: 12 },
        { header: 'Status', key: 'Status', width: 12 },
      ];

      // Add a sample row for every class to make it dynamic and complete
      classValues.forEach((className, idx) => {
        const r = idx + 2;
        worksheet.getCell(`A${r}`).value = className;
        worksheet.getCell(`B${r}`).value = 'Mathematics';
        worksheet.getCell(`C${r}`).value = `${className.replace(/\s+/g, '').toUpperCase()}101`;
        worksheet.getCell(`D${r}`).value = subjectTypeValues[0];
        worksheet.getCell(`E${r}`).value = 70;
        worksheet.getCell(`F${r}`).value = 23;
        worksheet.getCell(`G${r}`).value = 30;
        worksheet.getCell(`H${r}`).value = 10;
        worksheet.getCell(`K${r}`).value = 'No';
        worksheet.getCell(`L${r}`).value = 'Active';
      });

      // Write lists data to helper columns P, Q, R, S
      worksheet.getCell('P1').value = 'Class_List';
      worksheet.getCell('Q1').value = 'Subject_Type_List';
      worksheet.getCell('R1').value = 'Elective_List';
      worksheet.getCell('S1').value = 'Status_List';

      classValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      subjectTypeValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });
      electiveValues.forEach((val, idx) => {
        worksheet.getCell(`R${idx + 2}`).value = val;
      });
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`S${idx + 2}`).value = val;
      });

      // Hide helper columns P to S
      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;
      worksheet.getColumn('R').hidden = true;
      worksheet.getColumn('S').hidden = true;

      // Apply data validation and formulas to columns for rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        // Set formulas for Max Marks and Passing Marks
        worksheet.getCell(`I${r}`).value = { formula: `IF(AND(ISBLANK(E${r}),ISBLANK(G${r})),"",SUM(E${r},G${r}))` };
        worksheet.getCell(`J${r}`).value = { formula: `IF(AND(ISBLANK(F${r}),ISBLANK(H${r})),"",SUM(F${r},H${r}))` };

        // Class validation (Col A)
        worksheet.getCell(`A${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Subjects'!$P$2:$P$${1 + classValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        // Subject Type validation (Col D)
        worksheet.getCell(`D${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Subjects'!$Q$2:$Q$${1 + subjectTypeValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select an item from the dropdown list.',
        };

        // Elective validation (Col K)
        worksheet.getCell(`K${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Subjects'!$R$2:$R$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };

        // Status validation (Col L)
        worksheet.getCell(`L${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Subjects'!$S$2:$S$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_subjects.xlsx');
      toast.success('Sample file downloaded!');
    } catch (error) {
      console.error('Error downloading sample file:', error);
      toast.error('Failed to download sample file');
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

        // Filter out empty rows or helper columns rows by requiring Class and Subject Name
        const validRows = jsonData.filter((row: any) => row['Class'] && row['Subject Name']);

        if (validRows.length === 0) {
          toast.error('No valid data found in the file. Make sure Class and Subject Name are filled.');
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

  const processImport = async () => {
    setImporting(true);
    let ok = 0, fail = 0;

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      try {
        const classItem = classes.find(c => c.label === row['Class']);
        if (!classItem) {
          fail++;
          continue;
        }

        const importLabel = row['Subject Type'] || '';
        const matchedType = subjectTypeOptions.find(
          t => t.label.toLowerCase() === importLabel.toLowerCase()
        ) || subjectTypeOptions[0];

        const submitData = {
          class_id: classItem.value,
          name: row['Subject Name'],
          code: row['Subject Code'] || null,
          subject_type: matchedType ? matchedType.value : null,
          max_marks: Number(row['Max Marks']) || (Number(row['Theory Max Marks']) || 0) + (Number(row['Practical Max Marks']) || 0) || 100,
          passing_marks: Number(row['Passing Marks']) || (Number(row['Theory Passing Marks']) || 0) + (Number(row['Practical Passing Marks']) || 0) || 33,
          theory_max_marks: row['Theory Max Marks'] !== undefined && row['Theory Max Marks'] !== '' ? Number(row['Theory Max Marks']) : null,
          theory_passing_marks: row['Theory Passing Marks'] !== undefined && row['Theory Passing Marks'] !== '' ? Number(row['Theory Passing Marks']) : null,
          practical_max_marks: row['Practical Max Marks'] !== undefined && row['Practical Max Marks'] !== '' ? Number(row['Practical Max Marks']) : null,
          practical_passing_marks: row['Practical Passing Marks'] !== undefined && row['Practical Passing Marks'] !== '' ? Number(row['Practical Passing Marks']) : null,
          is_elective: row['Elective']?.toLowerCase() === 'yes',
          is_active: row['Status']?.toLowerCase() === 'active',
        };

        await api.post('/school/subjects', submitData);
        ok++;
      } catch {
        fail++;
      }
    }

    toast.success(`Import completed: ${ok} success, ${fail} failed`);
    setIsImportModalOpen(false);
    fetchSubjects();
    setImporting(false);
  };

  // ─── stats ───────────────────────────────────────────────
  const totalActive = subjects.filter(s => s.is_active).length;
  const totalElectives = subjects.filter(s => s.is_elective).length;

  // ─── shared input classes ────────────────────────────────
  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const lbl = 'block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading subjects…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Subject Management</h3>
          <p className="text-[12px] text-gray-500">Manage academic subjects, types, grading criteria and class mappings</p>
        </div>

        {/* stats */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{subjects.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{totalActive}</span>
          </div>
          <div className="bg-orange-50/60 border border-orange-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-orange-500">Elective</span>
            <span className="text-xs font-bold text-slate-700">{totalElectives}</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar Area ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Search input & filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search subjects, codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>

          {/* Class filter */}
          <SearchableSelect
            options={classes}
            value={filterClass}
            onChange={(val) => setFilterClass(val)}
            placeholder="All Classes"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          {/* Type filter */}
          <SearchableSelect
            options={subjectTypeOptions}
            value={filterSubjectType}
            onChange={(val) => setFilterSubjectType(val)}
            placeholder="All Types"
            isClearable={true}
            className="w-32 text-xs"
            compact={true}
          />

          {/* Status filter */}
          <SearchableSelect
            options={statusOptions}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="All Status"
            isClearable={true}
            className="w-28 text-xs"
            compact={true}
          />

          {/* Pagination limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-500 font-semibold uppercase"></span>
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

          {/* Show Trashed Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[11px] font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
              />
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

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-1.5" style={{ marginTop: "-30px" }}>
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
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition text-xs font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add New
            </button>
          )}
        </div>
      </div>

      {/* ── Table Container ── */}
      {
        showTrashed && (
          <div className="bg-red-50 border-b border-red-105 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
            <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>You are viewing deleted subjects. You can restore them or permanently delete them below.</span>
          </div>
        )
      }

      {/* Bulk Actions Bar */}
      {
        selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
            <div className="text-blue-800 font-semibold">
              {selectedIds.length} item(s) selected
            </div>
            <div className="flex items-center gap-1.5">
              {!showTrashed ? (
                <>
                  <button
                    onClick={() => handleBulkStatus('active')}
                    className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleBulkStatus('inactive')}
                    className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium"
                  >
                    Inactive
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-0.5 bg-red-650 text-white rounded hover:bg-red-700 font-medium"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBulkRestore}
                    className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium"
                  >
                    Restore
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-0.5 bg-red-650 text-white rounded hover:bg-red-700 font-medium"
                  >
                    Delete Permanently
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      }

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
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Class</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('class_name')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Subject Name</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('name')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('code')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Subject Code</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('code')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('subject_type')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Type</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('subject_type')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('max_marks')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Max Marks</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('max_marks')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('passing_marks')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Passing Marks</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('passing_marks')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('is_elective')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Elective</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('is_elective')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('is_active')}
                className="py-2 px-2.5 cursor-pointer hover:bg-gray-100 transition select-none w-24"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('is_active')}</span>
                </div>
              </th>
              <th className="py-2 px-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No subjects found</h4>
                    <p className="text-xs text-gray-500">Get started by creating a subject or importing from an Excel/CSV file.</p>
                    <button
                      onClick={openAddModal}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-650 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                    >
                      Add your first subject
                    </button>
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
                  <td className="py-1.5 px-2.5 font-semibold text-gray-800">{getClassName(item.class_id)}</td>
                  <td className="py-1.5 px-2.5 font-semibold text-gray-900">{item.name}</td>
                  <td className="py-1.5 px-2.5 font-mono text-slate-500">{item.code || '—'}</td>
                  <td className="py-1.5 px-2.5">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded-full border ${getSubjectTypeColor(item.subject_type)
                      }`}>
                      {getSubjectTypeLabel(item.subject_type)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="font-semibold text-gray-900">{item.max_marks}</div>
                    {item.theory_max_marks !== null && item.theory_max_marks !== undefined && (
                      <div className="text-[9px] text-gray-400 mt-0.5 font-medium">
                        Th: {item.theory_max_marks} | Pr: {item.practical_max_marks}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="font-semibold text-gray-650">{item.passing_marks}</div>
                    {item.theory_passing_marks !== null && item.theory_passing_marks !== undefined && (
                      <div className="text-[9px] text-gray-400 mt-0.5 font-medium">
                        Th: {item.theory_passing_marks} | Pr: {item.practical_passing_marks}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.is_elective
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                      {item.is_elective ? 'Elective' : 'Core'}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center">
                      <ToggleSwitch
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item.id)}
                        disabled={showTrashed}
                      />
                    </div>
                  </td>
                  <td className="py-1.5 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {showTrashed ? (
                        <>
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 transition"
                            title="Restore"
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
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

      {/* Pagination */}
      {
        totalPages > 1 && itemsPerPage !== -1 && (
          <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-2 rounded-lg shadow-sm text-xs">
            <span className="text-gray-500">
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
                className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
              >
                ‹
              </button>
              <span className="text-[11px] text-gray-600 px-1.5">
                Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-800">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 border border-gray-200 bg-white rounded disabled:opacity-50 text-[11px] text-gray-650 hover:bg-gray-50 transition"
              >
                »
              </button>
            </div>
          </div>
        )
      }

      {/* Add/Edit Modal */}
      {
        isModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all duration-300">
              <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
                <h3 className="text-sm font-bold">{editingItem ? 'Edit Subject Details' : 'Add New Subject'}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <div>
                    <label className={lbl}>Class *</label>
                    <SearchableSelect
                      options={classes}
                      value={formData.class_id}
                      onChange={(val) => setFormData(prev => ({ ...prev, class_id: val }))}
                      placeholder="Select Class *"
                      required
                      compact={true}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={lbl}>Subject Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Mathematics"
                        className={inp}
                        required
                      />
                    </div>
                    <div>
                      <label className={lbl}>Subject Code</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="e.g. MATH101"
                        className={inp}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Subject Type</label>
                    <SearchableSelect
                      options={subjectTypeOptions}
                      value={formData.subject_type}
                      onChange={(val) => setFormData(prev => ({ ...prev, subject_type: val }))}
                      placeholder="Select Type"
                      compact={true}
                    />
                  </div>

                  {(isTheorySelected() || isPracticalSelected()) && (
                    <div className="p-2 bg-blue-50/40 rounded-lg border border-blue-100/50 space-y-2">
                      {isTheorySelected() && (
                        <div className="space-y-1">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className={lbl}>Theory Max Marks</label>
                              <input
                                type="text"
                                name="theory_max_marks"
                                value={formData.theory_max_marks}
                                onChange={handleInputChange}
                                placeholder="e.g. 70"
                                className={`${inp} ${getTheoryError() ? 'border-red-350 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                minLength={1}
                                maxLength={3}
                              />
                            </div>
                            <div>
                              <label className={lbl}>Theory Passing Marks</label>
                              <input
                                type="text"
                                name="theory_passing_marks"
                                value={formData.theory_passing_marks}
                                onChange={handleInputChange}
                                placeholder="e.g. 23"
                                className={`${inp} ${getTheoryError() ? 'border-red-350 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                minLength={1}
                                maxLength={3}
                              />
                            </div>
                          </div>
                          {getTheoryError() && (
                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">{getTheoryError()}</p>
                          )}
                        </div>
                      )}

                      {isPracticalSelected() && (
                        <div className="space-y-1">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className={lbl}>Practical Max</label>
                              <input
                                type="text"
                                name="practical_max_marks"
                                value={formData.practical_max_marks}
                                onChange={handleInputChange}
                                placeholder="e.g. 30"
                                className={`${inp} ${getPracticalError() ? 'border-red-350 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                minLength={1}
                                maxLength={3}
                              />
                            </div>
                            <div>
                              <label className={lbl}>Practical Passing</label>
                              <input
                                type="text"
                                name="practical_passing_marks"
                                value={formData.practical_passing_marks}
                                onChange={handleInputChange}
                                placeholder="e.g. 10"
                                className={`${inp} ${getPracticalError() ? 'border-red-350 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                minLength={1}
                                maxLength={3}
                              />
                            </div>
                          </div>
                          {getPracticalError() && (
                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">{getPracticalError()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={lbl}>Total Max Marks</label>
                      <input
                        type="text"
                        name="max_marks"
                        value={formData.max_marks}
                        disabled
                        className={`${inp} bg-gray-50 border-gray-250 text-gray-400 cursor-not-allowed`}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Total Passing Marks</label>
                      <input
                        type="text"
                        name="passing_marks"
                        value={formData.passing_marks}
                        disabled
                        className={`${inp} bg-gray-50 border-gray-250 text-gray-400 cursor-not-allowed ${getTotalError() ? 'border-red-300' : ''}`}
                      />
                    </div>
                    {getTotalError() && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-red-500 font-semibold">{getTotalError()}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1 text-xs">
                      <span className="font-semibold text-gray-700">Elective Subject</span>
                      <ToggleSwitch
                        checked={formData.is_elective}
                        onChange={(checked) => setFormData(prev => ({ ...prev, is_elective: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1 text-xs">
                      <span className="font-semibold text-gray-700">Active Status</span>
                      <ToggleSwitch
                        checked={formData.is_active}
                        onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
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
                      disabled={hasValidationErrors()}
                      className={`px-4 py-1 text-xs font-semibold text-white rounded transition shadow-sm ${hasValidationErrors()
                        ? 'bg-blue-300 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        }`}
                    >
                      {editingItem ? 'Save Changes' : 'Create Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Import Modal */}
      {
        isImportModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white">
                <h3 className="text-base font-bold">Import Subjects Preview</h3>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex justify-between items-center">
                  <span><strong>Total Records Found:</strong> {importData.length}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded">Showing up to 5 rows preview</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200">
                        {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, idx) => (
                          <th key={idx} className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-500 border-r last:border-r-0 border-gray-200">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importPreview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="px-4 py-2.5 text-gray-800 border-r last:border-r-0 border-gray-200 font-medium">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-150 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={processImport}
                  disabled={importing}
                  className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default SubjectManager;