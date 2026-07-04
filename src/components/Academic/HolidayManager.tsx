import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from 'react-select';

// Helper function to format date as "01 Jul 2024"
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper function to format date for input[type="date"] (YYYY-MM-DD)
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// Compact Toggle Switch Component
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
          inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

// Premium theme styling for react-select matching our system's Tailwind design
const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    minHeight: '38px',
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
  clearIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    cursor: 'pointer',
    color: '#9ca3af',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({
    display: 'none',
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
    display: 'flex',
    alignItems: 'center',
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
  clearIndicator: (base: any) => ({
    ...base,
    padding: '2px',
    cursor: 'pointer',
    color: '#9ca3af',
    '&:hover': {
      color: '#ef4444',
    },
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '2px',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({
    display: 'none',
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
        className={compact ? 'text-[11px]' : 'text-[13px]'}
      />
    </div>
  );
};

interface Holiday {
  id: number;
  school_id: number;
  academic_year_id: number;
  holiday_type_id?: number | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  holiday_type?: {
    m_id: number;
    m_name: string;
  } | null;
}

const HolidayManager: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredData, setFilteredData] = useState<Holiday[]>([]);
  const [academicYears, setAcademicYears] = useState<{ value: number; label: string; is_current: boolean }[]>([]);
  const [holidayTypeOptions, setHolidayTypeOptions] = useState<{ value: number; label: string }[]>([]);
  
  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Modal toggle states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filters & layout states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Trashing & selections
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form states
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    holiday_type_id: '',
    start_date: '',
    end_date: '',
    is_active: true,
    academic_year_id: '',
  });

  // Import states
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const isMounted = useRef(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch holidays silently on trashed view toggle or academic year filter change
  useEffect(() => {
    if (isMounted.current && !initialLoading) {
      fetchHolidaysSilently();
    } else if (!isMounted.current) {
      isMounted.current = true;
    }
  }, [showTrashed, filterAcademicYear]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [holidays, searchTerm, sortColumn, sortDirection]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      // Fetch academic years and holiday types in parallel
      const [yearsResponse, typesResponse] = await Promise.all([
        api.get('/school/academic-years'),
        api.get('/master/group/HOLIDAY_TYPE')
      ]);

      let selectedYearId = '';

      // Process Academic Years
      if (yearsResponse.data.success) {
        const years = yearsResponse.data.data.map((y: any) => ({
          value: y.id,
          label: y.name,
          is_current: y.is_current,
        }));
        setAcademicYears(years);

        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) {
          selectedYearId = currentYear.value.toString();
          setFilterAcademicYear(selectedYearId);
          setFormData(prev => ({ ...prev, academic_year_id: selectedYearId }));
        }
      }

      // Process Holiday Types
      if (typesResponse.data.success) {
        const types = typesResponse.data.data.map((item: any) => ({
          value: item.m_id,
          label: item.m_name,
        }));
        setHolidayTypeOptions(types);
      }

      // Fetch holidays using the selected year ID directly to avoid waiting for state sync
      const holidaysResponse = await api.get(`/school/holidays`, {
        params: {
          only_trashed: showTrashed,
          academic_year_id: selectedYearId || null
        }
      });
      if (holidaysResponse.data.success) {
        setHolidays(holidaysResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load holiday manager data');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchHolidayTypes = async () => {
    try {
      const response = await api.get('/master/group/HOLIDAY_TYPE');
      if (response.data.success) {
        const typesData = response.data.data;
        const types = typesData.map((item: any) => ({
          value: item.m_id,
          label: item.m_name,
        }));
        setHolidayTypeOptions(types);
      }
    } catch (error) {
      console.error('Error fetching holiday types:', error);
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

        // Pre-select current academic year in filter and form
        const currentYear = years.find((y: any) => y.is_current);
        if (currentYear) {
          setFilterAcademicYear(currentYear.value.toString());
          setFormData(prev => ({ ...prev, academic_year_id: currentYear.value.toString() }));
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await api.get(`/school/holidays`, {
        params: {
          only_trashed: showTrashed,
          academic_year_id: filterAcademicYear || null
        }
      });
      if (response.data.success) {
        setHolidays(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Failed to load holidays list');
    }
  };

  const fetchHolidaysSilently = async () => {
    setTableLoading(true);
    try {
      await fetchHolidays();
      setSelectedIds([]);
    } finally {
      setTableLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...holidays];

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(lower);
        const descMatch = (item.description || '').toLowerCase().includes(lower);
        return titleMatch || descMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      if (sortColumn === 'title') {
        aVal = a.title || '';
        bVal = b.title || '';
      } else if (sortColumn === 'start_date') {
        aVal = a.start_date || '';
        bVal = b.start_date || '';
      } else if (sortColumn === 'end_date') {
        aVal = a.end_date || '';
        bVal = b.end_date || '';
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
  const isFilterActive = searchTerm !== '' || filterAcademicYear !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('');
  };
  // Pagination bounds
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = itemsPerPage === -1
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAddModal = () => {
    setEditingHoliday(null);
    const currentYear = academicYears.find(y => y.is_current);
    setFormData({
      title: '',
      description: '',
      holiday_type_id: '',
      start_date: '',
      end_date: '',
      is_active: true,
      academic_year_id: currentYear ? currentYear.value.toString() : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      title: holiday.title,
      description: holiday.description || '',
      holiday_type_id: holiday.holiday_type_id ? holiday.holiday_type_id.toString() : '',
      start_date: formatDateForInput(holiday.start_date),
      end_date: formatDateForInput(holiday.end_date),
      is_active: holiday.is_active,
      academic_year_id: holiday.academic_year_id.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }

    setTableLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        holiday_type_id: formData.holiday_type_id ? parseInt(formData.holiday_type_id) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        academic_year_id: formData.academic_year_id ? parseInt(formData.academic_year_id) : null,
      };

      let response;
      if (editingHoliday) {
        response = await api.put(`/school/holidays/${editingHoliday.id}`, payload);
      } else {
        response = await api.post(`/school/holidays`, payload);
      }

      if (response.data.success) {
        toast.success(response.data.message || 'Holiday configuration saved successfully');
        setIsModalOpen(false);
        await fetchHolidays();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save holiday');
    } finally {
      setTableLoading(false);
    }
  };

  const handleToggleStatus = async (item: Holiday) => {
    // Optimistic Update
    const prevList = [...holidays];
    setHolidays(prev =>
      prev.map(h => (h.id === item.id ? { ...h, is_active: !h.is_active } : h))
    );

    try {
      const response = await api.patch(`/school/holidays/${item.id}/toggle-status`);
      if (!response.data.success) {
        setHolidays(prevList);
        toast.error('Failed to update status');
      }
    } catch (error) {
      setHolidays(prevList);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday configuration?')) return;

    // Optimistic Update
    const prevList = [...holidays];
    setHolidays(prev => prev.filter(h => h.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.delete(`/school/holidays/${id}`);
      if (response.data.success) {
        toast.success('Holiday deleted successfully');
      } else {
        setHolidays(prevList);
        toast.error('Failed to delete holiday');
      }
    } catch (error: any) {
      setHolidays(prevList);
      toast.error(error.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const handleRestore = async (id: number) => {
    // Optimistic Update
    const prevList = [...holidays];
    setHolidays(prev => prev.filter(h => h.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.post(`/school/holidays/${id}/restore`);
      if (response.data.success) {
        toast.success('Holiday restored successfully');
      } else {
        setHolidays(prevList);
        toast.error(response.data.message || 'Failed to restore holiday');
      }
    } catch (error: any) {
      setHolidays(prevList);
      toast.error(error.response?.data?.message || 'Failed to restore holiday');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this holiday? This cannot be undone.')) return;

    // Optimistic Update
    const prevList = [...holidays];
    setHolidays(prev => prev.filter(h => h.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      const response = await api.delete(`/school/holidays/${id}/force`);
      if (response.data.success) {
        toast.success('Holiday permanently deleted');
      } else {
        setHolidays(prevList);
        toast.error('Failed to delete holiday permanently');
      }
    } catch (error: any) {
      setHolidays(prevList);
      toast.error(error.response?.data?.message || 'Failed to delete holiday permanently');
    }
  };

  // Checkbox selection
  const handleSelectAllToggle = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map(h => h.id));
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = paginatedData.length > 0 && selectedIds.length === paginatedData.length;

  // Bulk Actions
  const handleBulkDelete = async (force = false) => {
    const promptMessage = force
      ? 'Are you sure you want to permanently delete the selected holidays? This cannot be undone.'
      : 'Are you sure you want to delete the selected holidays?';

    if (!window.confirm(promptMessage)) return;

    const prevList = [...holidays];
    setHolidays(prev => prev.filter(item => !selectedIds.includes(item.id)));
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const response = await api.post(`/school/holidays/bulk-delete`, {
        ids: idsToProcess,
        force: force
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk deletion completed successfully');
      } else {
        setHolidays(prevList);
        setSelectedIds(idsToProcess);
        toast.error('Failed to delete selected items');
      }
    } catch (error: any) {
      setHolidays(prevList);
      setSelectedIds(idsToProcess);
      toast.error(error.response?.data?.message || 'Failed to delete selected items');
    }
  };

  const handleBulkRestore = async () => {
    const prevList = [...holidays];
    setHolidays(prev => prev.filter(item => !selectedIds.includes(item.id)));
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const response = await api.post(`/school/holidays/bulk-restore`, {
        ids: idsToProcess
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Bulk restore completed successfully');
      } else {
        setHolidays(prevList);
        setSelectedIds(idsToProcess);
        toast.error('Failed to restore selected items');
      }
    } catch (error: any) {
      setHolidays(prevList);
      setSelectedIds(idsToProcess);
      toast.error(error.response?.data?.message || 'Failed to restore selected items');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    const prevList = [...holidays];
    const isActive = status === 'active';
    setHolidays(prev =>
      prev.map(h => (selectedIds.includes(h.id) ? { ...h, is_active: isActive } : h))
    );
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const response = await api.post(`/school/holidays/bulk-status`, {
        status: status,
        ids: idsToProcess
      });
      if (!response.data.success) {
        setHolidays(prevList);
        setSelectedIds(idsToProcess);
        toast.error('Failed to update status of selected items');
      } else {
        toast.success(response.data.message || 'Bulk status updated successfully');
      }
    } catch (error: any) {
      setHolidays(prevList);
      setSelectedIds(idsToProcess);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Client-side Excel Export
  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = filteredData.map(item => {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        
        return {
          'Holiday Title': item.title,
          'Holiday Type': item.holiday_type?.m_name || '—',
          'Description': item.description || '—',
          'Start Date': formatDateForInput(item.start_date),
          'End Date': formatDateForInput(item.end_date),
          'Total Days': days,
          'Academic Year': academicYears.find(y => y.value === item.academic_year_id)?.label || '—',
          'Status': item.is_active ? 'Active' : 'Inactive',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Holidays');
      XLSX.writeFile(wb, `holidays_list_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Holidays list exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Client-side Excel sample template generation
  const downloadSampleFile = async () => {
    try {
      const academicYearValues = academicYears.map(y => y.label);
      const statusValues = ['Yes', 'No'];

      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Holidays');

      worksheet.columns = [
        { header: 'Holiday Title', key: 'title', width: 25 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Start Date (YYYY-MM-DD)', key: 'start_date', width: 22 },
        { header: 'End Date (YYYY-MM-DD)', key: 'end_date', width: 22 },
        { header: 'Academic Year', key: 'academic_year', width: 20 },
        { header: 'Set as Active', key: 'is_active', width: 15 },
      ];

      // Reference row
      worksheet.addRow({
        title: 'Christmas Holiday',
        description: 'Winter vacation and Christmas festival celebration',
        start_date: '2025-12-24',
        end_date: '2026-01-01',
        academic_year: academicYearValues[0] || '2025-2026',
        is_active: 'Yes',
      });

      // Helper option sheets columns P, Q
      worksheet.getCell('P1').value = 'Academic_Year_List';
      worksheet.getCell('Q1').value = 'Active_List';

      academicYearValues.forEach((val, idx) => {
        worksheet.getCell(`P${idx + 2}`).value = val;
      });
      statusValues.forEach((val, idx) => {
        worksheet.getCell(`Q${idx + 2}`).value = val;
      });

      worksheet.getColumn('P').hidden = true;
      worksheet.getColumn('Q').hidden = true;

      // Add Validation constraints
      for (let r = 2; r <= 500; r++) {
        if (academicYearValues.length > 0) {
          worksheet.getCell(`E${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`'Holidays'!$P$2:$P$${1 + academicYearValues.length}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: 'Please select an academic year from the dropdown list.',
          };
        }

        worksheet.getCell(`F${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Holidays'!$Q$2:$Q$3`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select Yes or No.',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'sample_holidays_import.xlsx');
      toast.success('Sample file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to generate template file');
    }
  };

  // Excel Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRows = jsonData.filter((row: any) => row['Holiday Title'] && row['Start Date (YYYY-MM-DD)'] && row['End Date (YYYY-MM-DD)']);

        if (validRows.length === 0) {
          toast.error('No valid records found. Holiday Title, Start Date, and End Date columns are required.');
          return;
        }

        setImportData(validRows);
        setImportPreview(validRows.slice(0, 5));
        setIsImportModalOpen(true);
      } catch {
        toast.error('Failed to read and parse template file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    setImporting(true);
    const payload: any[] = [];
    let failedCount = 0;

    importData.forEach((row: any) => {
      const yearStr = row['Academic Year'] ? String(row['Academic Year']).split(' ')[0] : '';
      const yearItem = academicYears.find(y => y.label.split(' ')[0] === yearStr);

      const isActive = row['Set as Active'] ? String(row['Set as Active']).toLowerCase() === 'yes' : true;

      // Date parsing check
      const startStr = row['Start Date (YYYY-MM-DD)'] ? String(row['Start Date (YYYY-MM-DD)']).trim() : '';
      const endStr = row['End Date (YYYY-MM-DD)'] ? String(row['End Date (YYYY-MM-DD)']).trim() : '';

      if (startStr && endStr) {
        payload.push({
          title: String(row['Holiday Title']),
          description: row['Description'] ? String(row['Description']) : null,
          start_date: startStr,
          end_date: endStr,
          is_active: isActive,
          academic_year_id: yearItem ? yearItem.value : null,
        });
      } else {
        failedCount++;
      }
    });

    if (payload.length === 0) {
      toast.error('Could not parse any valid rows. Please check data formats.');
      setImporting(false);
      return;
    }

    try {
      const response = await api.post(`/school/holidays/bulk-import`, { data: payload });
      if (response.data.success) {
        toast.success(`Import finished: ${response.data.imported_count} imported successfully, ${response.data.error_count + failedCount} failed`);
        setIsImportModalOpen(false);
        await fetchHolidays();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const lbl = 'block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
  const inp = 'w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700 transition';

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs text-gray-500 font-medium">Loading holiday configurations…</p>
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
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Holidays List</h3>
          <p className="text-[12px] text-gray-500">Configure public holidays and school session breaks</p>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 rounded px-2.5 py-0.5 text-center min-w-[70px]">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-500">Holidays</span>
          <span className="text-xs font-bold text-blue-700">{holidays.length}</span>
        </div>
      </div>

      {/* Toolbar */}
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
              placeholder="Search holiday..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-lpignore="true"
              data-1p-ignore="true"
              className="pl-7 pr-2 py-1 w-52 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            />
          </div>

          {/* Academic Year filter */}
          <SearchableSelect
            options={academicYears}
            value={filterAcademicYear}
            onChange={(val) => setFilterAcademicYear(val)}
            placeholder="Academic Year"
            isClearable={true}
            className="w-44 text-xs"
            compact={true}
          />

          {/* Limit selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5">
            <span className="text-[10px] text-gray-450 font-semibold uppercase">Show:</span>
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

          {/* Trashed switch */}
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

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-650 hover:text-red-800 font-medium px-1.5 py-0.5 rounded hover:bg-red-50/80 transition duration-150"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={downloadSampleFile}
            className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-xs font-medium"
            title="Download Excel Sample"
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
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} data-lpignore="true" data-1p-ignore="true" className="hidden" />
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
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Trashed Banner */}
      {showTrashed && (
        <div className="bg-red-50 border border-red-150 px-4 py-1.5 flex items-center gap-2 text-red-700 text-xs font-medium rounded-lg">
          <svg className="w-3.5 h-3.5 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>You are viewing deleted holidays. You can restore them or permanently delete them.</span>
        </div>
      )}

      {/* Bulk actions */}
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
              <>
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  className="px-2.5 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkDelete(false)}
                  className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
                >
                  Delete Selected
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Datagrid */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
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
                onClick={() => handleSort('title')}
                className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Holiday Title</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('title')}</span>
                </div>
              </th>
              <th className="py-2 px-3">Holiday Type</th>
              <th className="py-2 px-3">Description</th>
              <th
                onClick={() => handleSort('start_date')}
                className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Start Date</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('start_date')}</span>
                </div>
              </th>
              <th
                onClick={() => handleSort('end_date')}
                className="py-2 px-3 cursor-pointer hover:bg-gray-100 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>End Date</span>
                  <span className="text-gray-400 font-normal">{getSortIcon('end_date')}</span>
                </div>
              </th>
              <th className="py-2 px-3 text-center">Total Days</th>
              <th className="py-2 px-3 text-center w-24">Status</th>
              <th className="py-2 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-[13px] font-bold text-gray-900">No Holidays Found</h4>
                    <p className="text-xs text-gray-500">There are no holidays configured for this academic year.</p>
                    {!showTrashed && (
                      <button
                        onClick={openAddModal}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition"
                      >
                        Add New Holiday
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const start = new Date(item.start_date);
                const end = new Date(item.end_date);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

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
                      {item.title}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800">
                      {item.holiday_type?.m_name || '—'}
                    </td>
                    <td className="py-2 px-3 text-gray-500 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800">
                      {formatDate(item.start_date)}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800">
                      {formatDate(item.end_date)}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-blue-600">
                      {days}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <ToggleSwitch
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item)}
                        disabled={showTrashed}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {showTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="p-1 text-slate-500 hover:bg-green-50 rounded hover:text-green-600 transition"
                              title="Restore Holiday"
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
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded hover:text-blue-600 transition"
                              title="Edit Holiday"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded hover:text-red-700 transition"
                              title="Delete Holiday"
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
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-655 hover:bg-gray-50 transition"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-655 hover:bg-gray-50 transition"
            >
              ‹
            </button>
            <span className="text-[11px] text-gray-655 px-1.5 font-medium">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-655 hover:bg-gray-50 transition"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 border border-gray-250 bg-white rounded disabled:opacity-50 text-[11px] text-gray-655 hover:bg-gray-50 transition"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Holiday Add/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-visible border border-gray-100 transform transition-all duration-300">
            {/* Modal Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center text-white rounded-t-xl">
              <h3 className="text-sm font-bold">{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h3>
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
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title */}
                <div>
                  <label className={lbl}>Holiday Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Diwali Vacation"
                    className={inp}
                    maxLength={150}
                    required
                  />
                </div>

                {/* Holiday Type select */}
                <div>
                  <label className={lbl}>Holiday Type</label>
                  <SearchableSelect
                    options={holidayTypeOptions}
                    value={formData.holiday_type_id}
                    onChange={(val) => setFormData(prev => ({ ...prev, holiday_type_id: val }))}
                    placeholder="Select Holiday Type"
                    isClearable={true}
                    compact={true}
                  />
                </div>

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

                {/* Dates row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className={inp}
                      required
                    />
                  </div>
                  <div>
                    <label className={lbl}>End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className={inp}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional details about the holiday..."
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
                    rows={2}
                  />
                </div>

                {/* Active switch inside gray block */}
                <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-150 rounded-lg">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Set as Active Status</label>
                    <p className="text-[10px] text-gray-400">Whether the holiday is active for the academic calendar</p>
                  </div>
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1 text-xs border border-gray-205 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Save Holiday
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
              <h3 className="text-base font-bold">Import Holidays Preview</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/85 hover:text-white hover:bg-white/10 rounded-lg p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content preview list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs text-gray-500">
                Below is a preview of the first 5 records parsed from your file. Confirm the import to save all parsed records ({importData.length} total).
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-55 border-b border-gray-200 text-gray-650 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-4">Row</th>
                      <th className="py-2.5 px-4">Holiday Title</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Start Date</th>
                      <th className="py-2.5 px-4">End Date</th>
                      <th className="py-2.5 px-4">Academic Year</th>
                      <th className="py-2.5 px-4">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {importPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-55/50 text-gray-700">
                        <td className="py-2 px-4 font-semibold text-gray-400">{idx + 2}</td>
                        <td className="py-2 px-4 font-medium">{row['Holiday Title'] || '—'}</td>
                        <td className="py-2 px-4">{row['Description'] || '—'}</td>
                        <td className="py-2 px-4 font-medium text-gray-900">{row['Start Date (YYYY-MM-DD)'] || '—'}</td>
                        <td className="py-2 px-4 font-medium text-gray-900">{row['End Date (YYYY-MM-DD)'] || '—'}</td>
                        <td className="py-2 px-4">{row['Academic Year'] || '—'}</td>
                        <td className="py-2 px-4">{row['Set as Active'] || 'Yes'}</td>
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

export default HolidayManager;
