import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface TeacherData {
  id: number;
  user_id: number;
  school_id: number;
  employee_id: string;
  qualification: string;
  specialization: string;
  experience_years: number;
  joining_date: string;
  department: string;
  salary: number;
  is_class_teacher: boolean;
  is_active: boolean;
  assigned_class_id?: number | null;
  assigned_class_name?: string | null;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    gender: string;
    date_of_birth: string;
    address: string;
  };
}

interface ClassOption {
  value: number;
  label: string;
}


const DEPT_COLORS: Record<string, string> = {
  Science: 'bg-cyan-100 text-cyan-800',
  Mathematics: 'bg-indigo-100 text-indigo-800',
  Languages: 'bg-yellow-100 text-yellow-800',
  'Social Studies': 'bg-orange-100 text-orange-800',
  'Computer Science': 'bg-violet-100 text-violet-800',
  'Physical Education': 'bg-green-100 text-green-800',
  Arts: 'bg-pink-100 text-pink-800',
  Commerce: 'bg-teal-100 text-teal-800',
};

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

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
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
    borderRadius: '0.375rem',
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

// Toggle Switch Component (Compact size)
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
          ${checked ? 'translate-x-[18px]' : 'translate-x-1'}
        `}
      />
    </button>
  );
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
        isSearchable={true}
        styles={compact ? compactSelectStyles : customSelectStyles}
        menuPosition="fixed"
        menuPlacement="auto"
        menuPortalTarget={document.body}
        className={compact ? "text-[11px]" : "text-[13px]"}
      />
    </div>
  );
};

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', mobile: '',
  gender: '', date_of_birth: '', address: '',
  employee_id: '', qualification: '', specialization: '',
  experience_years: '0',
  joining_date: new Date().toISOString().split('T')[0],
  department: '', salary: 0,
  is_class_teacher: false, assigned_class_id: '', is_active: true,
};

const TeacherManager: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [filteredData, setFilteredData] = useState<TeacherData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const isFirstLoad = useRef(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeacherData | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showTrashed, setShowTrashed] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('employee_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClassTeacher, setFilterClassTeacher] = useState('');

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [genders, setGenders] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // Quick Add Department inline form states
  const [showInlineDept, setShowInlineDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [deptCreating, setDeptCreating] = useState(false);

  const handleQuickDeptCreate = async () => {
    const name = newDept.name.trim();
    if (!name) {
      toast.error('Department name is required');
      return;
    }
    setDeptCreating(true);
    try {
      const response = await api.post('/school/departments', {
        name,
        code: newDept.code.trim() || null,
        is_active: true
      });
      if (response.data.success) {
        toast.success('Department created successfully!');
        // 1. Refetch dynamic departments list
        await fetchDepartments();
        // 2. Select the newly created department in the form data
        setFormData(prev => ({ ...prev, department: name }));
        // 3. Clear new dept form & hide
        setNewDept({ name: '', code: '' });
        setShowInlineDept(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setDeptCreating(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchDepartments();
    fetchGenders();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [showTrashed]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [teachers, searchTerm, filterDepartment, filterStatus, filterClassTeacher, sortColumn, sortDirection]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [searchTerm, filterDepartment, filterStatus, filterClassTeacher, showTrashed, currentPage]);

  const fetchTeachers = async () => {
    try {
      if (isFirstLoad.current) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      const r = await api.get('/school/teachers', {
        params: { only_trashed: showTrashed }
      });
      if (r.data.success) {
        setTeachers(r.data.data);
      }
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setInitialLoading(false);
      setTableLoading(false);
      isFirstLoad.current = false;
    }
  };

  const fetchClasses = async () => {
    try {
      const r = await api.get('/master/classes');
      if (r.data.success) {
        const d = r.data.data;
        setClasses(
          typeof d === 'object' && !Array.isArray(d)
            ? Object.entries(d).map(([id, name]) => ({ value: parseInt(id), label: name as string }))
            : []
        );
      }
    } catch { /* silent */ }
  };

  const fetchDepartments = async () => {
    try {
      const r = await api.get('/school/departments');
      if (r.data.success) {
        const d = r.data.data;
        if (Array.isArray(d)) {
          const list = d
            .filter((dept: any) => dept.is_active)
            .map((dept: any) => ({
              value: dept.name,
              label: dept.name
            }));
          if (list.length > 0) {
            setDepartments(list);
          }
        }
      }
    } catch { /* silent fallback */ }
  };

  const fetchGenders = async () => {
    try {
      const r = await api.get('/master/genders');
      if (r.data.success) {
        const d = r.data.data;
        if (typeof d === 'object' && d !== null && !Array.isArray(d)) {
          const list = Object.entries(d).map(([id, name]) => ({
            value: (name as string).toLowerCase(),
            label: name as string
          }));
          if (list.length > 0) {
            setGenders(list);
          }
        }
      }
    } catch { /* silent fallback */ }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...teachers];
    if (searchTerm)
      filtered = filtered.filter(t =>
        t.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    if (filterDepartment) filtered = filtered.filter(t => t.department === filterDepartment);
    if (filterStatus) filtered = filtered.filter(t => t.is_active.toString() === filterStatus);
    if (filterClassTeacher) filtered = filtered.filter(t => t.is_class_teacher.toString() === filterClassTeacher);

    filtered.sort((a, b) => {
      let av: any, bv: any;
      if (sortColumn === 'name') {
        av = getFullName(a).toLowerCase(); bv = getFullName(b).toLowerCase();
      } else if (sortColumn === 'is_active') {
        av = a.is_active ? 1 : 0; bv = b.is_active ? 1 : 0;
      } else {
        av = (a as any)[sortColumn] ?? ''; bv = (b as any)[sortColumn] ?? '';
      }
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-xs opacity-50">
      {sortColumn !== col ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}
    </span>
  );

  const clearFilters = () => {
    setSearchTerm(''); setFilterDepartment('');
    setFilterStatus(''); setFilterClassTeacher('');
  };

  const hasFilters = !!(searchTerm || filterDepartment || filterStatus || filterClassTeacher);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFullName = (t: TeacherData) =>
    `${t.user?.first_name || ''} ${t.user?.last_name || ''}`.trim() || 'N/A';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'mobile') {
      const clean = value.replace(/[^0-9]/g, '');
      if (clean.length <= 10) {
        setFormData(prev => ({ ...prev, mobile: clean }));
      }
      return;
    }
    if (name === 'experience_years') {
      const clean = value.replace(/[^0-9]/g, '');
      if (clean.length <= 2) {
        setFormData(prev => ({ ...prev, experience_years: clean }));
      }
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, joining_date: new Date().toISOString().split('T')[0] });
    setShowInlineDept(false);
    setNewDept({ name: '', code: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: TeacherData) => {
    setEditingItem(item);
    setFormData({
      first_name: item.user?.first_name || '',
      last_name: item.user?.last_name || '',
      email: item.user?.email || '',
      mobile: item.user?.mobile || '',
      gender: item.user?.gender || '',
      date_of_birth: item.user?.date_of_birth || '',
      address: item.user?.address || '',
      employee_id: item.employee_id,
      qualification: item.qualification || '',
      specialization: item.specialization || '',
      experience_years: item.experience_years !== undefined && item.experience_years !== null ? String(item.experience_years) : '0',
      joining_date: item.joining_date,
      department: item.department || '',
      salary: item.salary,
      is_class_teacher: item.is_class_teacher,
      assigned_class_id: item.assigned_class_id ? item.assigned_class_id.toString() : '',
      is_active: item.is_active,
    });
    setShowInlineDept(false);
    setNewDept({ name: '', code: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email || !formData.mobile || !formData.employee_id) {
      toast.error('Please fill all required fields'); return;
    }

    // Input Validation Rules
    if (formData.first_name.length > 15) {
      toast.error('First Name cannot exceed 15 characters'); return;
    }
    if (formData.last_name && formData.last_name.length > 15) {
      toast.error('Last Name cannot exceed 15 characters'); return;
    }
    if (formData.email.length > 25) {
      toast.error('Email cannot exceed 25 characters'); return;
    }
    if (!/^[0-9]+$/.test(formData.mobile)) {
      toast.error('Mobile number must contain only digits'); return;
    }
    if (formData.mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits'); return;
    }
    if (formData.qualification && formData.qualification.length > 20) {
      toast.error('Qualification cannot exceed 20 characters'); return;
    }
    if (formData.specialization && formData.specialization.length > 20) {
      toast.error('Specialization cannot exceed 20 characters'); return;
    }
    const expStr = String(formData.experience_years).trim();
    if (expStr.length < 1 || expStr.length > 2) {
      toast.error('Experience must be 1 to 2 digits'); return;
    }
    const exp = Number(expStr);
    if (isNaN(exp) || exp < 0 || exp > 99) {
      toast.error('Experience must be between 0 and 99 years'); return;
    }
    if (formData.employee_id.length > 15) {
      toast.error('Employee ID cannot exceed 15 characters'); return;
    }
    try {
      const payload = {
        user_data: {
          first_name: formData.first_name, last_name: formData.last_name,
          email: formData.email, mobile: formData.mobile,
          gender: formData.gender, date_of_birth: formData.date_of_birth,
          address: formData.address, user_type: 'teacher',
        },
        teacher_data: {
          employee_id: formData.employee_id, qualification: formData.qualification,
          specialization: formData.specialization, experience_years: Number(formData.experience_years),
          joining_date: formData.joining_date, department: formData.department,
          salary: formData.salary, is_class_teacher: formData.is_class_teacher,
          assigned_class_id: formData.assigned_class_id || null, is_active: formData.is_active,
        },
      };
      if (editingItem) {
        const r = await api.put(`/school/teachers/${editingItem.id}`, payload);
        if (r.data.success) toast.success('Teacher updated successfully');
      } else {
        const r = await api.post('/school/teachers', payload);
        if (r.data.success) toast.success('Teacher created successfully');
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete teacher "${name}"?`)) return;
    try {
      const r = await api.delete(`/school/teachers/${id}`);
      if (r.data.success) {
        toast.success('Teacher deleted successfully');
        setTeachers(prev => prev.filter(t => t.id !== id));
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const r = await api.patch(`/school/teachers/${id}/toggle-status`);
      if (r.data.success) {
        toast.success('Status updated successfully');
        setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
      }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('Are you sure you want to restore this teacher?')) return;
    try {
      const response = await api.post(`/school/teachers/${id}/restore`);
      if (response.data.success) {
        toast.success('Teacher restored successfully');
        setTeachers(prev => prev.filter(t => t.id !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore teacher');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this teacher? This action cannot be undone.')) return;
    try {
      const response = await api.delete(`/school/teachers/${id}/force`);
      if (response.data.success) {
        toast.success('Teacher permanently deleted');
        setTeachers(prev => prev.filter(t => t.id !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete teacher');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    try {
      const response = await api.post('/school/teachers/bulk-status', { status, ids });
      if (response.data.success) {
        toast.success(response.data.message);
        const activeBool = status === 'active';
        setTeachers(prev => prev.map(t => ids.includes(t.id) ? { ...t, is_active: activeBool } : t));
        setSelectedItems(new Set());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete the selected teacher(s)?')) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    try {
      const response = await api.post('/school/teachers/bulk-delete', { ids });
      if (response.data.success) {
        toast.success(response.data.message);
        setTeachers(prev => prev.filter(t => !ids.includes(t.id)));
        setSelectedItems(new Set());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkRestore = async () => {
    if (!confirm('Are you sure you want to restore the selected teacher(s)?')) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    try {
      const response = await api.post('/school/teachers/bulk-restore', { ids });
      if (response.data.success) {
        toast.success(response.data.message);
        setTeachers(prev => prev.filter(t => !ids.includes(t.id)));
        setSelectedItems(new Set());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkForceDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete the selected teacher(s)? This action cannot be undone.')) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedItems);
    try {
      const response = await api.post('/school/teachers/bulk-delete', { ids, force: true });
      if (response.data.success) {
        toast.success(response.data.message);
        setTeachers(prev => prev.filter(t => !ids.includes(t.id)));
        setSelectedItems(new Set());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExport = () => {
    try {
      const data = filteredData.map(t => ({
        'Employee ID': t.employee_id,
        'Teacher Name': getFullName(t),
        'Email': t.user?.email || '',
        'Mobile': t.user?.mobile || '',
        'Gender': t.user?.gender || '',
        'Department': t.department || '',
        'Qualification': t.qualification || '',
        'Specialization': t.specialization || '',
        'Experience (Years)': t.experience_years,
        'Joining Date': t.joining_date,
        'Salary': t.salary,
        'Class Teacher': t.is_class_teacher ? 'Yes' : 'No',
        'Status': t.is_active ? 'Active' : 'Inactive',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
      XLSX.writeFile(wb, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully!');
    } catch { toast.error('Export failed'); }
  };

  const downloadSampleFile = async () => {
    try {
      const classValues = classes.length > 0
        ? classes.map(c => c.label)
        : ['Class 1', 'Class 2'];
      const genderValues = genders.length > 0 ? genders.map(g => g.label) : ['Male', 'Female', 'Other'];
      const deptValues = departments.map(d => d.value);
      const classTeacherValues = ['Yes', 'No'];
      const statusValues = ['Active', 'Inactive'];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Teachers');

      worksheet.columns = [
        { header: 'Employee ID', key: 'employee_id', width: 15 },
        { header: 'First Name', key: 'first_name', width: 18 },
        { header: 'Last Name', key: 'last_name', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Date of Birth', key: 'dob', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Qualification', key: 'qualification', width: 18 },
        { header: 'Specialization', key: 'specialization', width: 20 },
        { header: 'Experience (Years)', key: 'experience', width: 18 },
        { header: 'Joining Date', key: 'joining_date', width: 15 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Salary', key: 'salary', width: 12 },
        { header: 'Class Teacher', key: 'class_teacher', width: 15 },
        { header: 'Assign Class', key: 'assign_class', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      // Add sample values
      worksheet.getCell('A2').value = 'TCH001';
      worksheet.getCell('B2').value = 'Rahul';
      worksheet.getCell('C2').value = 'Sharma';
      worksheet.getCell('D2').value = 'rahul.sharma@school.com';
      worksheet.getCell('E2').value = '9876543210';
      worksheet.getCell('F2').value = 'Male';
      worksheet.getCell('G2').value = '1985-05-15';
      worksheet.getCell('H2').value = 'Delhi, India';
      worksheet.getCell('I2').value = 'M.Sc., B.Ed';
      worksheet.getCell('J2').value = 'Mathematics';
      worksheet.getCell('K2').value = 10;
      worksheet.getCell('L2').value = '2015-04-01';
      worksheet.getCell('M2').value = 'Mathematics';
      worksheet.getCell('N2').value = 50000;
      worksheet.getCell('O2').value = 'Yes';
      worksheet.getCell('P2').value = classValues[0];
      worksheet.getCell('Q2').value = 'Active';

      // Write lists data to helper columns T, U, V, W, X
      worksheet.getCell('T1').value = 'Gender_List';
      worksheet.getCell('U1').value = 'Department_List';
      worksheet.getCell('V1').value = 'Class_Teacher_List';
      worksheet.getCell('W1').value = 'Class_List';
      worksheet.getCell('X1').value = 'Status_List';

      genderValues.forEach((val, idx) => { worksheet.getCell(`T${idx + 2}`).value = val; });
      deptValues.forEach((val, idx) => { worksheet.getCell(`U${idx + 2}`).value = val; });
      classTeacherValues.forEach((val, idx) => { worksheet.getCell(`V${idx + 2}`).value = val; });
      classValues.forEach((val, idx) => { worksheet.getCell(`W${idx + 2}`).value = val; });
      statusValues.forEach((val, idx) => { worksheet.getCell(`X${idx + 2}`).value = val; });

      // Hide helper columns
      worksheet.getColumn('T').hidden = true;
      worksheet.getColumn('U').hidden = true;
      worksheet.getColumn('V').hidden = true;
      worksheet.getColumn('W').hidden = true;
      worksheet.getColumn('X').hidden = true;

      // Apply data validation to columns for rows 2 to 500
      for (let r = 2; r <= 500; r++) {
        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Teachers'!$T$2:$T$${1 + genderValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select from the dropdown list.',
        };

        worksheet.getCell(`M${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Teachers'!$U$2:$U$${1 + deptValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select from the dropdown list.',
        };

        worksheet.getCell(`O${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Teachers'!$V$2:$V$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };

        worksheet.getCell(`P${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Teachers'!$W$2:$W$${1 + classValues.length}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a class from the list.',
        };

        worksheet.getCell(`Q${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Teachers'!$X$2:$X$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Active or Inactive.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_teachers.xlsx');
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

        // Filter out empty rows or helper columns rows by requiring First Name and Employee ID
        const validRows = jsonData.filter((row: any) => row['First Name'] && row['Employee ID']);

        if (validRows.length === 0) {
          toast.error('No valid data found in the file. Make sure Employee ID and First Name are filled.');
          return;
        }

        setImportData(validRows);
        setImportPreview(validRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch (err) {
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
        const classItem = classes.find(c => c.label === row['Assign Class']);

        const payload = {
          user_data: {
            first_name: row['First Name'],
            last_name: row['Last Name'] || '',
            email: row['Email'],
            mobile: row['Mobile'] ? String(row['Mobile']) : '',
            gender: row['Gender']?.toLowerCase() || '',
            date_of_birth: row['Date of Birth'] ? new Date(row['Date of Birth']).toISOString().split('T')[0] : null,
            address: row['Address'] || '',
            user_type: 'teacher',
          },
          teacher_data: {
            employee_id: String(row['Employee ID']),
            qualification: row['Qualification'] || '',
            specialization: row['Specialization'] || '',
            experience_years: row['Experience (Years)'] !== undefined ? Number(row['Experience (Years)']) : 0,
            joining_date: row['Joining Date'] ? new Date(row['Joining Date']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            department: row['Department'] || '',
            salary: row['Salary'] !== undefined ? Number(row['Salary']) : 0,
            is_class_teacher: row['Class Teacher']?.toLowerCase() === 'yes',
            assigned_class_id: classItem ? classItem.value : null,
            is_active: row['Status']?.toLowerCase() === 'active',
          },
        };

        const response = await api.post('/school/teachers', payload);
        if (response.data.success) {
          ok++;
        } else {
          fail++;
        }
      } catch (err) {
        fail++;
      }
    }

    toast.success(`Import complete: ${ok} success, ${fail} failed`);
    setIsImportModalOpen(false);
    fetchTeachers();
    setImporting(false);
  };

  const handleSelectRow = (id: number) => {
    const s = new Set(selectedItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedItems(s);
  };

  const handleSelectAll = () => {
    setSelectedItems(
      selectedItems.size === paginatedData.length && paginatedData.length > 0
        ? new Set()
        : new Set(paginatedData.map(t => t.id))
    );
  };

  const totalActive = teachers.filter(t => t.is_active).length;
  const totalClassTeachers = teachers.filter(t => t.is_class_teacher).length;

  const deptOptions = departments;
  const classTeacherOptions = [
    { value: 'true', label: 'Class Teacher' },
    { value: 'false', label: 'Subject Teacher' },
  ];
  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const inp = 'w-full px-2.5 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';

  if (initialLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs text-gray-500 font-medium">Loading staff data…</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-3 text-xs">

      {/* ── Top Header ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Teacher Management</h3>
          <p className="text-[12px] text-gray-500">Manage teacher profiles, qualifications &amp; class assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total</span>
            <span className="text-xs font-bold text-slate-700">{teachers.length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500">Active</span>
            <span className="text-xs font-bold text-emerald-700">{totalActive}</span>
          </div>
          <div className="bg-purple-50/60 border border-purple-100/80 rounded px-2 py-0.5 text-center min-w-[60px]">
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-purple-500">Class Teachers</span>
            <span className="text-xs font-bold text-purple-700">{totalClassTeachers}</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar Area ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs">
        {/* Left side: Search & filters */}
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
              placeholder="Search name, ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 w-44 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Department Filter */}
          <SearchableSelect
            options={deptOptions}
            value={filterDepartment}
            onChange={(val) => setFilterDepartment(val)}
            placeholder="All Departments"
            isClearable={true}
            className="w-40 text-xs"
            compact={true}
          />

          {/* Class Teacher Filter */}
          <SearchableSelect
            options={classTeacherOptions}
            value={filterClassTeacher}
            onChange={(val) => setFilterClassTeacher(val)}
            placeholder="All Types"
            isClearable={true}
            className="w-36 text-xs"
            compact={true}
          />

          {/* Status Filter */}
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
            <span className="text-[10px] text-gray-400 font-semibold uppercase"></span>
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
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
            <span className="text-xs font-semibold text-gray-600">Trashed</span>
            <button
              type="button"
              onClick={() => setShowTrashed(prev => !prev)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${showTrashed ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${showTrashed ? 'translate-x-5' : 'translate-x-1'}`}
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
        <div className="flex items-center gap-1.5" style={{ marginTop: '-27px' }}>
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
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
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
              Add
            </button>
          )}
        </div>
      </div>

      {showTrashed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted teachers. You can restore them or permanently delete them below.</span>
        </div>
      )}

      {/* ── Bulk Actions Bar ── */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex items-center justify-between text-xs">
          <div className="text-blue-800 font-semibold">
            {selectedItems.size} teacher(s) selected
          </div>
          <div className="flex items-center gap-1.5">
            {!showTrashed ? (
              <>
                <button onClick={() => handleBulkStatusChange('active')} disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-green-700 font-medium">
                  Active
                </button>
                <button onClick={() => handleBulkStatusChange('inactive')} disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-red-700 font-medium">
                  Inactive
                </button>
                <button onClick={handleBulkDelete} disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
                  Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={handleBulkRestore} disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-white border border-blue-300 rounded hover:bg-blue-100 text-blue-700 font-medium">
                  Restore
                </button>
                <button onClick={handleBulkForceDelete} disabled={bulkUpdating}
                  className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
                  Delete Permanently
                </button>
              </>
            )}
            <button onClick={() => setSelectedItems(new Set())}
              className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="pl-4 pr-2 py-2 w-8">
                <input type="checkbox"
                  checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 cursor-pointer"
                />
              </th>
              {[
                { label: 'Employee ID', col: 'employee_id' },
                { label: 'Teacher', col: 'name' },
                { label: 'Contact', col: null },
                { label: 'Department', col: null },
                { label: 'Experience', col: 'experience_years' },
                { label: 'Class Teacher', col: null },
                { label: 'Status', col: 'is_active' },
                { label: 'Actions', col: null },
              ].map(({ label, col }) => (
                <th key={label}
                  className={`px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}
                  onClick={col ? () => handleSort(col) : undefined}>
                  <div className="flex items-center gap-1">
                    {label}
                    {col && <SortIcon col={col} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`bg-white divide-y divide-gray-100 ${tableLoading ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-200`}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">{hasFilters ? 'No teachers match your filters.' : 'No teachers added yet.'}</p>
                    {!hasFilters && !showTrashed && (
                      <button onClick={openAddModal} className="text-blue-600 text-sm font-medium hover:underline">
                        Add your first teacher →
                      </button>
                    )}
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-blue-600 text-sm font-medium hover:underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/30 border-b border-gray-150 transition-colors group">
                  <td className="pl-4 pr-2 py-1.5">
                    <input type="checkbox" checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-mono text-[11px] text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                      {item.employee_id}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(getFullName(item))} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                        {getFullName(item).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-955 leading-tight">{getFullName(item)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{item.qualification || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <p className="text-[11px] text-gray-700 leading-normal">{item.user?.email || '—'}</p>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{item.user?.mobile || '—'}</p>
                  </td>
                  <td className="px-3 py-1.5">
                    {item.department
                      ? <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${DEPT_COLORS[item.department] || 'bg-gray-100 text-gray-700'}`}>
                        {item.department}
                      </span>
                      : <span className="text-gray-400 text-[11px]">—</span>
                    }
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <span className="text-[12px] font-semibold text-gray-800">{item.experience_years}</span>
                      <span className="text-[10px] text-gray-400 font-medium">yrs</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    {item.is_class_teacher
                      ? <span className="inline-flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-green-150 text-green-800 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-green-500" />Yes
                        </span>
                        {item.assigned_class_name && (
                          <span className="text-[9px] text-gray-500 text-center font-bold">({item.assigned_class_name})</span>
                        )}
                      </span>
                      : <span className="text-[10px] text-gray-400 font-medium">—</span>
                    }
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => !showTrashed && handleToggleStatus(item.id)}
                        disabled={showTrashed}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-250 focus:outline-none ${item.is_active ? 'bg-green-500' : 'bg-gray-300'} ${showTrashed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-250 ${item.is_active ? 'translate-x-[18px]' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-0.5">
                      {!showTrashed ? (
                        <>
                          <button onClick={() => openEditModal(item)} title="Edit"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(item.id, getFullName(item))} title="Delete"
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleRestore(item.id)} title="Restore"
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.75 8H17" />
                            </svg>
                          </button>
                          <button onClick={() => handleForceDelete(item.id)} title="Delete Permanently"
                            className="p-1 text-red-650 hover:bg-red-50 rounded transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* ── Pagination ── */}
      {totalPages > 1 && itemsPerPage !== -1 && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center justify-between text-xs">
          <p className="text-[11px] text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
              className="px-2 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition font-medium">«</button>
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="px-2 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition font-medium">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
              }
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded text-xs border transition font-medium ${currentPage === page ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="px-2 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition font-medium">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
              className="px-2 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition font-medium">»</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ═══════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-visible">

            {/* Modal Header */}
            <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold">
                  {editingItem ? 'Edit Teacher' : 'Add New Teacher'}
                </h3>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  {editingItem ? `Editing profile for ${getFullName(editingItem)}` : 'Fill in teacher details below'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form id="teacher-form" onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {/* Section: Personal */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5.5 h-5.5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-[12px] font-semibold text-gray-800">Personal Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl}>First Name <span className="text-red-500 normal-case">*</span></label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange}
                      placeholder="Rahul" className={inp} maxLength={15} required />
                  </div>
                  <div>
                    <label className={lbl}>Last Name</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange}
                      placeholder="Sharma" className={inp} maxLength={15} />
                  </div>
                  <div>
                    <label className={lbl}>Email <span className="text-red-500 normal-case">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      placeholder="teacher@school.com" className={inp} maxLength={25} required />
                  </div>
                  <div>
                    <label className={lbl}>Mobile <span className="text-red-500 normal-case">*</span></label>
                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange}
                      placeholder="9876543210" className={inp} maxLength={10} required />
                  </div>
                  <div>
                    <label className={lbl}>Gender</label>
                    <SearchableSelect
                      options={genders}
                      value={formData.gender}
                      onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                      placeholder="Select gender"
                      isClearable={true}
                      compact={true}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Date of Birth</label>
                    <input type="date" name="date_of_birth" value={formData.date_of_birth}
                      onChange={handleInputChange} className={inp} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleInputChange}
                      rows={2} placeholder="Enter full address" className={inp} />
                  </div>
                </div>
              </section>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Section: Professional */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5.5 h-5.5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-[12px] font-semibold text-gray-800">Professional Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={lbl}>Employee ID <span className="text-red-500 normal-case">*</span></label>
                    <input type="text" name="employee_id" value={formData.employee_id} onChange={handleInputChange}
                      placeholder="TCH001" className={inp} maxLength={15} required />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={lbl} style={{ marginBottom: 0 }}>Department</label>
                      <button
                        type="button"
                        onClick={() => setShowInlineDept(prev => !prev)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline focus:outline-none"
                      >
                        {showInlineDept ? '✕ Close' : '+ Add New'}
                      </button>
                    </div>
                    <SearchableSelect
                      options={departments}
                      value={formData.department}
                      onChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                      placeholder="Select department"
                      isClearable={true}
                      compact={true}
                    />
                    {showInlineDept && (
                      <div className="bg-gray-50 border border-gray-250/70 rounded-lg p-2 mt-1.5 space-y-1.5">
                        <div className="font-bold text-[9px] text-gray-700 uppercase tracking-wide">Quick Add Department</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-gray-500 mb-0.5 uppercase">Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={newDept.name}
                              onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Physics"
                              className="w-full px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-gray-500 mb-0.5 uppercase">Code</label>
                            <input
                              type="text"
                              value={newDept.code}
                              onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value }))}
                              placeholder="e.g. PHY"
                              className="w-full px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              maxLength={50}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineDept(false);
                              setNewDept({ name: '', code: '' });
                            }}
                            className="px-2 py-0.5 text-[9px] font-semibold border border-gray-300 rounded text-gray-700 hover:bg-gray-150 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleQuickDeptCreate}
                            disabled={deptCreating}
                            className="px-2 py-0.5 text-[9px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            {deptCreating ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>Qualification</label>
                    <input type="text" name="qualification" value={formData.qualification}
                      onChange={handleInputChange} placeholder="M.Sc., B.Ed" className={inp} maxLength={20} />
                  </div>
                  <div>
                    <label className={lbl}>Specialization</label>
                    <input type="text" name="specialization" value={formData.specialization}
                      onChange={handleInputChange} placeholder="e.g. Mathematics" className={inp} maxLength={20} />
                  </div>
                  <div>
                    <label className={lbl}>Experience (Years)</label>
                    <input type="text" name="experience_years" value={formData.experience_years}
                      onChange={handleInputChange} placeholder="0" className={inp} maxLength={2} />
                  </div>
                  <div>
                    <label className={lbl}>Joining Date</label>
                    <input type="date" name="joining_date" value={formData.joining_date}
                      onChange={handleInputChange} className={inp} />
                  </div>
                </div>
              </section>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Section: Assignment */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5.5 h-5.5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-[12px] font-semibold text-gray-800">Assignment &amp; Status</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2.5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-gray-750">Class Teacher</span>
                      <span className="text-[10px] text-gray-400">Assign this teacher as a homeroom/class teacher</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.is_class_teacher}
                      onChange={(val) => setFormData(prev => ({ ...prev, is_class_teacher: val }))}
                    />
                  </div>
                  {formData.is_class_teacher && (
                    <div className="pl-0.5">
                      <label className={lbl}>Assign Class</label>
                      <SearchableSelect
                        options={classes}
                        value={formData.assigned_class_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, assigned_class_id: val }))}
                        placeholder="Select class"
                        compact={true}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200/60 pt-2.5">
                    <div>
                      <span className="block text-xs font-semibold text-gray-750">Active Status</span>
                      <span className="text-[10px] text-gray-400">Teacher can log in and access the system</span>
                    </div>
                    <ToggleSwitch
                      checked={formData.is_active}
                      onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                    />
                  </div>
                </div>
              </section>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" form="teacher-form"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
                {editingItem ? 'Update Teacher' : 'Create Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

            <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold">Import Teachers</h3>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  Preview — {importData.length} record{importData.length !== 1 ? 's' : ''} found (showing first 5)
                </p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {importPreview.length > 0 && Object.keys(importPreview[0]).map((key, i) => (
                        <th key={i} className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {importPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{String(val ?? '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-150 bg-gray-50 flex-shrink-0">
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                ⚠ Duplicate emails or employee IDs will cause individual row failures.
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-750 bg-white hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={processImport} disabled={importing}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm flex items-center gap-1.5">
                  {importing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    `Import ${importData.length} Record${importData.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;